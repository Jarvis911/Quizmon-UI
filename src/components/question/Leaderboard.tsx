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
import apiClient from "@/api/client";
import endpoints, { getAvatarUrl } from "@/api/api"
import { Download } from "lucide-react";

// ─── Podium Place Component ───────────────────────────────────
const PodiumPlace = ({ player, rank, isCurrentUser, isVisible }) => {
  const configs = [
    { // 1st
      height: "h-32",
      ringColor: "ring-yellow-400",
      bg: "from-yellow-500/30 to-amber-600/30",
      borderColor: "border-yellow-400/40",
      label: "HẠNG 1",
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
      label: "HẠNG 2",
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
      label: "HẠNG 3",
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
          {player.avatarUrl && <AvatarImage src={getAvatarUrl(player.avatarUrl)} />}
          <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
            {(player.displayName || player.username || "?")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className={`absolute -top-3 -right-3 text-[10px] font-black px-2 py-1 rounded-full text-white shadow-lg ${config.labelBg}`}>
          {config.label}
        </span>
      </div>

      {/* Name */}
      <span className={`text-foreground font-black ${config.textSize} truncate max-w-[140px] text-center drop-shadow-md`}>
        {player.displayName || player.username}
        {isCurrentUser && <span className="text-primary text-xs ml-1 font-bold">(Bạn)</span>}
      </span>

      {/* Score */}
      <span className={`text-foreground font-black ${config.scoreSize} drop-shadow-lg`}>{player.score}</span>

      {/* Podium bar */}
      <div className={`${config.height} w-28 bg-linear-to-t ${config.bg} border-t-4 ${config.borderColor} rounded-t-2xl backdrop-blur-md flex items-end justify-center pb-3 shadow-2xl transition-all duration-300`}>
        <span className="text-foreground/30 text-xs font-black uppercase tracking-widest">#{rank + 1}</span>
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
        const res = await apiClient.get(endpoints.match(Number(matchId)));
        const qId = res.data.quizId;
        setQuizId(qId);

        const ratedRes = await apiClient.get(endpoints.quiz_isRated(qId));
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
      await apiClient.post(endpoints.rating, { quizId, rating, text });
      setOpen(false);
      setIsRated(true);
    } catch (err) {
      console.error(err);
    }
  }

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const res = await apiClient.get(endpoints.report_excel(Number(matchId)), {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient effects - use primary color for theme awareness */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Title */}
        <h1 className={`text-4xl md:text-5xl font-black text-foreground text-center mb-2 drop-shadow-2xl transition-all duration-700 ${podiumStep > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          Bảng Xếp Hạng
        </h1>
        <p className={`text-muted-foreground font-bold text-center mb-12 text-sm uppercase tracking-widest transition-opacity duration-700 ${podiumStep > 0 ? "opacity-100" : "opacity-0"}`}>
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
            <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 mb-6 space-y-2 shadow-2xl">
              {rest.map((player, index) => (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${player.userId === currentUserId
                    ? "bg-primary/20 border border-primary/30 shadow-lg scale-102"
                    : "hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground font-black w-8 text-center text-lg">#{index + 4}</span>
                    <Avatar className="w-10 h-10 border-2 border-white/10 shadow-md">
                      {player.avatarUrl && <AvatarImage src={getAvatarUrl(player.avatarUrl)} />}
                      <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-primary-foreground text-sm font-bold">
                        {(player.displayName || player.username || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground text-base font-bold">
                      {player.displayName || player.username}
                      {player.userId === currentUserId && (
                        <span className="text-primary text-xs ml-2 font-black uppercase tracking-tighter">(Bạn)</span>
                      )}
                    </span>
                  </div>
                  <span className="text-foreground font-black text-xl tabular-nums">{player.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Go Home Button and Download Button */}
          <div className="flex flex-col gap-4 mt-8">
            <Button
              onClick={handleDownloadExcel}
              disabled={isDownloading}
              variant="secondary"
              className="w-full h-16 text-lg font-black bg-card/60 hover:bg-card/90 text-foreground rounded-2xl border-2 border-white/10 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-3 shadow-xl backdrop-blur-md"
            >
              <Download className="w-6 h-6 text-primary" />
              {isDownloading ? "Đang tải..." : "TẢI BÁO CÁO EXCEL"}
            </Button>
            <Button
              onClick={handleGoHome}
              className="w-full h-16 text-xl font-black bg-primary text-primary-foreground rounded-2xl shadow-[0_8px_0_0_rgba(0,0,0,0.1)] hover:translate-y-[-2px] hover:shadow-[0_12px_20px_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none transition-all duration-300"
            >
              TRỞ VỀ TRANG CHỦ
            </Button>
          </div>
        </div>
      </div>

      {/* Rating Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 text-foreground max-w-sm rounded-4xl shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center text-2xl font-black">Đánh giá bộ câu hỏi</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-3 my-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-all duration-300 hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-12 h-12 ${star <= rating
                    ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]"
                    : "text-muted-foreground/20"
                    } transition-all duration-200`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Bạn thấy bộ câu hỏi này thế nào?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 rounded-2xl p-4 focus:ring-primary focus:border-primary transition-all text-base border-2"
          />
          <DialogFooter>
            <Button
              onClick={handleSubmitRating}
              disabled={rating === 0}
              className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              Gửi đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;
