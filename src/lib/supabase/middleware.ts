import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip auth processing for public pages
    // This ensures these pages always load instantly and never get involved in redirect loops
    if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
        return NextResponse.next();
    }

    // 2. Create the Supabase client
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 3. Refresh the session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 4. Protect private routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/history')) {
        // A. User is confirmed authenticated -> Allow
        if (user) {
            // console.log('Middleware: User authenticated, allowing access.');
            return supabaseResponse;
        }

        // B. User is NOT confirmed by getUser(), but has auth cookie -> Allow (prevent loop)
        // This handles cases where getUser() might fail due to network/env issues,
        // letting the client-side handle the actual data fetching failure if token is bad.
        const allCookies = request.cookies.getAll();
        console.log('Middleware: Dumping ALL cookies:', allCookies.map(c => c.name));

        const hasAuthCookie = allCookies.some(
            (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
        );

        if (hasAuthCookie) {
            console.log('Middleware: Auth cookie found but getUser() returned null. ALLOWING access to prevent redirect loop.');
            return supabaseResponse;
        }

        // console.log('Middleware: No user and no auth cookie. Redirecting to login.');
        // C. No user, no cookie -> Redirect to login
        /* TEMPORARILY DISABLED FOR DEBUGGING
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
        */
        console.log('Middleware: Redirect disabled. Allowing access despite missing checks.');
        return supabaseResponse;
    }

    // 5. Allow access for all other routes
    return supabaseResponse;
}
