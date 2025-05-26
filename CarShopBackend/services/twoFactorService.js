const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorService {
    // Generate a new secret for a user
    generateSecret(email) {
        const secret = speakeasy.generateSecret({
            name: `CarShop (${email})`,
            issuer: 'CarShop'
        });
        return secret;
    }

    // Generate QR code for the secret
    async generateQRCode(secret) {
        try {
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            return qrCodeUrl;
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }

    // Verify TOTP token
    verifyToken(token, secret) {
        try {
            return speakeasy.totp.verify({
                secret: secret.base32,
                encoding: 'base32',
                token: token,
                window: 1 // Allow 30 seconds window
            });
        } catch (error) {
            return false;
        }
    }

    // Generate backup codes
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex'));
        }
        return codes;
    }

    // Verify backup code
    verifyBackupCode(userBackupCodes, providedCode) {
        const codes = JSON.parse(userBackupCodes);
        const index = codes.indexOf(providedCode);
        if (index !== -1) {
            codes.splice(index, 1); // Remove used code
            return {
                isValid: true,
                remainingCodes: codes
            };
        }
        return {
            isValid: false,
            remainingCodes: codes
        };
    }
}

module.exports = new TwoFactorService();
