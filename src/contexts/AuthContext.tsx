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

  const clearAuthState = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
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

    // Check for existing session with error handling for invalid refresh tokens
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      
      // Check if the error is related to invalid refresh token
      const errorMessage = error?.message || '';
      if (errorMessage.includes('Invalid Refresh Token') || 
          errorMessage.includes('refresh_token_not_found') ||
          error?.code === 'refresh_token_not_found') {
        console.info('Invalid refresh token detected, clearing session state');
        clearAuthState();
        // Sign out to clear any corrupted local storage
        supabase.auth.signOut().catch(() => {
          // Ignore errors during cleanup signout
        });
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
      // Simply sign out - this will clear the session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Handle the specific 'session_not_found' case as informational
        if (error.message?.includes('session_not_found') || 
            error.message?.includes('Session from session_id claim in JWT does not exist') ||
            (error as any).status === 403 ||
            (error as any).code === 'session_not_found') {
          console.info('Session already cleared on server:', error.message);
        } else {
          console.error('Logout error:', error);
        }
      }
    } catch (error) {
      // Handle any unexpected errors - check for session-related errors first
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('session_not_found') || 
          errorMessage.includes('Session from session_id claim in JWT does not exist') ||
          (error as any).status === 403 ||
          (error as any).code === 'session_not_found') {
        console.info('Session already cleared on server:', errorMessage);
      } else {
        console.error('Logout error:', error);
      }
    } finally {
      // Always clear the client-side state regardless of server response
      clearAuthState();
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