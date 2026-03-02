import { NextResponse } from 'next/server';
import os from 'os';

/**
 * サーバーのLAN IPアドレスを返す
 * スマホ共有URLの生成に使用
 */
export async function GET() {
    const interfaces = os.networkInterfaces();
    let lanIp = 'localhost';

    for (const iface of Object.values(interfaces)) {
        for (const info of iface ?? []) {
            if (info.family === 'IPv4' && !info.internal) {
                lanIp = info.address;
                break;
            }
        }
        if (lanIp !== 'localhost') break;
    }

    return NextResponse.json({ ip: lanIp });
}
