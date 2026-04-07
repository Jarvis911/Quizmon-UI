import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/api/client";
import { useModal } from "@/context/ModalContext";
import endpoints, { getAvatarUrl } from "@/api/api";
import type { Quiz, LobbyPlayer } from "../types";
import MusicSearchModal from "@/components/music/MusicSearchModal";

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
import {
    Users,
    Maximize,
    Minimize,
    Settings,
    Search,
    Timer,
    Music
} from "lucide-react";
import { useFullscreen } from "react-use";

interface MatchResponse {
    id: number;
    pin?: string;
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
    "https://projectpokemon.org/images/normal-sprite/bulbasaur.gif",
    "https://projectpokemon.org/images/normal-sprite/charmander.gif",
    "https://projectpokemon.org/images/normal-sprite/squirtle.gif",
    "https://projectpokemon.org/images/normal-sprite/caterpie.gif",
    "https://projectpokemon.org/images/normal-sprite/pikachu.gif",
    "https://projectpokemon.org/images/normal-sprite/ninetales.gif",
    "https://projectpokemon.org/images/normal-sprite/jigglypuff.gif",
    "https://projectpokemon.org/images/normal-sprite/meowth.gif",
    "https://projectpokemon.org/images/normal-sprite/psyduck.gif",
    "https://projectpokemon.org/images/normal-sprite/abra.gif",
    "https://projectpokemon.org/images/normal-sprite/machop.gif",
    "https://projectpokemon.org/images/normal-sprite/slowpoke.gif",
    "https://projectpokemon.org/images/normal-sprite/gastly.gif",
    "https://projectpokemon.org/images/normal-sprite/exeggcute.gif",
    "https://projectpokemon.org/images/normal-sprite/cubone.gif",
    "https://projectpokemon.org/images/normal-sprite/horsea.gif",
    "https://projectpokemon.org/images/normal-sprite/staryu.gif",
    "https://projectpokemon.org/images/normal-sprite/magikarp.gif",
    "https://projectpokemon.org/images/normal-sprite/lapras.gif",
    "https://projectpokemon.org/images/normal-sprite/ditto.gif",
    "https://projectpokemon.org/images/normal-sprite/eevee.gif",
    "https://projectpokemon.org/images/normal-sprite/porygon.gif",
    "https://projectpokemon.org/images/normal-sprite/snorlax.gif",
    "https://projectpokemon.org/images/normal-sprite/dratini.gif",
    "https://projectpokemon.org/images/normal-sprite/mew.gif",
];

