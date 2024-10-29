'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string, termsAccepted: boolean) => Promise<{ user: User | null; session: Session | null }>
  logout: () => Promise<void>
  loginAfterRegister: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoggedIn(!!session?.user)
    }

    fetchSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoggedIn(!!session?.user)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // No need to manually set user or isLoggedIn here, as the onAuthStateChange listener will handle it
  }

  const register = async (email: string, password: string, firstName: string, lastName: string, termsAccepted: boolean) => {
    console.log('Starting registration process:', { email, firstName, lastName, termsAccepted });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    })

    console.log('Auth signup response:', { data, error });

    if (error) {
      console.error('Registration error:', error);
      throw error;
    }

    // Create user profile
    if (data.user) {
      console.log('Attempting to create user profile for:', data.user.id);
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          email: data.user.email,
          first_name: firstName,
          last_name: lastName,
          role: 'user',
          terms_accepted: termsAccepted
        })
        .select()
        .single();

      console.log('Profile creation result:', { profileData, profileError });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        if (profileError.code === 'PGRST301') {
          console.error('This appears to be a permissions error. Check RLS policies.');
        }
        throw profileError;
      }

      console.log('User profile created successfully:', profileData);
    }

    return { user: data.user, session: data.session };
  }

  const logout = async () => {
    console.log('Logout function called')
    try {
      // First, check if there's a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        throw sessionError
      }

      if (!session) {
        console.log('No active session found, clearing local state')
        setUser(null)
        setIsLoggedIn(false)
        return
      }

      // If there's a session, proceed with sign out
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signOut error:', error)
        throw error
      }
      console.log('Supabase signOut successful')
      setUser(null)
      setIsLoggedIn(false)
      console.log('User state cleared')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, clear the local state
      setUser(null)
      setIsLoggedIn(false)
    }
  }

  const loginAfterRegister = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data.user)
    setIsLoggedIn(true)
  }

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google Sign-In process');
      await supabase.auth.signOut();
      console.log('Existing session cleared');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      if (!data.url) throw new Error('No URL returned from signInWithOAuth');

      console.log('OAuth URL:', data.url);
      
      // Redirect the user to the OAuth provider
      window.location.href = data.url;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, loginAfterRegister, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
