# Supabase Authentication Setup Guide

This document explains how to configure Supabase authentication for the Bondia application.

## Overview

The application uses Supabase for authentication with the following features:

- **Magic Link Authentication**: Users log in via email with a one-time link
- **Session-based Access Control**: Middleware enforces authentication on all routes except whitelisted ones
- **Cookie-based Sessions**: Using Supabase SSR for secure server-side session management
- **Automatic Redirects**: Unauthenticated users are redirected to `/login` with appropriate error messages

## Prerequisites

1. A [Supabase account](https://supabase.com/) (free tier is sufficient)
2. Node.js v18.14 or higher
3. npm or another package manager

## Setting Up Supabase

### 1. Create a Supabase Project

1. Log in to [Supabase](https://app.supabase.com/)
2. Click **"New project"**
3. Fill in the project details:
   - **Organization**: Select or create an organization
   - **Name**: Give your project a name (e.g., "bondia")
   - **Database Password**: Generate a strong password (save this securely)
   - **Region**: Choose the region closest to your users (e.g., `us-east-1` for USA)
4. Click **"Create new project"** and wait for provisioning (1-2 minutes)

### 2. Configure Authentication

1. In your Supabase project dashboard, navigate to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled (it should be enabled by default)
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize the magic link email template if desired
   - Ensure the **Confirm signup** template includes `{{ .ConfirmationURL }}` or `{{ .TokenHash }}`

### 3. Set Up Site URL and Redirect URLs

1. Navigate to **Authentication** → **URL Configuration**
2. Set the **Site URL** to your application URL:
   - Local development: `http://localhost:4321` (or `http://localhost:8888` if using Netlify CLI)
   - Production: Your deployed URL (e.g., `https://your-app.netlify.app`)
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:4321/auth/callback
   http://localhost:8888/auth/callback
   https://your-app.netlify.app/auth/callback
   ```

### 4. Get Your API Keys

1. Navigate to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: Your unique Supabase project URL
   - **anon/public key**: The anonymous key (safe to expose in browser)

**Important**: Do NOT use the `service_role` key in client-side code. The `anon` key is sufficient and safe for public use.

## Configuring the Application

### 1. Set Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```bash
   # Server-side variables
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   
   # Client-side variables (must have PUBLIC_ prefix)
   PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

**Note**: For Netlify deployments, you can also set these as environment variables in the Netlify dashboard under **Site settings** → **Environment variables**.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

For local development:
```bash
npm run dev
```

For development with Netlify CLI (recommended for production-like environment):
```bash
netlify dev --target-port 4321
```

## How Authentication Works

### User Flow

1. **Login**: User visits `/login` and enters their email address
2. **Magic Link**: Supabase sends an email with a one-time login link
3. **Callback**: User clicks the link, which redirects to `/auth/callback`
4. **Session Creation**: The callback handler validates the tokens and creates a session
5. **Redirect**: User is redirected to `/admin` (or the requested page)
6. **Access Control**: Middleware checks session on every request to protected routes

### Protected Routes

All routes are protected by default **except**:

- `/login` - Login page
- `/auth/callback` - OAuth callback handler
- `/api/auth/*` - Authentication API endpoints
- Static assets (`/_astro/*`, `/assets/*`, `/favicon.*`, etc.)
- Development resources (`/@vite/*`, `/@fs/*`, etc.)

To access any other route, users must have a valid session.

### Session Management

- Sessions are stored in HTTP-only cookies managed by Supabase SSR
- Session validation happens in `src/middleware.ts` on every request
- Invalid or missing sessions result in redirect to `/login` with an error message
- Users can log out by clicking "Cerrar sesión" in the admin header

## Architecture

### Key Files

- **`src/middleware.ts`**: Enforces authentication on all routes
- **`src/lib/supabaseServer.ts`**: Creates Supabase client for server-side operations
- **`src/lib/supabaseClient.ts`**: Creates Supabase client for client-side operations
- **`src/scripts/supabaseClient.js`**: Browser-compatible client for inline scripts
- **`src/pages/login.astro`**: Login page with magic link form
- **`src/pages/auth/callback.astro`**: Handles authentication callback
- **`src/components/Admin.astro`**: Admin layout with session check and logout

### Server-Side Client

Server-side operations use `createSupabaseServerClient(cookies)` which:
- Properly handles cookie-based sessions
- Works with Astro's SSR
- Automatically refreshes expired tokens
- Is secure for server-side operations

Example:
```typescript
import { createSupabaseServerClient } from '../lib/supabaseServer';

const supabase = createSupabaseServerClient(Astro.cookies);
const { data, error } = await supabase.from('table').select('*');
```

### Client-Side Client

Client-side operations use the browser client from `/src/scripts/supabaseClient.js`:

```javascript
import { supabase } from '/src/scripts/supabaseClient.js';

// Sign in
const { error } = await supabase.auth.signInWithOtp({ email });

// Sign out
await supabase.auth.signOut();
```

## Testing the Setup

### 1. Test Login Flow

1. Start the development server
2. Navigate to `http://localhost:4321` (or your dev URL)
3. You should be redirected to `/login`
4. Enter a valid email address
5. Check your email for the magic link
6. Click the link
7. You should be redirected to `/admin` with a valid session

### 2. Test Protected Routes

1. Open a private/incognito browser window
2. Try to access `http://localhost:4321/admin`
3. You should be redirected to `/login` with an error message
4. After logging in, you should be able to access all protected pages

### 3. Test Logout

1. While logged in, click "Cerrar sesión" in the admin header
2. You should be redirected to `/login`
3. Try to access `/admin` again - you should be redirected to `/login`

## Troubleshooting

### Issue: "Invalid login credentials" or magic link doesn't work

**Solution**: 
- Ensure email provider is enabled in Supabase dashboard
- Check that redirect URLs are configured correctly
- Verify Site URL matches your development/production URL
- Check spam folder for the magic link email

### Issue: "Session verification failed"

**Solution**:
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly
- Check that environment variables are available (restart dev server after changing .env)
- For Netlify, ensure environment variables are set in the Netlify dashboard

### Issue: Infinite redirect loop

**Solution**:
- Check that `/login` is in the middleware whitelist
- Verify middleware isn't blocking auth callback route
- Clear browser cookies and try again

### Issue: "Failed to establish session"

**Solution**:
- Ensure cookies are enabled in your browser
- Check that the application is running on the same domain as configured in Supabase
- For local development, use `localhost` (not `127.0.0.1` or `0.0.0.0`)

## Production Deployment

### Netlify

1. Set environment variables in Netlify dashboard
2. Deploy the application
3. Update Supabase redirect URLs to include production URL
4. Test the login flow in production

### Other Platforms

1. Set environment variables in your hosting platform
2. Ensure the platform supports Node.js SSR (server-side rendering)
3. Configure redirect URLs in Supabase to include your production URL
4. Test authentication in production environment

## Security Best Practices

1. **Never commit `.env` files**: Always use `.env.example` as a template
2. **Use HTTPS in production**: Required for secure cookie handling
3. **Rotate keys regularly**: Generate new API keys periodically
4. **Monitor auth logs**: Check Supabase authentication logs for suspicious activity
5. **Implement rate limiting**: Consider adding rate limiting to login endpoints
6. **Use RLS policies**: Configure Row Level Security in Supabase for database access control

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Astro Middleware Documentation](https://docs.astro.build/en/guides/middleware/)
- [Magic Link Authentication](https://supabase.com/docs/guides/auth/auth-magic-link)

## Support

For issues specific to this application, please open an issue in the GitHub repository.

For Supabase-specific issues, refer to [Supabase Support](https://supabase.com/support).
