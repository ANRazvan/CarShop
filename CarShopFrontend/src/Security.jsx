import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from './config';
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
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get(`${config.API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUser(response.data);
            setLoading(false);
        } catch (error) {
            setError('Failed to fetch user profile');
            setLoading(false);
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

            await axios.post(
                `${config.API_URL}/auth/2fa/disable`,
                { token: verificationCode },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
            );

            await fetchUserProfile();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to disable 2FA');
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
                    <button className="disable-2fa-button" onClick={handleDisable2FA}>
                        Disable 2FA
                    </button>
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
            </div>
        </div>
    );
};

export default Security;
