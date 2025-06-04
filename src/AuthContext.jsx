import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, signInWithGoogle, signOutUser } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);
  const [highScores, setHighScores] = useState({ easy: 0, medium: 0, hard: 0 });

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, highScores, setHighScores }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
