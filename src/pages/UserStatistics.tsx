import { useState, useEffect, ReactNode, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Clock,
    Calendar,
    Search,
    FileSpreadsheet,
    Target,
    ArrowUpDown,
    Trophy,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { UserStats as UserStatsType, RecentMatch } from "@/types";
import { MatchHistoryCompareDialog } from "@/components/statistics/MatchHistoryCompareDialog";

const UserStats = () => {
    const { user, token } = useAuth();
    const [stats, setStats] = useState<UserStatsType>({
        totalMatches: 0,
        totalQuizzes: 0,
        rankCounts: {},
        winRate: 0,
        recentMatches: [],
    });
    const [period, setPeriod] = useState("all");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof RecentMatch; direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    });
    const [compareMatch, setCompareMatch] = useState<RecentMatch | null>(null);

    const handleSort = (key: keyof RecentMatch) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const fetchStats = async (selectedPeriod: string) => {
        try {
            setLoading(true);
            setError(null);

            const params: Record<string, string | number | undefined> = {
                page,
                limit,
            };
            if (selectedPeriod !== "all") params.period = selectedPeriod;
            if (fromDate) params.from = fromDate;
            if (toDate) params.to = toDate;

            const res = await apiClient.get<UserStatsType>(endpoints.user_stats, { params });
            const raw = res.data;
            setStats({
                ...raw,
                recentMatches: (raw.recentMatches ?? []).map((row) => {
                    const ext = row as RecentMatch & { matchId?: number; id?: number };
                    const matchId = Number(ext.matchId ?? ext.id);
                    return {
                        ...ext,
                        matchId,
                    };
                }),
            });
        } catch (err) {
            console.error(`[UserStats] Error fetching stats for ${selectedPeriod}:`, err);
            setError("Không thể tải dữ liệu thống kê");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(period);
    }, [period, token, page, limit, fromDate, toDate]);

    const filteredMatches = useMemo(() => {
        if (!stats?.recentMatches) return [];
        const matches = stats.recentMatches.filter(match =>
            match.quizName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return [...matches].sort((a, b) => {
            if (sortConfig.key === "rank") {
                const ar = a.rank;
                const br = b.rank;
                if (ar == null && br == null) return 0;
                if (ar == null) return sortConfig.direction === "asc" ? 1 : -1;
                if (br == null) return sortConfig.direction === "asc" ? -1 : 1;
                if (ar < br) return sortConfig.direction === "asc" ? -1 : 1;
                if (ar > br) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            }
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === undefined || bValue === undefined) return 0;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [stats?.recentMatches, searchQuery, sortConfig]);

    const getRankBadge = (rank: number | null): ReactNode => {
        if (rank == null) {
            return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">Hạng —</Badge>;
        }
        if (rank === 1) return <Badge className="bg-yellow-400 text-black border-none shadow-sm shadow-yellow-400/50">Quán Quân</Badge>;
        if (rank === 2) return <Badge variant="secondary" className="bg-slate-300 text-slate-900 border-none shadow-sm shadow-slate-400/50">Á Quân 1</Badge>;
        if (rank === 3) return <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/30">Á Quân 2</Badge>;
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">{`Hạng #${rank}`}</Badge>;
    };

    const formatDate = (dateString: string): string => {
        try {
            return new Date(dateString).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "N/A";
        }
    };

    const handleDownloadExcel = async (matchId: number | string) => {
        try {
            const res = await apiClient.get(endpoints.report_excel(Number(matchId)), {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            const contentDisposition = (res.headers?.["content-disposition"] || res.headers?.["Content-Disposition"]) as
                | string
                | undefined;
            const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
            const filename = filenameMatch?.[1] ?? `match_${matchId}_report.xlsx`;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download Excel report", err);
        }
    };

    if (loading && !stats.totalMatches) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <div className="text-center relative">
                    <div className="w-24 h-24 border-8 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin-slow"></div>
                    </div>
                    <p className="mt-8 text-lg font-medium animate-pulse text-foreground/70">Đang chuẩn bị báo cáo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
                    <CardHeader className="text-center">
                        <CardTitle className="text-destructive font-bold">Lỗi Kết Nối</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button variant="outline" onClick={() => fetchStats(period)}>Thử lại ngay</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-64px)] p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Dashboard Header - Match Classroom style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-2 md:gap-3">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2972/2972415.png"
                                alt="History"
                                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                            />
                            Lịch sử đấu của tôi
                        </h1>
                        <p className="text-muted-foreground font-bold mt-1 md:mt-2 opacity-80 uppercase tracking-widest text-[10px] md:text-xs">
                            Theo dõi tiến trình, thứ hạng và hiệu quả học tập của bạn.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 bg-card/40 backdrop-blur-md p-1 md:p-2 rounded-xl md:rounded-2xl border border-white/10 shadow-lg">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground ml-2" />
                        <Select value={period} onValueChange={(v) => { setPeriod(v); setPage(1); }}>
                            <SelectTrigger className="w-[140px] md:w-[180px] border-none bg-transparent shadow-none focus:ring-0 font-bold text-xs md:text-sm">
                                <SelectValue placeholder="Khoảng thời gian" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-white/20 backdrop-blur-lg">
                                <SelectItem value="week" className="rounded-lg font-bold">7 Ngày Qua</SelectItem>
                                <SelectItem value="month" className="rounded-lg font-bold">30 Ngày Qua</SelectItem>
                                <SelectItem value="all" className="rounded-lg font-bold">Tất Cả Thời Gian</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-8">
                        {/* Filters + pagination */}
                        <div className="flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex flex-wrap items-center gap-2 bg-card/40 backdrop-blur-md border-2 border-white/5 rounded-2xl px-4 py-3">
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground/60 font-mono whitespace-nowrap">
                                        Từ
                                    </span>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                                        className="h-9 border-white/10 bg-white/5 font-bold"
                                    />
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground/60 font-mono whitespace-nowrap">
                                        Đến
                                    </span>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                                        className="h-9 border-white/10 bg-white/5 font-bold"
                                    />
                                    <Button
                                        variant="outline"
                                        className="h-9 font-bold"
                                        onClick={() => { setFromDate(""); setToDate(""); setPage(1); }}
                                    >
                                        Xóa lọc
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
                                <div className="flex items-center gap-2 bg-card/40 backdrop-blur-md border-2 border-white/5 rounded-2xl px-4 py-3">
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground/60 font-mono">
                                        Mỗi trang
                                    </span>
                                    <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                                        <SelectTrigger className="w-[110px] border-none bg-transparent shadow-none focus:ring-0 font-bold text-xs md:text-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/20 backdrop-blur-lg">
                                            {[10, 20, 50, 100].map(n => (
                                                <SelectItem key={n} value={String(n)} className="rounded-lg font-bold">
                                                    {n}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="text-xs md:text-sm font-bold text-muted-foreground">
                                    {stats.pagination?.total !== undefined ? `Tổng: ${stats.pagination.total}` : null}
                                </div>
                            </div>
                        </div>

                        {/* Search Bar - Classroom style */}
                        <div className="relative group">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/11552/11552108.png"
                                alt="Search"
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 object-contain opacity-50 group-focus-within:opacity-100 transition-opacity"
                            />
                            <Input
                                placeholder="Tìm kiếm trận đấu theo tên quiz..."
                                className="pl-12 h-14 bg-card/40 backdrop-blur-md border-2 border-white/5 rounded-2xl text-lg font-medium shadow-inner focus:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {filteredMatches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-card/20 backdrop-blur-sm rounded-[3rem] border-4 border-dashed border-white/10">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2 opacity-20">
                                    <Calendar size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-foreground/50">{searchQuery ? "Không tìm thấy trận đấu nào" : "Chưa có lịch sử đấu"}</h2>
                                <p className="text-muted-foreground max-w-md mx-auto font-medium">
                                    {searchQuery ? "Hãy thử tìm kiếm với từ khóa khác." : "Bạn chưa tham gia trận đấu nào. Hãy bắt đầu thi đấu để xem kết quả tại đây!"}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-card/40 backdrop-blur-md border-2 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse min-w-[600px] md:min-w-[800px]">
                                        <thead>
                                            <tr className="border-b border-white/10 bg-white/5">
                                                <th 
                                                    className="p-3 md:p-6 text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center w-24 md:w-40 cursor-pointer hover:bg-white/5 transition-colors"
                                                    onClick={() => handleSort('rank')}
                                                >
                                                    <div className="flex items-center justify-center gap-1 md:gap-2">
                                                        Thứ hạng
                                                        <ArrowUpDown size={10} className={sortConfig.key === 'rank' ? "text-primary" : "opacity-30"} />
                                                    </div>
                                                </th>
                                                <th 
                                                    className="p-3 md:p-6 text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-left cursor-pointer hover:bg-white/5 transition-colors"
                                                    onClick={() => handleSort('quizName')}
                                                >
                                                    <div className="flex items-center gap-1 md:gap-2">
                                                        Bộ Quiz
                                                        <ArrowUpDown size={10} className={sortConfig.key === 'quizName' ? "text-primary" : "opacity-30"} />
                                                    </div>
                                                </th>
                                                <th 
                                                    className="p-3 md:p-6 text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center w-24 md:w-40 cursor-pointer hover:bg-white/5 transition-colors"
                                                    onClick={() => handleSort('score')}
                                                >
                                                    <div className="flex items-center justify-center gap-1 md:gap-2">
                                                        Điểm số
                                                        <ArrowUpDown size={10} className={sortConfig.key === 'score' ? "text-primary" : "opacity-30"} />
                                                    </div>
                                                </th>
                                                <th 
                                                    className="p-3 md:p-6 text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-left w-36 md:w-56 cursor-pointer hover:bg-white/5 transition-colors"
                                                    onClick={() => handleSort('createdAt')}
                                                >
                                                    <div className="flex items-center gap-1 md:gap-2">
                                                        Thời gian
                                                        <ArrowUpDown size={10} className={sortConfig.key === 'createdAt' ? "text-primary" : "opacity-30"} />
                                                    </div>
                                                </th>
                                                <th className="p-3 md:p-6 text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center w-24 md:w-40">Tác vụ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMatches.map((match: RecentMatch) => (
                                                <tr key={match.matchId} className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-all duration-300 group">
                                                    <td className="p-3 md:p-6 text-center">
                                                        {getRankBadge(match.rank)}
                                                    </td>
                                                    <td className="p-3 md:p-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm md:text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 md:line-clamp-1">{match.quizName}</span>
                                                            <div className="flex items-center gap-1 md:gap-1.5 opacity-40">
                                                                <Target className="w-2 h-2 md:w-3 md:h-3" />
                                                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest leading-none">ID: {match.quizId}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 md:p-6 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-lg md:text-2xl font-black text-foreground group-hover:text-primary group-hover:scale-110 transition-all">{match.score}</span>
                                                            <span className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground/60">Điểm</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 md:p-6">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5 md:gap-2 text-foreground font-bold text-xs md:text-sm">
                                                                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" />
                                                                {formatDate(match.createdAt).split(" ")[1]}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground/60 font-mono text-[9px] md:text-[10px] mt-0.5 md:mt-1">
                                                                <Calendar size={10} className="md:w-3 md:h-3 opacity-50" />
                                                                {formatDate(match.createdAt).split(" ")[0]}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 md:p-6 text-center">
                                                        <div className="flex items-center justify-center gap-1 md:gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Xem bảng xếp hạng trận"
                                                                className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 group-hover:bg-amber-500 group-hover:text-amber-950 transition-all duration-300 shadow-sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCompareMatch(match);
                                                                }}
                                                            >
                                                                <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Tải Excel"
                                                                className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownloadExcel(match.matchId);
                                                                }}
                                                            >
                                                                <FileSpreadsheet className="w-4 h-4 md:w-6 md:h-6" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-white/10 bg-white/3">
                                    <div className="text-xs md:text-sm font-bold text-muted-foreground">
                                        Trang {stats.pagination?.page ?? page} / {stats.pagination?.totalPages ?? 1}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            className="font-bold"
                                            disabled={(stats.pagination?.page ?? page) <= 1 || loading}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        >
                                            Trước
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="font-bold"
                                            disabled={(stats.pagination?.page ?? page) >= (stats.pagination?.totalPages ?? 1) || loading}
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            Sau
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            <MatchHistoryCompareDialog
                open={compareMatch !== null}
                onOpenChange={(open) => {
                    if (!open) setCompareMatch(null);
                }}
                matchRow={compareMatch}
                currentUserId={user?.id ?? 0}
                currentUsername={user?.username ?? "Bạn"}
            />
        </div>
    );
};

export default UserStats;