const MatchLobby = () => {
    const { id: matchId } = useParams<{ id: string }>();
    const { user, token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const navigate = useNavigate();
    const isNavigationHandled = useRef(false);
    const hasReceivedSocketPlayers = useRef(false);


    // Match / lobby state
    const [players, setPlayers] = useState<LobbyPlayer[]>([]);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [match, setMatch] = useState<MatchResponse | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alreadyInMatchId, setAlreadyInMatchId] = useState<string | null>(null);

    // Player customization
    const [displayName, setDisplayName] = useState(user?.username || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || PREDEFINED_AVATARS[0]);
    const [profileOpen, setProfileOpen] = useState(false);

    // Sync profile when user context updates (e.g. after login or profile edit)
    useEffect(() => {
        if (user) {
            if (!displayName) setDisplayName(user.username || "");
            if (!avatarUrl || avatarUrl === PREDEFINED_AVATARS[0]) setAvatarUrl(user.avatarUrl || PREDEFINED_AVATARS[0]);
        }
    }, [user]);

    // Host settings
    const [timePerQuestion, setTimePerQuestion] = useState(30);
    const [musicUrl, setMusicUrl] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Copy room code
    const [copied, setCopied] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const [showFullscreen, toggleFullscreen] = useState(false);
    useFullscreen(rootRef, showFullscreen, { onClose: () => toggleFullscreen(false) });


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
                    // Prevent overwriting if socket has already provided a fresher list
                    if (!hasReceivedSocketPlayers.current) {
                        setPlayers(lobbyPlayers);
                    }
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
            hasReceivedSocketPlayers.current = true;
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
        if (alreadyInMatchId && user) {
            socket.emit("leaveMatch", {
                matchId: alreadyInMatchId,
                userId: user.id
            });
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
        const code = match?.pin || String(matchId);
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [matchId, match]);

    const copyJoinLink = () => {
        const link = `${window.location.origin}/join?code=${match?.pin || matchId}`;
        navigator.clipboard.writeText(link);
        showAlert({ title: "Đã sao chép", message: "Link tham gia đã được sao chép vào bộ nhớ tạm!", type: "info" });
    };

    const joinLink = `${window.location.origin}/join?code=${match?.pin || matchId}`;

    if (!user) return null;

    return (
        <div ref={rootRef} className="min-h-screen bg-background text-foreground font-quicksand overflow-x-hidden">
            {/* ── Fixed Header ── */}
            <header className="sticky top-0 z-50 w-full bg-card/60 backdrop-blur-2xl border-b border-white/10 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="cursor-pointer flex items-center h-10 lg:h-12" onClick={() => navigate('/')}>
                    <img src="/quizmon.png" alt="Quizmon Logo" className="h-full w-auto object-contain drop-shadow-sm" />
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden md:flex flex-col items-center">
                        <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest leading-none mb-1">Mã tham gia</span>
                        <span className="text-2xl font-black text-primary tracking-wider font-mono leading-none">
                            PIN {match?.pin || matchId}
                        </span>
                    </div>

                    <div className="h-10 w-[1px] bg-white/10" />

                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <Users className="w-5 h-5 text-primary" />
                        <span className="text-xl font-black">{players.length}</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFullscreen(!showFullscreen)}
                        className="rounded-xl hover:bg-white/10"
                    >
                        {showFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                    </Button>
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {error && (
                    <Alert variant="destructive" className="mb-6 max-w-xl mx-auto shadow-2xl border-none bg-destructive/10 backdrop-blur-md">
                        <AlertDescription className="font-bold">{error}</AlertDescription>
                    </Alert>
                )}

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ══════ Left Column ══════ */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* ── Connection Area: PIN & QR Code ── */}
                        <div className="flex flex-col md:flex-row items-stretch gap-4 bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden group/join animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* Visual PIN Display */}
                            <button
                                onClick={copyRoomCode}
                                className="flex-1 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] relative"
                            >
                                <span className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">Mã phòng</span>
                                <span className="text-5xl md:text-6xl font-black text-primary tracking-wider font-mono drop-shadow-sm">
                                    {match?.pin || matchId}
                                </span>
                                <span className="text-[10px] text-foreground/50 font-bold mt-1">
                                    {copied ? "✓ ĐÃ SAO CHÉP" : "NHẤN ĐỂ SAO CHÉP MÃ"}
                                </span>
                            </button>

                            {/* QR Code & Share Link Section */}
                            <div className="flex-1 flex flex-row items-center gap-6 bg-white/5 border border-white/10 rounded-3xl p-6">
                                {/* QR Code Canvas */}
                                <div className="relative p-2 bg-white rounded-2xl shrink-0 shadow-lg flex items-center justify-center">
                                    <QRCodeCanvas
                                        value={joinLink}
                                        size={100}
                                        level="H"
                                        includeMargin={false}
                                        className="w-20 h-20 md:w-24 md:h-24 rounded-lg"
                                    />
                                </div>

                                {/* Link & Instructions */}
                                <div className="flex-1 flex flex-col justify-center gap-3 text-left">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-foreground">Tham gia nhanh</h3>
                                        <p className="text-[11px] text-foreground/60 font-medium leading-tight">Quét mã QR hoặc sao chép đường dẫn trực tiếp.</p>
                                    </div>

                                    <Button
                                        onClick={copyJoinLink}
                                        size="sm"
                                        className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-black rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        SAO CHÉP LINK
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* ── Player List ── */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                                    <img src="https://cdn-icons-png.flaticon.com/512/4960/4960731.png" className="w-8 h-8 object-contain" alt="Người chơi" />
                                    Người chơi
                                    <span className="text-sm font-black bg-primary/30 text-primary-foreground rounded-full px-4 py-1 ring-2 ring-primary/20">
                                        {players.length}/20
                                    </span>
                                </h2>

                                {/* Player Profile Button */}
                                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-card/70 border-white/20 text-foreground hover:bg-card/90 backdrop-blur-md font-extrabold shadow-lg rounded-xl"
                                        >
                                            Tuỳ chỉnh hồ sơ
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 max-w-sm rounded-3xl">
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
                                                    className="bg-background/50 border-white/10 focus:ring-primary h-12 text-lg rounded-xl"
                                                    maxLength={20}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-foreground/80 font-bold block">Chọn Avatar</Label>
                                                <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                                                    <div className="grid grid-cols-4 gap-3 p-1">
                                                        {PREDEFINED_AVATARS.map((url, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setAvatarUrl(url)}
                                                                className={`aspect-square rounded-2xl overflow-hidden transition-all duration-300 ${avatarUrl === url
                                                                    ? "ring-4 ring-primary bg-primary/20 scale-110 shadow-lg shadow-primary/20"
                                                                    : "bg-transparent hover:bg-white/10 hover:scale-105"
                                                                    }`}
                                                            >
                                                                <img
                                                                    src={getAvatarUrl(url)}
                                                                    alt={`Avatar ${idx + 1}`}
                                                                    className="w-full h-full object-contain p-1"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={savePlayerProfile} className="w-full h-12 text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-xl">
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
                                        className="group relative bg-card/70 hover:bg-card/90 backdrop-blur-xl border border-white/20 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                    >
                                        {match && p.userId === match.hostId && (
                                            <span className="absolute -top-3 -right-3 text-3xl animate-bounce drop-shadow-md">👑</span>
                                        )}
                                        <Avatar className="w-16 h-16 ring-4 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-lg overflow-hidden">
                                            {p.avatarUrl ? (
                                                <AvatarImage src={getAvatarUrl(p.avatarUrl)} alt={p.displayName || p.username} className="object-cover" />
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
                                        className="bg-card/30 border-2 border-dashed border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 min-h-[140px]"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                            <span className="text-foreground/50 text-3xl font-black">?</span>
                                        </div>
                                        <span className="text-foreground/60 text-xs font-black uppercase tracking-widest">Đang chờ...</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ══════ Right Column: Sidebar ══════ */}
                    <div className="space-y-4 lg:sticky lg:top-28 self-start">
                        {/* 1. Quiz Info Card - Compact */}
                        {quiz && (
                            <Card className="bg-card/70 backdrop-blur-xl border-white/20 text-foreground overflow-hidden shadow-2xl transition-all hover:shadow-primary/10 rounded-[2rem]">
                                {quiz.image ? (
                                    <div className="relative h-32 overflow-hidden group">
                                        <img
                                            src={quiz.image}
                                            alt={quiz.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-card/80 via-transparent to-transparent" />
                                    </div>
                                ) : (
                                    <div className="h-16 bg-primary/20 flex items-center justify-center">
                                        <span className="text-3xl">📚</span>
                                    </div>
                                )}
                                <CardHeader className="pb-2 pt-4 px-5 border-b border-white/5">
                                    <CardTitle className="text-lg font-black tracking-tight line-clamp-1">{quiz.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 py-3 px-5">
                                    <CardDescription className="text-foreground/60 text-xs font-medium leading-relaxed line-clamp-2">
                                        {quiz.description || "Hãy tham gia cùng mọi người để trải nghiệm bài trắc nghiệm này."}
                                    </CardDescription>
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                                            <p className="text-[9px] uppercase font-bold text-foreground/40 mb-0.5">Câu hỏi</p>
                                            <p className="font-black text-primary text-sm">{quiz.questions?.length || 0}</p>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                                            <p className="text-[9px] uppercase font-bold text-foreground/40 mb-0.5">Chủ đề</p>
                                            <p className="font-black text-foreground truncate px-1 text-sm">{quiz.category?.name || "N/A"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 2. Host Controls */}
                        {isHost && (
                            <div className="space-y-3">
                                {/* Settings Dialog */}
                                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 bg-card/70 border-white/20 text-foreground hover:bg-card/90 backdrop-blur-md font-black shadow-lg shadow-black/10 rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                                        >
                                            <Settings className="w-4 h-4 text-primary" />
                                            Thay đổi cài đặt
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 max-w-md rounded-[2.5rem]">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black">Cài đặt trận đấu</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-8 py-6">
                                            {/* Summary Section inside Modal */}
                                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl grid grid-cols-2 gap-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-foreground/40 uppercase">Thời gian</p>
                                                    <p className="text-lg font-black text-primary">{timePerQuestion}s</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-foreground/40 uppercase">Nhạc nền</p>
                                                    <p className={`text-lg font-black ${musicUrl ? "text-green-400" : "text-foreground/30"}`}>{musicUrl ? "BẬT" : "TẮT"}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end">
                                                    <Label className="text-foreground/80 font-bold flex items-center gap-2">
                                                        <Timer className="w-4 h-4 text-primary" />
                                                        Thời gian mỗi câu (giây)
                                                    </Label>
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
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-foreground/80 font-bold flex items-center gap-2">
                                                    <Music className="w-4 h-4 text-primary" />
                                                    Nhạc nền (Mp3, Youtube...)
                                                </Label>
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <Input
                                                            value={musicUrl}
                                                            onChange={(e) => setMusicUrl(e.target.value)}
                                                            placeholder="https://example.com/music.mp3"
                                                            className="bg-background/50 border-white/10 h-14 pr-12 rounded-xl"
                                                        />
                                                        {musicUrl && (
                                                            <button
                                                                onClick={() => setMusicUrl("")}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground text-xs font-black"
                                                            >
                                                                XÓA
                                                            </button>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        onClick={() => setIsSearchOpen(true)}
                                                        className="h-14 px-6 bg-primary/10 hover:bg-primary/20 text-primary border-2 border-primary/20 font-black rounded-xl"
                                                    >
                                                        <Search className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={saveHostSettings} className="w-full h-14 text-xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl uppercase">
                                                Áp dụng
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {/* Start & Cancel Game */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={startGame}
                                        disabled={players.length < 1}
                                        className="flex-1 h-14 text-lg font-black bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                    >
                                        BẮT ĐẦU!
                                    </Button>
                                    <Button
                                        onClick={cancelRoom}
                                        variant="destructive"
                                        className="h-14 px-5 font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-[10px]"
                                    >
                                        HỦY
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Non-host waiting message */}
                        {!isHost && (
                            <div className="space-y-3">
                                <Button
                                    onClick={leaveRoom}
                                    variant="outline"
                                    className="w-full h-14 text-lg font-bold bg-white/5 border-white/10 text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-xl"
                                >
                                    Thoát phòng
                                </Button>
                                <div className="flex items-center justify-center gap-3 bg-primary/20 backdrop-blur-md rounded-2xl p-4 border-2 border-primary/40 shadow-inner">
                                    <div className="relative">
                                        <div className="w-3 h-3 rounded-full bg-green-500 animate-ping absolute" />
                                        <div className="w-3 h-3 rounded-full bg-green-500 relative" />
                                    </div>
                                    <span className="text-[11px] font-black text-primary tracking-wide uppercase drop-shadow-sm">Đang chờ Host bắt đầu...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Dialog open={!!alreadyInMatchId} onOpenChange={(open) => {
                    if (!open && alreadyInMatchId) {
                        navigate('/');
                    }
                }}>
                    <DialogContent className="sm:max-w-xl border-white/10 bg-card/95 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
                        <DialogHeader className="space-y-4">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-2">
                                <span className="text-4xl">⚠️</span>
                            </div>
                            <DialogTitle className="text-3xl font-black text-foreground">Phát hiện trận đấu đang diễn ra!</DialogTitle>
                            <DialogDescription className="text-lg text-foreground/70 font-medium leading-relaxed">
                                Bạn đang có một phòng thi đấu khác chưa kết thúc (Phòng: <span className="font-black text-primary px-2 py-1 bg-primary/10 rounded-lg">{alreadyInMatchId}</span>).
                                <br /><br />
                                Bạn muốn tiếp tục thi đấu ở phòng cũ, hay rời bỏ để tham gia phòng mới này?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-8">
                            <Button
                                variant="outline"
                                onClick={handleReconnect}
                                className="flex-1 h-14 text-lg font-black bg-white/5 border-white/10 text-foreground hover:bg-white/10 rounded-2xl transition-all shadow-lg"
                            >
                                Quay về phòng cũ
                            </Button>
                            <Button
                                onClick={handleResign}
                                className="flex-1 h-14 text-lg font-black shadow-xl text-white bg-destructive hover:bg-destructive/90 rounded-2xl transition-all"
                            >
                                Rời bỏ & Vào phòng mới
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Music Search Modal */}
                <MusicSearchModal
                    open={isSearchOpen}
                    onOpenChange={setIsSearchOpen}
                    onSelect={(url) => setMusicUrl(url)}
                />
            </div>
        </div>
    );
};

export default MatchLobby;
