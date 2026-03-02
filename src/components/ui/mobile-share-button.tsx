'use client';

import { useState, useCallback } from 'react';

/**
 * スマホ共有ボタン（クライアント専用コンポーネント）
 * dynamic({ ssr: false }) でインポートしてHydrationエラーを回避
 */
export default function MobileShareButton() {
    const [state, setState] = useState<'idle' | 'copying' | 'done' | 'error'>('idle');

    const share = useCallback(async () => {
        setState('copying');
        try {
            // トークンをCookieから取得
            const token = document.cookie
                .split(';')
                .map(c => c.trim())
                .find(c => c.startsWith('bfh_access_token='))
                ?.split('=')
                .slice(1)
                .join('=');

            if (!token) throw new Error('token not found');

            // LAN IPを取得
            const ipRes = await fetch('/api/local-ip');
            const { ip } = await ipRes.json();
            const port = window.location.port || '3000';
            const url = `http://${ip}:${port}/mobile?t=${encodeURIComponent(token)}`;

            // クリップボードへコピー（失敗時はpromptで代替）
            try {
                await navigator.clipboard.writeText(url);
            } catch {
                window.prompt('このURLをコピーしてスマホに送ってください', url);
            }

            setState('done');
            setTimeout(() => setState('idle'), 4000);
        } catch (err) {
            console.error('[MobileShare]', err);
            setState('error');
            setTimeout(() => setState('idle'), 3000);
        }
    }, []);

    const label = state === 'done' ? '✅ コピー済' : state === 'error' ? '❌ 失敗' : '📱 スマホで開く';
    const borderColor = state === 'done' ? 'rgba(68,255,136,0.5)' : state === 'error' ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.15)';
    const textColor = state === 'done' ? '#44ff88' : state === 'error' ? '#ff6666' : 'rgba(255,255,255,0.55)';
    const bg = state === 'done' ? 'rgba(68,255,136,0.08)' : 'rgba(255,255,255,0.04)';

    return (
        <button
            onClick={share}
            disabled={state === 'copying'}
            style={{
                position: 'relative', zIndex: 20,
                flexShrink: 0,
                background: bg,
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                color: textColor,
                fontFamily: 'Cinzel, serif',
                fontSize: 10,
                letterSpacing: 1,
                cursor: state === 'copying' ? 'wait' : 'pointer',
                padding: '8px 14px',
                lineHeight: 1.6,
                textAlign: 'center',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </button>
    );
}
