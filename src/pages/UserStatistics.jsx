import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import endpoints from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

const UserStats = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalQuizzes: 0,
    rankCounts: {},
    winRate: 0,
    recentMatches: [],
  });
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async (period) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = period === "all"
        ? `${endpoints.user_stats}`
        : `${endpoints.user_stats}?period=${period}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: token },
      });
      
      setStats(res.data);
    } catch (err) {
      console.error(`[UserStats] Error fetching stats for ${period}:`, err);
      setError("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period);
  }, [period, token]);

  const getRankCount = (rank) => {
    try {
      return (stats?.rankCounts && stats.rankCounts[rank]) || 0;
    } catch (error) {
      console.error(`Error getting rank count for ${rank}:`, error);
      return 0;
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Badge variant="default" className="bg-yellow-400 text-black">Top 1</Badge>;
    if (rank === 2) return <Badge variant="secondary" className="bg-gray-400 text-white">Top 2</Badge>;
    if (rank === 3) return <Badge variant="outline" className="border-amber-400 text-amber-600">Top 3</Badge>;
    return <Badge variant="outline">{`#${rank}`}</Badge>;
  };

  const formatDate = (dateString) => {
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

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-600">Không có dữ liệu thống kê</p>
      </div>
    );
  }

  const { totalMatches, totalQuizzes, rankCounts, winRate, recentMatches } = stats;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-3 text-gray-800">
              <FaHistory className="text-primary" />
              Thống Kê Lịch Sử Đấu Của {user.username}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Period Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
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
          <Card className="bg-white/95 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tổng Số Trận Đấu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{totalMatches}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tỷ Lệ Thắng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{(winRate * 100).toFixed(1)}%</p>
              <Progress value={winRate * 100} className="mt-2 h-2" indicatorClassName="bg-green-600" />
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Số Quiz Đã Chơi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{totalQuizzes}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/95 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Xếp Hạng Nổi Bật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Top 1: {getRankCount("1")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Medal className="w-4 h-4 text-gray-300" />
                <span>Top 2: {getRankCount("2")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Medal className="w-4 h-4 text-amber-600" />
                <span>Top 3: {getRankCount("3")}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Matches Table */}
        <Card className="bg-white/95 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FaHistory className="w-6 h-6 text-primary" />
              Trận Đấu Gần Đây ({recentMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có trận đấu gần đây</p>
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
                    {recentMatches.map((match) => (
                      <TableRow key={match.id} className="hover:bg-gray-50 border-b">
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {getRankBadge(match.rank)}
                            
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 truncate">{match.quizName}</span>
                            <span className="text-sm text-gray-500">ID: {match.quizId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-lg text-blue-600">
                          {match.score}
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-600">
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
          <Card className="bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Phân Bố Xếp Hạng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((rank) => {
                  const count = getRankCount(rank.toString());
                  const percentage = totalMatches > 0 ? (count / totalMatches) * 100 : 0;
                  return (
                    <div key={rank} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[80px]">
                        {getRankBadge(rank)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Top {rank}: {count} trận</span>
                          <span className="text-sm text-gray-500">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-3" 
                          indicatorClassName={`bg-${
                            rank === 1 ? "yellow-500" : rank === 2 ? "gray-400" : "amber-500"
                          }`} 
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

// Helper function to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default UserStats;