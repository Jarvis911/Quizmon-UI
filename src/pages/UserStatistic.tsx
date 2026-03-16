import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/client";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserStats } from "../types";

const UserStatistic = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [period, setPeriod] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (currentPeriod: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = currentPeriod === "all"
        ? `${endpoints.user_stats}`
        : `${endpoints.user_stats}?period=${currentPeriod}`;
      
      const res = await apiClient.get<UserStats>(url);
      setStats(res.data);
    } catch (err: any) {
      console.error(`[UserStats] Error fetching stats for ${currentPeriod}:`, err);
      setError("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchStats(period);
    }
  }, [period, token, fetchStats]);

  const getRankCount = (rank: string) => {
    if (!stats?.rankCounts) return 0;
    return stats.rankCounts[rank] || 0;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge variant="default" className="bg-yellow-400 text-black">Top 1</Badge>;
    if (rank === 2) return <Badge variant="secondary" className="bg-gray-400 text-white">Top 2</Badge>;
    if (rank === 3) return <Badge variant="outline" className="border-amber-400 text-amber-600">Top 3</Badge>;
    return <Badge variant="outline">{`#${rank}`}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchStats(period)}>Thử lại</Button>
        </div>
      </div>
    );
  }

  if (!stats || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-600">Không có dữ liệu thống kê</p>
      </div>
    );
  }

  const { totalMatches, totalQuizzes, rankCounts, winRate, recentMatches } = stats;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Card className="bg-white/95 shadow-xl border-none">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3 text-gray-800">
              <FaHistory className="text-primary" />
              Thống Kê Lịch Sử Đấu Của {user.username}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <Clock className="w-4 h-4" />
            <span>Thống kê theo thời gian:</span>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px] bg-white shadow-sm border-gray-200">
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
          <Card className="bg-white shadow-sm border-gray-100 transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-gray-400">Tổng Số Trận Đấu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">{totalMatches}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-gray-100 transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-gray-400">Tỷ Lệ Thắng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-600">{(winRate * 100).toFixed(1)}%</p>
              <Progress value={winRate * 100} className="mt-4 h-2 bg-gray-100" />
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-gray-100 transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-gray-400">Số Quiz Đã Chơi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-gray-900">{totalQuizzes}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-gray-100 transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-gray-400">Xếp Hạng Nổi Bật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Top 1: <span className="text-gray-900 font-bold">{getRankCount("1")}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Medal className="w-4 h-4 text-gray-300" />
                <span>Top 2: <span className="text-gray-900 font-bold">{getRankCount("2")}</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Medal className="w-4 h-4 text-amber-600" />
                <span>Top 3: <span className="text-gray-900 font-bold">{getRankCount("3")}</span></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Matches Table */}
        <Card className="bg-white shadow-lg border-none overflow-hidden">
          <CardHeader className="border-b border-gray-50 pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FaHistory className="w-5 h-5 text-primary" />
              Trận Đấu Gần Đây ({recentMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentMatches.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Chưa có trận đấu gần đây</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-gray-100">
                      <TableHead className="w-24 text-center py-4 font-bold text-gray-500 uppercase text-[10px] tracking-wider">Xếp Hạng</TableHead>
                      <TableHead className="py-4 font-bold text-gray-500 uppercase text-[10px] tracking-wider">Quiz</TableHead>
                      <TableHead className="w-32 text-center py-4 font-bold text-gray-500 uppercase text-[10px] tracking-wider">Điểm Số</TableHead>
                      <TableHead className="w-48 text-center py-4 font-bold text-gray-500 uppercase text-[10px] tracking-wider">Thời Gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMatches.map((match) => (
                      <TableRow key={match.id} className="hover:bg-gray-50 transition-colors border-gray-50">
                        <TableCell className="text-center py-4">
                          <div className="flex flex-col items-center">
                            {getRankBadge(match.rank)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{match.quizName}</span>
                            <span className="text-xs text-gray-400 font-medium mt-0.5">ID: {match.quizId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="font-black text-lg text-indigo-600">
                            {match.score}
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-4">
                          <span className="text-sm font-medium text-gray-500">
                            {formatDate(match.createdAt)}
                          </span>
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
          <Card className="bg-white shadow-lg border-none">
            <CardHeader className="border-b border-gray-50 pb-4">
              <CardTitle className="text-xl font-bold">Phân Bố Xếp Hạng</CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              <div className="space-y-6">
                {[1, 2, 3].map((rank) => {
                  const count = getRankCount(rank.toString());
                  const percentage = totalMatches > 0 ? (count / totalMatches) * 100 : 0;
                  const colors = {
                    1: "bg-yellow-400",
                    2: "bg-gray-300",
                    3: "bg-amber-600"
                  };
                  
                  return (
                    <div key={rank} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[100px] shrink-0">
                        {getRankBadge(rank)}
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700">Top {rank}</span>
                            <span className="text-sm font-black text-gray-900">{count} trận</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2.5 bg-gray-50"
                          indicatorClassName={colors[rank as 1|2|3]}
                        />
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

export default UserStatistic;
