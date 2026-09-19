import CryptoJS from "crypto-js";
import { CRYPTO_SECRET } from "./config";

export const encryptData = (data: any) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), CRYPTO_SECRET).toString();
};

export const decryptData = (cipherText: string) => {
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, CRYPTO_SECRET);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) return null;
        return JSON.parse(decrypted);
    } catch (err) {
        console.error("Decryption error:", err);
        return null;
    }
};