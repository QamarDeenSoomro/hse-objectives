import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/integrations/firebase/client";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword as firebaseUpdatePassword,
  IdTokenResult
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user" | "superadmin";
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profileDoc = await getDoc(doc(db, "profiles", user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          // Handle case where user exists in Auth but not in Firestore
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = () => profile?.role === "admin" || profile?.role === "superadmin";
  const isSuperAdmin = () => profile?.role === "superadmin";

  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await firebaseUpdatePassword(auth.currentUser, newPassword);
        return { success: true };
      }
      throw new Error("No user is currently signed in.");
    } catch (error) {
      console.error('Unexpected error updating password:', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    isAdmin,
    isSuperAdmin,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};