
import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch(
                    "http://localhost:3000/session",
                    {
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    throw new Error("Session check failed");
                }

                const data = await response.json();

                setUser(data.loggedIn ? data.user : null);

            } catch (error) {
                console.error(error);
                setUser(null);

            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    return (
        <UserContext.Provider value={{
            user,
            setUser,
            loading
        }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to access user information
export const useUser = () => {
    return useContext(UserContext);
};
