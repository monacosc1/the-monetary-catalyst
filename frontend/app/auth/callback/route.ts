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

      // Check if user already exists in custom users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select()
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing user:', fetchError)
      }

      if (!existingUser) {
        console.log('User not found in custom table, inserting new record')
        // Extract name from user metadata
        const fullName = user.user_metadata.full_name || ''
        const [firstName, ...lastNameParts] = fullName.split(' ')
        const lastName = lastNameParts.join(' ')

        // Insert into custom users table only if the user doesn't exist
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            first_name: firstName || null,
            last_name: lastName || null,
            role: 'user',  // Default role for Google Auth users
            google_id: user.app_metadata.provider === 'google' ? user.id : null,
          })
          .single()

        if (insertError) {
          console.error('Error inserting user into custom table:', insertError)
        } else {
          console.log('New Google user successfully inserted into custom table:', insertedUser)
        }
      } else {
        console.log('Existing Google user logged in, no new entry created')
      }
    } else {
      console.log('No user data available')
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + '/pricing')
}
