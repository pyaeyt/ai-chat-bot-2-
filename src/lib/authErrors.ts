/** Human-readable copy for common Supabase Auth API errors */
export function mapSupabaseAuthError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes('rate limit') || m.includes('too many requests')) {
    return (
      'Supabase has temporarily stopped sending auth emails (rate limit). ' +
      'In the Supabase dashboard go to Authentication → Providers → Email and turn OFF “Confirm email”. ' +
      'Then signup won’t send mail and this error goes away. You can also wait about an hour and try again.'
    )
  }

  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'Confirm your email first (check your inbox), or disable “Confirm email” in Supabase for testing.'
  }

  if (m.includes('invalid login credentials')) {
    return 'Wrong email or password. If you just signed up, confirm your email or use the password you chose.'
  }

  return message
}
