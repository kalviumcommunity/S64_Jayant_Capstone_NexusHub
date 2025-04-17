import React from "react";
import "../styles/Navbar.css";
import logo from "../assets/logo.png"; // Replace with your actual logo path
import { FiSend } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="Logo" className="logo" />
        <button className="products-btn">
          PRODUCTS <FiSend className="send-icon" />
        </button>
      </div>

      <ul className="navbar-links">
        <li>NEXUS</li>
        <li>VAULT</li>
        <li>PROLOGUE</li>
        <li>ABOUT</li>
        <li>CONTACT</li>
        <li><BsThreeDots size={20} /></li>
      </ul>
    </nav>
  );
};

export default Navbar;
