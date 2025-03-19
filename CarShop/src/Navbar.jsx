import React from "react";
import "./Navbar.css";
import {Link} from "react-router-dom";
function Navbar(){
    return(
        <nav className="navbar">
            <h1>Car Shop</h1>
            <div className="nav-links">
                <Link to="/"> <button className="Button" >Browse cars</button> </Link>
                <button>Cart</button>
                <button className="sign-in">Sign in</button>
            </div>
        </nav>
    );
}

export default Navbar