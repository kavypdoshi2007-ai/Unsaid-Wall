// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

//router.post('/register-request', userController.requestPhoneRegisterOtp);
//router.post('/register-verify', userController.verifyPhoneRegisterOtp);
router.get('/', userController.getAllUsers);

router.get('/me', authMiddleware, (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "Unauthorized access: Invalid user token session." });
    }
    
    // Inject the authenticated context token parameters safely down the execution pipeline
    req.params = { ...req.params, id: req.user.id }; 
    return userController.getUserById(req, res, next);
});

router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.patch('/:id/ban', authMiddleware, authorize(['admin']), userController.banUser);

router.post('/login', userController.loginUser);
router.post('/register', userController.registerUser);
router.post('/logout', userController.logoutUser);

module.exports = router;