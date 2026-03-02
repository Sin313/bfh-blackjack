
'use client';

import { useState, useEffect, useMemo } from "react";
import { useGetV1Rankmatches, useGetV1RankmatchesIdHistory } from "@/api/generated/rank-match/rank-match";
import { HandlersRankMatchHistoryResult } from "@/api/generated/model";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, PlayCircle, History, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { BATTLE_RSC_BASE_URL } from "@/lib/constants";

export function BattleList() {
    const { data: matchesResponse, isLoading: loadingMatches } = useGetV1Rankmatches({ status: 'finished' });
    const seasonIds = useMemo(() => {
        const ids = matchesResponse?.status === 200 ? (matchesResponse.data as number[]) : [];
        return [...ids].sort((a, b) => b - a); // Newest first
    }, [matchesResponse]);

    const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(null);

    useEffect(() => {
        if (seasonIds.length > 0 && currentSeasonId === null) {
            setCurrentSeasonId(seasonIds[0]);
        }
    }, [seasonIds, currentSeasonId]);

    const { data: historyResponse, isLoading: loadingHistory } = useGetV1RankmatchesIdHistory(currentSeasonId as number, {
        query: {
            enabled: !!currentSeasonId,
        }
    });

    const results = historyResponse?.status === 200 ? historyResponse.data.results || [] : [];
    const opponent = historyResponse?.status === 200 ? historyResponse.data.opponent : null;

    if (loadingMatches || (currentSeasonId && loadingHistory)) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (!currentSeasonId) {
        return (
            <div className="p-12 glass-card text-center text-slate-500">
                シーズンを読み込み中、または履歴が見つかりません
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 glass-card p-4 rounded-2xl border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-48">
                        <label className="text-[10px] uppercase text-slate-500 font-bold ml-1 mb-1 block">Select Season</label>
                        <Select value={String(currentSeasonId)} onValueChange={(v: any) => setCurrentSeasonId(Number(v))}>
                            <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-blue-400" />
                                    <SelectValue placeholder="Select Season" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10">
                                {seasonIds.map(id => (
                                    <SelectItem key={id} value={String(id)}>Season {id}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            Matching History
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">SEASON ID: {currentSeasonId}</p>
                    </div>
                </div>
                {opponent && (
                    <div className="text-sm font-bold text-blue-400 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
                        VS UID: {opponent?.uids?.join(', ') || 'Unknown'}
                    </div>
                )}
            </div>

            {results.length === 0 ? (
                <div className="p-12 glass-card text-center text-slate-500">
                    このシーズンのバトル履歴はありません
                </div>
            ) : (
                results.map((result, i) => (
                    <BattleItem key={result.battle_id || i} result={result} />
                ))
            )}
        </div>
    );
}

function BattleItem({ result }: { result: HandlersRankMatchHistoryResult }) {
    const battleId = String(result.battle_id);
    const first6 = battleId.substring(0, 6);
    const logUrl = `${BATTLE_RSC_BASE_URL}/${first6}/${battleId}.json`;
    const playbackUrl = `https://bravefrontierheroes.com/ja/battle/${battleId}`;

    return (
        <Card className="glass-card hover:bg-white/5 transition-colors border-l-4 border-l-transparent data-[win=true]:border-l-blue-500 data-[win=false]:border-l-red-500 overflow-hidden" data-win={result.win}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${result.win ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                            {result.win ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold font-display">{result.win ? 'VICTORY' : 'DEFEAT'}</span>
                                <span className="text-[10px] text-slate-500 font-mono">#{battleId}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                                {result.at ? new Date(result.at).toLocaleString() : 'Date unknown'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 flex-1 justify-center hidden md:flex">
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Damage</div>
                            <div className="text-sm font-mono text-blue-400">+{result.added_damage}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Taken</div>
                            <div className="text-sm font-mono text-red-400">-{result.taken_damage}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Rate</div>
                            <div className="text-sm font-mono whitespace-nowrap">
                                {result.last_rate} → <span className={result.win ? 'text-blue-400' : 'text-red-400'}>{result.new_rate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={playbackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                            title="View Replay"
                        >
                            <PlayCircle className="w-6 h-6" />
                        </a>
                        <a
                            href={logUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
                            title="Raw JSON Log"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
