import { registerUser, loginUser, forgetService, resetService } from '../services/authService.js';

export const register = async (req, res) => {
    try {
        const user = await registerUser(req.body);
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { emailOrMobile, password } = req.body;
        const { user, token } = await loginUser(emailOrMobile, password);
        res.json({ message: 'Login successful', user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const forgetPassword = async (req, res) => {
    try {
        const { emailOrMobile } = req.body;
        const resetToken = await forgetService(emailOrMobile);
        console.log(resetToken)
        res.json({ message: 'reset Otp generated' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const resetPassword  = async (req, res) => {
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        await resetService(resetToken, newPassword);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};