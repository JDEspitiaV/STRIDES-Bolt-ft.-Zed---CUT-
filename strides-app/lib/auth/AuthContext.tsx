"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'athlete' | 'coach') => Promise<void>;
  logOut: () => Promise<void>;
  userRole: 'athlete' | 'coach' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'athlete' | 'coach' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch custom claims or user document for role
        const idTokenResult = await currentUser.getIdTokenResult(true);
        const role = idTokenResult.claims.role as 'athlete' | 'coach' || null;
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, role: 'athlete' | 'coach') => {
    setLoading(true);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const currentUser = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', currentUser.uid), {
      email: currentUser.email,
      role: role,
      createdAt: new Date(),
    });

    // Note: Custom claims can only be set by a server-side process (e.g., Firebase Admin SDK).
    // For now, we'll rely on the Firestore user document for the role, or a separate API endpoint
    // to set custom claims after signup. The middleware will eventually check custom claims.
  };

  const logOut = async () => {
    setLoading(true);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logOut, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
