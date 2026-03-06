import { NextRequest, NextResponse } from 'next/server';

/**
 * スマホ認証ルート: PC のトークンをスマホに共有するためのエンドポイント
 * /mobile?t=<access_token> でアクセスすると Cookie をセットして /game へリダイレクト
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('t');
    const refreshToken = request.nextUrl.searchParams.get('r');

    if (!token || token.length < 10) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.redirect(new URL('/game', request.url));

    response.cookies.set('bfh_access_token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,
    });

    // refresh_token もあれば一緒にセット（30日有効）
    if (refreshToken) {
        response.cookies.set('bfh_refresh_token', refreshToken, {
            httpOnly: false,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
        });
    }

    return response;
}
