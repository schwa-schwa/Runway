import React, { createContext, useState, useContext } from "react";

export const UserContext = createContext(null);

export const UserProvider = ( { children }) => {

    const [currentUser, setCurrentUser] = useState(null);

    const value = { currentUser, setCurrentUser };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => {
    
    const context = useContext(UserContext);

    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }

    return context;
}