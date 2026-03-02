
'use client';

import { useGetV1Me } from "@/api/generated/user/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins } from "lucide-react";
import BFHBlackjack from "@/components/game/blackjack";

const LANDS: Record<number, string> = {
    1: 'Sain', 2: 'La Veda', 3: 'Zeltban',
    4: 'Sama', 5: 'Vriksha', 6: 'Mount Nihilo', 7: 'Agni',
};
const GUILDS: Record<number, string> = {
    10: 'Freedom Warriors Co.',
};
const GUILDS_JA: Record<number, string> = {
    10: 'フリーダムウォリアーズ',
};

export default function Dashboard() {
    const { data: response, isLoading } = useGetV1Me();

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="rounded-xl" style={{ aspectRatio: '3/5' }} />
                    ))}
                </div>
            </div>
        );
    }

    const isSuccess = response?.status === 200;
    const user = isSuccess ? (response?.data as any)?.user : null;

    const landName = user?.land_name || (user?.land_id ? LANDS[user.land_id] : null);
    const guildNameJa = user?.guild_id ? (GUILDS_JA[user.guild_id] ?? GUILDS[user.guild_id] ?? `ギルド #${user.guild_id}`) : 'ギルド未所属';
    const playerIcon = user?.player_icon_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid || 'guest'}`;

    // We'll pass wallet address to the viewer so it can fetch units
    const walletAddress = user?.eth || user?.wallet_address;

    return (
        <>
            {/* CSS animations needed by card viewer */}
            <style>{`
                @keyframes rbGlow {
                    0%  { box-shadow: 0 0 0 2px #ff2222, 0 0 10px #ff2222; }
                    16% { box-shadow: 0 0 0 2px #ff8800, 0 0 10px #ff8800; }
                    33% { box-shadow: 0 0 0 2px #ffee00, 0 0 10px #ffee00; }
                    50% { box-shadow: 0 0 0 2px #00ff88, 0 0 10px #00ff88; }
                    66% { box-shadow: 0 0 0 2px #00aaff, 0 0 10px #00aaff; }
                    83% { box-shadow: 0 0 0 2px #cc00ff, 0 0 10px #cc00ff; }
                    100%{ box-shadow: 0 0 0 2px #ff2222, 0 0 10px #ff2222; }
                }
                @keyframes badgePulse {
                    0%,100% { filter: brightness(1); }
                    50% { filter: brightness(1.4) drop-shadow(0 0 8px currentColor); }
                }
                @keyframes fillUp {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
                @keyframes pulse {
                    0%,100% { opacity: 0.35; }
                    50%     { opacity: 0.9; }
                }
                .card-spinner {
                    width: 32px; height: 32px;
                    border: 2px solid rgba(255,140,0,0.2);
                    border-top-color: #ff8c00;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                .card-spinner-sm {
                    width: 20px; height: 20px;
                    border: 2px solid rgba(255,140,0,0.2);
                    border-top-color: #ff8c00;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="min-h-screen pb-20" style={{ background: 'radial-gradient(ellipse at 50% 15%, #1f0a00 0%, #0a0808 50%, #050508 100%)' }}>
                <div className="relative z-10 p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

                    {/* ── Header / Profile ── */}
                    <header className="flex flex-col md:flex-row md:items-center gap-6 glass-card p-6 rounded-2xl border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 to-transparent" style={{ pointerEvents: "none" }} />
                        <div className="space-y-2 flex-1 pl-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <h1 className="text-2xl font-header font-bold text-amber-400 tracking-tight"
                                    style={{ fontFamily: 'Cinzel, serif', textShadow: '0 0 20px rgba(255,140,0,0.4)' }}>
                                    {isSuccess ? (user?.name || 'Unknown Adventurer') : 'Guest'}
                                </h1>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                                {walletAddress && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                                        <Coins size={12} className="text-yellow-400" />
                                        <span className="font-mono truncate max-w-[130px]">{walletAddress}</span>
                                    </div>
                                )}
                            </div>
                        </div>



                    </header>

                    {/* ── Blackjack ── */}
                    <section className="glass-card p-5 rounded-2xl border-white/5">
                        <BFHBlackjack />
                    </section>

                </div>
            </div>
        </>
    );
}
