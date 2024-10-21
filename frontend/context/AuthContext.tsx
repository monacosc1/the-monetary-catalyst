'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase'

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ user: User | null; session: Session | null }>
  logout: () => Promise<void>
  loginAfterRegister: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    console.log('Registering user:', email)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })
      if (error) {
        console.error('Supabase registration error:', error)
        throw error
      }
      console.log('Registration response:', data)
      console.log('Email confirmed at:', data.user?.email_confirmed_at)
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
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

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, loginAfterRegister }}>
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
