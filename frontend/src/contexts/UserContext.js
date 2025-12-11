import React, { createContext, useState, useContext, useEffect } from "react";

export const UserContext = createContext(null);

const STORAGE_KEY = 'walksense_current_user';

export const UserProvider = ( { children }) => {
    // localStorageから初期値を読み込む
    const [currentUser, setCurrentUserState] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // カスタムセッター：localStorageも更新する
    const setCurrentUser = (user) => {
        setCurrentUserState(user);
        if (user) {
            // ログイン時：localStorageに保存
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            // ログアウト時：localStorageから削除
            localStorage.removeItem(STORAGE_KEY);
        }
    };

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