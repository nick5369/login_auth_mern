import React, { useState } from "react";
import "../styles/OtpVerification.css";
import axios from "axios";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuthContext } from "../context/authContext.jsx";

const OtpVerification = () => {
  const { isAuthenticated, setIsAuthenticated, user, setUser } = useAuthContext();
  const { email, phone } = useParams();
  const [otp, setOtp] = useState(["", "", "", "", ""]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < otp.length - 1) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      document.getElementById(`otp-input-${index - 1}`).focus();
    }
  }

  const handleOtpVerification = async (e) => {
    try {
      e.preventDefault();
      const enteredOtp = otp.join("");
      const data = {
        email,
        phone,
        otp: enteredOtp,
      }
      const res = await axios.post("http://localhost:4000/api/v1/user/otp-verification",data,{
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success(res.data.message);
      setIsAuthenticated(true);
      setUser(res.data.user);

    } catch (error) {
      toast.error(error.response.data.message);
      setIsAuthenticated(false);
      setUser(null); 

    }
  }

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <div className="otp-verification-page">
      <div className="otp-container">
        <div className="otp-header">
          <h2>Verify Your Account</h2>
          <p className="otp-subtitle">Enter the 5-digit code sent to your email or phone</p>
        </div>
        
        <form onSubmit={handleOtpVerification} className="otp-form">
          <div className="otp-input-container">
            {otp.map((value, index) => (
              <input
                key={index}
                id={`otp-input-${index}`}
                type="text"
                maxLength="1"
                value={value}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`otp-input ${value ? 'filled' : ''}`}
                placeholder="0"
                required
              />
            ))}
          </div>
          <button type="submit" className="verify-button">Verify OTP</button>
        </form>
      </div>
    </div>
  );
};

export default OtpVerification;
