"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ===================== TYPES =====================
interface UnitsApiResponse {
    units?: string[];
}

interface UnitMetadata {
    name: string;
    image: string;
    attributes?: {
        type_name?: string;
        brave_burst?: string;
        [key: string]: unknown;
    };
}

interface DisplayUnit {
    id: string;
    jaName: string;
    bbName: string;
    image: string;
}

interface CardSlot {
    label: string;
    value: number;
}

const CARD_SLOTS: CardSlot[] = [
    { label: "A", value: 11 }, { label: "2", value: 2 },
    { label: "3", value: 3 }, { label: "4", value: 4 },
    { label: "5", value: 5 }, { label: "6", value: 6 },
    { label: "7", value: 7 }, { label: "8", value: 8 },
    { label: "9", value: 9 }, { label: "10", value: 10 },
    { label: "J", value: 10 }, { label: "Q", value: 10 },
    { label: "K", value: 10 },
];

interface GameCard {
    unit: DisplayUnit;
    label: string;
    value: number;
    faceDown?: boolean;
}

// ===================== CONSTANTS =====================
const PLACEHOLDER =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180'%3E%3Crect width='120' height='180' fill='%231a0800'/%3E%3Ctext x='60' y='95' text-anchor='middle' fill='rgba(255,140,0,0.3)' font-size='36'%3E⚔%3C/text%3E%3C/svg%3E";
const CARD_BACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230d0d2a'/%3E%3Cstop offset='1' stop-color='%231a0800'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='120' height='180' fill='url(%23g)'/%3E%3Crect x='8' y='8' width='104' height='164' rx='6' fill='none' stroke='rgba(255,140,0,0.3)' stroke-width='1'/%3E%3Ctext x='60' y='98' text-anchor='middle' fill='rgba(255,140,0,0.5)' font-size='32' font-family='serif'%3EBFH%3C/text%3E%3C/svg%3E";

// ===================== HELPERS =====================
function getToken(): string | null {
    if (typeof document === "undefined") return null;
    for (const part of document.cookie.split(";")) {
        const [k, v] = part.trim().split("=");
        if (k === "bfh_access_token") return decodeURIComponent(v ?? "");
    }
    return null;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function extractJa(text?: string): string {
    if (!text) return "";
    const m = text.match(/[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF][\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF\u30A0-\u30FF\s\u30fb\u30fc\u301c]*/);
    return m ? m[0].trim() : text.trim();
}

/** 26枚デッキ: 各カード値（A〜K）を2枚ずつ、計26枚。pool<26の場合は重複補充 */
function buildGameDeck(unitPool: DisplayUnit[]): GameCard[] {
    if (unitPool.length === 0) return [];
    const DECK_SIZE = 26; // 13値 × 2枚
    // 26体に満たない場合は繰り返して補充
    const padded: DisplayUnit[] = [];
    while (padded.length < DECK_SIZE) {
        for (const u of shuffle(unitPool)) {
            if (padded.length >= DECK_SIZE) break;
            padded.push(u);
        }
    }
    // 各値を2枚ずつ含む26スロットをシャッフル
    const slots = shuffle([...CARD_SLOTS, ...CARD_SLOTS]);
    return padded.map((unit, i) => ({ unit, label: slots[i].label, value: slots[i].value }));
}

function handTotal(hand: GameCard[]): number {
    const visible = hand.filter((c) => !c.faceDown);
    let total = visible.reduce((s, c) => s + c.value, 0);
    let aces = visible.filter((c) => c.label === "A").length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

// ===================== RIPPLE =====================
function spawnRipple(el: HTMLElement, x: number, y: number) {
    const r = document.createElement("div");
    const c = ["rgba(255,180,50,0.8)", "rgba(255,100,0,0.7)", "rgba(255,230,100,0.9)"][Math.floor(Math.random() * 3)];
    Object.assign(r.style, {
        position: "absolute", borderRadius: "50%", pointerEvents: "none", zIndex: "20",
        left: x + "px", top: y + "px", width: "50px", height: "50px",
        background: `radial-gradient(circle,${c} 0%,transparent 70%)`,
        transform: "translate(-50%,-50%) scale(0)",
        animation: "bjRipple 0.6s ease-out forwards",
    });
    el.appendChild(r);
    setTimeout(() => r.remove(), 650);
}

// ===================== CARD COMPONENT =====================
function Card({ card, index, animate }: { card: GameCard; index: number; animate: boolean }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (cardRef.current) spawnRipple(cardRef.current, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const isAce = card.label === "A";
    const isFace = ["J", "Q", "K"].includes(card.label);
    const labelColor = isAce ? "#ffd700" : isFace ? "#d4d4d4" : "#ffffff";
    const labelShadow = `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 8px ${isAce ? "rgba(255,215,0,0.8)" : "rgba(0,0,0,0.9)"}`;

    return (
        <div
            ref={cardRef}
            onClick={handleClick}
            className="bj-card"
            style={{
                transform: animate ? "translateY(0)" : "translateY(-22px)",
                opacity: animate ? 1 : 0,
                transition: `transform 0.4s ease ${index * 0.08}s, opacity 0.4s ease ${index * 0.08}s`,
            }}
        >
            {card.faceDown ? (
                <img src={CARD_BACK} alt="?" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
                <>
                    {/* ユニット画像 — カード全体、中心合わせ */}
                    <img
                        src={card.unit.image}
                        alt={card.unit.jaName}
                        decoding="async"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                        style={{
                            position: "absolute", top: 0, left: 0,
                            width: "100%", height: "100%",
                            objectFit: "contain",
                            objectPosition: "center center",
                            display: "block", pointerEvents: "none",
                        }}
                    />
                    {/* 上部フェード（数字視認性確保） */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "45%",
                        background: "linear-gradient(to bottom, rgba(4,3,12,0.72) 0%, rgba(4,3,12,0.0) 100%)",
                        pointerEvents: "none",
                    }} />
                    {/* 下部フェード（テキストエリア） */}
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                        background: "linear-gradient(to top, rgba(4,3,12,0.96) 0%, rgba(4,3,12,0.82) 40%, rgba(4,3,12,0.0) 100%)",
                        pointerEvents: "none",
                    }} />

                    {/* トランプ風の内側枠線 */}
                    <div style={{
                        position: "absolute", inset: 4, borderRadius: 7,
                        border: "1px solid rgba(255,255,255,0.10)",
                        pointerEvents: "none", zIndex: 9,
                    }} />

                    {/* ── 左上コーナー: 数値 + ♠ ── */}
                    <div style={{
                        position: "absolute", top: 5, left: 6,
                        zIndex: 12, pointerEvents: "none",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        lineHeight: 1,
                    }}>
                        <span
                            className={card.label === "10" ? "bj-card-label-num-10" : "bj-card-label-num"}
                            style={{ color: labelColor, textShadow: labelShadow }}
                        >{card.label}</span>
                        <span className="bj-card-suit" style={{ color: isAce ? "#ffd700" : "rgba(255,255,255,0.4)" }}>♠</span>
                    </div>

                    {/* ── 下部テキスト: ユニット名 + BB名 ── */}
                    <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0,
                        padding: "2px 5px 5px",
                        zIndex: 10, pointerEvents: "none",
                        textAlign: "center",
                    }}>
                        <div className="bj-card-name">{card.unit.jaName}</div>
                        {card.unit.bbName && (
                            <div className="bj-card-bb">
                                <span style={{
                                    fontFamily: "Cinzel,serif", fontWeight: 900,
                                    fontSize: "0.85em", letterSpacing: 0.5,
                                    color: "rgba(255,170,50,0.8)",
                                }}>BB </span>{card.unit.bbName}
                            </div>
                        )}
                    </div>

                    {/* グレア */}
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: 10,
                        background: "radial-gradient(ellipse at 28% 16%, rgba(255,255,255,0.16) 0%, transparent 48%)",
                        mixBlendMode: "screen", pointerEvents: "none", zIndex: 11,
                    }} />
                </>
            )}
        </div>
    );
}

