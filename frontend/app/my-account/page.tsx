'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/utils/supabase'
import DotPattern from '@/components/DotPattern'
import { withAuth } from '@/utils/withAuth'

const MyAccountPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
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
    if (user) {
      setFirstName(user.user_metadata.first_name || '')
      setLastName(user.user_metadata.last_name || '')
      setEmail(user.email || '')
      
      // Explicitly check the email confirmation status
      const checkEmailConfirmation = async () => {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Error fetching user data:', error)
          return
        }
        setIsEmailConfirmed(currentUser?.email_confirmed_at !== null)
      }
      checkEmailConfirmation()
    }
  }, [user])

  const handleUpdateGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.updateUser({
        data: { first_name: firstName, last_name: lastName }
      })
      if (error) throw error
      setMessage('General information updated successfully')
    } catch (error: any) {
      setMessage(error.message || 'An error occurred while updating')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setMessage('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (error: any) {
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
    <main className="flex-grow bg-background-light text-white py-16 relative min-h-screen">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-6">My Account</h2>
          
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 px-4 ${activeTab === 'general' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'} rounded-tl-lg rounded-tr-lg`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`flex-1 py-2 px-4 ${activeTab === 'email' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button
              className={`flex-1 py-2 px-4 ${activeTab === 'password' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'} rounded-tr-lg rounded-tl-lg`}
              onClick={() => setActiveTab('password')}
            >
              Password
            </button>
          </div>

          {message && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
              {message}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow">
            {activeTab === 'general' && (
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
                <button type="submit" className="w-full bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300">
                  Update
                </button>
              </form>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4">
                {isEditingEmail ? (
                  <form onSubmit={handleUpdateEmail} className="space-y-4">
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
                  </form>
                ) : (
                  <div>
                    <p className="text-lg">Your email address: {email}</p>
                    <button
                      onClick={() => {
                        setIsEditingEmail(true)
                        setNewEmail(email)
                      }}
                      className="text-primary hover:text-accent1 font-semibold"
                    >
                      Edit email
                    </button>
                  </div>
                )}
                
                <p className="text-green-600">Your email has been confirmed.</p>
              </div>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
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
                  />
                </div>
                <button type="submit" className="w-full bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300">
                  Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default withAuth(MyAccountPage)
