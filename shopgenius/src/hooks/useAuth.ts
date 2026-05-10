"use client";

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncWithSupabase(result.user);
      return result.user;
    } catch (err) {
      toast.error("Google sign-in failed. Please try again.");
      throw err;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncWithSupabase(result.user);
      return result.user;
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : "Sign-in failed. Please try again.";
      toast.error(msg);
      throw err;
    }
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: fullName });
      await syncWithSupabase(result.user, fullName);
      return result.user;
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : "Registration failed. Please try again.";
      toast.error(msg);
      throw err;
    }
  };

  const logout = async () => {
    const supabase = createClient();
    await Promise.all([signOut(auth), supabase.auth.signOut()]);
  };

  return { user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout };
}

/**
 * Sync Firebase user with Supabase profile table.
 * Uses Supabase's custom token auth via Firebase ID token.
 */
async function syncWithSupabase(firebaseUser: User, fullName?: string) {
  const supabase = createClient();

  // Upsert profile — the trigger handles initial creation,
  // but we also upsert here to handle display name updates
  const { error } = await supabase.from("profiles").upsert(
    {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      full_name: fullName ?? firebaseUser.displayName ?? null,
      avatar_url: firebaseUser.photoURL ?? null,
    } as any,
    { onConflict: "id" }
  );

  if (error) {
    console.error("Profile sync error:", error.message);
  }
}
