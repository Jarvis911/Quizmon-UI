import { useEffect, useMemo, useState } from "react";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import type { RecentMatch } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type MatchParticipantRow = {
    userId: number | null;
    displayName: string;
    user: { id: number; username: string } | null;
};

type MatchResultRow = {
    userId: number;
    score: number | null;
    user: { id: number; username: string } | null;
};

type MatchDetailResponse = {
    id: number;
    quiz: { title: string };
    participants: MatchParticipantRow[];
    matchResults: MatchResultRow[];
};

function displayLabelForUser(
    userId: number,
    participants: MatchParticipantRow[],
    resultUser: { username: string } | null | undefined
): string {
    const p = participants.find((x) => x.userId === userId);
    const fromParticipant = p?.displayName?.trim();
    const fromUser = p?.user?.username ?? resultUser?.username;
    return fromParticipant || fromUser || `Người chơi #${userId}`;
}

function rankAccent(rank: number): string {
    if (rank === 1) return "text-amber-500";
    if (rank === 2) return "text-slate-400";
    if (rank === 3) return "text-orange-600 dark:text-orange-400";
    return "text-muted-foreground";
}

export interface MatchHistoryCompareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    matchRow: RecentMatch | null;
    currentUserId: number;
    currentUsername: string;
}

export function MatchHistoryCompareDialog({
    open,
    onOpenChange,
    matchRow,
    currentUserId,
    currentUsername,
}: MatchHistoryCompareDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detail, setDetail] = useState<MatchDetailResponse | null>(null);

    useEffect(() => {
        if (!open || !matchRow) {
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await apiClient.get<MatchDetailResponse>(
                    endpoints.match(matchRow.matchId)
                );
                if (cancelled) return;
                setDetail(res.data);
            } catch (e) {
                console.error("[MatchHistoryCompare] fetch match", e);
                if (!cancelled) {
                    setError("Không thể tải bảng xếp hạng trận này.");
                    setDetail(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, matchRow?.matchId]);

    const ranked = useMemo(() => {
        if (!detail?.matchResults?.length) return [];
        const sorted = [...detail.matchResults].sort(
            (a, b) => (b.score ?? 0) - (a.score ?? 0)
        );
        return sorted.map((r, i) => ({
            ...r,
            rank: i + 1,
            label: displayLabelForUser(
                r.userId,
                detail.participants ?? [],
                r.user
            ),
            isSelf: r.userId === currentUserId,
        }));
    }, [detail, currentUserId]);

    if (!matchRow) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg sm:max-w-xl rounded-2xl border-white/10 bg-card/95 backdrop-blur-lg max-h-[min(90vh,640px)] flex flex-col gap-0 p-6">
                <DialogHeader className="shrink-0 space-y-1 pr-8">
                    <DialogTitle className="text-xl font-black tracking-tight">
                        Bảng xếp hạng trận
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground">
                        {matchRow.quizName}
                        <span className="block text-xs font-mono opacity-70 mt-1">
                            Trận #{matchRow.matchId}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-hidden flex flex-col mt-4 -mx-1 px-1">
                    {loading ? (
                        <div className="py-12 text-center text-sm font-bold text-muted-foreground animate-pulse">
                            Đang tải bảng xếp hạng…
                        </div>
                    ) : error ? (
                        <div className="py-8 text-center text-sm font-bold text-destructive">
                            {error}
                        </div>
                    ) : ranked.length === 0 ? (
                        <div className="py-8 text-center text-sm font-medium text-muted-foreground">
                            Chưa có kết quả xếp hạng cho trận này.
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col min-h-0 max-h-[min(52vh,420px)]">
                            <div className="overflow-y-auto overscroll-contain">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="sticky top-0 z-[1] border-b border-white/10 bg-card/95 backdrop-blur-sm">
                                            <th className="text-left py-3 pl-4 pr-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground/80 w-14">
                                                #
                                            </th>
                                            <th className="text-left py-3 px-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground/80">
                                                Người chơi
                                            </th>
                                            <th className="text-right py-3 pl-2 pr-4 font-black uppercase text-[10px] tracking-widest text-muted-foreground/80 w-28">
                                                Điểm
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranked.map((row) => (
                                            <tr
                                                key={row.userId}
                                                className={cn(
                                                    "border-b border-white/5 last:border-b-0 transition-colors",
                                                    row.isSelf &&
                                                        "bg-primary/15 ring-1 ring-inset ring-primary/35"
                                                )}
                                            >
                                                <td
                                                    className={cn(
                                                        "py-3 pl-4 pr-2 align-middle",
                                                        rankAccent(row.rank),
                                                        "font-black tabular-nums text-base"
                                                    )}
                                                >
                                                    {row.rank}
                                                </td>
                                                <td className="py-3 px-2 align-middle min-w-0">
                                                    <div className="font-bold truncate">
                                                        {row.label}
                                                        {row.isSelf ? (
                                                            <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-primary">
                                                                (bạn)
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    {row.isSelf &&
                                                    row.label !== currentUsername ? (
                                                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                                                            @{currentUsername}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="py-3 pl-2 pr-4 text-right align-middle">
                                                    <span className="font-black tabular-nums text-base">
                                                        {row.score ?? 0}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {!loading && !error && ranked.length > 0 ? (
                        <p className="text-[11px] text-muted-foreground font-medium mt-3 px-0.5">
                            Hàng của bạn được tô sáng trong bảng.
                        </p>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
