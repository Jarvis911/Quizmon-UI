import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import endpoints from "@/api/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

// ─── Predefined avatar list ────────────────────────────────────
const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Jasper",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Leo",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Ginger",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Bear",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Tigger",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Coco",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Mimi",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Oliver",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Willow",
  "https://api.dicebear.com/9.x/adventurer/svg?seed=Charlie",
];

const BACKGROUND_THEMES = [
  { id: "default", label: "Mặc định", class: "from-slate-900 via-slate-800 to-slate-900" },
  { id: "sunset", label: "Hoàng hôn", class: "from-orange-500 via-rose-500 to-purple-600" },
  { id: "ocean", label: "Đại dương", class: "from-cyan-500 via-blue-600 to-indigo-700" },
  { id: "forest", label: "Rừng xanh", class: "from-emerald-500 via-green-600 to-teal-700" },
  { id: "midnight", label: "Đêm khuya", class: "from-indigo-900 via-purple-900 to-slate-900" },
  { id: "lavender", label: "Oải hương", class: "from-purple-400 via-pink-400 to-rose-400" },
];

// ─── Component ─────────────────────────────────────────────────
const MatchLobby = () => {
  const { id: matchId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Match / lobby state
  const [players, setPlayers] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [match, setMatch] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);

  // Player customization
  const [displayName, setDisplayName] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(PREDEFINED_AVATARS[0]);
  const [profileOpen, setProfileOpen] = useState(false);

  // Host settings (live-broadcast via socket)
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [selectedBg, setSelectedBg] = useState("default");
  const [musicUrl, setMusicUrl] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Copy room code
  const [copied, setCopied] = useState(false);

  // ─── Fetch match data ────────────────────────────────────────
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await axios.get(endpoints.match(matchId), {
          headers: { Authorization: token },
        });
        setQuiz(res.data.quiz);
        setMatch(res.data);
        setIsHost(res.data.hostId === user.id);

        // Pre-fill host settings from DB
        if (res.data.hostId === user.id) {
          if (res.data.timePerQuestion) setTimePerQuestion(res.data.timePerQuestion);
          if (res.data.musicUrl) setMusicUrl(res.data.musicUrl);
          if (res.data.backgroundUrl) setSelectedBg(res.data.backgroundUrl);
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu trận đấu!");
      }
    };
    fetchMatch();
  }, [matchId, token, user.id]);

  // ─── Socket events ───────────────────────────────────────────
  useEffect(() => {
    const updatePlayers = (value) => setPlayers(value);
    const updateError = (message) => setError(message);
    const onSettingsUpdated = (settings) => {
      if (settings.backgroundUrl) setSelectedBg(settings.backgroundUrl);
      if (settings.musicUrl !== undefined) setMusicUrl(settings.musicUrl || "");
      if (settings.timePerQuestion !== undefined) setTimePerQuestion(settings.timePerQuestion || 30);
    };

    socket.on("gameStarted", () => navigate(`/match/${matchId}/play`));
    socket.on("playerJoined", updatePlayers);
    socket.on("playerLeft", updatePlayers);
    socket.on("error", updateError);
    socket.on("matchSettingsUpdated", onSettingsUpdated);
    socket.on("matchCancelled", ({ message }) => {
      alert(message);
      navigate('/');
    });
    socket.on("leftMatch", () => {
      navigate('/');
    });

    // Join match with custom profile
    socket.emit("joinMatch", {
      matchId,
      userId: user.id,
      username: user.username,
      displayName: displayName || user.username,
      avatarUrl,
    });

    return () => {
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("error", updateError);
      socket.off("gameStarted");
      socket.off("matchSettingsUpdated", onSettingsUpdated);
      socket.off("matchCancelled");
      socket.off("leftMatch");
    };
  }, [matchId, user.id, user.username]);

  // ─── Actions ─────────────────────────────────────────────────
  const startGame = () => socket.emit("startMatch", { matchId });

  const leaveRoom = () => {
    if (matchId) {
      socket.emit("leaveMatch", { matchId });
    }
  };

  const cancelRoom = () => {
    if (matchId && isHost) {
      if (window.confirm("Bạn có chắc chắn muốn hủy phòng này không?")) {
        socket.emit("cancelMatch", { matchId });
      }
    }
  };

  const savePlayerProfile = () => {
    socket.emit("updatePlayerInfo", {
      matchId,
      userId: user.id,
      displayName: displayName || user.username,
      avatarUrl,
    });
    setProfileOpen(false);
  };

  const saveHostSettings = async () => {
    try {
      // Persist to DB
      await axios.put(
        endpoints.match(matchId),
        { timePerQuestion, backgroundUrl: selectedBg, musicUrl: musicUrl || null },
        { headers: { Authorization: token } }
      );
      // Broadcast live to lobby
      socket.emit("updateMatchSettings", {
        matchId,
        timePerQuestion,
        backgroundUrl: selectedBg,
        musicUrl: musicUrl || null,
      });
      setSettingsOpen(false);
    } catch (err) {
      console.error(err);
      setError("Không thể lưu cài đặt!");
    }
  };

  const copyRoomCode = useCallback(() => {
    navigator.clipboard.writeText(String(matchId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [matchId]);

  // Current background
  const currentBg = BACKGROUND_THEMES.find((b) => b.id === selectedBg) || BACKGROUND_THEMES[0];

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentBg.class} transition-colors duration-700`}>
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-pulse"
            style={{
              width: `${60 + i * 40}px`,
              height: `${60 + i * 40}px`,
              top: `${10 + i * 15}%`,
              left: `${5 + i * 16}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + i}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
            ⚔️ Phòng Thi Đấu
          </h1>
          <p className="text-white/70 mt-2 text-lg">
            {quiz?.title || "Đang tải..."}
          </p>
        </div>

        {/* ── Room Code Banner ── */}
        <div className="flex justify-center mb-8">
          <button
            onClick={copyRoomCode}
            className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105"
          >
            <span className="text-white/60 text-sm font-medium">Mã phòng</span>
            <span className="text-3xl font-black text-white tracking-widest font-mono">
              {matchId}
            </span>
            <span className="text-xs text-white/50 group-hover:text-green-300 transition-colors">
              {copied ? "✓ Đã sao chép!" : "📋 Nhấn để sao chép"}
            </span>
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ══════ Left: Player List ══════ */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                👥 Người chơi
                <span className="text-sm font-normal bg-white/10 backdrop-blur-sm rounded-full px-3 py-0.5">
                  {players.length}/20
                </span>
              </h2>

              {/* Player Profile Button */}
              <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                  >
                    ✏️ Tuỳ chỉnh hồ sơ
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Tuỳ chỉnh hồ sơ</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-white/80">Tên hiển thị</Label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={user?.username}
                        className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <Label className="text-white/80 mb-2 block">Chọn Avatar</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {PREDEFINED_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setAvatarUrl(url)}
                            className={`rounded-xl p-1 transition-all duration-200 ${avatarUrl === url
                                ? "ring-2 ring-purple-400 bg-purple-500/30 scale-110"
                                : "hover:bg-white/10 hover:scale-105"
                              }`}
                          >
                            <img
                              src={url}
                              alt={`Avatar ${idx + 1}`}
                              className="w-full h-auto rounded-lg"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={savePlayerProfile} className="bg-purple-600 hover:bg-purple-700 text-white">
                      💾 Lưu thay đổi
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Player Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {players.map((p, idx) => (
                <div
                  key={p.userId}
                  className="group relative bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Host crown */}
                  {match && p.userId === match.hostId && (
                    <span className="absolute -top-2 -right-2 text-xl animate-bounce">👑</span>
                  )}
                  <Avatar className="w-14 h-14 ring-2 ring-white/20 group-hover:ring-purple-400/50 transition-all">
                    {p.avatarUrl ? (
                      <AvatarImage src={p.avatarUrl} alt={p.displayName || p.username} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold">
                      {(p.displayName || p.username || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-sm font-semibold truncate max-w-full">
                    {p.displayName || p.username}
                  </span>
                  {p.userId === user.id && (
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">
                      Bạn
                    </span>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {[...Array(Math.max(0, 4 - players.length))].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[120px]"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-white/20 text-2xl">?</span>
                  </div>
                  <span className="text-white/20 text-xs">Đang chờ...</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══════ Right Sidebar ══════ */}
          <div className="space-y-4">
            {/* Quiz Info Card */}
            {quiz && (
              <Card className="bg-white/10 backdrop-blur-xl border-white/10 text-white overflow-hidden">
                {quiz.image && (
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={quiz.image}
                      alt={quiz.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <CardDescription className="text-white/60">
                    {quiz.description}
                  </CardDescription>
                  <div className="flex items-center justify-between text-white/70 pt-2 border-t border-white/10">
                    <span>📝 {quiz.questions?.length || 0} câu hỏi</span>
                    <span>📂 {quiz.category?.name || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Match Settings Summary */}
            <Card className="bg-white/10 backdrop-blur-xl border-white/10 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  ⚙️ Cài đặt trận đấu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>⏱ Thời gian/câu</span>
                  <span className="text-white font-medium">{timePerQuestion}s</span>
                </div>
                <div className="flex justify-between">
                  <span>🎨 Giao diện</span>
                  <span className="text-white font-medium">
                    {currentBg.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>🎵 Nhạc nền</span>
                  <span className="text-white font-medium">
                    {musicUrl ? "Đã thiết lập" : "Không có"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Host Controls */}
            {isHost && (
              <div className="space-y-3">
                {/* Settings Dialog */}
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                    >
                      ⚙️ Cài đặt trận đấu
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">Cài đặt trận đấu</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                      {/* Time per question */}
                      <div>
                        <Label className="text-white/80">
                          ⏱ Thời gian mỗi câu: <span className="text-purple-300 font-bold">{timePerQuestion}s</span>
                        </Label>
                        <Slider
                          value={[timePerQuestion]}
                          onValueChange={([v]) => setTimePerQuestion(v)}
                          min={5}
                          max={120}
                          step={5}
                          className="mt-3"
                        />
                        <div className="flex justify-between text-xs text-white/40 mt-1">
                          <span>5s</span>
                          <span>120s</span>
                        </div>
                      </div>

                      {/* Background Theme */}
                      <div>
                        <Label className="text-white/80 mb-2 block">🎨 Giao diện nền</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {BACKGROUND_THEMES.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => setSelectedBg(bg.id)}
                              className={`rounded-xl p-2 text-xs text-center transition-all duration-200 ${selectedBg === bg.id
                                  ? "ring-2 ring-purple-400 scale-105"
                                  : "hover:scale-105"
                                }`}
                            >
                              <div
                                className={`w-full h-8 rounded-lg bg-gradient-to-br ${bg.class} mb-1`}
                              />
                              <span className="text-white/70">{bg.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Music URL */}
                      <div>
                        <Label className="text-white/80">🎵 URL nhạc nền (tuỳ chọn)</Label>
                        <Input
                          value={musicUrl}
                          onChange={(e) => setMusicUrl(e.target.value)}
                          placeholder="https://example.com/music.mp3"
                          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveHostSettings} className="bg-purple-600 hover:bg-purple-700 text-white">
                        💾 Lưu & Áp dụng
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Start & Cancel Game */}
                <div className="flex gap-3">
                  <Button
                    onClick={startGame}
                    disabled={players.length < 1}
                    className="flex-1 h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg shadow-green-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:scale-100"
                  >
                    🚀 Bắt đầu!
                  </Button>
                  <Button
                    onClick={cancelRoom}
                    variant="destructive"
                    className="h-14 px-6 font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-all"
                  >
                    Hủy phòng
                  </Button>
                </div>
              </div>
            )}

            {/* Non-host waiting message */}
            {/* Leave Room for non-host */}
            {!isHost && (
              <div className="space-y-3">
                <Button
                  onClick={leaveRoom}
                  variant="outline"
                  className="w-full h-14 text-lg font-bold bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  🚪 Thoát phòng
                </Button>
                <div className="flex items-center justify-center gap-2 text-white/50 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm">Đang chờ host bắt đầu...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchLobby;