import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function assertSupabaseConfig() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }

    // JWT anon keys have three segments; a truncated key causes Supabase "Invalid API key".
    const jwtSegments = supabaseAnonKey.split('.').length
    if (jwtSegments < 3 && !supabaseAnonKey.startsWith('sb_publishable_')) {
        throw new Error(
            'NEXT_PUBLIC_SUPABASE_ANON_KEY looks truncated — paste the full anon key from Supabase → Settings → API',
        )
    }
}

if (typeof window === 'undefined') {
    try {
        assertSupabaseConfig()
    } catch (error) {
        console.error('CRITICAL:', error instanceof Error ? error.message : error)
    }
}

// createBrowserClient is used here, but it's safe to use on server as well for basic interactions
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
