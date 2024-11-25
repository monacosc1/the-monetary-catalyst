import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    // Fetch the user data
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Error fetching user:', userError)
    }

    if (user) {
      console.log('User data retrieved:', user)

      // Check if user profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select()
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing profile:', fetchError)
      }

      if (!existingProfile) {
        console.log('User profile not found, creating new profile')
        // Extract name from user metadata
        const fullName = user.user_metadata.full_name || ''
        const [firstName, ...lastNameParts] = fullName.split(' ')
        const lastName = lastNameParts.join(' ')

        // Insert into user_profiles table
        const { data: insertedProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            first_name: firstName || null,
            last_name: lastName || null,
            role: 'user',
            google_id: user.app_metadata.provider === 'google' ? user.id : null,
          })

        if (insertError) {
          console.error('Error inserting user profile:', insertError)
        } else {
          console.log('New user profile created:', insertedProfile)

          if (!insertError) {
            console.log('Attempting to send welcome email via callback route');
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/welcome-email`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: user.email,
                  name: `${firstName} ${lastName}`.trim()
                })
              });

              console.log('Welcome email API response:', await response.json());

              if (!response.ok) {
                throw new Error('Failed to trigger welcome email');
              }
            } catch (emailError) {
              console.error('Failed to send welcome email:', emailError);
            }
          }
        }
      } else {
        console.log('Existing user profile found:', existingProfile)
        // Update the profile if needed
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            email: user.email,
            // Update other fields if necessary
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating user profile:', updateError)
        } else {
          console.log('User profile updated')
        }
      }
    } else {
      console.log('No user data available')
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + '/pricing')
}
