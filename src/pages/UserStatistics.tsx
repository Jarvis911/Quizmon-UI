import { useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import endpoints from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Clock, Calendar } from "lucide-react";
import { FaHistory } from "react-icons/fa";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

    const fetchStats = async (selectedPeriod: string) => {
        try {
            setLoading(true);
            setError(null);

            const url =
                selectedPeriod === "all"
                    ? `${endpoints.user_stats}`
                    : `${endpoints.user_stats}?period=${selectedPeriod}`;

            const res = await axios.get<UserStatsType>(url, {
                headers: { Authorization: token },
            });

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

    const getRankCount = (rank: string): number => {
        try {
            return stats?.rankCounts?.[rank] || 0;
        } catch {
            return 0;
        }
    };

    const getRankBadge = (rank: number): ReactNode => {
        if (rank === 1) return <Badge className="bg-yellow-400 text-black border-none">Top 1</Badge>;
        if (rank === 2) return <Badge variant="secondary" className="bg-slate-300 text-slate-900 border-none">Top 2</Badge>;
        if (rank === 3) return <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10">Top 3</Badge>;
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">{`#${rank}`}</Badge>;
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Đang tải thống kê...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-4 font-bold">{error}</p>
                    <Button onClick={() => fetchStats(period)}>Thử lại</Button>
                </div>
            </div>
        );
    }

    if (!stats || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Không có dữ liệu thống kê</p>
            </div>
        );
    }

    const { totalMatches, totalQuizzes, rankCounts, winRate, recentMatches } = stats;

    return (
        <div className="min-h-screen p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <Card className="bg-card/90 backdrop-blur-md shadow-xl border-white/10">
                    <CardHeader>
                        <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3 text-foreground">
                            <FaHistory className="text-primary" />
                            Thống Kê Lịch Sử Đấu Của {user.username}
                        </CardTitle>
                    </CardHeader>
                </Card>

                {/* Period Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                        <Clock className="w-4 h-4" />
                        <span>Thống kê theo thời gian:</span>
                    </div>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Chọn khoảng thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Tuần gần nhất</SelectItem>
                            <SelectItem value="month">Tháng gần nhất</SelectItem>
                            <SelectItem value="all">Tất cả thời gian</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-card/90 backdrop-blur-md shadow-md border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase opacity-80">Tổng Số Trận Đấu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{totalMatches}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/90 backdrop-blur-md shadow-md border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase opacity-80">Tỷ Lệ Thắng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-green-400">{(winRate * 100).toFixed(1)}%</p>
                            <Progress value={winRate * 100} className="mt-2 h-2 bg-white/10" />
                        </CardContent>
                    </Card>

                    <Card className="bg-card/90 backdrop-blur-md shadow-md border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase opacity-80">Số Quiz Đã Chơi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-foreground">{totalQuizzes}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/90 backdrop-blur-md shadow-md border-white/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase opacity-80">Xếp Hạng Nổi Bật</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <span>Top 1: {getRankCount("1")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                                <Medal className="w-4 h-4 text-slate-400" />
                                <span>Top 2: {getRankCount("2")}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                                <Medal className="w-4 h-4 text-amber-500" />
                                <span>Top 3: {getRankCount("3")}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Matches Table */}
                <Card className="bg-card/90 backdrop-blur-md shadow-xl border-white/10">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                            <FaHistory className="w-6 h-6 text-primary" />
                            Trận Đấu Gần Đây ({recentMatches.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentMatches.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">Chưa có trận đấu gần đây</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b-2 border-gray-200">
                                            <TableHead className="w-16 text-center">Xếp Hạng</TableHead>
                                            <TableHead className="w-32">Quiz</TableHead>
                                            <TableHead className="w-24 text-center">Điểm Số</TableHead>
                                            <TableHead className="w-32 text-center">Thời Gian</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentMatches.map((match: RecentMatch) => (
                                            <TableRow key={match.id} className="hover:bg-white/5 border-b border-foreground/5">
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {getRankBadge(match.rank)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground truncate">{match.quizName}</span>
                                                        <span className="text-xs text-muted-foreground/70 font-mono">ID: {match.quizId}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-black text-lg text-primary">
                                                    {match.score}
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-foreground/80 font-medium">
                                                    {formatDate(match.createdAt)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rank Distribution */}
                {Object.keys(rankCounts || {}).length > 0 && (
                    <Card className="bg-card/90 backdrop-blur-md shadow-xl border-white/10">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-foreground">Phân Bố Xếp Hạng</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map((rank) => {
                                    const count = getRankCount(rank.toString());
                                    const percentage = totalMatches > 0 ? (count / totalMatches) * 100 : 0;
                                    return (
                                        <div key={rank} className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 min-w-[100px]">
                                                {getRankBadge(rank)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1 text-sm">
                                                    <span className="font-bold text-foreground">Top {rank}: {count} trận</span>
                                                    <span className="text-muted-foreground/70">({percentage.toFixed(1)}%)</span>
                                                </div>
                                                <Progress value={percentage} className="h-3 bg-white/10" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default UserStats;
