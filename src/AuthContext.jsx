import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  signInWithGoogle,
  signOutUser,
  getLeaderboard,
  getUserData,
} from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, loading, error] = useAuthState(auth);
  const [highScores, setHighScores] = useState({ easy: 0, medium: 0, hard: 0 });
  const [isLoadingScores, setIsLoadingScores] = useState(true);

  useEffect(() => {
    async function loadHighScores() {
      if (user) {
        setIsLoadingScores(true);
        try {
          // Get user data which includes high scores
          const userData = await getUserData(user.uid);
          if (userData?.highScores) {
            setHighScores(userData.highScores);
          }

          // Also check leaderboards for any higher scores
          const [easyScores, mediumScores, hardScores] = await Promise.all([
            getLeaderboard("easy"),
            getLeaderboard("medium"),
            getLeaderboard("hard"),
          ]);

          const leaderboardScores = {
            easy:
              easyScores.find((entry) => entry.userId === user.uid)?.score || 0,
            medium:
              mediumScores.find((entry) => entry.userId === user.uid)?.score ||
              0,
            hard:
              hardScores.find((entry) => entry.userId === user.uid)?.score || 0,
          };

          // Use the highest scores from either source
          setHighScores((prev) => ({
            easy: Math.max(prev.easy, leaderboardScores.easy),
            medium: Math.max(prev.medium, leaderboardScores.medium),
            hard: Math.max(prev.hard, leaderboardScores.hard),
          }));
        } catch (error) {
          console.error("Error loading high scores:", error);
        } finally {
          setIsLoadingScores(false);
        }
      } else {
        setHighScores({ easy: 0, medium: 0, hard: 0 });
        setIsLoadingScores(false);
      }
    }

    loadHighScores();
  }, [user]);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setHighScores({ easy: 0, medium: 0, hard: 0 });
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || isLoadingScores,
        error,
        login,
        logout,
        highScores,
        setHighScores,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
