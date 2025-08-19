import * as crypto from 'crypto';
import { UserRole } from './../user/users.entity';

// Utility function to validate if the input is an email or not
export const validateEmail = (input: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(input);
};
// Utility function to generate OTP (6 digits)
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString(); // Generates a 6-digit OTP
};

// Utility function to generate a random password
export const generateRandomPassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the password to randomize positions
  return password.split('').sort(() => crypto.randomInt(0, 2) - 0.5).join('');
};
// Placeholder function to send OTP via email
export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  // Implement actual email sending logic here
  console.log(`OTP sent to email ${email}: ${otp}`);
};

// Placeholder function to send OTP via SMS
export const sendOtpSms = async (mobile: string, otp: string): Promise<void> => {
  // Implement actual SMS sending logic here
  console.log(`OTP sent to mobile ${mobile}: ${otp}`);
};

export function isAdmin(userRole: UserRole): userRole is UserRole.Admin {
  return userRole === UserRole.Admin;
}

export function isEditor(userRole: UserRole): userRole is UserRole.User {
  return userRole === UserRole.User;
}
