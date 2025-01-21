import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { Op } from 'sequelize'; // Import Op from Sequelize
import { sendEmail, sendSMS } from '../utils/transporter.js';

export const registerUser = async (data) => {
    const existingUserByEmail = await User.findOne({ where: { email: data.email } });
    if (existingUserByEmail) {
        throw new Error('Email already exists');
    }

    const existingUserByMobile = await User.findOne({ where: { mobile: data.mobile } });
    if (existingUserByMobile) {
        throw new Error('Mobile number already exists');
    }

    data.password = await bcrypt.hash(data.password, 10);
    return await User.create(data);
};

export const loginUser = async (emailOrMobile, password) => {
    const user = await User.findOne({
        where: {
            [Op.or]: [ // Use Op.or properly
                { email: emailOrMobile },
                { mobile: emailOrMobile },
            ],
        },
    });

    if (!user) throw new Error('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Invalid credentials');

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    return { user, token };
};


export const forgetService = async (emailOrMobile) => {
    const user = await User.findOne({
        where: {
            [Op.or]: [
                { email: emailOrMobile },
                { mobile: emailOrMobile },
            ],
        },
    });

    if (!user) throw new Error('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a random 6-digit number


    user.resetToken = otp;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    await user.save();

    if (emailOrMobile.includes('@')) {
        await sendEmail(emailOrMobile, 'Password Reset OTP', `Your OTP for password reset is: ${otp}`);
    } else {
        await sendSMS(emailOrMobile, `Your OTP for password reset is: ${otp}`);
    }

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
