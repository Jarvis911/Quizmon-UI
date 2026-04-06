import { useState, useEffect, ReactNode, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Trophy,
    Medal,
    Clock,
    Calendar,
    Search,
    TrendingUp,
    FileSpreadsheet,
    ArrowUpRight,
    Target
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import type { UserStats as UserStatsType, RecentMatch } from "@/types";

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("overview");

    const fetchStats = async (selectedPeriod: string) => {
        try {
            setLoading(true);
            setError(null);

            const url =
                selectedPeriod === "all"
                    ? `${endpoints.user_stats}`
                    : `${endpoints.user_stats}?period=${selectedPeriod}`;

            const res = await apiClient.get<UserStatsType>(url);
            setStats(res.data);
        } catch (err) {
            console.error(`[UserStats] Error fetching stats for ${selectedPeriod}:`, err);
            setError("Không thể tải dữ liệu thống kê");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(period);
    }, [period, token]);

    const filteredMatches = useMemo(() => {
        if (!stats?.recentMatches) return [];
        return stats.recentMatches.filter(match =>
            match.quizName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stats?.recentMatches, searchQuery]);

    const getRankCount = (rank: string): number => {
        try {
            return stats?.rankCounts?.[rank] || 0;
        } catch {
            return 0;
        }
    };

    const getRankBadge = (rank: number): ReactNode => {
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

    const handleDownloadExcel = (matchId: number | string) => {
        const url = endpoints.report_excel(Number(matchId));
        window.open(url, "_blank");
    };

    // Performance Chart Component (Inline SVG)
    const PerformanceChart = () => {
        if (!stats.recentMatches || stats.recentMatches.length < 2) return (
            <div className="h-48 flex items-center justify-center border border-dashed rounded-lg bg-white/5">
                <p className="text-muted-foreground text-sm">Cần ít nhất 2 trận đấu để hiển thị xu hướng</p>
            </div>
        );

        const data = [...stats.recentMatches].reverse().map(m => m.score);
        const maxScore = Math.max(...data, 100);
        const width = 800;
        const height = 200;
        const padding = 40;

        const points = data.map((d, i) => {
            const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
            const y = height - padding - (d / maxScore) * (height - 2 * padding);
            return `${x},${y}`;
        }).join(" ");

        return (
            <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-lg">
                    {/* Gradients */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.1" />
                    <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" strokeOpacity="0.05" />

                    {/* Area under line */}
                    <path
                        d={`M${padding},${height - padding} L${points} L${width - padding},${height - padding} Z`}
                        fill="url(#areaGradient)"
                    />

                    {/* Line */}
                    <polyline
                        points={points}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {data.map((d, i) => {
                        const x = padding + (i * (width - 2 * padding)) / (data.length - 1);
                        const y = height - padding - (d / maxScore) * (height - 2 * padding);
                        return (
                            <g key={i} className="group cursor-help">
                                <circle
                                    cx={x}
                                    cy={y}
                                    r="6"
                                    fill="#fff"
                                    stroke="#a855f7"
                                    strokeWidth="3"
                                    className="transition-all duration-300 group-hover:r-8"
                                />
                                <text x={x} y={y - 12} fontSize="10" fontWeight="bold" textAnchor="middle" fill="#a855f7" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
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

    const { totalMatches, totalQuizzes, winRate, recentMatches } = stats;
    const averageScore = recentMatches.length > 0
        ? Math.round(recentMatches.reduce((acc, m) => acc + m.score, 0) / recentMatches.length)
        : 0;

    return (
        <div className="min-h-[calc(100vh-64px)] p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Dashboard Header - Match Classroom style */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2972/2972415.png"
                                alt="History"
                                className="w-10 h-10 object-contain"
                            />
                            Lịch sử đấu của tôi
                        </h1>
                        <p className="text-muted-foreground font-bold mt-2 opacity-80 uppercase tracking-widest text-xs">
                            Theo dõi tiến trình, thứ hạng và hiệu quả học tập của bạn.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg">
                        <Calendar className="w-5 h-5 text-muted-foreground ml-2" />
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px] border-none bg-transparent shadow-none focus:ring-0 font-bold">
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <TabsList className="bg-card/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 w-fit">
                        <TabsTrigger value="overview" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Tổng Quan
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2">
                            <img 
                                src="https://cdn-icons-png.flaticon.com/512/2972/2972415.png" 
                                alt="History" 
                                className="w-4 h-4 object-contain" 
                            />
                            Lịch Sử Đấu
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 mt-0 focus-visible:ring-0">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { 
                                    label: "Tổng Trận Đấu", 
                                    value: totalMatches, 
                                    icon: () => <img 
                                        src="https://cdn-icons-png.flaticon.com/512/2972/2972415.png" 
                                        alt="Total Matches" 
                                        className="w-4 h-4 object-contain" 
                                    />, 
                                    color: "text-blue-500", 
                                    bg: "bg-blue-500/10", 
                                    suffix: "trận" 
                                },
                                { label: "Tỷ Lệ Thắng", value: `${(winRate * 100).toFixed(1)}%`, icon: Target, color: "text-green-500", bg: "bg-green-500/10", progress: winRate * 100 },
                                { label: "Điểm Trung Bình", value: averageScore, icon: ArrowUpRight, color: "text-purple-500", bg: "bg-purple-500/10", suffix: "điểm" },
                                { label: "Quiz Tham Gia", value: totalQuizzes, icon: Medal, color: "text-orange-500", bg: "bg-orange-500/10", suffix: "bộ" },
                            ].map((item, idx) => (
                                <Card key={idx} className="bg-card/40 backdrop-blur-md border-2 border-white/5 shadow-xl rounded-[2.5rem] overflow-hidden hover:scale-[1.02] transition-transform duration-500">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono">{item.label}</span>
                                            <div className={`p-2 rounded-xl ${item.bg}`}>
                                                <item.icon className={`w-4 h-4 ${item.color}`} />
                                            </div>
                                        </div>
                                    </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-foreground">{item.value}</span>
                                        {item.suffix && <span className="text-xs font-bold text-muted-foreground">{item.suffix}</span>}
                                    </div>
                                    {item.progress !== undefined && (
                                        <div className="mt-4 space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                                <span>Chi số hiệu quả</span>
                                                <span>{item.progress.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={item.progress} className="h-2 bg-slate-100 dark:bg-white/5" />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Performance Trend */}
                            <Card className="lg:col-span-2 bg-card/40 backdrop-blur-md border-2 border-white/5 shadow-xl rounded-[2.5rem]">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-primary" />
                                            Biểu Đồ Xu Hướng Hiệu Suất
                                        </CardTitle>
                                        <CardDescription>Biến thiên điểm số qua các trận đấu gần nhất</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <PerformanceChart />
                                </CardContent>
                            </Card>

                            {/* Rank Distribution */}
                            <Card className="bg-card/40 backdrop-blur-md border-2 border-white/5 shadow-xl rounded-[2.5rem]">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-yellow-500" />
                                        Các Thành Tích Cao
                                    </CardTitle>
                                    <CardDescription>Phân bố các thứ hạng bục vinh quang</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {[1, 2, 3].map((rank) => {
                                        const count = getRankCount(rank.toString());
                                        const percentage = totalMatches > 0 ? (count / totalMatches) * 100 : 0;
                                        const colors = rank === 1 ? "bg-yellow-400" : rank === 2 ? "bg-slate-400" : "bg-orange-500";
                                        return (
                                            <div key={rank} className="group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl ${colors}/20 flex items-center justify-center font-black text-lg ${colors.replace("bg-", "text-")}`}>
                                                            {rank}
                                                        </div>
                                                        <div className="font-bold">Hạng {rank === 1 ? "Quán Quân" : rank === 2 ? "Á Quân 1" : "Á Quân 2"}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-black text-foreground">{count} trận</div>
                                                        <div className="text-[10px] text-muted-foreground/70 font-mono tracking-tighter">{percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                                <div className="h-6 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1">
                                                    <div
                                                        className={`h-full ${colors} rounded-full transition-all duration-1000 group-hover:opacity-80`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-8 mt-0 focus-visible:ring-0">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredMatches.map((match: RecentMatch) => (
                                    <div
                                        key={match.id}
                                        className="bg-card/40 backdrop-blur-md group rounded-[2.5rem] p-8 shadow-lg border-2 border-white/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="bg-primary text-primary-foreground w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transform group-hover:rotate-3 transition-transform">
                                                {match.quizName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                {getRankBadge(match.rank)}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{match.quizName}</h3>
                                        <div className="flex items-center gap-1.5 mb-6 opacity-60">
                                            <Target className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">ID: {match.quizId}</span>
                                        </div>

                                        <div className="mt-auto space-y-4">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">{match.score}</span>
                                                <span className="text-[10px] font-black uppercase text-muted-foreground">Điểm</span>
                                            </div>

                                            <div className="flex justify-between items-center border-t border-white/5 pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-foreground/80">{formatDate(match.createdAt).split(" ")[1]}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 font-mono">{formatDate(match.createdAt).split(" ")[0]}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadExcel(match.id);
                                                    }}
                                                >
                                                    <FileSpreadsheet className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default UserStats;
