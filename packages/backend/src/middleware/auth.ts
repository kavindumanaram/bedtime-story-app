import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'sb-access-token')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401)

  c.set('userId', user.id)
  await next()
})
