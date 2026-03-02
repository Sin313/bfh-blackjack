
'use client';

import { useState, useMemo } from 'react';
import { useGetV1MeUnits } from "@/api/generated/assets/assets";
import { UnitCard } from "./unit-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, SortAsc, SortDesc, LayoutGrid, List } from "lucide-react";
import { useQueries } from '@tanstack/react-query';
import { fetchUnitMetadata } from '@/hooks/use-unit-metadata';
import { useSkills } from "@/hooks/use-skills";
import { useHeroTypes } from "@/hooks/use-hero-types";
import { UnitMetadata } from '@/lib/constants';

type SortKey = 'id' | 'lv' | 'hp' | 'phy' | 'int' | 'agi' | 'spr' | 'def' | 'rarity';

const RARITY_ORDER: Record<string, number> = {
    'legendary': 5,
    'epic': 4,
    'rare': 3,
    'uncommon': 2,
    'common': 1
};

export function UnitList() {
    const { data: response, isLoading: isLoadingIds, error: errorIds } = useGetV1MeUnits();
    const [sortBy, setSortBy] = useState<SortKey>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

    const unitIds = useMemo(() => {
        if (response?.status !== 200) return [];
        return response.data.units || [];
    }, [response]);

    // Fetch all metadata in parallel for sorting
    const metadataQueries = useQueries({
        queries: unitIds.map((id) => ({
            queryKey: ['unitMetadata', id],
            queryFn: () => fetchUnitMetadata(id),
            staleTime: Infinity,
        })),
    });

    const isLoadingMetadata = metadataQueries.some((q) => q.isLoading);

    const { data: skills } = useSkills();
    const { data: heroTypes } = useHeroTypes(); // Assuming this hook exists

    const enrichedUnits = useMemo(() => {
        return unitIds.map((id, index) => {
            const metadata = metadataQueries[index].data;
            const typeName = metadata?.attributes?.type_name || '';

            // Find localized names
            const hero = heroTypes?.find((h: any) => h.name.ja === typeName || h.name.en === typeName);
            const nameJa = hero?.name.ja || typeName;
            const nameEn = hero?.name.en || '';

            // Find skill description for this unit's BB
            const bbName = metadata?.attributes?.brave_burst;
            const skill = skills?.find((s: any) =>
                s.name.ja === bbName ||
                s.name.en === bbName ||
                (bbName && (bbName.includes(s.name.ja) || bbName.includes(s.name.en)))
            );
            const bbDescription = skill?.description?.ja?.effects?.join(' ') || '';

            return { id, metadata, bbDescription, nameJa, nameEn };
        });
    }, [unitIds, metadataQueries, skills, heroTypes]);

    const filteredAndSortedUnits = useMemo(() => {
        let result = enrichedUnits.filter(u => {
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            const nameJaMatch = u.nameJa?.toLowerCase().includes(term);
            const nameEnMatch = u.nameEn?.toLowerCase().includes(term);
            const idMatch = u.id.includes(term);
            const typeMatch = u.metadata?.attributes?.type_name?.toLowerCase().includes(term);
            const bbMatch = u.metadata?.attributes?.brave_burst?.toLowerCase().includes(term);
            const bbDescMatch = u.bbDescription?.toLowerCase().includes(term);

            return nameJaMatch || nameEnMatch || idMatch || typeMatch || bbMatch || bbDescMatch;
        });

        result.sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            const metaA = a.metadata?.attributes;
            const metaB = b.metadata?.attributes;

            switch (sortBy) {
                case 'id':
                    valA = a.id;
                    valB = b.id;
                    break;
                case 'lv':
                    valA = metaA?.lv || 0;
                    valB = metaB?.lv || 0;
                    break;
                case 'hp':
                    valA = metaA?.hp || 0;
                    valB = metaB?.hp || 0;
                    break;
                case 'phy':
                    valA = metaA?.phy || 0;
                    valB = metaB?.phy || 0;
                    break;
                case 'int':
                    valA = metaA?.int || 0;
                    valB = metaB?.int || 0;
                    break;
                case 'agi':
                    valA = metaA?.agi || 0;
                    valB = metaB?.agi || 0;
                    break;
                case 'spr':
                    valA = metaA?.spr || 0;
                    valB = metaB?.spr || 0;
                    break;
                case 'def':
                    valA = metaA?.def || 0;
                    valB = metaB?.def || 0;
                    break;
                case 'rarity':
                    valA = RARITY_ORDER[metaA?.rarity?.toLowerCase() || ''] || 0;
                    valB = RARITY_ORDER[metaB?.rarity?.toLowerCase() || ''] || 0;
                    break;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [enrichedUnits, sortBy, sortOrder, searchTerm]);

    if (isLoadingIds) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (errorIds || response?.status !== 200) {
        return <div className="text-red-400 p-8 glass-card text-center">ユニット情報の取得に失敗しました</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end glass-card p-6 rounded-3xl border-white/5 relative z-50">
                <div className="flex gap-2 mb-0.5">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-xl border ${viewMode === 'grid' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'} transition-all`}
                        title="Grid View"
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('compact')}
                        className={`p-2 rounded-xl border ${viewMode === 'compact' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'} transition-all`}
                        title="Compact View"
                    >
                        <List size={20} />
                    </button>
                </div>
                <div className="flex-1 space-y-2 w-full">
                    <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Search Unit</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Search by name, type, ID or BB effects..."
                            className="pl-10 h-12 bg-white/5 border-white/10 rounded-2xl focus:ring-blue-500/50"
                            value={searchTerm}
                            onChange={(e: any) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="w-full md:w-48 space-y-2">
                        <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Sort By</label>
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-2xl">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10">
                                <SelectItem value="id">Asset ID</SelectItem>
                                <SelectItem value="rarity">Rarity</SelectItem>
                                <SelectItem value="lv">Level</SelectItem>
                                <SelectItem value="hp">HP</SelectItem>
                                <SelectItem value="phy">PHY (Attack)</SelectItem>
                                <SelectItem value="int">INT (Magic)</SelectItem>
                                <SelectItem value="agi">AGI (Speed)</SelectItem>
                                <SelectItem value="spr">SPR (Recovery)</SelectItem>
                                <SelectItem value="def">DEF (Defense)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Order</label>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
                        >
                            {sortOrder === 'asc' ? <SortAsc className="w-5 h-5 text-blue-400" /> : <SortDesc className="w-5 h-5 text-blue-400" />}
                        </button>
                    </div>
                </div>
            </div>

            {isLoadingMetadata && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-300 animate-pulse">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">Loading unit attributes for sorting...</span>
                </div>
            )}

            {filteredAndSortedUnits.length === 0 ? (
                <div className="p-20 glass-card text-center text-slate-500 rounded-3xl">
                    条件に一致するユニットが見つかりません
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"}>
                    {filteredAndSortedUnits.map((u) => (
                        <UnitCard key={u.id} heroId={u.id} compact={viewMode === 'compact'} />
                    ))}
                </div>
            )}
        </div>
    );
}
