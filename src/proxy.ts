import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveOnboardingGate } from '@/lib/onboarding-gate'

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Local UI previews — skip auth so /dev/* works without Supabase session.
    if (process.env.NODE_ENV === 'development' && pathname.startsWith('/dev/')) {
        return NextResponse.next()
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') || pathname.startsWith('/auth/callback')
    const isPublicRoute = pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico'
    const isOnboardingRoute = pathname === '/onboarding' || pathname.startsWith('/onboarding/')

    if (pathname.startsWith('/api')) {
        return response
    }

    if (!user && !isAuthRoute && !isPublicRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (user && !isPublicRoute) {
        const gate = await resolveOnboardingGate(
            supabase,
            user.id,
            (user.user_metadata ?? null) as Record<string, unknown> | null
        )

        if (gate.isComplete && isOnboardingRoute) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (!gate.isComplete && !isOnboardingRoute) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
