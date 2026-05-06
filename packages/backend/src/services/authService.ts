import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { getChildren, getProfile } from './dbService.js'
import type { User, Profile, Child } from '@bedtime/shared'

export async function signup(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(error?.message ?? 'Signup failed')

  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError || !session.session) throw new Error(signInError?.message ?? 'Sign-in after signup failed')

  if (displayName) {
    await supabaseAdmin.from('profiles').update({ display_name: displayName }).eq('id', data.user.id)
  }

  return {
    user: { id: data.user.id, email: data.user.email! },
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(error?.message ?? 'Invalid credentials')

  return {
    user: { id: data.user.id, email: data.user.email! },
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}

export async function getMe(
  userId: string,
): Promise<{ profile: Profile; children: Child[] } | null> {
  const profile = await getProfile(userId)
  if (!profile) return null
  const children = await getChildren(userId)
  return { profile, children }
}

export async function refreshSession(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) throw new Error(error?.message ?? 'Session refresh failed')
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}
