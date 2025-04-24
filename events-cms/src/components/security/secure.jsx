import CryptoJS from "crypto-js";

const SECRET_KEY = 'Ght00585454sfdfdsfsd'; // Store securely in env

export const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decryptData = (cipherText) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
};

export const decryptToken = (cipherText) => {
    if (!cipherText) return null;
  
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (e) {
      console.error('Failed to decrypt:', e);
      return null;
    }
  };