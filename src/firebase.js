import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
    // Create user document if it doesn't exist
    const userDocRef = doc(db, "users", result.user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: result.user.email,
        name: result.user.displayName,
        highScores: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
      });
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const signOutUser = () => signOut(auth);

// High score functions
export const updateHighScore = async (userId, difficulty, score) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    const currentData = userDoc.data();

    // The score represents the last level the user completed successfully
    // No need to adjust it here since we're already passing the correct value
    if (score > (currentData.highScores[difficulty.toLowerCase()] || 0)) {
      await setDoc(
        userDocRef,
        {
          ...currentData,
          highScores: {
            ...currentData.highScores,
            [difficulty.toLowerCase()]: score,
          },
        },
        { merge: true }
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating high score: ", error);
    throw error;
  }
};

export const getHighScores = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    return userDoc.data()?.highScores || { easy: 0, medium: 0, hard: 0 };
  } catch (error) {
    console.error("Error getting high scores: ", error);
    throw error;
  }
};

export { auth, db };
