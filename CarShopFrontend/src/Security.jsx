import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './services/api';
import TwoFactorSetup from './TwoFactorSetup';
import './Security.css';

const Security = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showSetup, setShowSetup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserProfile();
    }, []);    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/api/auth/profile');
            setUser(response.data.user);
            setError('');
            setLoading(false);
        } catch (error) {
            console.error('Profile fetch error:', error);
            const message = error.response?.data?.message || 'Failed to fetch user profile';
            setError(message);
            setLoading(false);

            // If authentication error, redirect to login
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handle2FASetupSuccess = () => {
        setShowSetup(false);
        fetchUserProfile();
    };

    const handleDisable2FA = async () => {
        try {
            const verificationCode = prompt('Please enter your verification code to disable 2FA:');
            if (!verificationCode) return;

            await api.post('/api/auth/2fa/disable', { token: verificationCode });
            await fetchUserProfile();
            setError('');
        } catch (error) {
            console.error('2FA disable error:', error);
            setError(error.response?.data?.message || 'Failed to disable 2FA');
        }
    };

    const handleRegenerateBackupCodes = async () => {
        try {
            const verificationCode = prompt('Please enter your verification code to regenerate backup codes:');
            if (!verificationCode) return;

            const response = await api.post('/api/auth/2fa/regenerate-backup', { token: verificationCode });
            
            if (response.data.backupCodes) {
                const codes = response.data.backupCodes;
                let codesText = 'Your new backup codes:\n\n';
                codes.forEach((code, index) => {
                    codesText += `${index + 1}. ${code}\n`;
                });
                codesText += '\n⚠️ Save these codes in a secure location!\n⚠️ Your old backup codes are no longer valid.';
                
                alert(codesText);
            }
            
            setError('');
        } catch (error) {
            console.error('Regenerate backup codes error:', error);
            setError(error.response?.data?.message || 'Failed to regenerate backup codes');
        }
    };

    if (loading) {
        return <div className="security-container">Loading...</div>;
    }

    if (showSetup) {
        return (
            <div className="security-container">
                <TwoFactorSetup onSuccess={handle2FASetupSuccess} />
            </div>
        );
    }

    return (
        <div className="security-container">
            <h2>Security Settings</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="security-section">
                <h3>Two-Factor Authentication</h3>
                
                <div className="two-factor-status">
                    <p>
                        Status: 
                        <span className={user?.twoFactorEnabled ? 'enabled' : 'disabled'}>
                            {user?.twoFactorEnabled ? ' Enabled' : ' Disabled'}
                        </span>
                    </p>
                </div>
                  {user?.twoFactorEnabled ? (
                    <div className="two-factor-actions">
                        <button className="disable-2fa-button" onClick={handleDisable2FA}>
                            Disable 2FA
                        </button>
                        <button className="regenerate-codes-button" onClick={handleRegenerateBackupCodes}>
                            Regenerate Backup Codes
                        </button>
                    </div>
                ) : (
                    <button className="enable-2fa-button" onClick={() => setShowSetup(true)}>
                        Enable 2FA
                    </button>
                )}
                
                <div className="info-box">
                    <h4>What is Two-Factor Authentication?</h4>
                    <p>
                        Two-Factor Authentication (2FA) adds an extra layer of security to your account.
                        When enabled, you'll need to enter both your password and a verification code
                        from your authenticator app when logging in.
                    </p>
                </div>
                
                {user?.twoFactorEnabled && (
                    <div className="warning-box">
                        <h4>⚠️ Important</h4>
                        <p>
                            Make sure you have saved your backup codes in a secure location.
                            You'll need them if you lose access to your authenticator app.
                        </p>
                    </div>
                )}
                
                {user?.twoFactorEnabled && (
                    <div className="backup-codes-section">
                        <h4>Your Backup Codes</h4>
                        <button className="regenerate-codes-button" onClick={handleRegenerateBackupCodes}>
                            Regenerate Backup Codes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Security;
