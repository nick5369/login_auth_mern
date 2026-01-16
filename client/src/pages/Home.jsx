import React from "react";
import Hero from "../components/Hero";
import "../styles/Home.css";
import { toast } from "react-toastify";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/authContext.jsx";

const Home = () => {

  const { isAuthenticated, setIsAuthenticated, setUser, loading } = useAuthContext();
  const navigateTo = useNavigate();

  if(loading){
    return <div>Loading...</div>; // or a spinner component
  }

  const logout = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/user/logout", {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });
      toast.success(res.data.message);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }

  if(!isAuthenticated){
    return <Navigate to={"/auth"} />;
  }

  return <>
  <section className="home" >
    <Hero />
    <button onClick={logout} >Logout</button>
  </section>
  </>;
};

export default Home;
