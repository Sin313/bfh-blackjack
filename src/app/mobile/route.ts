import { NextRequest, NextResponse } from 'next/server';

/**
 * スマホ認証ルート: PC のトークンをスマホに共有するためのエンドポイント
 * /mobile?t=<access_token> でアクセスすると Cookie をセットして /dashboard へリダイレクト
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('t');

    if (!token || token.length < 10) {
        // トークンなし → ログインページへ
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Cookie をセットして dashboard へリダイレクト
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('bfh_access_token', token, {
        httpOnly: false,      // JS から読めるように（プロキシが Cookie を読む）
        secure: false,        // HTTP（ローカル LAN）でも動作するよう false
        sameSite: 'lax',
        path: '/',
        maxAge: 3600,         // 1時間
    });

    return response;
}
