
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    return handleProxy(request);
}

export async function POST(request: NextRequest) {
    return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const targetPath = searchParams.get('path');

    if (!targetPath) {
        return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    const overrideBase = searchParams.get('base');
    const apiUrl = overrideBase || process.env.NEXT_PUBLIC_API_URL || 'https://api.bravefrontierheroes.com';
    const finalUrl = `${apiUrl}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;

    // Copy original query params except 'path' and 'base'
    const targetUrl = new URL(finalUrl);
    searchParams.forEach((value, key) => {
        if (key !== 'path' && key !== 'base') {
            targetUrl.searchParams.append(key, value);
        }
    });

    const authHeader = request.headers.get('Authorization');

    try {
        const response = await axios({
            method: request.method,
            url: targetUrl.toString(),
            headers: {
                ...(authHeader ? { 'Authorization': authHeader } : {}),
                'Accept': 'application/json',
            },
            data: request.method !== 'GET' ? await request.json().catch(() => undefined) : undefined,
        });

        if (targetUrl.toString().includes('/v1/me/units')) {
            console.log(`[Units Debug] Data:`, JSON.stringify(response.data));
        }
        console.log(`[Proxy Success] ${targetUrl.toString()} -> Status: ${response.status}`, JSON.stringify(response.data).slice(0, 200));

        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        console.error(`[Proxy Error] ${request.method} ${targetUrl.toString()}:`, error.response?.data || error.message);
        return NextResponse.json(
            error.response?.data || { message: 'Proxy request failed' },
            { status: error.response?.status || 500 }
        );
    }
}
