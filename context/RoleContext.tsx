// components/RoleProvider.tsx
'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'hr' | 'manager' | 'employee' | 'guest';

interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface RoleContextType {
    userRole: UserRole;
    user: User | null;
    login: (userData: User, role: UserRole) => void;
    logout: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
    const [userRole, setUserRole] = useState<UserRole>('guest');
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // In a real app, you would fetch user data and role from your auth system
        const storedUser = localStorage.getItem('user');
        const storedRole = localStorage.getItem('userRole') as UserRole;

        if (storedUser && storedRole) {
            setUser(JSON.parse(storedUser));
            setUserRole(storedRole);
        } else {
            // Default to guest role
            setUserRole('guest');
        }
    }, []);

    const login = (userData: User, role: UserRole) => {
        setUser(userData);
        setUserRole(role);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userRole', role);
    };

    const logout = () => {
        setUser(null);
        setUserRole('guest');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
    };

    return (
        <RoleContext.Provider value={{ userRole, user, login, logout }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = (): RoleContextType => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
};