# Google OAuth Setup Guide

## Overview
Google sign-in/signup has been added to both the login and signup pages. Users can now authenticate using their Google account.

## What Was Added

1. **Google Sign-In Button** on Login Page (`app/(auth)/login/page.tsx`)
2. **Google Sign-Up Button** on Signup Page (`app/(auth)/signup/page.tsx`)
3. **OAuth Callback Route** (`app/auth/callback/route.ts`) - Handles the redirect after Google authentication

## Supabase Configuration Required

To enable Google OAuth, you need to configure it in your Supabase dashboard:

### Step 1: Enable Google Provider
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and click to enable it

### Step 2: Configure Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. Set the application type to **Web application**
7. Add authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - For local development: `http://localhost:3000/auth/callback` (if testing locally)
8. Copy the **Client ID** and **Client Secret**

### Step 3: Add Credentials to Supabase
1. In Supabase Dashboard > **Authentication** > **Providers** > **Google**
2. Paste your **Client ID** and **Client Secret**
3. Save the configuration

### Step 4: Configure Redirect URLs
In Supabase Dashboard > **Authentication** > **URL Configuration**:
- Add your production URL: `https://yourdomain.com/auth/callback`
- Add your development URL: `http://localhost:3000/auth/callback`

## How It Works

1. User clicks "Sign in with Google" or "Sign up with Google"
2. User is redirected to Google's OAuth consent screen
3. After authorization, Google redirects back to `/auth/callback` with an authorization code
4. The callback route exchanges the code for a session token
5. User is redirected to the dashboard

## Features

- **Seamless Integration**: Works with existing email/password authentication
- **Automatic Account Creation**: New users signing in with Google will have accounts created automatically
- **User Profile Sync**: User's Google profile information is synced to Supabase
- **Consistent UI**: Google button matches the dark theme of the application

## Testing

1. Make sure Google OAuth is enabled in Supabase
2. Click "Sign in with Google" or "Sign up with Google"
3. Complete the Google OAuth flow
4. You should be redirected to the dashboard after successful authentication

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console matches exactly: `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Check that the URL in Supabase settings matches your application URL

### "Invalid client" error
- Verify that Client ID and Client Secret are correctly entered in Supabase
- Make sure Google+ API is enabled in Google Cloud Console

### Callback not working
- Check that `/auth/callback` route is accessible
- Verify middleware allows the callback route to proceed
- Check browser console and server logs for errors

## Notes

- The `handle_new_user()` trigger in the database will automatically create a user record in `public.users` table when a new user signs up via Google
- Users can link their Google account to an existing email/password account (future enhancement)
- The OAuth flow uses PKCE (Proof Key for Code Exchange) for security

