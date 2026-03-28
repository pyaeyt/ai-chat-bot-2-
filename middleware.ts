import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicRoutes = ['/', '/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isStudentRoute = pathname.startsWith('/student')
  const isTeacherRoute = pathname.startsWith('/teacher')

  // Allow auth callback
  if (isAuthCallback) return supabaseResponse

  // Not logged in trying to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Logged in - check role for routing
  if (user) {
    const roleCookie = request.cookies.get('user_role')?.value

    if (roleCookie) {
      // Redirect authenticated users away from auth pages
      if (isPublicRoute && (pathname === '/login' || pathname === '/register')) {
        const url = request.nextUrl.clone()
        url.pathname = roleCookie === 'teacher' ? '/teacher' : '/student'
        return NextResponse.redirect(url)
      }

      // Redirect root to dashboard
      if (pathname === '/') {
        const url = request.nextUrl.clone()
        url.pathname = roleCookie === 'teacher' ? '/teacher' : '/student'
        return NextResponse.redirect(url)
      }

      // Prevent wrong role access
      if (isStudentRoute && roleCookie === 'teacher') {
        const url = request.nextUrl.clone()
        url.pathname = '/teacher'
        return NextResponse.redirect(url)
      }
      if (isTeacherRoute && roleCookie === 'student') {
        const url = request.nextUrl.clone()
        url.pathname = '/student'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
