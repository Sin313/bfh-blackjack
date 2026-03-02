"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGetV1MeUnits } from "@/api/generated/assets/assets";
import { fetchUnitMetadata } from "@/hooks/use-unit-metadata";

// ===================== TYPES =====================
interface Unit {
  id: string;
  name: string;
  rarity: "Legendary" | "Epic" | "Rare" | "Uncommon" | string;
  element: string;
  elementName: string;
  hp: number;
  phy: number;
  int: number;
  def: number;
  spr: number;
  agi: number;
  skill: string;
  skillDesc: string;
  tint: string;
  image?: string; // URL — falls back to placeholder
}

// Replace with real API call: fetch('/api/units') or similar
const DUMMY_UNITS: Unit[] = [
  { id: "500012049", name: "神燃煌騎ラヴァ", rarity: "Legendary", element: "火", elementName: "1", phy: 3150, int: 2000, hp: 8420, def: 2480, spr: 1890, agi: 2000, skill: "神焔爆砕陣", skillDesc: "全体に炎属性の超強力な攻撃。Lv.MAX時、追加で2ターン継続ダメージ付与。", tint: "#ff3300" },
  { id: "500008821", name: "蒼龍聖騎士アーク", rarity: "Legendary", element: "水", elementName: "2", phy: 2980, int: 2100, hp: 9100, def: 3020, spr: 2100, agi: 2200, skill: "蒼天龍牙撃", skillDesc: "全体に水属性の強力な攻撃。味方全体のHPを回復する。", tint: "#0044ff" },
  { id: "500009244", name: "翠嵐剣聖リュウ", rarity: "Epic", element: "木", elementName: "3", phy: 2750, int: 1800, hp: 8600, def: 2800, spr: 2300, agi: 2500, skill: "翠嵐剣舞", skillDesc: "単体に木属性の強力攻撃。自身のATKを2ターンアップ。", tint: "#00cc44" },
];

const RARITY_STYLE: Record<string, { bg: string; color: string; short: string }> = {
  Legendary: { bg: "linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)", color: "#ffffff", short: "L" },
  Epic: { bg: "#cc0000", color: "#ffffff", short: "E" },
  Rare: { bg: "#ddb500", color: "#ffffff", short: "R" },
  Uncommon: { bg: "#7fb800", color: "#ffffff", short: "UC" },
};

// ===================== PLACEHOLDER IMAGE =====================
// A small dark gradient SVG used when no image URL is provided
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='270' height='474'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%231a0800'/%3E%3Cstop offset='1' stop-color='%230d0d1a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='270' height='474' fill='url(%23g)'/%3E%3C/svg%3E";

function getElementTint(typeName: string | undefined) {
  const t = (typeName || '').toLowerCase();
  if (t.includes('火') || t.includes('fire')) return '#cc2200';
  if (t.includes('水') || t.includes('water')) return '#0044cc';
  if (t.includes('雷') || t.includes('thunder') || t.includes('lightning')) return '#ccaa00';
  if (t.includes('木') || t.includes('earth') || t.includes('nature')) return '#008822';
  if (t.includes('闇') || t.includes('dark')) return '#440088';
  if (t.includes('光') || t.includes('light')) return '#aa8800';
  return '#333355';
}

function getJapaneseName(fullName: string) {
  // BFH names usually come in format "English Name 日本語名"
  // We match the Japanese characters (Kanji, Hiragana, Katakana)
  const jpMatch = fullName.match(/[\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf]+/g);
  return jpMatch ? jpMatch.join(' ') : fullName;
}

function getElementMark(attrId: number) {
  switch (attrId) {
    case 1: return '🔥'; // Fire
    case 2: return '💧'; // Water
    case 3: return '🌳'; // Earth/Wood
    case 4: return '⚡'; // Thunder
    case 5: return '✨'; // Light
    case 6: return '🌑'; // Dark
    default: return '⭐';
  }
}

function getElementOrbStyle(attrId: number): React.CSSProperties {
  switch (attrId) {
    case 1: return { background: 'radial-gradient(circle at 30% 30%, #ff8888, #dd0000)' };
    case 2: return { background: 'radial-gradient(circle at 30% 30%, #88ccff, #0044dd)' };
    case 3: return { background: 'radial-gradient(circle at 30% 30%, #aaffaa, #009922)' };
    case 4: return { background: 'radial-gradient(circle at 30% 30%, #ffffcc, #eebb00)' };
    case 5: return { background: 'radial-gradient(circle at 30% 30%, #ffffff, #aaaaaa)' };
    case 6: return { background: 'radial-gradient(circle at 30% 30%, #cc88ff, #440088)' };
    default: return { background: '#777' };
  }
}

