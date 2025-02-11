import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { Op } from 'sequelize'; // Import Op from Sequelize
import { sendEmail } from '../utils/transporter.js';
// import sendEmail from '../utils/sendEmail.js';

export const registerUser = async (data) => {
    const existingUserByEmail = await User.findOne({ where: { email: data.email } });
    if (existingUserByEmail) {
        throw new Error('Email already exists');
    }

    data.password = await bcrypt.hash(data.password, 10);
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Ensures exactly 6-digit OTP
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // OTP valid for 5 minutes

    // Create user with OTP fields
    const user = await User.create({
        ...data, // Spread existing user data
        otp, // Store OTP
        otpExpiry, // Store OTP Expiry
        isVerify: false, // Ensure user starts as unverified
    });

    // Send OTP via email
    await sendEmail(data.email, 'Verify Your Account', `Your OTP is: ${otp} (Valid for 5 minutes)`);
    return user;
};

export const verifyUserOtp = async (email, otp) => {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }

    // Check OTP validity
    if (!user.otp || user.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    // Check if OTP expired (5 minutes limit)
    if (new Date() > user.otpExpiry) {
        throw new Error('OTP has expired. Please request a new one.');
    }

    // OTP is valid, verify user
    user.isVerify = true;
    user.otp = null; // Clear OTP
    user.otpExpiry = null;
    await user.save();

    return { message: 'Account verified successfully. You can now login.' };
};


/**
 * Resend OTP to the user.
 * @param {string} email - User email to resend OTP.
 * @returns {object} - Response message.
 */
export const resendUserOtp = async (email) => {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }

    // Check if account is already verified
    if (user.isVerify) {
        throw new Error('Account is already verified. No need to resend OTP.');
    }

    // Generate a new OTP (6-digit number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Ensures exactly 6-digit OTP
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // ⏳ OTP valid for 5 minutes

    // Update user's OTP and expiry in the database
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send the new OTP via email
    await sendEmail(email, 'New OTP Request', `Your new OTP is: ${otp} (Valid for 5 minutes)`);

    return { message: 'New OTP sent successfully. Please check your email.' };
};


export const loginUser = async (email, password) => {
    const user = await User.findOne({ where: { email } });

    if (!user) throw new Error('User not found');

    // Check if user is verified
    if (!user.isVerify) {
        throw new Error('Account is not verified. Please verify your email before logging in.');
    }

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
