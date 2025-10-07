
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type UserStatus = 'active' | 'idle' | 'away';

interface UserStatusContextData {
    status: UserStatus;
}

const UserStatusContext = createContext<UserStatusContextData | undefined>(undefined);

export const UserStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<UserStatus>('active');

    useEffect(() => {
        let idleTimer: number;

        const resetTimer = () => {
            setStatus('active');
            clearTimeout(idleTimer);
            idleTimer = window.setTimeout(() => setStatus('idle'), 5 * 60 * 1000); // 5 minutes to idle
        };

        const handleAway = () => {
            if (document.visibilityState === 'hidden') {
                setStatus('away');
            } else {
                resetTimer();
            }
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        document.addEventListener('visibilitychange', handleAway);

        resetTimer();

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            document.removeEventListener('visibilitychange', handleAway);
            clearTimeout(idleTimer);
        };
    }, []);

    return (
        <UserStatusContext.Provider value={{ status }}>
            {children}
        </UserStatusContext.Provider>
    );
};

export const useUserStatus = (): UserStatusContextData => {
    const context = useContext(UserStatusContext);
    if (!context) {
        throw new Error('useUserStatus must be used within a UserStatusProvider');
    }
    return context;
};