// ===================== RIPPLE =====================
function spawnRipple(parent: HTMLElement, x: number, y: number, cool: boolean) {
  const el = document.createElement("div");
  const hot = ["rgba(255,180,50,0.8)", "rgba(255,100,0,0.7)", "rgba(255,230,100,0.9)", "rgba(255,255,255,0.6)"];
  const cold = ["rgba(100,200,255,0.8)", "rgba(180,100,255,0.7)", "rgba(255,255,255,0.6)"];
  const palette = cool ? cold : hot;
  const c = palette[Math.floor(Math.random() * palette.length)];
  Object.assign(el.style, {
    position: "absolute",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: "10",
    left: x + "px",
    top: y + "px",
    width: "60px",
    height: "60px",
    background: `radial-gradient(circle,${c} 0%,transparent 70%)`,
    boxShadow: `0 0 12px ${c}`,
    transform: "translate(-50%,-50%) scale(0)",
    animation: "bfhRipple 0.7s ease-out forwards",
  });
  parent.appendChild(el);
  setTimeout(() => el.remove(), 750);
}

// ===================== CARD DETAIL =====================
interface CardDetailProps {
  units: Unit[];
  initialIndex: number;
  onBack: () => void;
}

function CardDetail({ units, initialIndex, onBack }: CardDetailProps) {
  const [index, setIndex] = useState(initialIndex);
  const [flipped, setFlipped] = useState<boolean[]>(() => units.map(() => false));
  const [spinning, setSpinning] = useState<boolean[]>(() => units.map(() => false));

  const rotYRef = useRef<number[]>(units.map(() => 0));
  const targetRYRef = useRef<number[]>(units.map(() => 0));
  const flipBaseRef = useRef<number[]>(units.map(() => 0));
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>(units.map(() => null));
  const glareRefs = useRef<(HTMLDivElement | null)[]>(units.map(() => null));
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  // Animate tilt
  useEffect(() => {
    const loop = () => {
      const i = index; // closure over current index via ref below
      const cw = wrapperRefs.current[i];
      if (cw && !spinning[i]) {
        rotYRef.current[i] += (targetRYRef.current[i] - rotYRef.current[i]) * 0.10;
        cw.style.transform = `rotateY(${rotYRef.current[i].toFixed(3)}deg)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, spinning]);

  // Slide track position
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-index * 300}px)`;
    }
  }, [index]);

  const navigate = useCallback((dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= units.length) return;
    targetRYRef.current[index] = flipBaseRef.current[index];
    setIndex(next);
  }, [index, units.length]);

  const flip = useCallback(() => {
    const i = index;
    if (spinning[i]) return;
    const cw = wrapperRefs.current[i];
    if (!cw) return;
    const newFlipped = [...flipped];
    newFlipped[i] = !newFlipped[i];
    setFlipped(newFlipped);
    flipBaseRef.current[i] = newFlipped[i] ? 180 : 0;
    targetRYRef.current[i] = flipBaseRef.current[i];
    rotYRef.current[i] = flipBaseRef.current[i];
    cw.style.transition = "transform 0.65s cubic-bezier(0.4,0,0.2,1)";
    cw.style.transform = `rotateY(${flipBaseRef.current[i]}deg)`;
    setTimeout(() => { cw.style.transition = ""; }, 700);
  }, [index, flipped, spinning]);

  const spin = useCallback(() => {
    const i = index;
    if (spinning[i]) return;
    const cw = wrapperRefs.current[i];
    if (!cw) return;
    const newSpinning = [...spinning];
    newSpinning[i] = true;
    setSpinning(newSpinning);

    const startAngle = rotYRef.current[i];
    const totalRot = 720 + (flipped[i] ? 180 : 0);
    const duration = 900;
    let start: number | null = null;

    const newFlipped = [...flipped];
    newFlipped[i] = false;
    setFlipped(newFlipped);
    flipBaseRef.current[i] = 0;

    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      cw.style.transform = `rotateY(${(startAngle + totalRot * eased).toFixed(2)}deg)`;
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        rotYRef.current[i] = 0;
        targetRYRef.current[i] = 0;
        cw.style.transform = "rotateY(0deg)";
        const done = [...spinning];
        done[i] = false;
        setSpinning(done);
      }
    };
    requestAnimationFrame(step);
  }, [index, flipped, spinning]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 12) isSwiping.current = true;
    if (!isSwiping.current && stageRef.current) {
      const i = index;
      if (spinning[i]) return;
      const r = stageRef.current.getBoundingClientRect();
      let ndx = (e.touches[0].clientX - (r.left + r.width / 2)) / (r.width / 2);
      ndx = Math.max(-1, Math.min(1, ndx));
      targetRYRef.current[i] = ndx * 25 + flipBaseRef.current[i];
    }
    e.preventDefault();
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (isSwiping.current && Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1);
  };

  const unit = units[index];
  const rs = RARITY_STYLE[unit.rarity] ?? RARITY_STYLE.R;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, height: "100%", justifyContent: "center" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 20px" }}>
        <button className="bfh-btn-back" onClick={onBack}>一覧へ</button>
        <span className="bfh-label">{unit.name}</span>
      </div>

      {/* Main Area: Nav + Viewport */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }}>
        <button className="bfh-nav-btn" style={{ flexShrink: 0 }} onClick={() => navigate(-1)} disabled={index === 0}>‹</button>

        {/* Slide viewport */}
        <div
          ref={stageRef}
          className="bfh-slide-viewport"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={trackRef}
            className="bfh-slide-track"
          >
            {units.map((u, i) => {
              const urs = RARITY_STYLE[u.rarity] || RARITY_STYLE.Uncommon || { bg: "#555", color: "#fff", short: "?" };
              return (
                <div key={u.id} className="bfh-slide-item">
                  <div
                    ref={el => { wrapperRefs.current[i] = el; }}
                    className="bfh-card-wrapper"
                  >
                    {/* FRONT */}
                    <div
                      className="bfh-card-face bfh-card-front"
                      onClick={e => {
                        if (!spinning[i]) {
                          spawnRipple(e.currentTarget as HTMLElement, e.nativeEvent.offsetX, e.nativeEvent.offsetY, false);
                          flip();
                        }
                      }}
                      onTouchStart={e => {
                        if (spinning[i]) return;
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        Array.from(e.touches).forEach(t => spawnRipple(e.currentTarget as HTMLElement, t.clientX - r.left, t.clientY - r.top, false));
                      }}
                    >
                      <img
                        src={u.image ?? PLACEHOLDER_IMG}
                        alt={u.name}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none" }}
                      />
                      {/* color tint */}
                      <div style={{ position: "absolute", inset: 0, background: u.tint, mixBlendMode: "multiply", opacity: 0.35, pointerEvents: "none" }} />

                      {/* rarity badge */}
                      <div className="bfh-badge" style={{ background: urs.bg, color: urs.color }}>
                        {urs.short}
                      </div>

                      {/* element orb */}
                      <div className="bfh-element-orb" style={getElementOrbStyle(parseInt(u.elementName, 10))}>
                        {u.element}
                      </div>

                      {/* Card front overlay for trading card look */}
                      <div className="bfh-card-front-top-overlay">
                        <div className="bfh-card-front-name">{getJapaneseName(u.name)}</div>
                      </div>
                      <div className="bfh-card-front-bottom-overlay">
                        <div className="bfh-card-front-bb-label">Brave Burst</div>
                        <div className="bfh-card-front-bb">{u.skill || "No BB"}</div>
                      </div>
                      {/* glare */}
                      <div
                        ref={el => { glareRefs.current[i] = el; }}
                        className="bfh-glare"
                      />
                    </div>

                    {/* BACK */}
                    <div
                      className="bfh-card-face bfh-card-back"
                      onClick={e => {
                        if (!spinning[i]) {
                          spawnRipple(e.currentTarget as HTMLElement, e.nativeEvent.offsetX, e.nativeEvent.offsetY, true);
                          flip();
                        }
                      }}
                      onTouchStart={e => {
                        if (spinning[i]) return;
                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        Array.from(e.touches).forEach(t => spawnRipple(e.currentTarget as HTMLElement, t.clientX - r.left, t.clientY - r.top, true));
                      }}
                    >
                      <div className="bfh-back-header">
                        <img src={u.image ?? PLACEHOLDER_IMG} alt={u.name} style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,140,0,0.4)" }} />
                        <div>
                          <div className="bfh-back-name">{u.name}</div>
                          <div className="bfh-back-id">#{u.id}</div>
                        </div>
                      </div>
                      <div className="bfh-stats-grid">
                        {[
                          { key: 'hp', label: 'HP', max: 12000 },
                          { key: 'phy', label: '攻撃', max: 4000 },
                          { key: 'int', label: '魔攻', max: 4000 },
                          { key: 'def', label: '防御', max: 4000 },
                          { key: 'spr', label: '魔防', max: 4000 },
                          { key: 'agi', label: '敏捷', max: 4000 }
                        ].map(stat => {
                          const val = u[stat.key as "hp" | "phy" | "int" | "def" | "spr" | "agi"];
                          return (
                            <div key={stat.key} className="bfh-stat-box">
                              <div className="bfh-stat-label">{stat.label}</div>
                              <div className="bfh-stat-value">{val}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="bfh-skill-row">
                        <div className="bfh-skill-name">⚡ {u.skill || "No BB"}</div>
                        <div className="bfh-skill-desc">{u.skillDesc || "-"}</div>
                      </div>
                      <div className="bfh-rarity-row">
                        <div style={{ color: "#ff8c00", fontSize: "10px", fontWeight: "bold" }}>{u.rarity}</div>
                        <div className="bfh-nft-id">TOKEN #{u.id}</div>
                      </div>
                      <div className="bfh-logo-back">BRAVE FRONTIER HEROES</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button className="bfh-nav-btn" style={{ flexShrink: 0 }} onClick={() => navigate(1)} disabled={index === units.length - 1}>›</button>
      </div>

      {/* Info & Additional Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
        <span className="bfh-counter">{index + 1} / {units.length}</span>
        <button className="bfh-btn-spin" onClick={spin}>↻ Spin</button>
      </div>
      <div className="bfh-hint">クリックでフリップ · スワイプで次へ</div>
    </div>
  );
}

type SortOrder = "ID" | "NAME" | "RARITY" | "HP" | "PHY" | "INT" | "DEF" | "SPR" | "AGI";

interface GridListProps {
  units: Unit[];
  loading?: boolean;
  onSelect: (id: string) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

function GridList({ units, loading, onSelect, sortOrder, onSortChange }: GridListProps) {
  return (
    <div style={{ overflowY: "auto", height: "100%", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
      <div className="bfh-list-header">
        <div>
          <span className="bfh-list-title">My Units</span>
          <span className="bfh-unit-count" style={{ marginLeft: 8 }}>{units.length} units</span>
        </div>
        <select value={sortOrder} onChange={e => onSortChange(e.target.value as SortOrder)} style={{ background: "rgba(255,140,0,0.1)", color: "#ffaa00", border: "1px solid rgba(255,140,0,0.5)", borderRadius: 4, padding: "4px 8px", outline: "none", fontSize: 12 }}>
          <option value="ID">ID</option>
          <option value="NAME">Name</option>
          <option value="RARITY">Rarity</option>
          <option value="HP">HP</option>
          <option value="PHY">PHY (ATK)</option>
          <option value="INT">INT (M.ATK)</option>
          <option value="DEF">DEF</option>
          <option value="SPR">SPR (M.DEF)</option>
          <option value="AGI">AGI (SPD)</option>
        </select>
      </div>
      <div className="bfh-grid">
        {units.map((u, i) => {
          const rs = RARITY_STYLE[u.rarity] || RARITY_STYLE.Uncommon || { bg: "#555", color: "#fff", short: "?" };
          return (
            <div key={u.id} className="bfh-grid-card" onClick={() => onSelect(u.id)}>
              <img src={u.image ?? PLACEHOLDER_IMG} alt={u.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: u.tint, mixBlendMode: "multiply", opacity: 0.4 }} />
              <div className="bfh-grid-overlay" />
              {u.rarity === "Legendary" && <div className="bfh-grid-glow" />}
              <div className="bfh-grid-rarity" style={{ background: rs.bg, color: rs.color }}>{rs.short}</div>
              <div className="bfh-grid-name">{u.name}</div>
            </div>
          );
        })}
      </div>
      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,140,0,0.6)", fontSize: "12px", letterSpacing: "2px" }}>
          Loading units...
        </div>
      )}
    </div>
  );
}

// ===================== EMBERS =====================
function Embers() {
  const emberData = useRef(
    Array.from({ length: 24 }, () => ({
      left: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 10 + 7,
      delay: Math.random() * 12,
      drift: Math.random() * 120 - 60,
      color: ["#ff6600", "#ff4400", "#ffaa00", "#ff2200"][Math.floor(Math.random() * 4)],
    }))
  ).current;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1 }}>
      {emberData.map((e, i) => (
        <div
          key={i}
          className="bfh-ember"
          style={{
            left: e.left + "%",
            width: e.size + "px",
            height: e.size + "px",
            animationDuration: e.duration + "s",
            animationDelay: e.delay + "s",
            background: e.color,
            ["--drift" as string]: e.drift + "px",
          }}
        />
      ))}
    </div>
  );
}

export default function CardViewer() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("ID");
  const { data: unitsRes, isLoading: loadingUnits } = useGetV1MeUnits();
  const loading = loadingUnits || (unitsRes?.status === 200 && (unitsRes.data as any).units?.length > 0 && units.length < (unitsRes.data as any).units.length);

  useEffect(() => {
    let isCancelled = false;
    let skillsData: any[] | null = null;
    let heroTypesData: any[] | null = null;

    // Fetch Skills & Hero Types JSON
    const fetchGameData = async () => {
      try {
        const [resS, resH] = await Promise.all([
          fetch("https://rsc.bravefrontierheroes.com/data/skills_v2.json"),
          fetch("https://rsc.bravefrontierheroes.com/data/hero_types_v2.json")
        ]);
        if (resS.ok) skillsData = await resS.json();
        if (resH.ok) heroTypesData = await resH.json();
      } catch (e) { console.error("Failed to load game data", e); }
    };

    const getBBDescription = (bbName: string) => {
      if (!skillsData || !bbName) return null;
      const skill = skillsData.find(s =>
        s.name && (s.name.ja === bbName || s.name.en === bbName ||
          (s.name.ja && bbName.includes(s.name.ja)) || (s.name.en && bbName.includes(s.name.en)))
      );
      if (!skill || !skill.description) return null;
      if (skill.description.ja && skill.description.ja.effects) return skill.description.ja.effects.join(' / ');
      if (skill.description.en && skill.description.en.effects) return skill.description.en.effects.join(' / ');
      return null;
    };

    const load = async () => {
      if (!unitsRes || unitsRes.status !== 200) return;
      const ids = (unitsRes.data as any).units || [];
      if (ids.length === 0) {
        setUnits([]);
        return;
      }

      await fetchGameData();

      const results: Unit[] = [];
      const BATCH_SIZE = 5; // Reduced to throttle IPFS load storm
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        if (isCancelled) return;
        const batchIds = ids.slice(i, i + BATCH_SIZE);
        await Promise.all(batchIds.map(async (id: string) => {
          try {
            const m = await fetchUnitMetadata(id);
            let imageUrl = m.image;
            if (imageUrl && imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
            }

            // Map attribute from hero types if possible
            let attrVal = 7; // default
            if (heroTypesData && m.attributes.type_name) {
              const h = heroTypesData.find(ht =>
                (ht.name && ht.name.ja && m.attributes.type_name.includes(ht.name.ja)) ||
                (ht.name && ht.name.en && m.attributes.type_name.includes(ht.name.en))
              );
              if (h) attrVal = h.attribute;
            }

            const bbName = m.attributes.brave_burst;
            results.push({
              id: String(id),
              name: m.attributes.type_name || `Hero #${id}`,
              rarity: m.attributes.rarity || 'Uncommon',
              element: getElementMark(attrVal),
              elementName: String(attrVal),
              hp: m.attributes.hp || 0,
              phy: m.attributes.phy || 0,
              int: m.attributes.int || 0,
              def: m.attributes.def || 0,
              spr: m.attributes.spr || 0,
              agi: m.attributes.agi || 0,
              skill: bbName || "No Skill",
              skillDesc: getBBDescription(bbName) || m.description || "",
              tint: getElementTint(m.attributes.type_name),
              image: imageUrl
            });
          } catch (e) {
            console.error(`Failed to fetch ${id}`, e);
          }
        }));
        if (isCancelled) return;
        setUnits([...results]);
      }
    };
    if (!loadingUnits) load();
    return () => { isCancelled = true; };
  }, [unitsRes, loadingUnits]);

  const sortedUnits = [...units].sort((a, b) => {
    if (sortOrder === "NAME") return a.name.localeCompare(b.name);
    if (sortOrder === "RARITY") {
      const order: Record<string, number> = { Legendary: 4, Epic: 3, Rare: 2, Uncommon: 1 };
      return (order[b.rarity] || 0) - (order[a.rarity] || 0);
    }
    if (sortOrder === "HP") return b.hp - a.hp;
    if (sortOrder === "PHY") return b.phy - a.phy;
    if (sortOrder === "INT") return b.int - a.int;
    if (sortOrder === "DEF") return b.def - a.def;
    if (sortOrder === "SPR") return b.spr - a.spr;
    if (sortOrder === "AGI") return b.agi - a.agi;
    return parseInt(b.id) - parseInt(a.id); // Default to newer ID first
  });

  const selectedIndex = selectedUnitId ? sortedUnits.findIndex(u => u.id === selectedUnitId) : null;

  return (
    <>
      <style>{`
        /* === Google Font === */
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Noto+Sans+JP:wght@300;400;700&display=swap');

        /* === Ripple keyframe === */
        @keyframes bfhRipple {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(6); opacity: 0; }
        }

        /* === Ember === */
        @keyframes bfhFloatUp {
          0%   { transform: translateY(100vh) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-5vh) translateX(var(--drift)); opacity: 0; }
        }
        .bfh-ember {
          position: absolute; border-radius: 50%;
          animation: bfhFloatUp linear infinite; opacity: 0;
        }

        /* === Rainbow border glow === */
        @keyframes bfhRbGlow {
          0%   { box-shadow: 0 0 0 2.5px #ff2222, 0 0 18px #ff2222; }
          16%  { box-shadow: 0 0 0 2.5px #ff8800, 0 0 18px #ff8800; }
          33%  { box-shadow: 0 0 0 2.5px #ffee00, 0 0 18px #ffee00; }
          50%  { box-shadow: 0 0 0 2.5px #00ff88, 0 0 18px #00ff88; }
          66%  { box-shadow: 0 0 0 2.5px #00aaff, 0 0 18px #00aaff; }
          83%  { box-shadow: 0 0 0 2.5px #cc00ff, 0 0 18px #cc00ff; }
          100% { box-shadow: 0 0 0 2.5px #ff2222, 0 0 18px #ff2222; }
        }
        @keyframes bfhBadgePulse {
          0%,100% { filter: brightness(1); }
          50%     { filter: brightness(1.5) drop-shadow(0 0 8px currentColor); }
        }
        @keyframes bfhFillUp {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        /* === Layout === */
        .bfh-label       { font-family:'Cinzel',serif; color:#ff8c00; font-size:10px; letter-spacing:4px; text-transform:uppercase; opacity:0.7; }
        .bfh-list-header { padding:20px 20px 12px; display:flex; align-items:center; justify-content:space-between; }
        .bfh-list-title  { font-family:'Cinzel',serif; color:#ff8c00; font-size:13px; letter-spacing:4px; text-transform:uppercase; }
        .bfh-unit-count  { font-size:11px; color:rgba(255,140,0,0.4); letter-spacing:2px; }
        .bfh-hint        { font-size:10px; color:rgba(255,140,0,0.4); letter-spacing:2px; text-transform:uppercase; }

        /* === Grid === */
        .bfh-grid       { display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:10px; padding:0 12px 24px; }
        @media(min-width: 600px) {
          .bfh-grid { grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; padding: 0 20px 24px; }
        }
        .bfh-grid-card  { position:relative; border-radius:10px; overflow:hidden; aspect-ratio:3/5; cursor:pointer; transition:transform 0.2s; }
        .bfh-grid-card:active { transform:scale(0.95); }
        .bfh-grid-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%); }
        .bfh-grid-glow  { position:absolute; inset:-1px; border-radius:11px; animation:bfhRbGlow 3s linear infinite; }
        .bfh-grid-rarity { position:absolute; top:6px; left:6px; font-family:'Cinzel',serif; font-size:8px; font-weight:900; padding:2px 7px; border-radius:8px; }
        .bfh-grid-name  { position:absolute; bottom:6px; left:6px; right:6px; font-size:8px; color:#fff; letter-spacing:1px; text-shadow:0 1px 3px rgba(0,0,0,0.9); line-height:1.3; }

        /* === Slide === */
        .bfh-slide-viewport { width:300px; height:504px; position:relative; overflow:hidden; }
        .bfh-slide-track    { display:flex; height:100%; transition:transform 0.45s cubic-bezier(0.4,0,0.2,1); }
        .bfh-slide-item     { width:300px; height:504px; flex-shrink:0; perspective:900px; display:flex; justify-content:center; align-items:center; }

        /* === Card front overlay === */
        .bfh-card-front-top-overlay { position:absolute; top:42px; left:0; right:0; padding:0 14px; z-index:5; display:flex; flex-direction:column; align-items:flex-start; pointer-events:none; }
        .bfh-card-front-bottom-overlay { position:absolute; bottom:12px; left:12px; right:12px; background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%); border:1px solid rgba(255,140,0,0.4); border-radius:12px; padding:6px 10px 8px; z-index:5; display:flex; flex-direction:column; align-items:center; pointer-events:none; }
        
        .bfh-card-front-name { font-family:'Noto Sans JP',sans-serif; font-size:16px; color:#ffffff; letter-spacing:2px; font-weight:bold; text-shadow:0 2px 4px rgba(0,0,0,1), 0 0 8px rgba(255,140,0,1); }
        .bfh-card-front-bb-label { font-size:9px; color:rgba(255,200,100,0.8); letter-spacing:3px; text-transform:uppercase; margin-bottom:2px; font-family:'Cinzel',serif; }
        .bfh-card-front-bb   { font-family:'Noto Sans JP',sans-serif; font-size:13px; color:#ffcc44; letter-spacing:1px; line-height:1.2; text-shadow:0 1px 3px rgba(0,0,0,1); font-weight: bold; text-align:center; }

        /* === Card wrapper === */
        .bfh-card-wrapper {
          width:270px; height:474px;
          transform-style:preserve-3d; position:relative; cursor:pointer;
        }
        .bfh-card-wrapper::before {
          content:''; position:absolute; inset:-3px; border-radius:19px; z-index:0;
          animation:bfhRbGlow 3s linear infinite; pointer-events:none;
        }
        .bfh-card-face {
          position:absolute; inset:0; border-radius:16px; overflow:hidden;
          backface-visibility:hidden; -webkit-backface-visibility:hidden;
        }
        .bfh-card-front { z-index:1; }
        .bfh-card-back  { transform:rotateY(180deg); z-index:1;
          background:linear-gradient(145deg,#0d0d1a 0%,#1a0800 40%,#0d0d1a 100%);
          display:flex; flex-direction:column; padding:20px 18px; gap:10px;
        }

        /* === Glare === */
        .bfh-glare {
          position:absolute; inset:0; border-radius:16px; pointer-events:none; z-index:3;
          background:radial-gradient(ellipse at var(--gx,50%) var(--gy,30%),
            rgba(255,255,255,0.38) 0%, rgba(255,220,160,0.12) 35%, transparent 65%);
          mix-blend-mode:screen;
        }

        /* === Badge and Orb === */
        .bfh-badge {
          position:absolute; top:12px; left:12px;
          height:24px; border-radius:12px; padding: 0 10px;
          z-index:6; display:flex; align-items:center; justify-content:center;
          font-family:'Cinzel',serif; font-size:13px; font-weight:900;
          animation:bfhBadgePulse 2s ease-in-out infinite;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.4);
        }
        .bfh-element-orb {
          position:absolute; top:10px; right:10px;
          width:30px; height:30px; border-radius:50%;
          z-index:6; display:flex; align-items:center; justify-content:center;
          font-size:14px;
          box-shadow: inset -4px -4px 8px rgba(0,0,0,0.4), inset 2px 2px 6px rgba(255,255,255,0.5), 0 3px 6px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.2);
        }

        /* === Card back content === */
        .bfh-back-header  { display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(255,140,0,0.3); padding-bottom:10px; }
        .bfh-back-name    { font-family:'Cinzel',serif; color:#ffcc44; font-size:11px; letter-spacing:1px; line-height:1.5; }
        .bfh-back-id      { color:rgba(255,180,50,0.5); font-size:9px; letter-spacing:2px; }
        .bfh-stats-grid   { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .bfh-stat-box     { background:rgba(255,255,255,0.04); border:1px solid rgba(255,140,0,0.2); border-radius:8px; padding:8px 10px; }
        .bfh-stat-label   { font-size:8px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,140,0,0.5); margin-bottom:4px; }
        .bfh-stat-value   { font-family:'Cinzel',serif; font-size:18px; font-weight:700; color:#ffcc44; }
        .bfh-stat-bar     { height:3px; background:rgba(255,255,255,0.1); border-radius:2px; margin-top:4px; overflow:hidden; }
        .bfh-stat-fill    { height:100%; border-radius:2px; transform-origin:left; animation:bfhFillUp 1.2s ease-out forwards; }
        .bfh-skill-row    { background:rgba(255,60,0,0.08); border:1px solid rgba(255,60,0,0.3); border-radius:8px; padding:10px 12px; }
        .bfh-skill-name   { font-family:'Cinzel',serif; color:#ff8844; font-size:10px; letter-spacing:1px; margin-bottom:4px; }
        .bfh-skill-desc   { color:rgba(255,200,150,0.7); font-size:9px; line-height:1.6; }
        .bfh-rarity-row   { display:flex; align-items:center; justify-content:space-between; margin-top:auto; border-top:1px solid rgba(255,140,0,0.2); padding-top:10px; }
        .bfh-rarity-stars { color:#ffd700; font-size:12px; letter-spacing:2px; }
        .bfh-nft-id       { font-size:8px; letter-spacing:2px; color:rgba(255,140,0,0.4); font-family:monospace; }
        .bfh-logo-back    { font-family:'Cinzel',serif; font-size:8px; letter-spacing:1px; color:rgba(255,140,0,0.35); text-align:center; }

        /* === Buttons === */
        .bfh-btn-back { font-family:'Cinzel',serif; font-size:9px; letter-spacing:2px; padding:7px 14px; border:1px solid rgba(255,140,0,0.3); background:rgba(255,140,0,0.06); color:rgba(255,180,50,0.8); cursor:pointer; border-radius:4px; transition:all 0.2s; }
        .bfh-btn-back:hover { background:rgba(255,140,0,0.2); color:#ffaa00; }
        .bfh-nav-btn  { width:36px; height:36px; border-radius:50%; border:1px solid rgba(255,140,0,0.3); background:rgba(255,140,0,0.06); color:rgba(255,180,50,0.8); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
        .bfh-nav-btn:hover:not(:disabled) { background:rgba(255,140,0,0.2); }
        .bfh-nav-btn:disabled { opacity:0.2; cursor:default; }
        .bfh-counter  { font-family:'Cinzel',serif; font-size:10px; color:rgba(255,140,0,0.5); letter-spacing:2px; min-width:50px; text-align:center; }
        .bfh-btn-flip { font-family:'Cinzel',serif; font-size:10px; letter-spacing:2px; padding:9px 20px; border:1px solid rgba(0,200,255,0.4); background:rgba(0,200,255,0.08); color:rgba(100,220,255,0.9); cursor:pointer; border-radius:5px; transition:all 0.3s; }
        .bfh-btn-flip:hover { background:rgba(0,200,255,0.2); color:#88eeff; }
        .bfh-btn-spin { font-family:'Cinzel',serif; font-size:10px; letter-spacing:2px; padding:9px 20px; border:1px solid rgba(200,100,255,0.4); background:rgba(200,100,255,0.08); color:rgba(200,150,255,0.9); cursor:pointer; border-radius:5px; transition:all 0.3s; }
        .bfh-btn-spin:hover { background:rgba(200,100,255,0.2); color:#ddaaff; }
      `}</style>

      {/* Background */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%,#1f0a00 0%,#0a0808 50%,#050508 100%)", zIndex: 0, borderRadius: "16px" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "hidden", pointerEvents: "none", borderRadius: "16px" }}>
        <Embers />
      </div>

      {/* Screens */}
      <div style={{ position: "relative", zIndex: 10, overflow: "hidden", fontFamily: "'Noto Sans JP',sans-serif", width: "100%", minHeight: "60vh" }}>
        {selectedIndex === null || selectedIndex < 0 ? (
          <GridList units={sortedUnits} loading={loading} onSelect={setSelectedUnitId} sortOrder={sortOrder} onSortChange={setSortOrder} />
        ) : (
          <CardDetail units={sortedUnits} initialIndex={selectedIndex} onBack={() => setSelectedUnitId(null)} />
        )}
      </div>
    </>
  );
}
