import React, { useState } from "react";
import "../styles/Auth.css";
import { useAuthContext } from "../context/authContext.jsx";
import { Navigate } from "react-router-dom";
import Login from "../components/Login.jsx";
import Register from "../components/Register.jsx";

const Auth = () => {
  const { isAuthenticated } = useAuthContext();
  const [isLogin, setIsLogin] = useState(true);
  if (isAuthenticated) {
    return <Navigate to={"/"} />
  }
  return <>
    <div className="auth-page" >
      <div className="auth-container">
        <div className="auth-toggle">
          <button className={`toggle-btn ${isLogin ? "active" : ""}`} onClick={() => setIsLogin(true)}>Login</button>
          <button className={`toggle-btn ${!isLogin ? "active" : ""}`} onClick={() => setIsLogin(false)}>Register</button>
        </div>
        {isLogin ? <Login/> : <Register/> }
      </div>
    </div>
  </>;
};

export default Auth;
