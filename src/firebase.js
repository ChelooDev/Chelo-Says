import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

// Replace these with your Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyA3PdFNdOGOwaacQeie1fn_a8Oe16HfsDU",

  authDomain: "chelo-says.firebaseapp.com",

  projectId: "chelo-says",

  storageBucket: "chelo-says.firebasestorage.app",

  messagingSenderId: "971039849807",

  appId: "1:971039849807:web:b8d50b9d4d3b3cac20593a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Check if user document exists
    const userDocRef = doc(db, "users", result.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create new user document without nickname
      await setDoc(userDocRef, {
        email: result.user.email,
        name: result.user.displayName,
        highScores: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
        createdAt: new Date().toISOString(),
      });
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const setUserNickname = async (userId, nickname) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    if (userDoc.data().nickname) {
      throw new Error("Nickname already set");
    }

    await updateDoc(userDocRef, { nickname });
    return true;
  } catch (error) {
    console.error("Error setting nickname:", error);
    throw error;
  }
};

export const checkNicknameExists = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() && userDoc.data().nickname ? true : false;
  } catch (error) {
    console.error("Error checking nickname:", error);
    return false;
  }
};

export const signOutUser = () => signOut(auth);

export const getUserData = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

// Initialize a leaderboard if it doesn't exist
const initializeLeaderboard = async (difficulty) => {
  const leaderboardRef = doc(db, "leaderboards", difficulty.toLowerCase());
  const leaderboardDoc = await getDoc(leaderboardRef);

  if (!leaderboardDoc.exists()) {
    console.log(`Initializing ${difficulty} leaderboard`);
    await setDoc(leaderboardRef, { entries: [] });
  }
};

// Initialize all leaderboards on app start
export const initializeLeaderboards = async () => {
  try {
    await Promise.all([
      initializeLeaderboard("easy"),
      initializeLeaderboard("medium"),
      initializeLeaderboard("hard"),
    ]);
    console.log("All leaderboards initialized");
  } catch (error) {
    console.error("Error initializing leaderboards:", error);
  }
};

export const updateHighScore = async (userId, difficulty, score) => {
  try {
    console.log("Updating high score:", { userId, difficulty, score });
    // Get user data first
    const userData = await getUserData(userId);
    if (!userData) throw new Error("User not found");

    const difficultyKey = difficulty.toLowerCase();
    const currentHighScore = userData.highScores?.[difficultyKey] || 0;

    console.log("Current high score:", currentHighScore);
    if (score > currentHighScore) {
      console.log("New high score achieved");
      // Update user's high score
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        [`highScores.${difficultyKey}`]: score,
      });

      // Ensure leaderboard exists
      await initializeLeaderboard(difficultyKey);

      // Update leaderboard
      const leaderboardRef = doc(db, "leaderboards", difficultyKey);
      const leaderboardDoc = await getDoc(leaderboardRef);
      const currentEntries = leaderboardDoc.data().entries || [];

      const entry = {
        userId,
        nickname: userData.nickname,
        score,
        achievedAt: new Date().toISOString(),
      };

      console.log("Adding new entry:", entry);

      // Remove any existing entry for this user
      const filteredEntries = currentEntries.filter((e) => e.userId !== userId);

      // Add new entry
      filteredEntries.push(entry);

      // Sort and limit to top 10
      const topEntries = filteredEntries
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      console.log("Updated leaderboard entries:", topEntries);

      await setDoc(leaderboardRef, { entries: topEntries });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating high score:", error);
    throw error;
  }
};

export const getLeaderboard = async (difficulty) => {
  try {
    console.log("Getting leaderboard for difficulty:", difficulty);
    const difficultyKey = difficulty.toLowerCase();
    const leaderboardRef = doc(db, "leaderboards", difficultyKey);
    const leaderboardDoc = await getDoc(leaderboardRef);

    console.log("Leaderboard exists:", leaderboardDoc.exists());
    if (!leaderboardDoc.exists()) {
      console.log("No leaderboard found");
      return [];
    }

    const entries = leaderboardDoc.data().entries || [];
    console.log("Retrieved entries:", entries);
    return entries;
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return [];
  }
};

export { auth, db };
