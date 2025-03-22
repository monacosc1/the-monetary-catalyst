// /frontend/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`);
    }

    // Fetch the user data
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth`);
    }

    if (user) {
      console.log('User data retrieved:', user);
      console.log('User metadata:', user.user_metadata);

      try {
        const googleIdentity = user.identities?.find(identity => identity.provider === 'google');
        const googleId = googleIdentity?.id;

        const firstName = user.user_metadata.given_name || 
                         user.user_metadata.name?.split(' ')[0] || 
                         '';
        const lastName = user.user_metadata.family_name || 
                        (user.user_metadata.name?.split(' ').length > 1 ? 
                         user.user_metadata.name.split(' ').slice(1).join(' ') : 
                         '');

        console.log('Extracted data:', { googleId, firstName, lastName });

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
            google_id: googleId,
            raw_user_metadata: user.user_metadata,
          }),
        });

        if (!response.ok) {
          console.error('Backend processing failed:', await response.text());
        } else {
          console.log('Backend processing successful:', await response.json());
        }
      } catch (error) {
        console.error('Error processing Google callback:', error);
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin + '/pricing');
}