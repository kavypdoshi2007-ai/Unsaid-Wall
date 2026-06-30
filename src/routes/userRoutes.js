// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

//router.post('/register-request', userController.requestPhoneRegisterOtp);
//router.post('/register-verify', userController.verifyPhoneRegisterOtp);
router.get('/', userController.getAllUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

router.post('/login', userController.loginUser);
router.post('/register', userController.registerUser);

module.exports = router;