// ===================== HAND =====================
function Hand({ cards, label, total, animate, hideTotal, totalBelow }: {
    cards: GameCard[]; label: string; total: number; animate: boolean;
    hideTotal?: boolean; totalBelow?: boolean;
}) {
    const bust = !hideTotal && total > 21;

    const totalEl = !hideTotal ? (
        <span style={{
            fontFamily: "Cinzel,serif", fontSize: 22, fontWeight: 900,
            color: bust ? "#ff4444" : total >= 18 ? "#44ff88" : "#ffcc44",
            textShadow: bust ? "0 0 20px rgba(255,68,68,0.8)" : total >= 18 ? "0 0 20px rgba(68,255,136,0.6)" : "0 0 20px rgba(255,204,68,0.6)",
        }}>{total}{bust ? " BUST" : ""}</span>
    ) : (
        <span style={{ fontFamily: "Cinzel,serif", fontSize: 22, fontWeight: 900, color: "rgba(255,140,0,0.3)" }}>?</span>
    );

    const labelEl = (
        <span style={{ fontFamily: "Cinzel,serif", fontSize: 10, color: "rgba(255,140,0,0.6)", letterSpacing: 3, textTransform: "uppercase" }}>{label}</span>
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {/* ラベル+合計: totalBelow=falseのとき上に表示 */}
            {!totalBelow && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {labelEl}{totalEl}
                </div>
            )}
            {/* カード列 */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {cards.map((c, i) => <Card key={c.unit.id + i} card={c} index={i} animate={animate} />)}
            </div>
            {/* ラベル+合計: totalBelow=trueのとき下に表示 */}
            {totalBelow && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {labelEl}{totalEl}
                </div>
            )}
        </div>
    );
}

// ── SVG Crown Icon ──
function CrownIcon({ color, rainbow = false, size = 22 }: { color: string; rainbow?: boolean; size?: number }) {
    return (
        <svg width={size} height={size * 0.78} viewBox="0 0 40 31" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ verticalAlign: 'middle', flexShrink: 0 }}>
            <defs>
                {rainbow && (
                    <linearGradient id="crown-rb" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff6b6b" />
                        <stop offset="20%" stopColor="#ffa500" />
                        <stop offset="40%" stopColor="#ffe000" />
                        <stop offset="60%" stopColor="#44dd88" />
                        <stop offset="80%" stopColor="#55aaff" />
                        <stop offset="100%" stopColor="#cc55ff" />
                    </linearGradient>
                )}
            </defs>
            <path
                d="M3 27 L3 15 L11 21.5 L20 2 L29 21.5 L37 15 L37 27 Z"
                fill={rainbow ? 'url(#crown-rb)' : color}
                stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeLinejoin="round"
            />
            <rect x="3" y="24.5" width="34" height="4" rx="2" fill={rainbow ? 'url(#crown-rb)' : color} />
            <circle cx="3" cy="15" r="2.8" fill="white" opacity="0.85" />
            <circle cx="20" cy="2" r="2.8" fill="white" opacity="0.85" />
            <circle cx="37" cy="15" r="2.8" fill="white" opacity="0.85" />
        </svg>
    );
}

// ===================== MAIN GAME =====================
type GamePhase = "loading" | "error" | "idle" | "playing" | "dealer" | "result";
type Result = "win" | "lose" | "push" | "blackjack";

const STREAK_BADGES = [
    { streak: 2, rarity: "COMMON", color: "#7ecef4", glow: "rgba(126,206,244,0.6)", rainbow: false },
    { streak: 3, rarity: "UNCOMMON", color: "#aaee55", glow: "rgba(170,238,85,0.6)", rainbow: false },
    { streak: 5, rarity: "RARE", color: "#ffd700", glow: "rgba(255,215,0,0.6)", rainbow: false },
    { streak: 10, rarity: "EPIC", color: "#ff4500", glow: "rgba(255,69,0,0.6)", rainbow: false },
    { streak: 20, rarity: "LEGENDARY", color: "#ffd700", glow: "rgba(255,215,0,0.6)", rainbow: true },
] as const;



