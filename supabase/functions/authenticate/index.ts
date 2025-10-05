import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting: Track failed attempts per IP
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 hour

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of failedAttempts.entries()) {
    if (now - data.lastAttempt > LOCKOUT_DURATION) {
      failedAttempts.delete(ip)
    }
  }
}, CLEANUP_INTERVAL)

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown'
}

function isRateLimited(ip: string): boolean {
  const attempt = failedAttempts.get(ip)
  if (!attempt) return false
  
  const now = Date.now()
  if (now - attempt.lastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(ip)
    return false
  }
  
  return attempt.count >= MAX_ATTEMPTS
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const attempt = failedAttempts.get(ip)
  
  if (!attempt || now - attempt.lastAttempt > LOCKOUT_DURATION) {
    failedAttempts.set(ip, { count: 1, lastAttempt: now })
  } else {
    attempt.count++
    attempt.lastAttempt = now
  }
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip)
}

function validateInput(username: string, password: string): { valid: boolean; error?: string } {
  // Username validation
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Invalid input' }
  }
  if (username.length < 3 || username.length > 50) {
    return { valid: false, error: 'Invalid input' }
  }
  if (!/^[a-zA-Z0-9._@-]+$/.test(username)) {
    return { valid: false, error: 'Invalid input' }
  }
  
  // Password validation
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Invalid input' }
  }
  if (password.length < 1 || password.length > 128) {
    return { valid: false, error: 'Invalid input' }
  }
  
  return { valid: true }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientIP = getClientIP(req)
  
  // Check rate limiting
  if (isRateLimited(clientIP)) {
    return new Response(
      JSON.stringify({ error: 'Too many failed attempts. Please try again later.' }),
      {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const { username, password } = await req.json()

    // Validate input
    const validation = validateInput(username, password)
    if (!validation.valid) {
      recordFailedAttempt(clientIP)
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client with service role key for secure database access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Try to authenticate user
    const { data: users, error } = await supabase
      .rpc('authenticate_user', {
        input_username: username,
        input_password: password
      })

    if (error) {
      // Log detailed error server-side only
      console.error('Authentication error:', error)
      recordFailedAttempt(clientIP)
      
      // Return generic error to client
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!users || users.length === 0) {
      recordFailedAttempt(clientIP)
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Authentication successful - clear failed attempts
    clearFailedAttempts(clientIP)

    // Return user data (without password)
    const userData = users[0]
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          jurusan: userData.jurusan
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    // Log detailed error server-side only
    console.error('Edge function error:', error)
    recordFailedAttempt(clientIP)
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})