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
  signInWithGoogle: () => Promise<void>
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
      if (error) throw error

      if (data.user) {
        // Insert into custom users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            first_name: firstName,
            last_name: lastName,
            role: 'user',
            terms_accepted: true,
          })
        if (insertError) throw insertError
      }

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

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) throw error

    // After successful sign-in, fetch user details
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    if (user) {
      // Extract first and last name from Google data
      const fullName = user.user_metadata.full_name || ''
      const [firstName, ...lastNameParts] = fullName.split(' ')
      const lastName = lastNameParts.join(' ')

      // Check if user already exists in custom users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for new users
        throw fetchError
      }

      if (!existingUser) {
        // Insert into custom users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            role: 'user',
            terms_accepted: true,
          })
        if (insertError) throw insertError
      }

      // Update user metadata if first_name or last_name is missing
      if (!user.user_metadata.first_name || !user.user_metadata.last_name) {
        const { data, error } = await supabase.auth.updateUser({
          data: { 
            first_name: firstName, 
            last_name: lastName 
          }
        })
        if (error) throw error
        setUser(data.user)
      }
    }
  }

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