export default function BFHBlackjack() {
    // ── ユニット不足チェック: 1体以上あればプレイ可能 ──
    const [unitPool, setUnitPool] = useState<DisplayUnit[]>([]);
    const [phase, setPhase] = useState<GamePhase>("loading");
    const [error, setError] = useState<string | null>(null);
    const [isAuthError, setIsAuthError] = useState(false); // 401用フラグ
    const [loadProgress, setLoadProgress] = useState(0);
    const [loadTotal, setLoadTotal] = useState(0);

    const [playerHand, setPlayer] = useState<GameCard[]>([]);
    const [dealerHand, setDealer] = useState<GameCard[]>([]);
    const [result, setResult] = useState<Result | null>(null);
    const [animate, setAnimate] = useState(false);
    const [score, setScore] = useState({ win: 0, lose: 0, push: 0 });
    const [winStreak, setWinStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [muted, setMuted] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [earnedBadges, setEarnedBadges] = useState<number[]>([]);
    const [newBadgeAlert, setNewBadgeAlert] = useState<typeof STREAK_BADGES[number] | null>(null);

    // ──  バグ修正: deck/idx/dealing を useRef で管理 ──
    const deckRef = useRef<GameCard[]>([]);
    const idxRef = useRef<number>(0);
    const dealing = useRef<boolean>(false);
    const phaseRef = useRef<GamePhase>("loading");
    const mutedRef = useRef(false); // MUTEの確実な参照
    const [, forceRender] = useState(0);

    const setPhaseSync = (p: GamePhase) => { phaseRef.current = p; setPhase(p); };

    // ── localStorage からベスト連勝・バッジを読み込む ──
    useEffect(() => {
        const saved = parseInt(localStorage.getItem('bfh_best_streak') || '0', 10);
        if (!isNaN(saved)) setBestStreak(saved);
        const badges = JSON.parse(localStorage.getItem('bfh_badges') || '[]') as number[];
        setEarnedBadges(badges);
    }, []);

    // ── 効果音 (Web Audio API) ── mutedRef で確実にミュート判定 ──
    const playSound = useCallback((type: 'deal' | 'win' | 'lose' | 'push') => {
        if (mutedRef.current) return;
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const master = ctx.createGain();
            master.gain.value = 0.25;
            master.connect(ctx.destination);

            if (type === 'deal') {
                // カード配布音: シャッ（カードスライド）
                const duration = 0.09;
                const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    const env = Math.sin(Math.PI * t / duration); // サインカーブ — 中心がぴーク
                    data[i] = (Math.random() * 2 - 1) * env * 0.9;
                }
                const src = ctx.createBufferSource();
                src.buffer = buf;
                // バンドパスフィルターで紙が滑る音質に
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(4000, ctx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + duration);
                filter.Q.value = 1.2;
                src.connect(filter); filter.connect(master); src.start();
            } else if (type === 'win') {
                [[0, 523], [0.1, 659], [0.2, 784], [0.3, 1047]].forEach(([t, freq]) => {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.frequency.value = freq; osc.type = 'sine';
                    g.gain.setValueAtTime(0.25, ctx.currentTime + t);
                    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.35);
                    osc.connect(g); g.connect(master);
                    osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.4);
                });
            } else if (type === 'lose') {
                // 敗北音: 2コードのみ・短く（0.35秒）
                const loseChords: [number, number[]][] = [[0, [330, 392]], [0.18, [261, 311]]];
                loseChords.forEach(([t, freqs]) => {
                    freqs.forEach(freq => {
                        const osc = ctx.createOscillator();
                        const g = ctx.createGain();
                        osc.frequency.value = freq; osc.type = 'triangle';
                        g.gain.setValueAtTime(0.2, ctx.currentTime + t);
                        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
                        osc.connect(g); g.connect(master);
                        osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.32);
                    });
                });
            } else {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.frequency.value = 440; osc.type = 'sine';
                g.gain.setValueAtTime(0.18, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.connect(g); g.connect(master);
                osc.start(); osc.stop(ctx.currentTime + 0.32);
            }
        } catch { }
    }, []); // mutedRef.current を参照するので依存なし

    function drawCard(pool: DisplayUnit[]): GameCard {
        if (idxRef.current >= deckRef.current.length) {
            deckRef.current = shuffle(buildGameDeck(pool));
            idxRef.current = 0;
        }
        return { ...deckRef.current[idxRef.current++] };
    }

    // ---- ユニット一覧とメタデータを取得 ----
    useEffect(() => {
        async function load() {
            try {
                const token = getToken();
                const headers: Record<string, string> = { Accept: "application/json" };
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const res = await fetch("/api/proxy/v1/me/units", { headers });
                if (res.status === 401) {
                    setIsAuthError(true);
                    throw new Error("ログインが必要です。");
                }
                if (!res.ok) throw new Error(`ユニット取得失敗 (HTTP ${res.status})`);
                const data: UnitsApiResponse = await res.json();
                const tokenIds = data.units ?? [];

                if (tokenIds.length < 4) throw new Error(`ユニットが少なすぎます（${tokenIds.length}体）。最低4体必要です。`);

                const sample = shuffle(tokenIds).slice(0, 60);
                setLoadTotal(sample.length);

                const results = await Promise.all(
                    sample.map(async (id: string) => {
                        try {
                            const clean = id.replace("#", "");
                            const url = `/api/proxy/metadata/units/${clean}?base=https://core.bravefrontierheroes.com`;
                            const r = await fetch(url, { headers: { Accept: "application/json" } });
                            if (!r.ok) return null;
                            const meta: UnitMetadata = await r.json();
                            const jaName = extractJa(meta.attributes?.type_name) || id;
                            const bbName = extractJa(meta.attributes?.brave_burst);
                            return { id, jaName, bbName, image: meta.image ?? PLACEHOLDER } as DisplayUnit;
                        } catch { return null; }
                        finally { setLoadProgress((p) => p + 1); }
                    })
                );

                const pool = results.filter((u): u is DisplayUnit => u !== null);
                // 1体以上あればプレイ可能（重複して13枚デッキを構成）
                if (pool.length === 0) throw new Error("ユニットのメタデータを取得できませんでした。");

                setUnitPool(pool);
                setPhaseSync("idle");
            } catch (e: any) {
                console.error("[BFHBlackjack] load error:", e);
                setError(e.message ?? "ユニットの取得に失敗しました");
                setPhaseSync("error");
            }
        }
        load();
    }, []);

    // ---- ゲーム開始 ----
    const startGame = useCallback((pool: DisplayUnit[]) => {
        if (dealing.current || pool.length === 0) return;
        resolvedRef.current = false; // 新ゲームでリセット
        dealing.current = true;
        playSound('deal');

        // 毎ゲーム新デッキ生成
        deckRef.current = shuffle(buildGameDeck(pool));
        idxRef.current = 0;

        const c1 = drawCard(pool);
        const c2 = drawCard(pool);
        const c3 = { ...drawCard(pool), faceDown: true };
        const c4 = drawCard(pool);

        const pCards: GameCard[] = [c1, c2];
        const dCards: GameCard[] = [c3, c4];

        setPlayer(pCards);
        setDealer(dCards);
        setResult(null);
        setPhaseSync("playing");

        setTimeout(() => {
            setAnimate(true);
            dealing.current = false;
            const pTotal = handTotal(pCards);
            if (pTotal === 21) {
                setTimeout(() => resolveGame(pCards, dCards), 600);
            }
        }, 100);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playSound]);

    // ---- Hit: dealing ref でガード ----
    // currentDealer も引数で受け取ることで setState 内副作用を排除
    const hit = useCallback((currentPlayer: GameCard[], currentDealer: GameCard[], pool: DisplayUnit[]) => {
        if (phaseRef.current !== "playing" || dealing.current) return;
        dealing.current = true;

        const newCard = drawCard(pool);
        playSound('deal');
        const newHand = [...currentPlayer, newCard];
        setPlayer(newHand);

        const total = handTotal(newHand);
        if (total >= 21) {
            // setStateコールバック内ではなく直接呼び出す（二重実行バグ防止）
            setTimeout(() => resolveGame(newHand, currentDealer), 400);
        } else {
            dealing.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Stand: currentPlayer も引数で受け取りdealerPlayへ渡す ----
    const stand = useCallback((currentPlayer: GameCard[], currentDealer: GameCard[], pool: DisplayUnit[]) => {
        if (phaseRef.current !== "playing" || dealing.current) return;
        dealing.current = true;
        setPhaseSync("dealer");
        const revealed = currentDealer.map((c) => ({ ...c, faceDown: false }));
        setDealer(revealed);
        setTimeout(() => dealerPlay(currentPlayer, revealed, pool), 600);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- ディーラー自動ドロー: currentPlayer を引数で受け取る ----
    const dealerPlay = useCallback((currentPlayer: GameCard[], currentDealer: GameCard[], pool: DisplayUnit[]) => {
        const total = handTotal(currentDealer);
        if (total < 17) {
            const newCard = drawCard(pool);
            const newDealer = [...currentDealer, newCard];
            setDealer(newDealer);
            setTimeout(() => dealerPlay(currentPlayer, newDealer, pool), 700);
        } else {
            // setState コールバック内ではなく直接呼び出す
            resolveGame(currentPlayer, currentDealer);
            dealing.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- 勝負判定: 副作用なし、直接呼び出しのみ ----
    const resolvedRef = useRef(false); // 同ゲームでの二重呼び出しガード
    const resolveGame = useCallback((pHand: GameCard[], dHand: GameCard[]) => {
        if (resolvedRef.current) return; // 二重呼び出しを防ぐ
        resolvedRef.current = true;

        const pTotal = handTotal(pHand.map((c) => ({ ...c, faceDown: false })));
        const dTotal = handTotal(dHand.map((c) => ({ ...c, faceDown: false })));
        setDealer(dHand.map((c) => ({ ...c, faceDown: false })));

        let r: Result;
        if (pTotal > 21) r = "lose";
        else if (dTotal > 21) r = "win";
        else if (pTotal === 21 && pHand.length === 2) r = "blackjack";
        else if (pTotal > dTotal) r = "win";
        else if (pTotal < dTotal) r = "lose";
        else r = "push";

        setResult(r);
        setPhaseSync("result");
        setScore((prev) => ({
            win: prev.win + (r === "win" || r === "blackjack" ? 1 : 0),
            lose: prev.lose + (r === "lose" ? 1 : 0),
            push: prev.push + (r === "push" ? 1 : 0),
        }));
        // 効果音
        playSound(r === "win" || r === "blackjack" ? 'win' : r === "lose" ? 'lose' : 'push');
        // 連勝カウント + ベスト更新 + バッジチェック
        if (r === "win" || r === "blackjack") {
            setWinStreak((prev) => {
                const next = prev + 1;
                // ベスト更新
                setBestStreak((best) => {
                    if (next > best) {
                        localStorage.setItem('bfh_best_streak', String(next));
                        return next;
                    }
                    return best;
                });
                // バッジチェック
                const badge = STREAK_BADGES.find(b => b.streak === next);
                if (badge) {
                    setEarnedBadges(eb => {
                        if (eb.includes(badge.streak)) return eb;
                        const updated = [...eb, badge.streak];
                        localStorage.setItem('bfh_badges', JSON.stringify(updated));
                        return updated;
                    });
                    setNewBadgeAlert(badge);
                    setTimeout(() => setNewBadgeAlert(null), 3500);
                }
                return next;
            });
        } else {
            setWinStreak(0);
        }
        dealing.current = false;
    }, []);

    const pTotal = handTotal(playerHand);
    const dTotal = handTotal(dealerHand);

    const resultConfig: Record<Result, { text: string; color: string; glow: string }> = {
        blackjack: { text: "BLACKJACK!", color: "#ffd700", glow: "rgba(255,215,0,0.8)" },
        win: { text: "YOU WIN", color: "#44ff88", glow: "rgba(68,255,136,0.7)" },
        lose: { text: "YOU LOSE", color: "#ff4444", glow: "rgba(255,68,68,0.7)" },
        push: { text: "PUSH", color: "#ffcc44", glow: "rgba(255,204,68,0.6)" },
    };

    // ===================== RENDER =====================
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Cinzel+Decorative:wght@700;900&family=Noto+Sans+JP:wght@400;700&display=swap');
        @keyframes bjRipple {
          0%   { transform:translate(-50%,-50%) scale(0); opacity:1; }
          100% { transform:translate(-50%,-50%) scale(5); opacity:0; }
        }
        @keyframes bjResultPop {
          0%  { transform:translate(-50%,-50%) scale(0.5); opacity:0; }
          60% { transform:translate(-50%,-50%) scale(1.1); opacity:1; }
          100%{ transform:translate(-50%,-50%) scale(1);   opacity:1; }
        }
        @keyframes bjFloat { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }
        @keyframes bjSpin  { to{ transform:rotate(360deg); } }
        @keyframes bjPulse { 0%,100%{opacity:0.35;} 50%{opacity:0.9;} }
        @keyframes bjTitleShimmer {
          0%  { background-position: -200% center; }
          100%{ background-position:  200% center; }
        }
        .bj-btn {
          font-family:'Cinzel Decorative',Cinzel,serif; font-size:13px; letter-spacing:2px;
          padding:12px 28px; border-radius:6px; cursor:pointer;
          transition:all 0.25s; text-transform:uppercase; font-weight:700;
          border:none; outline:none;
        }
        .bj-btn:disabled { opacity:0.3; cursor:default; }
        .bj-btn-hit   { border:1px solid rgba(255,140,0,0.5); background:rgba(255,140,0,0.12); color:#ffaa00; }
        .bj-btn-hit:hover:not(:disabled)   { background:rgba(255,140,0,0.28); box-shadow:0 0 20px rgba(255,140,0,0.3); }
        .bj-btn-stand { border:1px solid rgba(100,200,255,0.5); background:rgba(100,200,255,0.08); color:#88ddff; }
        .bj-btn-stand:hover:not(:disabled) { background:rgba(100,200,255,0.2); box-shadow:0 0 20px rgba(100,200,255,0.3); }
        .bj-btn-deal  { border:1px solid rgba(255,215,0,0.5); background:rgba(255,215,0,0.1); color:#ffd700; font-size:16px; padding:14px 44px; letter-spacing:4px; }
        .bj-btn-deal:hover:not(:disabled)  { background:rgba(255,215,0,0.22); box-shadow:0 0 30px rgba(255,215,0,0.4); }

        /* カード: PCは固定サイズ、スマホはvwベース */
        .bj-card {
          position:relative;
          width: clamp(72px, 22vw, 104px);
          height: clamp(108px, 33vw, 156px);
          border-radius:clamp(6px,2vw,10px);
          flex-shrink:0; cursor:pointer; overflow:hidden;
          box-shadow:0 6px 20px rgba(0,0,0,0.7),0 2px 6px rgba(0,0,0,0.5);
          background:#080614;
        }
        .bj-card-label-num {
          font-family:Cinzel,serif; font-weight:900;
          font-size: clamp(14px, 4.5vw, 22px);
        }
        .bj-card-label-num-10 {
          font-family:Cinzel,serif; font-weight:900;
          font-size: clamp(12px, 3.8vw, 18px);
        }
        .bj-card-suit {
          font-size: clamp(7px, 2.2vw, 10px);
          line-height:1; margin-top:1px;
        }
        .bj-card-name {
          font-size: clamp(7px, 2.2vw, 8px);
          font-weight:700;
          color:rgba(255,255,255,0.95);
          line-height:1.3;
          text-shadow:0 1px 4px rgba(0,0,0,1);
          font-family:'Noto Sans JP',sans-serif;
          overflow:hidden;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
        }
        .bj-card-bb {
          font-size: clamp(6px, 1.9vw, 7px);
          color:rgba(255,210,100,0.92);
          line-height:1.3;
          text-shadow:0 1px 3px rgba(0,0,0,1);
          font-family:'Noto Sans JP',sans-serif;
          margin-top:1px;
          overflow:hidden;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
        }
        /* スマホ用追加スタイル (小画面縦画対応) */
        @media (max-width: 480px) {
          .bj-btn {
            font-size:14px; padding:15px 28px; letter-spacing:1px;
          }
          .bj-btn-deal {
            font-size:16px; padding:16px 40px; letter-spacing:2px;
          }
          /* ヘッダー: タイトルとスコアを縦並び・中心展開 */
          .bj-game-header {
            flex-direction: column !important;
            gap: 10px !important;
            align-items: center !important;
          }
          /* タイトル: 中心から縮小 */
          .bj-title-wrapper {
            transform: scale(0.85);
            transform-origin: center top;
          }
          /* カード: 横画スマホで見やすいサイズに */
          .bj-card {
            width: clamp(80px, 24vw, 108px) !important;
            height: clamp(120px, 36vw, 162px) !important;
          }
          .bj-card-label-num { font-size: clamp(13px, 3.8vw, 19px) !important; }
          .bj-card-label-num-10 { font-size: clamp(11px, 3.2vw, 16px) !important; }
          .bj-card-suit { font-size: clamp(7px, 2vw, 10px) !important; }
          .bj-card-name { font-size: clamp(7px, 2vw, 9px) !important; }
          .bj-card-bb { font-size: clamp(6px, 1.8vw, 8px) !important; }
          /* メインコンテナ: 上下左右の余白を削減 */
          .bj-main-container {
            padding: 12px 8px 24px !important;
          }
        }
      `}</style>

            <div className="bj-main-container" style={{
                minHeight: "100svh",
                background: "radial-gradient(ellipse at 50% 20%, #1a0900 0%, #080810 60%, #030306 100%)",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "20px 16px 40px",
                fontFamily: "'Noto Sans JP',sans-serif", userSelect: "none",
                overflowY: "auto",
            }}>

                {/* ── HEADER ── */}
                <div style={{ width: "100%", maxWidth: 560, marginBottom: 24 }}>
                    {/* デザインタイトル */}
                    <div className="bj-game-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {/* ── タイトル ── */}
                        <div className="bj-title-wrapper" style={{ display: "flex", alignItems: "baseline", gap: 0, position: "relative" }}>
                            {/* デコレーティブ横線（上） */}
                            <div style={{
                                position: "absolute", top: -6, left: 0, right: 0, height: 1,
                                background: "linear-gradient(90deg, transparent, rgba(255,140,0,0.6), rgba(255,60,0,0.6), transparent)",
                            }} />
                            {/* B - 赤オレンジ */}
                            <span style={{
                                fontFamily: "'Cinzel Decorative',Cinzel,serif",
                                fontSize: 28, fontWeight: 900,
                                color: "#ff3300",
                                textShadow: "0 0 20px rgba(255,51,0,0.9), 0 0 40px rgba(255,51,0,0.4), 0 2px 4px rgba(0,0,0,0.8)",
                                letterSpacing: 0,
                            }}>B</span>
                            {/* FH */}
                            <span style={{
                                fontFamily: "'Cinzel Decorative',Cinzel,serif",
                                fontSize: 28, fontWeight: 900,
                                color: "#ffd700",
                                textShadow: "0 0 20px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)",
                                letterSpacing: 2,
                            }}>FH</span>
                            {/* スペース */}
                            <span style={{ width: 10, display: "inline-block" }} />
                            {/* B - 赤オレンジ */}
                            <span style={{
                                fontFamily: "'Cinzel Decorative',Cinzel,serif",
                                fontSize: 28, fontWeight: 900,
                                color: "#ff3300",
                                textShadow: "0 0 20px rgba(255,51,0,0.9), 0 0 40px rgba(255,51,0,0.4), 0 2px 4px rgba(0,0,0,0.8)",
                                letterSpacing: 0,
                            }}>B</span>
                            {/* LACKJACK */}
                            <span style={{
                                fontFamily: "'Cinzel Decorative',Cinzel,serif",
                                fontSize: 28, fontWeight: 900,
                                color: "#ffd700",
                                textShadow: "0 0 20px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)",
                                letterSpacing: 2,
                            }}>LACKJACK</span>
                            {/* デコレーティブ横線（下） */}
                            <div style={{
                                position: "absolute", bottom: -6, left: 0, right: 0, height: 1,
                                background: "linear-gradient(90deg, transparent, rgba(255,140,0,0.6), rgba(255,60,0,0.6), transparent)",
                            }} />
                        </div>

                        {/* スコア: WIN列のみ縦並び (数字+連勝)、LOSE・DRAWは横並び */}
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                            {/* WIN + 連勝バナー */}
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    fontFamily: "Cinzel,serif", fontSize: 9,
                                    color: "rgba(255,255,255,0.4)", letterSpacing: 2,
                                    marginBottom: 2,
                                }}>WIN</div>
                                <div style={{
                                    fontFamily: "Cinzel,serif", fontSize: 28, fontWeight: 900,
                                    color: "#44ff88", lineHeight: 1,
                                    textShadow: "0 0 16px #44ff88aa, 0 2px 4px rgba(0,0,0,0.6)",
                                }}>{score.win}</div>
                                {/* ベスト連勝 */}
                                {bestStreak >= 2 && (
                                    <div style={{
                                        fontFamily: "'Noto Sans JP',sans-serif",
                                        fontSize: 8, color: "rgba(255,215,0,0.45)",
                                        letterSpacing: 0.5, marginTop: 2,
                                    }}>BEST {bestStreak}連勝</div>
                                )}
                                {/* 連勝: WINの真下 */}
                                {winStreak >= 2 && (
                                    <div style={{
                                        fontFamily: "'Noto Sans JP',sans-serif",
                                        fontSize: winStreak >= 5 ? 12 : 10,
                                        fontWeight: 700,
                                        marginTop: 3,
                                        color: winStreak >= 5 ? "#ffd700" : winStreak >= 3 ? "#ff8c00" : "#ffcc44",
                                        textShadow: winStreak >= 5
                                            ? "0 0 14px rgba(255,215,0,1), 0 0 28px rgba(255,215,0,0.6)"
                                            : winStreak >= 3
                                                ? "0 0 10px rgba(255,140,0,0.9)"
                                                : "0 0 8px rgba(255,204,68,0.7)",
                                        letterSpacing: 0.5,
                                        animation: winStreak >= 5 ? "bjPulse 0.8s ease-in-out infinite" : "none",
                                        whiteSpace: "nowrap",
                                    }}>{winStreak}連勝！{winStreak >= 10 ? "🔥🔥🔥" : winStreak >= 5 ? "🔥🔥" : winStreak >= 3 ? "🔥" : ""}</div>
                                )}
                            </div>
                            {/* LOSE */}
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    fontFamily: "Cinzel,serif", fontSize: 9,
                                    color: "rgba(255,255,255,0.4)", letterSpacing: 2,
                                    marginBottom: 2,
                                }}>LOSE</div>
                                <div style={{
                                    fontFamily: "Cinzel,serif", fontSize: 28, fontWeight: 900,
                                    color: "#ff4444", lineHeight: 1,
                                    textShadow: "0 0 16px #ff4444aa, 0 2px 4px rgba(0,0,0,0.6)",
                                }}>{score.lose}</div>
                            </div>
                            {/* DRAW */}
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    fontFamily: "Cinzel,serif", fontSize: 9,
                                    color: "rgba(255,255,255,0.4)", letterSpacing: 2,
                                    marginBottom: 2,
                                }}>DRAW</div>
                                <div style={{
                                    fontFamily: "Cinzel,serif", fontSize: 28, fontWeight: 900,
                                    color: "#ffcc44", lineHeight: 1,
                                    textShadow: "0 0 16px #ffcc44aa, 0 2px 4px rgba(0,0,0,0.6)",
                                }}>{score.push}</div>
                            </div>
                            {/* MUTEボタン + ルールボタン */}
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button
                                    onClick={() => setShowRules(true)}
                                    title="ルールを見る"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.12)",
                                        borderRadius: 6, color: "rgba(255,255,255,0.45)",
                                        fontFamily: "Cinzel,serif", fontSize: 11,
                                        cursor: "pointer", padding: "5px 10px",
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,215,0,0.8)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; }}
                                >?</button>
                                <button
                                    onClick={() => { mutedRef.current = !muted; setMuted(m => !m); }}
                                    title={muted ? "音オン" : "ミュート"}
                                    style={{
                                        background: muted ? "rgba(255,100,100,0.1)" : "rgba(255,255,255,0.05)",
                                        border: `1px solid ${muted ? "rgba(255,100,100,0.3)" : "rgba(255,255,255,0.12)"}`,
                                        borderRadius: 6,
                                        color: muted ? "rgba(255,100,100,0.7)" : "rgba(255,255,255,0.45)",
                                        fontFamily: "Cinzel,serif", fontSize: 11,
                                        cursor: "pointer", padding: "5px 10px",
                                        transition: "all 0.2s",
                                    }}
                                >{muted ? "🔇" : "🔊"}</button>
                            </div>
                            {/* 獲得バッジ表示 */}
                            {earnedBadges.length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                    {STREAK_BADGES.filter(b => earnedBadges.includes(b.streak)).map(b => (
                                        <span
                                            key={b.streak}
                                            title={`${b.rarity} — ${b.streak}連勝達成`}
                                            style={{
                                                display: 'inline-flex', cursor: "default",
                                                filter: b.rainbow ? undefined : `drop-shadow(0 0 4px ${b.glow})`,
                                                animation: b.rainbow ? 'bjRainbow 2s linear infinite' : undefined,
                                            }}
                                        >
                                            <CrownIcon color={b.color} rainbow={b.rainbow} size={20} />
                                        </span>
                                    ))}
                                </div>
                            )}
                            {/* リセットボタン */}
                            <button
                                onClick={() => { setScore({ win: 0, lose: 0, push: 0 }); setWinStreak(0); }}
                                style={{
                                    marginBottom: 2,
                                    background: "none",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    borderRadius: 5,
                                    color: "rgba(255,255,255,0.35)",
                                    fontFamily: "Cinzel,serif",
                                    fontSize: 7.5, letterSpacing: 1.5,
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    lineHeight: 1.4,
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    const b = e.currentTarget as HTMLButtonElement;
                                    b.style.color = "rgba(255,100,80,0.85)";
                                    b.style.borderColor = "rgba(255,100,80,0.5)";
                                    b.style.textShadow = "0 0 8px rgba(255,80,60,0.6)";
                                }}
                                onMouseLeave={(e) => {
                                    const b = e.currentTarget as HTMLButtonElement;
                                    b.style.color = "rgba(255,255,255,0.35)";
                                    b.style.borderColor = "rgba(255,255,255,0.18)";
                                    b.style.textShadow = "none";
                                }}
                            >RESULT<br />RESET</button>
                        </div>
                    </div>
                    <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,140,0,0.4),rgba(255,60,0,0.3),transparent)", marginTop: 14 }} />
                </div>

                {/* ── バッジ獲得トースト ── */}
                {newBadgeAlert && (
                    <div style={{
                        position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
                        background: "linear-gradient(135deg,rgba(20,10,0,0.97),rgba(10,10,25,0.97))",
                        border: `1px solid ${newBadgeAlert.glow}`,
                        borderRadius: 14, padding: "14px 24px",
                        display: "flex", alignItems: "center", gap: 14,
                        zIndex: 200, boxShadow: `0 0 40px ${newBadgeAlert.glow}`,
                        animation: "bjResultPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
                        whiteSpace: "nowrap",
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            filter: newBadgeAlert.rainbow ? undefined : `drop-shadow(0 0 8px ${newBadgeAlert.glow})`,
                            animation: newBadgeAlert.rainbow ? 'bjRainbow 2s linear infinite' : undefined,
                        }}>
                            <CrownIcon color={newBadgeAlert.color} rainbow={newBadgeAlert.rainbow} size={40} />
                        </span>
                        <div>
                            <div style={{ fontFamily: "Cinzel,serif", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 3 }}>CROWN UNLOCKED</div>
                            <div style={{ fontFamily: "Cinzel,serif", fontSize: 16, fontWeight: 700, color: newBadgeAlert.color, letterSpacing: 2 }}>
                                {newBadgeAlert.rarity}
                            </div>
                            <div style={{ fontFamily: "'Noto Sans JP',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                                {newBadgeAlert.streak}連勝達成
                            </div>
                        </div>
                    </div>
                )}

                {/* ── LOADING ── */}
                {phase === "loading" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                        <div style={{ width: 44, height: 44, border: "2px solid rgba(255,140,0,0.2)", borderTopColor: "#ff8c00", borderRadius: "50%", animation: "bjSpin 0.8s linear infinite" }} />
                        <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, color: "rgba(255,140,0,0.5)", letterSpacing: 3 }}>
                            {loadTotal > 0 ? `LOADING ${loadProgress} / ${loadTotal} UNITS...` : "LOADING UNITS..."}
                        </div>
                        {loadTotal > 0 && (
                            <div style={{ width: 220, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                                <div style={{
                                    height: "100%", borderRadius: 2,
                                    background: "linear-gradient(90deg,#ff8c00,#ffcc44)",
                                    width: `${Math.round((loadProgress / loadTotal) * 100)}%`,
                                    transition: "width 0.25s",
                                }} />
                            </div>
                        )}
                    </div>
                )}

                {/* ── ERROR ── */}
                {phase === "error" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: "0 24px" }}>
                        <div style={{ fontSize: 40 }}>{isAuthError ? "🔐" : "⚠️"}</div>
                        <div style={{ fontFamily: "Cinzel,serif", fontSize: 12, color: "rgba(255,140,0,0.7)", letterSpacing: 1, maxWidth: 320, lineHeight: 1.8 }}>
                            {isAuthError ? "ログインが必要です" : error}
                        </div>
                        {isAuthError ? (
                            <a href="/" style={{ textDecoration: "none" }}>
                                <button className="bj-btn bj-btn-deal" style={{ marginTop: 8 }}>
                                    ブレヒロでログイン
                                </button>
                            </a>
                        ) : (
                            <button className="bj-btn bj-btn-deal" onClick={() => window.location.reload()} style={{ marginTop: 8 }}>RETRY</button>
                        )}
                    </div>
                )}

                {/* ── RULES MODAL ── */}
                {showRules && (
                    <div
                        onClick={() => setShowRules(false)}
                        style={{
                            position: "fixed", inset: 0, zIndex: 100,
                            background: "rgba(0,0,0,0.85)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            backdropFilter: "blur(6px)",
                        }}
                    >
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: "linear-gradient(135deg,#1a0a00,#0d0d18)",
                                border: "1px solid rgba(255,140,0,0.3)",
                                borderRadius: 16, padding: "32px 28px",
                                maxWidth: 320, width: "90%",
                                textAlign: "center",
                                boxShadow: "0 0 60px rgba(255,140,0,0.15)",
                            }}
                        >
                            <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "rgba(255,140,0,0.8)", letterSpacing: 3, marginBottom: 20 }}>HOW TO PLAY</div>
                            <div style={{ fontFamily: "'Noto Sans JP',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 2.2, textAlign: "left" }}>
                                🃏 あなたのユニットがカードになります<br />
                                🎯 合計値を21に近づけよう<br />
                                ✋ <b style={{ color: "rgba(255,180,0,0.9)" }}>HIT</b> でカード追加<br />
                                🛑 <b style={{ color: "rgba(100,200,255,0.9)" }}>STAND</b> でディーラーと勝負<br />
                                💥 21を超えるとバースト（負け）<br />
                                ⚡ 最初の2枚で21 = <b style={{ color: "#ffd700" }}>BLACKJACK！</b><br />
                                🎰 ディーラーは17以上で止まる
                            </div>
                            <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,215,0,0.15)", paddingTop: 14 }}>
                                <div style={{ fontFamily: "Cinzel,serif", fontSize: 9, color: "rgba(255,215,0,0.5)", letterSpacing: 2, marginBottom: 10 }}>TITLE SYSTEM</div>
                                {STREAK_BADGES.map(b => (
                                    <div key={b.streak} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            filter: b.rainbow ? undefined : `drop-shadow(0 0 4px ${b.glow})`,
                                            animation: b.rainbow ? 'bjRainbow 2s linear infinite' : undefined,
                                        }}>
                                            <CrownIcon color={b.color} rainbow={b.rainbow} size={18} />
                                        </span>
                                        <span style={{ fontFamily: "Cinzel,serif", fontSize: 8, color: b.color, letterSpacing: 1.5, minWidth: 80 }}>{b.rarity}</span>
                                        <span style={{ fontFamily: "'Noto Sans JP',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{b.streak}連勝</span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowRules(false)}
                                className="bj-btn bj-btn-deal"
                                style={{ marginTop: 24, fontSize: 12, padding: "10px 28px" }}
                            >CLOSE</button>
                        </div>
                    </div>
                )}

                {/* ── IDLE ── */}
                {phase === "idle" && (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
                        <div style={{ textAlign: "center", animation: "bjFloat 3s ease-in-out infinite" }}>
                            <div style={{ fontSize: 64, marginBottom: 8 }}>🃏</div>
                            <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "rgba(255,140,0,0.6)", letterSpacing: 3 }}>
                                {unitPool.length} UNITS READY
                            </div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 8, letterSpacing: 1 }}>
                                毎ゲーム26体をランダムに選んで26枚デッキを構成します（各値×2枚）
                            </div>
                        </div>
                        <button className="bj-btn bj-btn-deal" onClick={() => startGame(unitPool)}>DEAL</button>

                        {/* ルール説明 */}
                        <div style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.2)",
                            fontSize: 10,
                            fontFamily: "'Noto Sans JP',sans-serif",
                            lineHeight: 1.9,
                            letterSpacing: 0.5,
                            maxWidth: 280,
                        }}>
                            <div style={{ color: "rgba(255,140,0,0.35)", fontFamily: "Cinzel,serif", fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>HOW TO PLAY</div>
                            🃏 あなたのユニットがカードになります<br />
                            🎯 合計値を21に近づけよう<br />
                            ✋ HIT でカード追加 / STAND で勝負<br />
                            💥 21を超えるとバースト（負け）<br />
                            ⚡ 最初の2枚で21 = BLACKJACK！
                        </div>
                    </div>
                )}

                {/* ── GAME ── */}
                {(phase === "playing" || phase === "dealer" || phase === "result") && (
                    <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>

                        <Hand cards={dealerHand} label="DEALER" total={dTotal} animate={animate} hideTotal={phase === "playing"} totalBelow />
                        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(255,140,0,0.2),transparent)" }} />
                        <Hand cards={playerHand} label="YOU" total={pTotal} animate={animate} />

                        {/* RESULT OVERLAY */}
                        {phase === "result" && result && (
                            <div style={{
                                position: "absolute", top: "50%", left: "50%",
                                transform: "translate(-50%,-50%)",
                                background: "rgba(0,0,0,0.90)",
                                border: `1px solid ${resultConfig[result].color}`,
                                borderRadius: 14, padding: "22px 44px",
                                textAlign: "center", zIndex: 30,
                                boxShadow: `0 0 40px ${resultConfig[result].glow}, 0 0 80px ${resultConfig[result].glow}`,
                                animation: "bjResultPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
                                backdropFilter: "blur(10px)",
                                minWidth: 220,
                            }}>
                                <div style={{
                                    fontFamily: "'Cinzel Decorative',Cinzel,serif", fontSize: 26, fontWeight: 900,
                                    color: resultConfig[result].color,
                                    textShadow: `0 0 30px ${resultConfig[result].glow}`,
                                    letterSpacing: 3,
                                }}>{resultConfig[result].text}</div>
                                <div style={{
                                    fontFamily: "Cinzel,serif", fontSize: 13,
                                    color: "rgba(255,255,255,0.45)", marginTop: 6, letterSpacing: 2,
                                }}>{pTotal} vs {dTotal}</div>
                            </div>
                        )}

                        {/* BUTTONS */}
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
                            {phase === "playing" && (
                                <>
                                    <button className="bj-btn bj-btn-hit" onClick={() => hit(playerHand, dealerHand, unitPool)}>HIT</button>
                                    <button className="bj-btn bj-btn-stand" onClick={() => stand(playerHand, dealerHand, unitPool)}>STAND</button>
                                </>
                            )}
                            {phase === "result" && (
                                <button className="bj-btn bj-btn-deal" onClick={() => startGame(unitPool)}>
                                    DEAL AGAIN
                                </button>
                            )}
                            {phase === "dealer" && (
                                <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, color: "rgba(255,140,0,0.4)", letterSpacing: 3, animation: "bjPulse 1s ease-in-out infinite" }}>
                                    DEALER DRAWING...
                                </div>
                            )}
                        </div>

                        <div style={{ textAlign: "center", fontFamily: "Cinzel,serif", fontSize: 9, color: "rgba(255,140,0,0.18)", letterSpacing: 2 }}>
                            DECK · {Math.max(0, deckRef.current.length - idxRef.current)} REMAINING
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}