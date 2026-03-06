
'use client';

import BFHBlackjack from "@/components/game/blackjack";

export default function Dashboard() {
    return (
        <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 15%, #1f0a00 0%, #0a0808 50%, #050508 100%)' }}>
            <BFHBlackjack />
        </div>
    );
}
