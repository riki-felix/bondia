# Testing Guide for Supabase Authentication

This document outlines how to manually test the authentication implementation.

## Prerequisites

Before testing, ensure you have:

1. ✅ A Supabase project created
2. ✅ Environment variables configured (see `.env.example`)
3. ✅ Email authentication enabled in Supabase dashboard
4. ✅ Redirect URLs configured in Supabase (see `SUPABASE_SETUP.md`)
5. ✅ Application running locally

## Test Scenarios

### 1. Test Unauthenticated Access

**Purpose**: Verify that middleware blocks unauthenticated users

**Steps**:
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:4321/`
3. **Expected**: Should redirect to `/login` with error message "Please log in to access this page."
4. Try accessing `/admin`
5. **Expected**: Should redirect to `/login` with same error message

**Status**: ⬜ Not tested (requires setup)

---

### 2. Test Login Flow

**Purpose**: Verify magic link authentication works

**Steps**:
1. Navigate to `/login`
2. Enter a valid email address
3. Click "Acceder"
4. **Expected**: See message "¡Revisa tu email! Te hemos enviado un enlace para acceder."
5. Check email inbox (including spam folder)
6. **Expected**: Receive email from Supabase with magic link

**Status**: ⬜ Not tested (requires setup)

---

### 3. Test Magic Link Callback

**Purpose**: Verify auth callback establishes session correctly

**Steps**:
1. Click the magic link in email
2. **Expected**: Browser opens callback page showing "Verificando enlace de autenticación..."
3. **Expected**: Then shows "¡Autenticación exitosa! Redirigiendo..."
4. **Expected**: Redirects to `/admin`
5. **Expected**: Admin page loads successfully showing user interface

**Status**: ⬜ Not tested (requires setup)

---

### 4. Test Authenticated Navigation

**Purpose**: Verify authenticated users can access protected routes

**Steps**:
1. While logged in, navigate to different pages:
   - `/` - Home page
   - `/admin` - Admin dashboard
   - `/admin/propiedades` - Properties admin
   - `/inversiones` - Investments page
2. **Expected**: All pages load without redirect
3. **Expected**: No authentication errors

**Status**: ⬜ Not tested (requires setup)

---

### 5. Test Session Persistence

**Purpose**: Verify session persists across browser refreshes

**Steps**:
1. Log in successfully
2. Navigate to `/admin`
3. Refresh the page (F5)
4. **Expected**: Page reloads without redirect to login
5. Close browser tab
6. Open new tab and navigate to `/admin`
7. **Expected**: Should still be logged in (if browser wasn't closed)

**Status**: ⬜ Not tested (requires setup)

---

### 6. Test Logout

**Purpose**: Verify logout clears session

**Steps**:
1. While logged in, navigate to `/admin`
2. Click "Cerrar sesión" button in header
3. **Expected**: Redirects to `/login`
4. Try to access `/admin` again
5. **Expected**: Should redirect to `/login` with error message

**Status**: ⬜ Not tested (requires setup)

---

### 7. Test Invalid/Expired Link

**Purpose**: Verify error handling for invalid auth links

**Steps**:
1. Request a magic link
2. Wait for it to arrive in email
3. Request a **second** magic link (this invalidates the first)
4. Click the **first** (now invalid) link
5. **Expected**: Should show error message on callback page
6. **Expected**: After 3 seconds, redirects to `/login` with error

**Status**: ⬜ Not tested (requires setup)

---

### 8. Test Error Messages

**Purpose**: Verify user-friendly error messages display correctly

**Steps**:
1. Access `/login?error=Test%20Error%20Message`
2. **Expected**: Red error box appears at top of login form with "Test Error Message"
3. Access `/login` normally
4. **Expected**: No error box visible

**Status**: ⬜ Not tested (requires setup)

---

### 9. Test Whitelisted Routes

**Purpose**: Verify public routes don't require authentication

**Steps**:
1. In incognito mode (not logged in):
2. Try to access:
   - `/login` - Should load without redirect ✓
   - `/favicon.ico` - Should load (404 is fine)
   - `/_astro/*` - Static assets should load
3. **Expected**: None of these routes trigger authentication

**Status**: ⬜ Not tested (requires setup)

---

### 10. Test Session Validation

**Purpose**: Verify middleware checks session on every request

**Steps**:
1. Log in successfully
2. Open browser developer tools
3. Go to Application/Storage > Cookies
4. Delete all `sb-*` cookies
5. Try to navigate to `/admin`
6. **Expected**: Redirects to `/login` with error message

**Status**: ⬜ Not tested (requires setup)

---

## Browser Testing Checklist

Test in multiple browsers to ensure compatibility:

- ⬜ Chrome/Chromium
- ⬜ Firefox
- ⬜ Safari (macOS)
- ⬜ Edge

---

## Network Conditions Testing

Test under different network conditions:

- ⬜ Fast connection (local dev)
- ⬜ Slow 3G simulation
- ⬜ Offline (should show appropriate errors)

---

## Security Checks

Manual security verification:

### Cookie Security
1. ⬜ Open DevTools > Application > Cookies
2. ⬜ Verify `sb-*` cookies have:
   - `HttpOnly` flag set
   - `Secure` flag set (in production)
   - `SameSite=Lax` or `SameSite=Strict`

### Session Isolation
1. ⬜ Log in on one browser
2. ⬜ Open incognito/private window
3. ⬜ Verify second window is NOT logged in
4. ⬜ Sessions should be independent

### URL Parameter Security
1. ⬜ Try accessing `/login?error=<script>alert('XSS')</script>`
2. ⬜ Verify no JavaScript execution (should display as text)

---

## Performance Checks

1. ⬜ Login flow completes in < 3 seconds (excluding email delivery)
2. ⬜ Page loads after auth complete in < 2 seconds
3. ⬜ Middleware adds < 50ms to request processing

---

## Notes

- All tests require a properly configured Supabase project
- Some tests require email access (use a test email account)
- Magic links typically expire after 1 hour
- Session tokens typically expire after 1 hour (with auto-refresh)

---

## Reporting Issues

If you find issues during testing, please note:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Network tab details (if relevant)
