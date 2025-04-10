import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ wsStatus = 'disconnected' }) => {
    const getStatusText = (status) => {
        switch (status) {
            case 'connected': return 'Live updates active';
            case 'disconnected': return 'Live updates offline';
            case 'error': return 'Connection error';
            case 'connecting': return 'Connecting...';
            default: return 'Offline mode';
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="nav-left">
                    <Link to="/" className="navbar-logo">
                        CarMarket
                    </Link>
                    <div className="websocket-status">
                        <span className={`status-indicator ${wsStatus}`}></span>
                        <span className="status-text">
                            {getStatusText(wsStatus)}
                        </span>
                    </div>
                </div>
                <div className="nav-right">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/AddCar" className="nav-link">Add Car</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;