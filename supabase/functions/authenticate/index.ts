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

    // Try to authenticate as regular user first
    const { data: users, error } = await supabase
      .rpc('authenticate_user', {
        input_username: username,
        input_password: password
      })

    let userData = null
    let userType = 'user' // 'user' or 'guru_pembimbing'

    if (!error && users && users.length > 0) {
      userData = users[0]
    } else {
      // Try to authenticate as guru pembimbing
      const { data: guruData, error: guruError } = await supabase
        .rpc('authenticate_guru_pembimbing', {
          input_username: username,
          input_password: password
        })

      if (!guruError && guruData && guruData.length > 0) {
        userData = {
          id: guruData[0].id,
          name: guruData[0].nama,
          username: guruData[0].username,
          role: 'guru_pembimbing',
          jurusan: guruData[0].jurusan_nama,
          jurusan_id: guruData[0].jurusan_id,
          nip: guruData[0].nip,
          email: guruData[0].email,
          guru_pembimbing_id: guruData[0].id
        }
        userType = 'guru_pembimbing'
      }
    }

    if (!userData) {
      recordFailedAttempt(clientIP)
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create or get Supabase Auth session for this user
    const authEmail = userType === 'guru_pembimbing'
      ? `guru_${userData.username}@internal.smkglobin.local`
      : `${userData.username}@internal.smkglobin.local`

    // Ensure an Auth user exists for this identity (password = input password)
    const { data: listData } = await supabase.auth.admin.listUsers()
    const existingUser = listData?.users?.find(u => u.email === authEmail)

    let authUserId = existingUser?.id || null

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
        user_metadata: {
          custom_user_id: userData.id,
          name: userData.name,
          role: userData.role,
          jurusan: userData.jurusan,
          user_type: userType,
        },
      })

      if (createError) {
        console.error('Error creating auth user:', createError)
      } else {
        authUserId = newUser?.user?.id || null
      }
    } else {
      // Keep auth password synced with custom password so sign-in works reliably
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: {
          custom_user_id: userData.id,
          name: userData.name,
          role: userData.role,
          jurusan: userData.jurusan,
          user_type: userType,
        },
      })

      if (updateAuthError) {
        console.error('Error updating auth user:', updateAuthError)
      }
    }

    // Create role entry in user_roles table for secure role management
    if (authUserId) {
      const roleToInsert = userType === 'guru_pembimbing' ? 'guru_pembimbing' : userData.role

      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: authUserId,
          role: roleToInsert,
          jurusan: userData.jurusan,
        }, {
          onConflict: 'user_id,role',
        })

      if (roleError) {
        console.error('Error creating role entry:', roleError)
      }

      // For guru pembimbing, also update the user_id in guru_pembimbing table
      if (userType === 'guru_pembimbing') {
        const { error: updateError } = await supabase
          .from('guru_pembimbing')
          .update({ user_id: authUserId })
          .eq('id', userData.guru_pembimbing_id)

        if (updateError) {
          console.error('Error updating guru_pembimbing user_id:', updateError)
        }
      }
    }

    // Sign in via anon client to get a real session (access_token + refresh_token)
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: authEmail,
      password,
    })

    if (signInError || !signInData?.session) {
      console.error('Auth sign-in error:', signInError)
      return new Response(
        JSON.stringify({ error: 'Gagal membuat sesi login. Silakan coba lagi.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return user data with session token
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          role: userData.role,
          jurusan: userData.jurusan,
          jurusan_id: userData.jurusan_id,
          guru_pembimbing_id: userData.guru_pembimbing_id,
          nip: userData.nip,
          email: userData.email,
        },
        session: signInData.session,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    recordFailedAttempt(clientIP)
    
    return new Response(
      JSON.stringify({ error: 'An error occurred. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
