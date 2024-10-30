'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/utils/supabase'
import DotPattern from '@/components/DotPattern'
import { withAuth } from '@/utils/withAuth'
import SubscriptionDetails from '@/components/SubscriptionDetails'
import PaymentDetails from '@/components/PaymentDetails'

const MyAccountPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        console.log('Current user:', user);

        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (error) {
            if (error.code === 'PGRST116') {
              console.log('Profile not found, creating new profile');
              const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .upsert({
                  user_id: user.id,
                  email: user.email,
                  first_name: user.user_metadata?.first_name || '',
                  last_name: user.user_metadata?.last_name || '',
                  role: 'user',
                }, { onConflict: 'user_id' })
                .select()
                .single()

              if (insertError) {
                console.error('Error creating user profile:', insertError)
              } else {
                console.log('New profile created:', newProfile);
                setFirstName(newProfile?.first_name || '')
                setLastName(newProfile?.last_name || '')
                setEmail(newProfile?.email || user.email || '')
              }
            } else {
              console.error('Error fetching user profile:', error)
            }
          } else if (profile) {
            console.log('Fetched profile:', profile);
            setFirstName(profile.first_name || '')
            setLastName(profile.last_name || '')
            setEmail(user.email || profile.email || '')
          }
        } catch (error) {
          console.error('Unexpected error:', error)
        }
      }
    }

    fetchUserProfile()
  }, [user])

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)

      if (profileError) {
        throw profileError
      }

      setMessage('Profile updated successfully')
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage(error.message || 'An error occurred while updating profile')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      // Validate passwords match
      if (newPassword !== confirmNewPassword) {
        setMessage('New passwords do not match')
        return
      }

      // Validate current password
      const { data: { user: currentUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email as string,
        password: currentPassword
      })

      if (signInError) {
        setMessage('Current password is incorrect')
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      })

      if (updateError) {
        throw updateError
      }

      // Clear form and show success message
      setMessage('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage('')
      }, 3000)
    } catch (error: any) {
      console.error('Error updating password:', error)
      setMessage(error.message || 'An error occurred while updating password')
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      setEmail(newEmail)
      setIsEditingEmail(false)
      setMessage('Email update request sent. Please check your new email for confirmation.')
    } catch (error: any) {
      setMessage(error.message || 'An error occurred while updating email')
    }
  }

  return (
    <main className="flex-grow bg-background-light py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-6">My Account</h2>
          
          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-4 ${activeTab === 'profile' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-4 ${activeTab === 'security' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-2 px-4 ${activeTab === 'email' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              Email
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`py-2 px-4 ${activeTab === 'subscription' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              Subscription Details
            </button>
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-2 px-4 ${activeTab === 'payment' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            >
              Payment Details
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Profile</h3>
              
              {message && (
                <div className={`mb-4 p-4 rounded ${
                  message.includes('error') || message.includes('Error') 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {message}
                </div>
              )}
              
              <form onSubmit={handleUpdateGeneral} className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Update
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Security</h3>
              
              {message && (
                <div className={`mb-4 p-4 rounded ${
                  message.includes('error') || message.includes('Error') 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {message}
                </div>
              )}
              
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Update Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Email</h3>
              
              <div className="space-y-4">
                <div className="mb-6">
                  <p className="text-gray-700">
                    Your current email address is <span className="font-medium">{user?.email}</span>
                  </p>
                </div>

                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">New Email Address</label>
                  <input
                    type="email"
                    id="newEmail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300">
                    Update Email
                  </button>
                  <button type="button" onClick={() => setIsEditingEmail(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition duration-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && user && (
            <SubscriptionDetails userId={user.id} />
          )}

          {activeTab === 'payment' && user && (
            <PaymentDetails userId={user.id} />
          )}
        </div>
      </div>
    </main>
  )
}

export default withAuth(MyAccountPage)
