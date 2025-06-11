import React, { useState } from 'react';
import api from './services/api';
import './TwoFactorVerify.css';

const TwoFactorVerify = ({ username, password, onSuccess, onCancel }) => {
    const [verificationCode, setVerificationCode] = useState('');
    const [showBackupCode, setShowBackupCode] = useState(false);
    const [backupCode, setBackupCode] = useState('');
    const [error, setError] = useState('');
    
    console.log('TwoFactorVerify mounted with:', { username, password });
    
    const verifyCode = async (e) => {
        e.preventDefault();
        try {            const response = await api.post('/api/auth/login', {
                username,
                password,
                totpToken: verificationCode
            });

            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onSuccess(response.data);
            }
        } catch (error) {
            setError('Invalid verification code');
        }
    };

    const verifyBackupCode = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/api/auth/2fa/verify-backup', {                username,
                backupCode
            });            if (response.data.token) {
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onSuccess(response.data);
            }
        } catch (error) {
            setError('Invalid backup code');
        }
    };

    return (
        <div className="two-factor-verify">
            <h2>Two-Factor Authentication</h2>
            
            {!showBackupCode ? (
                <form onSubmit={verifyCode}>
                    <p>Enter the verification code from your authenticator app:</p>
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter code"
                        autoFocus
                    />
                    {error && <div className="error">{error}</div>}
                    <div className="button-group">
                        <button type="submit">Verify</button>
                        <button type="button" onClick={() => setShowBackupCode(true)}>
                            Use backup code
                        </button>
                        <button type="button" onClick={onCancel}>Cancel</button>
                    </div>
                </form>
            ) : (
                <form onSubmit={verifyBackupCode}>
                    <p>Enter one of your backup codes:</p>
                    <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        placeholder="Enter backup code"
                        autoFocus
                    />
                    {error && <div className="error">{error}</div>}
                    <div className="button-group">
                        <button type="submit">Verify</button>
                        <button type="button" onClick={() => setShowBackupCode(false)}>
                            Use authenticator
                        </button>
                        <button type="button" onClick={onCancel}>Cancel</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default TwoFactorVerify;
