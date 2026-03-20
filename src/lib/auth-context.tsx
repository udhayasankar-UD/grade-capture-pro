import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { checkAndResetDailyCredits } from "./firestore-service";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  credits: number;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check and reset daily credits first
        checkAndResetDailyCredits(currentUser.uid).catch(err => {
          console.error("Daily credit reset check failed:", err);
        });

        // Listen to credit updates from Firestore
        const userRef = doc(db, "user", currentUser.uid);
        const unsubscribeFirestore = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setCredits(doc.data().credits_remaining || 0);
          } else {
            setCredits(0);
          }
        }, (error) => {
          console.error("Firestore Listen Error:", error);
          });
        
        setLoading(false);
        return () => unsubscribeFirestore();
      } else {
        setCredits(0);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, credits, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
