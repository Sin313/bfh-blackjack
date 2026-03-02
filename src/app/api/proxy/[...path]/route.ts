import { NextRequest, NextResponse } from 'next/server';

const BFH_API_BASE = 'https://api.bravefrontierheroes.com';

async function handleProxy(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const pathStr = '/' + path.join('/');

    // クエリパラメータから base を取り出してベースURLを切り替え可能にする
    const searchParams = request.nextUrl.searchParams;
    const baseOverride = searchParams.get('base');
    const base = baseOverride ?? BFH_API_BASE;

    const targetUrl = new URL(`${base}${pathStr}`);
    // base 以外のクエリパラメータを転送
    searchParams.forEach((value, key) => {
        if (key !== 'base') targetUrl.searchParams.append(key, value);
    });

    // Get token from cookie
    const cookieHeader = request.headers.get('cookie') || '';
    let token: string | null = null;
    for (const part of cookieHeader.split(';')) {
        const [k, v] = part.trim().split('=');
        if (k === 'bfh_access_token') {
            token = v;
            break;
        }
    }

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[Proxy] ${request.method} ${pathStr} -> ${targetUrl.toString()} token=${token ? 'yes' : 'no'}`);

    try {
        const upstream = await fetch(targetUrl.toString(), {
            method: request.method,
            headers,
            body: request.method !== 'GET' && request.method !== 'HEAD'
                ? await request.text()
                : undefined,
        });

        const data = await upstream.json().catch(() => null);
        console.log(`[Proxy] <- ${upstream.status}`, JSON.stringify(data)?.slice(0, 300));

        return NextResponse.json(data, { status: upstream.status });
    } catch (err: any) {
        console.error('[Proxy Error]', err.message);
        return NextResponse.json({ error: err.message }, { status: 502 });
    }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
