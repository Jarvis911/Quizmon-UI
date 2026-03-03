// UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Star } from "lucide-react";
// Hook
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
// Call api
import axios from "axios";
import endpoints from "@/api/api.js"
import { Download } from "lucide-react";

// ─── Podium Place Component ───────────────────────────────────
const PodiumPlace = ({ player, rank, isCurrentUser, isVisible }) => {
  const configs = [
    { // 1st
      height: "h-32",
      ringColor: "ring-yellow-400",
      bg: "from-yellow-500/30 to-amber-600/30",
      borderColor: "border-yellow-400/40",
      label: "🥇",
      labelBg: "bg-yellow-400",
      scale: "scale-110",
      textSize: "text-lg",
      scoreSize: "text-2xl",
    },
    { // 2nd
      height: "h-24",
      ringColor: "ring-gray-300",
      bg: "from-gray-400/20 to-gray-500/20",
      borderColor: "border-gray-300/40",
      label: "🥈",
      labelBg: "bg-gray-300",
      scale: "",
      textSize: "text-base",
      scoreSize: "text-xl",
    },
    { // 3rd
      height: "h-20",
      ringColor: "ring-amber-600",
      bg: "from-amber-700/20 to-amber-800/20",
      borderColor: "border-amber-600/40",
      label: "🥉",
      labelBg: "bg-amber-600",
      scale: "",
      textSize: "text-base",
      scoreSize: "text-xl",
    },
  ];

  const config = configs[rank];
  if (!config) return null;

  return (
    <div
      className={`flex flex-col items-center gap-2 ${config.scale} transition-all duration-700 ease-out transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16 pointer-events-none"
        }`}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className={`w-16 h-16 ring-4 ${config.ringColor} shadow-lg`}>
          {player.avatarUrl && <AvatarImage src={player.avatarUrl} />}
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
            {(player.displayName || player.username || "?")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -top-1 -right-1 text-lg">{config.label}</span>
      </div>

      {/* Name */}
      <span className={`text-white font-bold ${config.textSize} truncate max-w-[140px] text-center`}>
        {player.displayName || player.username}
        {isCurrentUser && <span className="text-purple-300 text-xs ml-1">(Bạn)</span>}
      </span>

      {/* Score */}
      <span className={`text-white font-black ${config.scoreSize}`}>{player.score}</span>

      {/* Podium bar */}
      <div className={`${config.height} w-28 bg-gradient-to-t ${config.bg} border ${config.borderColor} rounded-t-xl backdrop-blur-xl flex items-end justify-center pb-2`}>
        <span className="text-white/40 text-xs font-bold">#{rank + 1}</span>
      </div>
    </div>
  );
};

// ─── Main Leaderboard Component ───────────────────────────────
const Leaderboard = ({ leaderboard, currentUserId }) => {
  const { id: matchId } = useParams();
  const { token } = useAuth();
  const [quizId, setQuizId] = useState(null);
  const [isRated, setIsRated] = useState(true);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [podiumStep, setPodiumStep] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
  const top3 = sortedLeaderboard.slice(0, 3);
  const rest = sortedLeaderboard.slice(3);

  // Reorder top3 for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2
      ? [top3[1], top3[0]]
      : top3;

  const podiumRanks = top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => (top3.length === 2 && i === 0 ? 1 : i === 1 ? 0 : i));

  // Sequence animation
  useEffect(() => {
    // Sequence: 3rd place -> 2nd place -> 1st place -> Rest of players
    // Step 1: Show 3rd place (rank 2)
    const t1 = setTimeout(() => setPodiumStep(1), 500);
    // Step 2: Show 2nd place (rank 1)
    const t2 = setTimeout(() => setPodiumStep(2), 1500);
    // Step 3: Show 1st place (rank 0)
    const t3 = setTimeout(() => setPodiumStep(3), 2500);
    // Step 4: Show the rest of the players
    const t4 = setTimeout(() => setPodiumStep(4), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Fetch match and rating status
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await axios.get(endpoints.match(matchId), {
          headers: { Authorization: token },
        });
        const qId = res.data.quizId;
        setQuizId(qId);

        const ratedRes = await axios.get(endpoints.quiz_isRated(qId), {
          headers: { Authorization: token },
        });
        if (ratedRes) {
          setIsRated(ratedRes.data.rated);
          // Only show rating dialog after the whole animation sequence finishes
          setTimeout(() => setOpen(!ratedRes.data.rated), 5000);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatch();
  }, [matchId, token]);

  const handleSubmitRating = async () => {
    try {
      await axios.post(endpoints.rating, { quizId, rating, text }, {
        headers: { Authorization: token },
      });
      setOpen(false);
      setIsRated(true);
    } catch (err) {
      console.error(err);
    }
  }

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const res = await axios.get(endpoints.report_excel(matchId), {
        headers: { Authorization: token },
        responseType: 'blob', // Important for file download
      });

      // Create a blob from the response data
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_match_${matchId}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download Excel report", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGoHome = () => navigate('/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Title */}
        <h1 className={`text-4xl font-extrabold text-white text-center mb-2 drop-shadow-lg transition-opacity duration-700 ${podiumStep > 0 ? "opacity-100" : "opacity-0"}`}>
          🏆 Bảng Xếp Hạng
        </h1>
        <p className={`text-white/50 text-center mb-12 text-sm transition-opacity duration-700 ${podiumStep > 0 ? "opacity-100" : "opacity-0"}`}>
          Khám phá người chiến thắng!
        </p>

        {/* Podium Area Container (fixed height so things don't jump around) */}
        <div className="min-h-[220px] mb-8">
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4 h-full">
              {podiumOrder.map((player, displayIdx) => {
                const rank = podiumRanks[displayIdx];
                // Determine visibility based on current animation step and rank
                // step 1: rank >= 2 (shows 3rd)
                // step 2: rank >= 1 (shows 2nd + 3rd)
                // step 3: rank >= 0 (shows 1st + 2nd + 3rd)
                const isVisible = rank >= 3 - podiumStep;

                return (
                  <PodiumPlace
                    key={player.userId}
                    player={player}
                    rank={rank}
                    isVisible={isVisible}
                    isCurrentUser={player.userId === currentUserId}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Remaining players - show smoothly only when podium animations finish */}
        <div className={`transition-all duration-1000 transform ${podiumStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {rest.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6 space-y-2">
              {rest.map((player, index) => (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${player.userId === currentUserId
                    ? "bg-purple-500/20 border border-purple-400/30"
                    : "hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 font-bold w-8 text-center">#{index + 4}</span>
                    <Avatar className="w-8 h-8">
                      {player.avatarUrl && <AvatarImage src={player.avatarUrl} />}
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                        {(player.displayName || player.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-sm font-medium">
                      {player.displayName || player.username}
                      {player.userId === currentUserId && (
                        <span className="text-purple-300 text-xs ml-1">(Bạn)</span>
                      )}
                    </span>
                  </div>
                  <span className="text-white font-bold text-lg tabular-nums">{player.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Go Home Button and Download Button */}
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleDownloadExcel}
              disabled={isDownloading}
              className="w-full h-14 text-lg font-bold bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {isDownloading ? "Đang tải..." : "Tải Báo Cáo Excel"}
            </Button>
            <Button
              onClick={handleGoHome}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02]"
            >
              🏠 Trở về Trang Chủ
            </Button>
          </div>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-center">⭐ Đánh giá Quiz</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-125"
              >
                <Star
                  className={`w-10 h-10 ${star <= rating
                    ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                    : "text-white/20"
                    } transition-all duration-200`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Nhập đánh giá của bạn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
          <DialogFooter>
            <Button
              onClick={handleSubmitRating}
              disabled={rating === 0}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              ✅ Gửi đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;
