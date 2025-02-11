import { registerUser, loginUser, forgetService, resetService, verifyUserOtp, resendUserOtp, checkUserExistsService } from '../services/authService.js';

export const checkUserExists = async (req, res) => {
    try {
        const { email } = req.query; // Get email from query parameters

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        const user = await checkUserExistsService(email);

        if (user) {
            return res.status(200).json({
                success: true,
                message: "This email is already existing.",
            });
        } else {
            return res.status(404).json({
                success: false,
                message: "No account found with this email. Please check and try again."
            });
        }
    } catch (error) {
        console.error("Error checking user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


export const register = async (req, res) => {
    try {
        await registerUser(req.body);
        res.status(201).json({ message: 'User registered successfully. Please verify your email.' });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await verifyUserOtp(email, otp);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await resendUserOtp(email);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { user, token } = await loginUser(email, password);
        res.json({ message: 'Login successful', user, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const resetToken = await forgetService(email);
        console.log(resetToken);
        res.json({ message: 'Reset OTP generated' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const resetPassword = async (req, res) => {
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
