import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { serialize } from 'cookie';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
    }

    if (!code) {
        return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    try {
        const clientId = process.env.BFH_CLIENT_ID;
        const clientSecret = process.env.BFH_CLIENT_SECRET;
        const tokenUrl = process.env.BFH_TOKEN_URL || 'https://auth.bravefrontierheroes.com/oauth2/token';
        // リクエストのオリジンを動的に使用（localhost でも LAN IP でも対応）
        const redirectUri = `${request.nextUrl.origin}/callback`;

        // Exchange code for token
        const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await axios.post(
            tokenUrl,
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`
                },
            }
        );

        const { access_token, expires_in } = response.data;

        const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));

        redirectResponse.cookies.set('bfh_access_token', access_token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: expires_in || 3600,
        });

        return redirectResponse;
    } catch (error: any) {
        console.error('Auth Error:', error.response?.data || error.message);
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }
}
