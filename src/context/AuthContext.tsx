import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { BASE_URL } from "../api/client";

export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setAuthData: (token: string, user: User) => void;
  updateUserData: (userData: Partial<User>) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null
  );

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email,
          password: password
        }),
      });

      if (!res.ok) throw new Error("Wrong email or password");

      const data = await res.json();
      const bearerToken = data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`;
      setToken(bearerToken);
      setUser(data.user);
      localStorage.setItem("token", bearerToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      return true;
    } catch (err: any) {
      console.error(err.message);
      return false;
    }
  };

  const signup = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      if (!res.ok) throw new Error("Signup failed");

      const data = await res.json();

      if (data.token && data.user) {
        const bearerToken = data.token.startsWith('Bearer ') ? data.token : `Bearer ${data.token}`;
        setToken(bearerToken);
        setUser(data.user);
        localStorage.setItem("token", bearerToken);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return true;
    } catch (err: any) {
      console.error(err.message);
      return false;
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const setAuthData = useCallback((token: string, user: User) => {
    const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    setToken(bearerToken);
    setUser(user);
    localStorage.setItem("token", bearerToken);
    localStorage.setItem("user", JSON.stringify(user));
  }, []);

  const updateUserData = useCallback((userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...userData };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout, setAuthData, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
