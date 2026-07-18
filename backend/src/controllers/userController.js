// src/controllers/userController.js
const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
//const twilio = require('twilio');

// Fetching your secret signature string from runtime environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

//const accountSid = process.env.TWILIO_ACCOUNT_SID;
//const authToken = process.env.TWILIO_AUTH_TOKEN;
//const twilioClient = new twilio(accountSid, authToken);
//const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const userController = {
  // ==========================================
  // COMMENTED OUT: OTP TWO-STEP REGISTRATION
  // ==========================================
  /*
  // 1. New Two-Step Registration Part A: Requesting the SMS OTP
  async requestPhoneRegisterOtp(req, res, next) {
    try {
      const { phone_number, password_hash, display_name_pool, role } = req.body;

      if (!phone_number || !password_hash) {
        return res.status(400).json({ error: "Phone number and password are required." });
      }

      // Check if user already exists in permanent database directory
      const existingUser = await prisma.user.findUnique({
        where: { phone_number }
      });

      if (existingUser) {
        return res.status(400).json({ error: "An account with this phone number already exists." });
      }

      // Generate a secure 6-digit random OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      
      // Hash the plain text password right now so it's ready for step 2
      const encryptedPassword = await bcrypt.hash(password_hash, 10);
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes

      // Store in temporary staging table
      await prisma.phoneOtpVerification.upsert({
        where: { 
          phone_number: phone_number 
        },
        update: {
          password_hash: encryptedPassword,
          otp_code: otp,
          expires_at: expirationTime,
          created_at: new Date() // Reset creation time to refresh the 5-minute window
        },
        create: {
          phone_number,
          password_hash: encryptedPassword,
          otp_code: otp,
          expires_at: expirationTime
        }
      });

      // Send the code using either Twilio Dev Phone (Console Simulator) number or live SMS lines
      await twilioClient.messages.create({
        body: `Your secure validation code is: ${otp}. It expires in 5 minutes.`,
        to: phone_number,
        from: TWILIO_PHONE_NUMBER
      });

      return res.status(200).json({ message: "Verification OTP dispatched via SMS." });
    } catch (error) {
      next(error);
    }
  },

  // 2. New Two-Step Registration Part B: Validating OTP and activating user account
  async verifyPhoneRegisterOtp(req, res, next) {
    try {
      const { phone_number, otp_code, display_name_pool, role } = req.body;

      if (!phone_number || !otp_code) {
        return res.status(400).json({ error: "Phone number and verification code are required." });
      }

      // Find the most recent pending verification code entry for this phone number
      const verificationRecord = await prisma.phoneOtpVerification.findFirst({
        where: { phone_number },
        orderBy: { created_at: 'desc' }
      });

      if (!verificationRecord) {
        return res.status(400).json({ error: "No pending registration session found for this number." });
      }

      // Check validation constraints
      if (verificationRecord.otp_code !== otp_code) {
        return res.status(400).json({ error: "Invalid verification code." });
      }

      if (new Date() > verificationRecord.expires_at) {
        return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
      }

      // Code checks out! Move them into your primary 'user' production model
      const user = await prisma.user.create({
        data: {
          phone_number: verificationRecord.phone_number,
          password_hash: verificationRecord.password_hash,
          display_name_pool: display_name_pool || [],
          role: role || "user"
        }
      });

      // Clear out security clutter by deleting all old staging records for this phone number
      await prisma.phoneOtpVerification.deleteMany({
        where: { phone_number }
      });

      const { password_hash: _, ...userResponseData } = user;
      return res.status(201).json({
        message: "Account successfully verified and created!",
        user: userResponseData
      });
    } catch (error) {
      next(error);
    }
  },
  */

  // ==========================================
  // NEW: SINGLE-STEP REGISTRATION
  // ==========================================
  async registerUser(req, res, next) {
    try {
      const { phone_number , display_name_pool, role } = req.body;
      const password = req.body.password ;
      
      // Validate required fields
      if (!phone_number || !password) {
        return res.status(400).json({ error: "Phone number and password are required." });
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phone_number || !phoneRegex.test(phone_number)) {
        return res.status(400).json({ 
          error: "Validation Error: Phone number must be exactly 10 digits and contain only numbers." 
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { phone_number }
      });

      if (existingUser) {
        return res.status(400).json({ error: "An account with this phone number already exists." });
      }

      // Hash the plain text password securely
      const encryptedPassword = await bcrypt.hash(password, 10);

      // Create user immediately in the main production table
      const user = await prisma.user.create({
        data: {
          phone_number,
          password_hash: encryptedPassword,
          display_name_pool: display_name_pool || [],
          role: role || "user"
        }
      });

      // Strip password hash from response object
      const { password_hash: _, ...userResponseData } = user;

      return res.status(201).json({
        message: "Account successfully created!",
        user: userResponseData
      });
    } catch (error) {
      next(error);
    }
  },
  
  // LOGIN VALIDATION (With Hash Comparison & JWT Generation)
  // Handles: POST /api/users/login
  async loginUser(req, res, next) {
    try {
      const { phone_number, password } = req.body;

      if (!phone_number || !password) {
        return res.status(400).json({ error: "Phone number and password are required." });
      }

      // 1. Locate the user by their unique phone number string
      const user = await prisma.user.findUnique({
        where: { phone_number: phone_number }
      });

      // 2. Stop transaction if the user is missing
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.is_banned) {
      return res.status(403).json({ error: "Your account has been suspended/banned." });
      }

      // 3. Compare incoming plain text password against the stored database hash
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // 4. Generate a secure cryptographic JWT token containing payload identity claims
      const token = jwt.sign(
        { 
          id: user.id, 
          phone_number: user.phone_number, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 5. Success payload resolution containing token and tracking indices
      return res.status(200).json({
        message: "Authentication successful",
        token: token,
        id: user.id,
        phone_number: user.phone_number,
        role: user.role
      });

    } catch (error) {
      next(error);
    }
  },

  // READ (ALL)
  async getAllUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        include: { coach_profile: true },
      });
      // Strip out the password hashes so internal credential contexts don't leak downstream
      const sanitizedUsers = users.map(({ password_hash, ...rest }) => rest);
      return res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  },

  // READ (SINGLE)
  async getUserById(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const { password_hash, ...sanitizedUser } = user;
      return res.json(sanitizedUser);
    } catch (error) {
      next(error);
    }
  },

  // UPDATE
  async updateUser(req, res, next) {
    try {
      const updateData = { ...req.body };
      
      // If the consumer attempts to update their password string directly, ensure it gets intercepted and re-hashed
      if (updateData.password_hash) {
        updateData.password_hash = await bcrypt.hash(updateData.password_hash, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
      });

      const { password_hash, ...sanitizedUser } = updatedUser;
      return res.json(sanitizedUser);
    } catch (error) {
      next(error);
    }
  },

  // DELETE
  async deleteUser(req, res, next) {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      return res.json({ message: 'User deleted safely' });
    } catch (error) {
      next(error);
    }
  },
  //ban
  async banUser(req, res, next) {
    try {
      const { id } = req.params;
      const is_banned = typeof req.body.is_banned === 'boolean' ? req.body.is_banned : true;

      // Guard against an admin locking themselves out via this route
      if (req.userData && req.userData.id === id) {
        return res.status(400).json({ error: "You cannot ban your own account." });
      }

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { is_banned }
      });

      const { password_hash, ...sanitizedUser } = updatedUser;

      return res.status(200).json({
        message: `User has been successfully ${is_banned ? 'banned' : 'unbanned'}.`,
        user: sanitizedUser
      });
    } catch (error) {
      next(error);
    }
  },
  async logoutUser(req, res, next) {
        try {
            // Clear the cookie by name (e.g., 'token')
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,          // Must match how it was created
                sameSite: 'none',      // Crucial for cross-origin environments like ngrok
                path: '/'              // Must match the creation path exactly
            });

            return res.status(200).json({ message: "Logged out successfully." });
        } catch (error) {
            return res.status(500).json({ error: "Logout failed." });
        }
    }
};

module.exports = userController;