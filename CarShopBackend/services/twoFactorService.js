const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

module.exports = {
    generateSecret(email) {
        const secret = speakeasy.generateSecret({
            name: `CarShop (${email})`,
            issuer: 'CarShop'
        });
        return secret;
    },

    async generateQRCode(secret) {
        try {
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
            return qrCodeUrl;
        } catch (error) {
            throw new Error('Failed to generate QR code');
        }
    },

    verifyToken(token, secret) {
        try {
            return speakeasy.totp.verify({
                secret: secret.base32,
                encoding: 'base32',
                token: token,
                window: 1
            });
        } catch (error) {
            return false;
        }
    },

    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex'));
        }
        return codes;
    },

    verifyBackupCode(userBackupCodes, providedCode) {
        try {
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
        } catch (error) {
            return {
                isValid: false,
                error: 'Failed to verify backup code'
            };
        }
    }
};
