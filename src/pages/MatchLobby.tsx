import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/client";
import { useModal } from "@/context/ModalContext";
import endpoints from "@/api/api";
import type { Quiz, LobbyPlayer } from "../types";

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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface MatchResponse {
    id: number;
    quiz: Quiz;
    hostId: number;
    timePerQuestion?: number;
    musicUrl?: string;
    backgroundUrl?: string;
    participants: {
        user: { id: number; username: string };
    }[];
}

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

const MatchLobby = () => {
    const { id: matchId } = useParams<{ id: string }>();
    const { user, token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const navigate = useNavigate();
    const isNavigationHandled = useRef(false);

    // Match / lobby state
    const [players, setPlayers] = useState<LobbyPlayer[]>([]);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [match, setMatch] = useState<MatchResponse | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alreadyInMatchId, setAlreadyInMatchId] = useState<string | null>(null);

    // Player customization
    const [displayName, setDisplayName] = useState(user?.username || "");
    const [avatarUrl, setAvatarUrl] = useState(PREDEFINED_AVATARS[0]);
    const [profileOpen, setProfileOpen] = useState(false);

    // Host settings
    const [timePerQuestion, setTimePerQuestion] = useState(30);
    const [musicUrl, setMusicUrl] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Copy room code
    const [copied, setCopied] = useState(false);

    // ─── Fetch match data ────────────────────────────────────────
    useEffect(() => {
        if (!user || !matchId) return;

        const fetchMatch = async () => {
            try {
                const res = await apiClient.get<MatchResponse>(endpoints.match(Number(matchId)));
                setQuiz(res.data.quiz);
                setMatch(res.data);
                setIsHost(res.data.hostId === user.id);

                // Pre-fill settings
                if (res.data.timePerQuestion) setTimePerQuestion(res.data.timePerQuestion);
                if (res.data.musicUrl) setMusicUrl(res.data.musicUrl);

                // Initialize players list immediately from DB
                if (res.data.participants) {
                    const lobbyPlayers: LobbyPlayer[] = res.data.participants.map(p => ({
                        userId: p.user.id,
                        username: p.user.username,
                        isReady: false,
                        isHost: p.user.id === res.data.hostId,
                    }));
                    setPlayers(lobbyPlayers);
                }
            } catch (err) {
                console.error(err);
                setError("Cannot load match data!");
            }
        };
        fetchMatch();
    }, [matchId, user, token]);

    // Handle component unmount to leave match if user navigates away natively
    useEffect(() => {
        return () => {
            if (!isNavigationHandled.current && matchId) {
                socket.emit("leaveMatch", { matchId });
            }
        };
    }, [matchId]);

    // ─── Socket events ───────────────────────────────────────────
    useEffect(() => {
        if (!user || !matchId) return;

        const onConnect = () => {
            console.log("⚡ [Socket] Connected/Reconnected. Joining match...");
            socket.emit("joinMatch", {
                matchId,
                userId: user.id,
                username: user.username,
                displayName: displayName || user.username,
                avatarUrl,
            });
        };

        const updatePlayers = (value: LobbyPlayer[]) => {
            console.log("👥 [Socket] Player list updated:", value);
            setPlayers(value);
        };

        const updateError = (message: string) => {
            setError(message);
        };

        const onSettingsUpdated = (settings: { timePerQuestion?: number; musicUrl?: string }) => {
            if (settings.musicUrl !== undefined) setMusicUrl(settings.musicUrl || "");
            if (settings.timePerQuestion !== undefined) setTimePerQuestion(settings.timePerQuestion || 30);
        };

        socket.on("connect", onConnect);
        socket.on("gameStarted", () => {
            isNavigationHandled.current = true;
            navigate(`/match/${matchId}/play`);
        });
        socket.on("playerJoined", updatePlayers);
        socket.on("playerLeft", updatePlayers);
        socket.on("error", updateError);
        socket.on("matchSettingsUpdated", onSettingsUpdated);
        socket.on("hostChanged", ({ newHostId }) => {
            if (user && newHostId === user.id) {
                setIsHost(true);
            }
        });
        socket.on("alreadyInMatch", ({ currentMatchId }) => {
            setAlreadyInMatchId(currentMatchId);
        });
        socket.on("leftMatch", () => {
            if (alreadyInMatchId) {
                setAlreadyInMatchId(null);
                socket.emit("joinMatch", { matchId, userId: user.id, username: user.username });
            } else {
                isNavigationHandled.current = true;
                navigate('/');
            }
        });

        socket.on("matchCancelled", ({ message }) => {
            showAlert({
                title: "Thông báo",
                message,
                type: "info"
            });
            isNavigationHandled.current = true;
            navigate('/');
        });

        // If already connected, manual emit once.
        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("playerJoined");
            socket.off("playerLeft");
            socket.off("error", updateError);
            socket.off("gameStarted");
            socket.off("matchSettingsUpdated", onSettingsUpdated);
            socket.off("alreadyInMatch");
            socket.off("leftMatch");
            socket.off("matchCancelled");
            socket.off("hostChanged");
        };
    }, [matchId, user, displayName, avatarUrl, navigate, alreadyInMatchId]);

    // ─── Actions ─────────────────────────────────────────────────
    const startGame = () => socket.emit("startMatch", { matchId });

    const handleReconnect = () => {
        if (alreadyInMatchId) {
            isNavigationHandled.current = true;
            navigate(`/match/${alreadyInMatchId}/lobby`);
            setAlreadyInMatchId(null);
        }
    };

    const handleResign = () => {
        if (alreadyInMatchId) {
            socket.emit("leaveMatch", { matchId: alreadyInMatchId });
        }
    };

    const leaveRoom = () => {
        if (matchId) {
            socket.emit("leaveMatch", { matchId });
        }
    };

    const cancelRoom = async () => {
        if (matchId && isHost) {
            const confirmed = await showConfirm({
                title: "Hủy phòng",
                message: "Bạn có chắc chắn muốn hủy phòng này không?",
                type: "confirm"
            });
            if (confirmed) {
                socket.emit("cancelMatch", { matchId });
            }
        }
    };

    const savePlayerProfile = () => {
        socket.emit("updatePlayerInfo", {
            matchId,
            userId: user?.id,
            displayName: displayName || user?.username,
            avatarUrl,
        });
        setProfileOpen(false);
    };

    const saveHostSettings = async () => {
        try {
            await apiClient.put(
                endpoints.match(Number(matchId)),
                { timePerQuestion, musicUrl: musicUrl || null }
            );
            socket.emit("updateMatchSettings", {
                matchId,
                timePerQuestion,
                musicUrl: musicUrl || null,
            });
            setSettingsOpen(false);
        } catch (err) {
            console.error(err);
            setError("Không thể lưu cài đặt!");
        }
    };

    const copyRoomCode = useCallback(() => {
        if (matchId) {
            navigator.clipboard.writeText(String(matchId));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [matchId]);

    if (!user) return null;

    return (
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
            {/* ── Header ── */}
            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-foreground drop-shadow-lg tracking-tight">
                    Phòng Thi Đấu
                </h1>
                <p className="text-foreground/70 mt-2 text-lg">
                    {quiz?.title || "Đang tải..."}
                </p>
            </div>

            {/* ── Room Code Banner ── */}
            <div className="flex justify-center mb-8">
                <button
                    onClick={copyRoomCode}
                    className="group flex items-center gap-3 bg-card/40 hover:bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 transition-all duration-300 hover:scale-105 shadow-xl"
                >
                    <span className="text-foreground/60 text-sm font-medium">Mã phòng</span>
                    <span className="text-3xl font-black text-primary tracking-widest font-mono">
                        {matchId}
                    </span>
                    <span className="text-xs text-foreground/50 group-hover:text-primary transition-colors">
                        {copied ? "✓ Đã sao chép!" : "Nhấn để sao chép"}
                    </span>
                </button>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6 max-w-xl mx-auto shadow-2xl border-none bg-destructive/10 backdrop-blur-md">
                    <AlertDescription className="font-bold">{error}</AlertDescription>
                </Alert>
            )}

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ══════ Left: Player List ══════ */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                            👥 Người chơi
                            <span className="text-sm font-bold bg-primary/20 text-primary backdrop-blur-sm rounded-full px-4 py-1">
                                {players.length}/20
                            </span>
                        </h2>

                        {/* Player Profile Button */}
                        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-card/40 border-white/10 text-foreground hover:bg-card/60 backdrop-blur-sm font-bold shadow-lg"
                                >
                                    Tuỳ chỉnh hồ sơ
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black">Tuỳ chỉnh hồ sơ</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <Label className="text-foreground/80 font-bold">Tên hiển thị</Label>
                                        <Input
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder={user?.username}
                                            className="bg-background/50 border-white/10 focus:ring-primary h-12 text-lg"
                                            maxLength={20}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-foreground/80 font-bold block">Chọn Avatar</Label>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                            {PREDEFINED_AVATARS.map((url, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setAvatarUrl(url)}
                                                    className={`rounded-2xl p-1 transition-all duration-300 ${avatarUrl === url
                                                        ? "ring-4 ring-primary bg-primary/20 scale-110 shadow-lg shadow-primary/20"
                                                        : "hover:bg-white/5 hover:scale-105"
                                                        }`}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Avatar ${idx + 1}`}
                                                        className="w-full h-auto rounded-xl"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={savePlayerProfile} className="w-full h-12 text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                                        Lưu thay đổi
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Player Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {players.map((p, idx) => (
                            <div
                                key={p.userId}
                                className="group relative bg-card/40 hover:bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-primary/10 animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                {match && p.userId === match.hostId && (
                                    <span className="absolute -top-3 -right-3 text-3xl animate-bounce drop-shadow-md">👑</span>
                                )}
                                <Avatar className="w-16 h-16 ring-4 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-lg">
                                    {p.avatarUrl ? (
                                        <AvatarImage src={p.avatarUrl} alt={p.displayName || p.username} />
                                    ) : null}
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-black">
                                        {(p.displayName || p.username || "?")[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-foreground font-bold truncate max-w-full text-center">
                                    {p.displayName || p.username}
                                </span>
                                {p.userId === user.id && (
                                    <span className="text-[10px] uppercase tracking-wider font-black bg-primary/20 text-primary px-3 py-1 rounded-full">
                                        Bạn
                                    </span>
                                )}
                            </div>
                        ))}

                        {/* Empty slots */}
                        {[...Array(Math.max(0, 4 - players.length))].map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="bg-card/10 border-2 border-dashed border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 min-h-[140px] opacity-50"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                    <span className="text-foreground/20 text-3xl">?</span>
                                </div>
                                <span className="text-foreground/30 text-xs font-bold uppercase tracking-widest">Đang chờ...</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════ Right Sidebar ══════ */}
                <div className="space-y-6">
                    {/* Quiz Info Card */}
                    {quiz && (
                        <Card className="bg-card/40 backdrop-blur-xl border-white/10 text-foreground overflow-hidden shadow-2xl transition-all hover:shadow-primary/5">
                            {quiz.image && (
                                <div className="relative h-44 overflow-hidden group">
                                    <img
                                        src={quiz.image}
                                        alt={quiz.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-card/80 via-transparent to-transparent" />
                                </div>
                            )}
                            <CardHeader className="pb-3 border-b border-white/5">
                                <CardTitle className="text-xl font-black tracking-tight">{quiz.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 py-4">
                                <CardDescription className="text-foreground/60 font-medium leading-relaxed">
                                    {quiz.description}
                                </CardDescription>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[10px] uppercase font-bold text-foreground/40 mb-1">Câu hỏi</p>
                                        <p className="font-black text-primary">{quiz.questions?.length || 0}</p>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                        <p className="text-[10px] uppercase font-bold text-foreground/40 mb-1">Chủ đề</p>
                                        <p className="font-black text-foreground truncate px-1">{quiz.category?.name || "N/A"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Match Settings Summary */}
                    <Card className="bg-card/40 backdrop-blur-xl border-white/10 text-foreground shadow-2xl">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="text-lg font-black flex items-center gap-2">
                                Thiết lập trận đấu
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 py-4 text-sm">
                            <div className="flex justify-between items-center group">
                                <span className="text-foreground/60 font-bold">⏱ Thời gian/câu</span>
                                <span className="text-primary font-black bg-primary/10 px-3 py-1 rounded-lg group-hover:scale-110 transition-transform">{timePerQuestion}s</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-foreground/60 font-bold">🎵 Nhạc nền</span>
                                <span className={`font-black px-3 py-1 rounded-lg transition-all ${musicUrl ? "text-green-400 bg-green-400/10" : "text-foreground/40 bg-white/5"}`}>
                                    {musicUrl ? "BẬT" : "TẮT"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Host Controls */}
                    {isHost && (
                        <div className="space-y-4">
                            {/* Settings Dialog */}
                            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 bg-card/40 border-white/10 text-foreground hover:bg-card/60 backdrop-blur-sm font-black shadow-lg shadow-white/5"
                                    >
                                        Thay đổi cài đặt
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black">Cài đặt trận đấu</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-8 py-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <Label className="text-foreground/80 font-bold">⏱ Thời gian mỗi câu</Label>
                                                <span className="text-2xl font-black text-primary">{timePerQuestion}s</span>
                                            </div>
                                            <Slider
                                                value={[timePerQuestion]}
                                                onValueChange={([v]) => setTimePerQuestion(v)}
                                                min={5}
                                                max={120}
                                                step={5}
                                                className="py-4"
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-foreground/40">
                                                <span>5 GIÂY</span>
                                                <span>120 GIÂY</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-foreground/80 font-bold">🎵 URL nhạc nền (Mp3, Youtube...)</Label>
                                            <Input
                                                value={musicUrl}
                                                onChange={(e) => setMusicUrl(e.target.value)}
                                                placeholder="https://example.com/music.mp3"
                                                className="bg-background/50 border-white/10 h-12"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={saveHostSettings} className="w-full h-12 text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                                            Lưu & Áp dụng
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Start & Cancel Game */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={startGame}
                                    disabled={players.length < 1}
                                    className="flex-1 h-16 text-xl font-black bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    BẮT ĐẦU!
                                </Button>
                                <Button
                                    onClick={cancelRoom}
                                    variant="destructive"
                                    className="h-16 px-8 font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    HỦY
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Non-host waiting message */}
                    {!isHost && (
                        <div className="space-y-4">
                            <Button
                                onClick={leaveRoom}
                                variant="outline"
                                className="w-full h-16 text-xl font-bold bg-white/5 border-white/10 text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl"
                            >
                                Thoát phòng
                            </Button>
                            <div className="flex items-center justify-center gap-3 bg-primary/10 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 shadow-inner">
                                <div className="relative">
                                    <div className="w-3 h-3 rounded-full bg-green-500 animate-ping absolute" />
                                    <div className="w-3 h-3 rounded-full bg-green-500 relative" />
                                </div>
                                <span className="text-sm font-black text-primary tracking-wide uppercase">Đang chờ Host bắt đầu...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Already in match dialog */}
            <Dialog open={!!alreadyInMatchId} onOpenChange={(open) => {
                if (!open && alreadyInMatchId) {
                    navigate('/');
                }
            }}>
                <DialogContent className="sm:max-w-md border-white/10 bg-card/95 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Phát hiện trận đấu đang diễn ra!</DialogTitle>
                        <DialogDescription className="text-base text-foreground/70 pt-4 font-medium">
                            Bạn đang có một phòng thi đấu khác chưa kết thúc (Phòng: <span className="font-black text-primary">{alreadyInMatchId}</span>).
                            <br /><br />
                            Bạn muốn tiếp tục thi đấu ở phòng cũ, hay rời bỏ để tham gia phòng mới này?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={handleReconnect}
                            className="flex-1 h-12 font-black border-white/10 hover:bg-white/5"
                        >
                            Quay về phòng cũ
                        </Button>
                        <Button
                            onClick={handleResign}
                            className="flex-1 h-12 font-black shadow-lg text-white bg-destructive hover:bg-destructive/90"
                        >
                            Rời bỏ & Vào phòng mới
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatchLobby;
