import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types/types';
import { profileApi, loginHistoryApi, activeSessionApi } from '@/db/api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getCurrentProfile();
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    const email = `${username}@miaoda.com`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Track login immediately after successful authentication
    if (data.user) {
      try {
        // Pass the authenticated user's ID explicitly to avoid timing issues
        const userProfile = await profileApi.getCurrentProfile(data.user.id);
        if (userProfile) {
          // Verify we're tracking the correct user
          console.log('Tracking login for user:', {
            userId: userProfile.id,
            username: userProfile.username,
            role: userProfile.role,
            authUserId: data.user.id
          });
          
          // Create login history record immediately
          await loginHistoryApi.createLoginHistory(
            userProfile.id,
            userProfile.username,
            userProfile.full_name,
            userProfile.role,
            userProfile.school_id,
            null, // IP address (would need backend to get real IP)
            navigator.userAgent
          );

          // Create or update active session
          await activeSessionApi.upsertActiveSession(
            userProfile.id,
            userProfile.username,
            userProfile.full_name,
            userProfile.role,
            userProfile.school_id,
            null, // IP address
            navigator.userAgent
          );
        }
      } catch (trackError) {
        console.error('Error tracking login:', trackError);
        // Don't throw error - login tracking should not block authentication
      }
    }
    
    return data;
  };

  const signUp = async (
    username: string, 
    password: string, 
    fullName?: string, 
    email?: string,
    phone?: string,
    schoolId?: string
  ) => {
    const authEmail = `${username}@miaoda.com`;
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
    });
    if (error) throw error;
    
    if (data.user) {
      const updates: any = {};
      if (fullName) updates.full_name = fullName;
      if (email) updates.email = email;
      if (phone) updates.phone = phone;
      if (schoolId) updates.school_id = schoolId;
      
      if (Object.keys(updates).length > 0) {
        await profileApi.updateProfile(data.user.id, updates);
      }
    }
    
    return data;
  };

  const signOut = async () => {
    // Update session status and logout time before signing out
    if (user?.id) {
      try {
        await activeSessionApi.logoutSession(user.id);
        await loginHistoryApi.updateLogoutTime(user.id);
      } catch (error) {
        console.error('Error updating session status:', error);
      }
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile();
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin: profile?.role === 'admin',
    isPrincipal: profile?.role === 'principal',
    isTeacher: profile?.role === 'teacher',
    isStudent: profile?.role === 'student',
  };
}
