import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protect internal routes -> redirect to login if not authenticated
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth')
    ) {
        // For now, let's keep it open or redirect strict Dashboard paths?
        // Let's protect everything except public paths. 
        // Actually, for this stage, let's just make sure we handle the session refresh.
        // We can add strict redirection later if needed, or if the user requests it.
        // For now, redirecting root to login if no user is a safe bet for a "Clinical Tool".

        // COMMENTED OUT FOR NOW TO AVOID LOCKOUT DURING DEV WITHOUT KEYS
        // const url = request.nextUrl.clone()
        // url.pathname = '/login'
        // return NextResponse.redirect(url)
    }

    return response
}
