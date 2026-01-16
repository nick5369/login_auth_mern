import { useState, useEffect } from "react";
import { useContext } from "react";
import { createContext } from "react";
import axios from "axios";

const authContext = createContext();

export const AuthProvider = ({children}) => {
    const [isAuthenticated,setIsAuthenticated] = useState(false);
    const [user,setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is still authenticated on app load/refresh
        const checkAuth = async () => {
            try {
                const res = await axios.get("http://localhost:4000/api/v1/user/me", {
                    withCredentials: true,
                });
                setUser(res.data.user);
                setIsAuthenticated(true);
            } catch (error) {
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const value = {
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        loading,
    }

    return (
        <authContext.Provider value = {value}>
            {children}
        </authContext.Provider>
    )
};

export const useAuthContext = () => {
    return useContext(authContext);
}