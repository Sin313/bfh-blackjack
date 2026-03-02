
'use client';

import { useUnitMetadata } from "@/hooks/use-unit-metadata";
import { useBBDescription } from "@/hooks/use-skills";
import { useUnitNames } from "@/hooks/use-hero-types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { Shield, Sword, Zap, Brain, Info } from "lucide-react";

interface UnitCardProps {
    heroId: string;
    compact?: boolean;
}

export function UnitCard({ heroId, compact }: UnitCardProps) {
    const { data: metadata, isLoading, error } = useUnitMetadata(heroId);
    const names = useUnitNames(metadata?.attributes?.type_name || '');
    const bbDescription = useBBDescription(metadata?.attributes?.brave_burst || '');

    if (isLoading) {
        return <Skeleton className={compact ? "h-32 w-full rounded-xl" : "h-[400px] w-full rounded-2xl"} />;
    }

    if (error || !metadata) {
        return (
            <Card className="glass-card border-red-500/20">
                <CardContent className="p-4 text-center text-sm text-red-400">
                    Metadata error: {heroId}
                </CardContent>
            </Card>
        );
    }

    const { attributes } = metadata;

    const getRarityColor = (rarity: string) => {
        switch (rarity.toLowerCase()) {
            case 'legendary': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
            case 'epic': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
            case 'rare': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
            case 'uncommon': return 'text-green-400 border-green-400/30 bg-green-400/10';
            default: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
        }
    };

    return (
        compact ? (
            <Card className="glass-card overflow-hidden group hover:border-blue-500/30 transition-all border-white/5 bg-white/5 h-auto min-h-[120px]">
                <CardContent className="p-3 flex items-start gap-3">
                    <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img src={metadata.image} className="h-full w-full object-cover" alt="" />
                        <Badge className={`absolute top-0.5 right-0.5 text-[8px] px-1 py-0 ${getRarityColor(attributes.rarity)}`}>
                            {attributes.rarity[0].toUpperCase()}
                        </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h3 className="text-[11px] font-bold text-white leading-tight">{names.ja}</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 italic mb-1 leading-tight">{names.en}</p>
                        <p className="text-[9px] font-bold text-blue-300 mb-2 truncate bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                            {attributes.brave_burst}
                        </p>

                        <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-1">
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-500 font-bold leading-none uppercase">HP</span>
                                <span className="text-[10px] text-slate-200 font-bold font-mono">{attributes.hp}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-500 font-bold leading-none uppercase">PHY</span>
                                <span className="text-[10px] text-red-400 font-bold font-mono">{attributes.phy}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-500 font-bold leading-none uppercase">INT</span>
                                <span className="text-[10px] text-blue-400 font-bold font-mono">{attributes.int}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-500 font-bold leading-none uppercase">AGI</span>
                                <span className="text-[10px] text-green-400 font-bold font-mono">{attributes.agi}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-500 font-bold leading-none uppercase">DEF</span>
                                <span className="text-[10px] text-orange-400 font-bold font-mono">{attributes.def}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-500 font-bold leading-none uppercase">SPR</span>
                                <span className="text-[10px] text-purple-400 font-bold font-mono">{attributes.spr}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <Card className="glass-card overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                        src={metadata.image}
                        alt={metadata.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    <Badge className={`absolute top-3 right-3 ${getRarityColor(attributes.rarity)} backdrop-blur-md`}>
                        {attributes.rarity}
                    </Badge>
                </div>

                <CardHeader className="p-4 pb-0 space-y-1">
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-bold font-display leading-tight text-white group-hover:text-blue-400 transition-colors block">
                            {names.ja}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium italic block">
                            {names.en}
                        </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>#{heroId}</span>
                        <span>LV {attributes.lv}</span>
                    </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <StatBox icon={<Sword className="w-3 h-3" />} label="PHY" value={attributes.phy} color="text-red-400" />
                        <StatBox icon={<Brain className="w-3 h-3" />} label="INT" value={attributes.int} color="text-blue-400" />
                        <StatBox icon={<Shield className="w-3 h-3" />} label="DEF" value={attributes.def} color="text-orange-400" />
                        <StatBox icon={<Zap className="w-3 h-3" />} label="AGI" value={attributes.agi} color="text-green-400" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Brave Burst</p>
                            {bbDescription && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info size={12} className="text-blue-400 opacity-50 hover:opacity-100" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[200px] bg-slate-900 border-white/10 text-xs">
                                            {bbDescription}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <p className="text-sm font-bold text-blue-300 mb-1">{attributes.brave_burst}</p>
                        {bbDescription && (
                            <p className="text-xs text-slate-300 leading-relaxed bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                                {bbDescription}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
    return (
        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <div className="flex items-center gap-1 mb-1">
                <span className={color}>{icon}</span>
                <span className="text-[10px] text-slate-500 font-bold">{label}</span>
            </div>
            <div className="text-sm font-bold font-mono">{value}</div>
        </div>
    );
}
