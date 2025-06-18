import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user" | "superadmin";
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Always attempt to sign out - signOut() handles local session clearing regardless
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Handle the specific 'session_not_found' case as informational
        if (error.message?.includes('session_not_found') || error.message?.includes('Session from session_id claim in JWT does not exist')) {
          console.info('Session already cleared on server:', error.message);
        } else {
          console.warn('Logout error:', error);
        }
      }
      
      // Always clear the client-side state regardless of server response
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      // Handle any unexpected errors and clear state
      console.error('Logout error:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  const isAdmin = () => profile?.role === "admin" || profile?.role === "superadmin";
  const isSuperAdmin = () => profile?.role === "superadmin";

  const updatePassword = async (newPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('Error updating password:', error);
        return { success: false, error };
      }
      return { success: true };
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
    session,
    loading,
    login,
    logout,
    isAdmin,
    isSuperAdmin,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};