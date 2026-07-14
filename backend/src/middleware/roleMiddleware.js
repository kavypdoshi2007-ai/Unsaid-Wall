// src/middleware/roleMiddleware.js

/**
 * Middleware to restrict access based on UserRole enum values.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route ('user', 'coach', 'admin', 'guest')
 */
module.exports = (allowedRoles = []) => {
    return (req, res, next) => {
        // 1. Handle Guest Access explicitly
        if (allowedRoles.includes('guest')) {
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                return next();
            }
            return next();
        }

        // 🚀 RESOLUTION FIX: Check both dynamic request scopes where authMiddleware appends payload
        const activeSession = req.user || req.userData;

        // 2. For protected routes, check if user session payload context exists
        if (!activeSession) {
            return res.status(401).json({ message: "Unauthorized: No user session found" });
        }

        // 3. Extract the role from the valid detected session payload
        const userRole = activeSession.role; 

        // 4. Validate if the user's role is permitted
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Forbidden. This action requires one of the following roles: [${allowedRoles.join(', ')}]` 
            });
        }

        // Everything checks out! Pass control to the controller handler sequence
        next();
    };
};