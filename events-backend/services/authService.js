import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { Op } from 'sequelize'; // Import Op from Sequelize
import { sendEmail } from '../utils/transporter.js';

export const registerUser = async (data) => {
    const existingUserByEmail = await User.findOne({ where: { email: data.email } });
    if (existingUserByEmail) {
        throw new Error('Email already exists');
    }

    data.password = await bcrypt.hash(data.password, 10);
    return await User.create(data);
};

export const loginUser = async (email, password) => {
    const user = await User.findOne({ where: { email } });

    if (!user) throw new Error('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid credentials');

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    return { user, token };
};

export const forgetService = async (email) => {
    const user = await User.findOne({ where: { email } });

    if (!user) throw new Error('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit number

    user.resetToken = otp;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    await user.save();

    await sendEmail(email, 'Password Reset OTP', `Your OTP for password reset is: ${otp}`);

    return otp;
};

export const resetService = async (otp, newPassword) => {
    try {
        const user = await User.findOne({ where: { resetToken: otp } });
        if (!user) throw new Error('Invalid OTP');

        if (new Date() > user.resetTokenExpiry) {
            throw new Error('OTP has expired');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();
    } catch (error) {
        throw new Error('OTP is invalid or expired');
    }
};
