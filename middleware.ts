import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get user info from cookie (synchronized from Zustand store)
  const authCookie = request.cookies.get('dementia-care-auth')
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/', '/unauthorized', '/setup-password', '/forgot-password', '/reset-password']
  
  // If it's a public route, allow access
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Check if user is authenticated
  if (!authCookie) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    // Decode the cookie value since we encode it in the auth store
    const decodedValue = decodeURIComponent(authCookie.value)
    const userData = JSON.parse(decodedValue)
    const userType = userData.user_type
    const isActive = userData.is_active
    
    // Check if user account is active
    if (!isActive) {
      return NextResponse.redirect(new URL('/login?error=account_inactive', request.url))
    }
    
    // Role-based route protection
    if (pathname.startsWith('/super-admin')) {
      if (userType !== 'super_admin') {
        // Redirect to user's appropriate dashboard
        const redirectPath = getRedirectPath(userType)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
    
    if (pathname.startsWith('/hospital-admin')) {
      if (userType !== 'hospital_admin') {
        const redirectPath = getRedirectPath(userType)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
    
    if (pathname.startsWith('/doctor')) {
      if (userType !== 'doctor') {
        const redirectPath = getRedirectPath(userType)
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
    
    // Hospital data isolation - Add headers with user context
    const response = NextResponse.next()
    response.headers.set('x-user-id', userData.id)
    response.headers.set('x-user-role', userType)
    
    // Add hospital context for hospital_admin and doctor
    if (userType === 'hospital_admin' && userData.hospital?.id) {
      response.headers.set('x-hospital-id', userData.hospital.id)
    } else if (userType === 'doctor' && userData.doctor_profile?.hospital_id) {
      response.headers.set('x-hospital-id', userData.doctor_profile.hospital_id)
    }
    
    return response
    
  } catch (error) {
    // If cookie is invalid, redirect to login
    return NextResponse.redirect(new URL('/login?error=invalid_session', request.url))
  }
}

/**
 * Get redirect path based on user type
 */
function getRedirectPath(userType: string): string {
  switch (userType) {
    case 'super_admin':
      return '/super-admin'
    case 'hospital_admin':
      return '/hospital-admin'
    case 'doctor':
      return '/doctor'
    default:
      return '/login?error=unauthorized'
  }
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
