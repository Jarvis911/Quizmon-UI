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
    ChevronUp,
    ChevronDown
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
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [chartMode, setChartMode] = useState<"line" | "bar">("line");
    const [sortConfig, setSortConfig] = useState<{ key: keyof RecentMatch; direction: 'asc' | 'desc' }>({
        key: 'createdAt',
        direction: 'desc'
    });

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
    }, [period, token, page, limit, fromDate, toDate]);

    const filteredMatches = useMemo(() => {
        if (!stats?.recentMatches) return [];
        const matches = stats.recentMatches.filter(match =>
            match.quizName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return [...matches].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === undefined || bValue === undefined) return 0;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [stats?.recentMatches, searchQuery, sortConfig]);

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

    // Performance Chart Component (Enhanced Manual SVG)
    const PerformanceChart = () => {
        if (!stats.recentMatches || stats.recentMatches.length < 2) return (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5 m-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-muted-foreground opacity-20">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/2496/2496781.png"
                        alt="Stats"
                        className="w-8 h-8 object-contain opacity-40"
                    />
                </div>
                <p className="text-muted-foreground text-sm font-medium tracking-wide">Cần ít nhất 2 trận đấu để hiển thị xu hướng</p>
            </div>
        );
 
        const data = [...stats.recentMatches].reverse();
        const scores = data.map(m => m.score);
        const maxScore = Math.max(...scores, 10);
        const yMax = Math.ceil(maxScore / 10) * 10;
        
        const width = 800;
        const height = 300;
        const paddingLeft = 50;
        const paddingRight = 30;
        const paddingTop = 40;
        const paddingBottom = 50;
        
        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;
 
        const getX = (index: number) => paddingLeft + (index * chartWidth) / (data.length - 1);
        const getY = (score: number) => height - paddingBottom - (score / yMax) * chartHeight;

        const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(" ");
        
        const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

        return (
            <div className="w-full overflow-hidden p-2">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl overflow-visible select-none">
                    {/* Gradients */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
 
                    {/* Y-Axis Grid & Labels */}
                    {yTicks.map((tick, i) => {
                        const y = getY(tick);
                        return (
                            <g key={i}>
                                <line 
                                    x1={paddingLeft} 
                                    y1={y} 
                                    x2={width - paddingRight} 
                                    y2={y} 
                                    stroke="currentColor" 
                                    strokeOpacity={tick === 0 ? "0.15" : "0.05"} 
                                    strokeWidth={tick === 0 ? "2" : "1"}
                                    strokeDasharray={tick === 0 ? "0" : "4"}
                                />
                                <text 
                                    x={paddingLeft - 10} 
                                    y={y + 4} 
                                    textAnchor="end" 
                                    fill="currentColor" 
                                    className="text-[10px] font-black opacity-30 font-mono"
                                >
                                    {Math.round(tick)}
                                </text>
                            </g>
                        );
                    })}

                    {chartMode === "line" ? (
                        <>
                            {/* Area under line */}
                            <path
                                d={`M${paddingLeft},${height - paddingBottom} L${points} L${width - paddingRight},${height - paddingBottom} Z`}
                                fill="url(#areaGradient)"
                                className="transition-all duration-1000"
                            />
 
                            {/* Line */}
                            <polyline
                                points={points}
                                fill="none"
                                stroke="url(#lineGradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-1000"
                            />
 
                            {/* Interactive Scan Line & Tooltip Groups */}
                            {data.map((d, i) => {
                                const x = getX(i);
                                const y = getY(d.score);
                                return (
                                    <g key={i} className="group cursor-default">
                                        {/* Scanner Line */}
                                        <line 
                                            x1={x} y1={paddingTop} 
                                            x2={x} y2={height - paddingBottom} 
                                            stroke="currentColor" 
                                            strokeOpacity="0" 
                                            className="group-hover:stroke-opacity-10 transition-opacity"
                                            strokeWidth="2"
                                        />
                                        
                                        {/* Point */}
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r="6"
                                            fill="#fff"
                                            stroke="#3b82f6"
                                            strokeWidth="3"
                                            className="transition-all duration-300 group-hover:r-10 shadow-lg"
                                        />

                                        {/* Tooltip Card */}
                                        <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <rect 
                                                x={x - 60} y={y < 80 ? y + 20 : y - 70} 
                                                width="120" height="50" 
                                                rx="12" 
                                                className="fill-background/90 backdrop-blur-md stroke-primary/20 shadow-xl"
                                            />
                                            <text x={x} y={y < 80 ? y + 38 : y - 52} fontSize="11" fontWeight="900" textAnchor="middle" fill="currentColor" className="text-foreground">
                                                {d.quizName.length > 15 ? d.quizName.substring(0, 15) + '...' : d.quizName}
                                            </text>
                                            <text x={x} y={y < 80 ? y + 54 : y - 36} fontSize="14" fontWeight="900" textAnchor="middle" fill="#3b82f6">
                                                {d.score} điểm
                                            </text>
                                        </g>

                                        {/* X-Axis Label */}
                                        <text 
                                            x={x} 
                                            y={height - paddingBottom + 20} 
                                            textAnchor="middle" 
                                            className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity fill-muted-foreground uppercase tracking-widest font-mono"
                                        >
                                            {formatDate(d.createdAt).split(" ")[0]}
                                        </text>
                                    </g>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            {/* Bar Chart Rendering */}
                            {data.map((d, i) => {
                                const barWidth = (chartWidth / data.length) * 0.7;
                                const x = paddingLeft + (i * chartWidth) / data.length + (chartWidth / data.length - barWidth) / 2;
                                const barHeight = (d.score / yMax) * chartHeight;
                                const y = height - paddingBottom - barHeight;
                                return (
                                    <g key={i} className="group">
                                        <path
                                            d={`
                                                M ${x},${y + Math.min(8, barHeight)} 
                                                a 8,8 0 0 1 8,-8 
                                                h ${Math.max(0, barWidth - 16)} 
                                                a 8,8 0 0 1 8,8 
                                                v ${Math.max(0, barHeight - 8)} 
                                                h -${barWidth} 
                                                z
                                            `}
                                            fill="#3b82f6"
                                            className="transition-all duration-500 opacity-60 group-hover:opacity-100 cursor-default"
                                        />
                                        
                                        {/* Tooltip Card for Bars */}
                                        <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <rect 
                                                x={x + barWidth/2 - 60} y={y < 80 ? y + 20 : y - 65} 
                                                width="120" height="50" 
                                                rx="12" 
                                                className="fill-background/90 backdrop-blur-md stroke-primary/20 shadow-xl"
                                            />
                                            <text x={x + barWidth/2} y={y < 80 ? y + 38 : y - 47} fontSize="11" fontWeight="900" textAnchor="middle" fill="currentColor">
                                                {d.quizName.length > 15 ? d.quizName.substring(0, 15) + '...' : d.quizName}
                                            </text>
                                            <text x={x + barWidth/2} y={y < 80 ? y + 54 : y - 31} fontSize="14" fontWeight="900" textAnchor="middle" fill="#3b82f6">
                                                {d.score} điểm
                                            </text>
                                        </g>

                                        {/* X-Axis Label */}
                                        <text 
                                            x={x + barWidth / 2} 
                                            y={height - paddingBottom + 20} 
                                            textAnchor="middle" 
                                            className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity fill-muted-foreground uppercase tracking-widest font-mono"
                                        >
                                            {formatDate(d.createdAt).split(" ")[0]}
                                        </text>
                                    </g>
                                );
                            })}
                        </>
                    )}
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

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-8">
                    <TabsList className="bg-card/40 backdrop-blur-md p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-white/10 w-fit flex-wrap">
                        <TabsTrigger value="overview" className="rounded-lg md:rounded-xl px-4 py-2 md:px-8 md:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2 text-xs md:text-sm font-bold">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/4825/4825706.png"
                                alt="Overview"
                                className="w-3 h-3 md:w-4 md:h-4 object-contain"
                            />
                            Tổng Quan
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-lg md:rounded-xl px-4 py-2 md:px-8 md:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2 text-xs md:text-sm font-bold">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/2972/2972415.png"
                                alt="History"
                                className="w-3 h-3 md:w-4 md:h-4 object-contain"
                            />
                            Lịch Sử Đấu
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 mt-0 focus-visible:ring-0">
                        {/* Metrics Grid */}
                        <div className="bg-card/40 backdrop-blur-md border-2 border-white/5 shadow-2xl rounded-[3rem] overflow-hidden transition-all duration-500">
                            {/* Section 1: Metrics Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-white/10 lg:[&>*:nth-child(n+3)]:border-t-0">
                                {/* Match Count */}
                                <div className="p-4 md:p-8 lg:p-10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
                                    <span className="text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center mb-1 md:mb-4">Tổng Trận Đấu</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl md:text-5xl font-black text-foreground drop-shadow-sm">{totalMatches}</span>
                                        <span className="text-[9px] md:text-xs font-bold text-muted-foreground hidden sm:inline">trận</span>
                                    </div>
                                </div>
                                {/* Win Rate */}
                                <div className="p-4 md:p-8 lg:p-10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
                                    <span className="text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center mb-1 md:mb-4">Tỷ Lệ Thắng</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl md:text-5xl font-black text-foreground drop-shadow-sm">{(winRate * 100).toFixed(0)}<span className="text-xl md:text-3xl">%</span></span>
                                    </div>
                                </div>
                                {/* Avg Score */}
                                <div className="p-4 md:p-8 lg:p-10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
                                    <span className="text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center mb-1 md:mb-4">Điểm TB</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl md:text-5xl font-black text-foreground drop-shadow-sm">{averageScore}</span>
                                        <span className="text-[9px] md:text-xs font-bold text-muted-foreground hidden sm:inline">điểm</span>
                                    </div>
                                </div>
                                {/* Total Quizzes */}
                                <div className="p-4 md:p-8 lg:p-10 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
                                    <span className="text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center mb-1 md:mb-4">Quiz T.Gia</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl md:text-5xl font-black text-foreground drop-shadow-sm">{totalQuizzes}</span>
                                        <span className="text-[9px] md:text-xs font-bold text-muted-foreground hidden sm:inline">bộ</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10" />

                            {/* Section 2: Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-10 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                                {/* Performance Trend */}
                                <div className="lg:col-span-7 p-4 md:p-8 lg:p-10">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                                        <div>
                                            <h3 className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3">
                                                <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg md:rounded-xl">
                                                    <img
                                                        src="https://cdn-icons-png.flaticon.com/512/4825/4825706.png"
                                                        alt="Trend"
                                                        className="w-5 h-5 md:w-6 md:h-6 object-contain"
                                                    />
                                                </div>
                                                Xu Hướng Hiệu Suất
                                            </h3>
                                            <p className="text-muted-foreground font-medium mt-1 text-xs md:text-sm">Biến thiên điểm số qua các trận đấu gần nhất</p>
                                        </div>

                                        <div className="flex bg-white/5 p-1 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-sm self-start sm:self-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`rounded-lg md:rounded-xl px-4 md:px-6 h-8 md:h-10 text-xs md:text-sm font-bold transition-all ${chartMode === 'line' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground'}`}
                                                onClick={() => setChartMode('line')}
                                            >
                                                <img
                                                    src="https://cdn-icons-png.flaticon.com/512/4825/4825706.png"
                                                    alt="Line"
                                                    className={`w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 object-contain ${chartMode === 'line' ? '' : 'opacity-50'}`}
                                                />
                                                Đường
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`rounded-lg md:rounded-xl px-4 md:px-6 h-8 md:h-10 text-xs md:text-sm font-bold transition-all ${chartMode === 'bar' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:text-foreground'}`}
                                                onClick={() => setChartMode('bar')}
                                            >
                                                <img
                                                    src="https://cdn-icons-png.flaticon.com/512/2496/2496781.png"
                                                    alt="Bar"
                                                    className={`w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2 object-contain ${chartMode === 'bar' ? '' : 'opacity-50'}`}
                                                />
                                                Cột
                                            </Button>
                                        </div>
                                    </div>
                                    <PerformanceChart />
                                </div>

                                {/* Rank Distribution */}
                                <div className="lg:col-span-3 p-4 md:p-8 lg:p-10 bg-white/2">
                                    <div className="mb-6 md:mb-10">
                                        <h3 className="text-xl md:text-2xl font-black flex items-center gap-2 md:gap-3">
                                            <div className="p-1.5 md:p-2 bg-yellow-500/10 rounded-lg md:rounded-xl">
                                                <img
                                                    src="https://cdn-icons-png.flaticon.com/512/861/861506.png"
                                                    alt="Achievement"
                                                    className="w-5 h-5 md:w-6 md:h-6 object-contain"
                                                />
                                            </div>
                                            Thành Tích
                                        </h3>
                                        <p className="text-muted-foreground font-medium mt-1 text-xs md:text-sm">Phân bố thứ hạng vinh quang</p>
                                    </div>

                                    <div className="space-y-8">
                                        {[1, 2, 3].map((rank) => {
                                            const count = getRankCount(rank.toString());
                                            const percentage = totalMatches > 0 ? (count / totalMatches) * 100 : 0;
                                            const colors = rank === 1 ? "bg-yellow-400" : rank === 2 ? "bg-slate-400" : "bg-orange-500";
                                            const glow = rank === 1 ? "shadow-yellow-400/20" : rank === 2 ? "shadow-slate-400/20" : "shadow-orange-500/20";
                                            
                                            return (
                                                <div key={rank} className="group cursor-default">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${colors}/10 flex items-center justify-center font-black text-sm md:text-xl shadow-inner ${colors.replace("bg-", "text-")} transition-transform group-hover:scale-110 duration-500`}>
                                                                {rank}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-sm md:text-lg">Hạng {rank === 1 ? "Quán Quân" : rank === 2 ? "Á Quân 1" : "Á Quân 2"}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-black text-sm md:text-xl text-foreground">{count} trận</div>
                                                            <div className="text-[9px] md:text-[10px] text-muted-foreground/60 font-mono tracking-wider">{percentage.toFixed(1)}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                                        <div
                                                            className={`h-full ${colors} ${glow} shadow-lg rounded-full transition-all duration-1000 group-hover:opacity-90`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-8 mt-0 focus-visible:ring-0">
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
                                                <th className="p-3 md:p-6 text-[10px] md:text-xs font-black uppercase text-muted-foreground/60 tracking-wider font-mono text-center w-20 md:w-32">Tác vụ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredMatches.map((match: RecentMatch) => (
                                                <tr key={match.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-all duration-300 group">
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
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadExcel(match.id);
                                                            }}
                                                        >
                                                            <FileSpreadsheet className="w-4 h-4 md:w-6 md:h-6" />
                                                        </Button>
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
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default UserStats;
