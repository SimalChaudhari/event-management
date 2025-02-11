import express from 'express';
import { register, login, forgetPassword,resetPassword, verifyOtp, resendOtp } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/forget', forgetPassword);
router.post('/reset', resetPassword);


export default router;