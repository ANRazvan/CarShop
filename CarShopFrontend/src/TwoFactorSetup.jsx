import React, { useState } from 'react';
import api from './services/api';
import './TwoFactorSetup.css';

const TwoFactorSetup = ({ onSuccess }) => {
    const [qrCode, setQrCode] = useState('');
    const [backupCodes, setBackupCodes] = useState([]);
    const [verificationCode, setVerificationCode] = useState('');
    const [showBackupCodes, setShowBackupCodes] = useState(false);
    const [error, setError] = useState('');    const initiate2FASetup = async () => {
        try {
            const response = await api.post('/api/auth/2fa/setup', {});
            
            if (response.data.qrCode) {
                setQrCode(response.data.qrCode);
                setError('');
            } else {
                setError('Failed to generate QR code');
            }
        } catch (error) {
            setError('Failed to initiate 2FA setup');
        }
    };const verify2FASetup = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/2fa/verify-setup', { token: verificationCode });
            
            if (response.data.backupCodes) {
                setBackupCodes(response.data.backupCodes);
                setShowBackupCodes(true);
            } else {
                setError('Failed to generate backup codes');
            }
        } catch (error) {
            setError('Invalid verification code');
        }
    };

    const finishSetup = () => {
        onSuccess();
    };

    return (
        <div className="two-factor-setup">
            <h2>Two-Factor Authentication Setup</h2>
            
            {!qrCode ? (
                <button onClick={initiate2FASetup}>
                    Begin 2FA Setup
                </button>
            ) : !showBackupCodes ? (
                <div>
                    <p>1. Scan this QR code with your authenticator app:</p>
                    <img src={qrCode} alt="2FA QR Code" />
                    
                    <form onSubmit={verify2FASetup}>
                        <div>
                            <p>2. Enter the verification code from your app:</p>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter code"
                            />
                        </div>
                        {error && <div className="error">{error}</div>}
                        <button type="submit">Verify</button>
                    </form>
                </div>
            ) : (
                <div>
                    <h3>🔐 Save Your Backup Codes</h3>
                    <p>Store these codes in a safe place. You can use them to log in if you lose access to your authenticator app.</p>
                    <div className="backup-codes">
                        {backupCodes.map((code, index) => (
                            <div key={index} className="backup-code">{code}</div>
                        ))}
                    </div>
                    <button onClick={finishSetup}>I've saved my backup codes</button>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSetup;
