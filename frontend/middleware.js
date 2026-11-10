import { NextResponse } from 'next/server';

// "/admin" -> "/admin/": the PHP admin panel uses relative links, so it needs the trailing slash.
// (A redirect rule in next.config would also match "/admin/" and loop, so this checks the exact path.)
export function middleware(req) {
  if (req.nextUrl.pathname === '/admin') {
    // a plain URL (not req.nextUrl), so Next does not strip the trailing slash again
    const url = new URL('/admin/' + req.nextUrl.search, req.url);
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin'] };
