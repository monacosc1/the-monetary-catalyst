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
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`)
    }

    if (user) {
      console.log('User data retrieved:', user)
      console.log('User metadata:', user.user_metadata) // Log full metadata for debugging
      
      try {
        // Extract name from Google OAuth metadata
        const firstName = user.user_metadata.given_name || 
                         user.user_metadata.first_name ||
                         (user.user_metadata.full_name ? user.user_metadata.full_name.split(' ')[0] : null)

        const lastName = user.user_metadata.family_name || 
                        user.user_metadata.last_name ||
                        (user.user_metadata.full_name ? 
                          user.user_metadata.full_name.split(' ').slice(1).join(' ') : 
                          null)

        console.log('Extracted names:', { firstName, lastName })

        // Call backend to handle user profile creation and welcome email
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            google_id: user.app_metadata.provider === 'google' ? user.id : null,
            raw_user_metadata: user.user_metadata // Send full metadata for debugging
          })
        });

        if (!response.ok) {
          console.error('Backend processing failed:', await response.text());
        }
      } catch (error) {
        console.error('Error processing Google callback:', error);
      }
    }
  }

  // Always redirect to pricing page after sign in
  return NextResponse.redirect(requestUrl.origin + '/pricing')
}
