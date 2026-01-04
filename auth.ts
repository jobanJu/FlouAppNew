import { supabase } from './lib/supabase';

type Body = {
  action?: 'signin' | 'signup' | 'signout';
  email?: string;
  password?: string;
};

async function GET(request: Request) {
  return new Response(JSON.stringify({ ok: true, message: 'Auth handler active' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function POST(request: Request) {
  try {
    const body: Body = await request.json().catch(() => ({} as Body));

    if (body.action === 'signup') {
      if (!body.email || !body.password) {
        return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400 });
      }

      const { data, error } = await supabase.auth.signUp({
        email: body.email.trim().toLowerCase(),
        password: body.password,
      });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ data }), { status: 200 });
    }

    if (body.action === 'signin') {
      if (!body.email || !body.password) {
        return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400 });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email.trim().toLowerCase(),
        password: body.password,
      });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      return new Response(JSON.stringify({ data }), { status: 200 });
    }

    if (body.action === 'signout') {
      // server-side signOut is a no-op here (client should sign out locally), but call API if needed
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 });
  }
}

export const handlers = { GET, POST };

export default handlers;

// Simple middleware export: validates Supabase access token from Authorization header
export async function auth(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '') || null;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Return a minimal ok response with user info; callers can adapt this middleware to their needs
    return new Response(JSON.stringify({ ok: true, user: { id: userData.user.id, email: userData.user.email } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Next.js middleware compatibility: if `next/server` is available, return NextResponse
export async function middleware(req: any) {
  // Try to dynamically load NextResponse if running inside Next.js middleware
  let NextResponse: any = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NextResponse = require('next/server').NextResponse;
  } catch (e) {
    NextResponse = null;
  }

  // Normalize to a Request-like object for token extraction
  const getTokenFromReq = (r: any) => {
    try {
      // Next.js middleware Request has headers.get
      if (r && typeof r.headers?.get === 'function') return r.headers.get('authorization')?.replace('Bearer ', '') || null;
      // Node/Express-style
      if (r && r.headers && r.headers.authorization) return r.headers.authorization.replace('Bearer ', '');
      // Fallback to cookies
      if (r && r.cookies && r.cookies.get) return r.cookies.get('sb-access-token')?.value || null;
      return null;
    } catch {
      return null;
    }
  };

  const token = getTokenFromReq(req);

  if (!token) {
    if (NextResponse) {
      // Redirect to login page within Next.js
      try {
        const url = new URL(req.url || '/', 'http://localhost');
        url.pathname = '/(auth)/login';
        return NextResponse.redirect(url);
      } catch (_) {
        return NextResponse.rewrite('/(auth)/login');
      }
    }
    return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      if (NextResponse) return NextResponse.redirect(new URL('/(auth)/login', req.url || '/'));
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Valid user: continue
    if (NextResponse) return NextResponse.next();
    return new Response(JSON.stringify({ ok: true, user: { id: userData.user.id, email: userData.user.email } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    if (NextResponse) return NextResponse.redirect(new URL('/(auth)/login', req.url || '/'));
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
