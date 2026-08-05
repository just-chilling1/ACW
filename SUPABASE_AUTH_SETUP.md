# Supabase dashboard steps (manual)

Complete these in the Supabase project used by 1tap and AI CashWave.

## Redirect URLs

**Authentication → URL Configuration → Redirect URLs**

Add (keep existing 1tap entries):

```
https://aicashwavemembersarea.com/**
https://cashtapaiaccess.com/**
http://localhost:3000/**
http://localhost:3001/**
```

## Reset Password email template

**Authentication → Email Templates → Reset Password**

Use `{{ .ConfirmationURL }}` in the reset link so `redirectTo` from each app controls the domain:

```html
<h2>Reset Password</h2>
<p>Follow this link to reset the password for your account:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

AI CashWave calls `resetPasswordForEmail` with `https://cashtapaiaccess.com/auth/callback?next=/reset-password`.

## Confirm signup (if enabled)

Prefer `{{ .ConfirmationURL }}` in the confirm template as well so signups from either domain redirect correctly.
