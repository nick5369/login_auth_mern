import React, { useState } from "react";
import "../styles/ForgotPassword.css";
import { useAuthContext } from "../context/authContext";
import { toast } from "react-toastify";
import axios from "axios";

const ForgotPassword = () => {

  const {isAuthenticated} = useAuthContext();
  const [email,setEmail] = useState("");

  const handleForgotPassword = async (e) => {
    try {
      e.preventDefault();
      const res = await axios.post("http://localhost:4000/api/v1/user/password/forgot", {email}, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  }

  return <>
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2>Forgot Password</h2>
        <p>Enter your email to receive password reset token.</p>
        <form onSubmit={handleForgotPassword} className="forgot-password-form" >
          <input type="email" placeholder="Enter your Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="forgot-input" />
          <button type="submit" className="forgot-btn" >Send Reset link</button>
        </form>
      </div>
    </div>
  </>;
};

export default ForgotPassword;
