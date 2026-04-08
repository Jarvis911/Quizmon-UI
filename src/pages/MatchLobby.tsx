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
    const { pin } = useParams<{ pin: string }>();
    const [matchId, setMatchId] = useState<number | null>(null);
    const internalIdRef = useRef<number | null>(null); // Keep for unmount cleanup only
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
    const [alreadyInMatchId, setAlreadyInMatchId] = useState<string | number | null>(null);
    const [alreadyInMatchPin, setAlreadyInMatchPin] = useState<string | null>(null);

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
        if (!user || !pin) return;

        const fetchMatch = async () => {
            try {
                const res = await apiClient.get<MatchResponse>(endpoints.match(pin!));
                setQuiz(res.data.quiz);
                setMatch(res.data);
                setMatchId(res.data.id);
                internalIdRef.current = res.data.id;
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
    }, [pin, user, token]);

    // Handle component unmount to leave match if user navigates away natively
    useEffect(() => {
        return () => {
            if (!isNavigationHandled.current && internalIdRef.current) {
                socket.emit("leaveMatch", { matchId: internalIdRef.current });
            }
        };
    }, []);

    // ─── Socket events ───────────────────────────────────────────
    useEffect(() => {
        if (!user || !pin) return;

        const onConnect = () => {
            if (!matchId) return;
            console.log("⚡ [Socket] Connected/Reconnected. Joining match...");
            socket.emit("joinMatch", {
                matchId: matchId,
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
            navigate(`/match/${pin}/play`);
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
        socket.on("alreadyInMatch", ({ currentMatchId, currentMatchPin }) => {
            setAlreadyInMatchId(currentMatchId);
            setAlreadyInMatchPin(currentMatchPin || null);
        });
        socket.on("leftMatch", () => {
            if (alreadyInMatchId) {
                setAlreadyInMatchId(null);
                if (matchId) {
                    socket.emit("joinMatch", { matchId: matchId, userId: user.id, username: user.username });
                }
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
    }, [pin, user, displayName, avatarUrl, navigate, alreadyInMatchId, matchId]);

    // ─── Actions ─────────────────────────────────────────────────
    const startGame = () => {
        if (matchId) {
            socket.emit("startMatch", { matchId: matchId });
        }
    };

    const handleReconnect = () => {
        if (alreadyInMatchId) {
            isNavigationHandled.current = true;
            navigate(`/match/${alreadyInMatchPin || alreadyInMatchId}/lobby`);
            setAlreadyInMatchId(null);
            setAlreadyInMatchPin(null);
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
            socket.emit("leaveMatch", { matchId: matchId });
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
                socket.emit("cancelMatch", { matchId: matchId });
            }
        }
    };

    const savePlayerProfile = () => {
        if (matchId) {
            socket.emit("updatePlayerInfo", {
                matchId: matchId,
                userId: user?.id,
                displayName: displayName || user?.username,
                avatarUrl,
            });
        }
        setProfileOpen(false);
    };

    const saveHostSettings = async () => {
        try {
            if (!matchId) return;
            await apiClient.put(
                endpoints.match(matchId),
                { timePerQuestion, musicUrl: musicUrl || null }
            );
            socket.emit("updateMatchSettings", {
                matchId: matchId,
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
        const code = match?.pin || pin || "";
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [pin, match]);

    const copyJoinLink = () => {
        const link = `${window.location.origin}/join?code=${match?.pin || pin}`;
        navigator.clipboard.writeText(link);
        showAlert({ title: "Đã sao chép", message: "Link tham gia đã được sao chép vào bộ nhớ tạm!", type: "info" });
    };

    const joinLink = `${window.location.origin}/join?code=${match?.pin || pin}`;

    if (!user) return null;

    return (
        <div ref={rootRef} className="min-h-screen bg-background text-foreground font-quicksand overflow-x-hidden">
            {/* ── Fixed Header ── */}
            <header className="sticky top-0 z-50 w-full bg-card/60 backdrop-blur-2xl border-b border-white/10 px-3 py-2 md:px-6 md:py-4 flex items-center justify-between shadow-sm">
                <div className="cursor-pointer flex items-center h-8 md:h-10 lg:h-12" onClick={() => navigate('/')}>
                    <img src="/quizmon.png" alt="Quizmon Logo" className="h-full w-auto object-contain drop-shadow-sm" />
                </div>

                <div className="flex items-center gap-3 md:gap-8">
                    <div className="hidden md:flex flex-col items-center">
                        <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest leading-none mb-1">Mã tham gia</span>
                        <span className="text-2xl font-black text-primary tracking-wider font-mono leading-none">
                            PIN {match?.pin || pin}
                        </span>
                    </div>

                    <div className="hidden md:block h-10 w-[1px] bg-white/10" />

                    <div className="flex items-center gap-2 md:gap-3 bg-white/5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-white/5">
                        <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        <span className="text-base md:text-xl font-black">{players.length}</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFullscreen(!showFullscreen)}
                        className="rounded-lg md:rounded-xl hover:bg-white/10 h-8 w-8 md:h-10 md:w-10"
                    >
                        {showFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
                    </Button>
                </div>
            </header>

            <div className="relative z-10 max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
                {error && (
                    <Alert variant="destructive" className="mb-4 md:mb-6 max-w-xl mx-auto shadow-2xl border-none bg-destructive/10 backdrop-blur-md">
                        <AlertDescription className="font-bold text-sm md:text-base">{error}</AlertDescription>
                    </Alert>
                )}

                {/* ── Main Grid ── */}
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 md:gap-8">
                    {/* ══════ Left Column ══════ */}
                    <div className="lg:col-span-2 space-y-6 md:space-y-8">
                        {/* ── Connection Area: PIN & QR Code ── */}
                        <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-4 bg-card/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-2xl overflow-hidden group/join animate-in fade-in slide-in-from-top-4 duration-500">
                            {/* Visual PIN Display */}
                            <button
                                onClick={copyRoomCode}
                                className="flex-1 flex flex-col items-center justify-center gap-1 md:gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all duration-300 hover:scale-[1.02] relative"
                            >
                                <span className="text-foreground/40 text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden md:block">Mã phòng</span>
                                <span className="text-5xl sm:text-6xl md:text-7xl font-black text-primary tracking-wider font-mono drop-shadow-sm min-h-[4rem]">
                                    {match?.pin || pin}
                                </span>
                                <span className="text-[10px] text-foreground/50 font-bold mt-1">
                                    {copied ? "✓ ĐÃ SAO CHÉP" : "NHẤN ĐỂ SAO CHÉP MÃ"}
                                </span>
                            </button>

                            {/* QR Code & Share Link Section */}
                            <div className="flex-1 flex flex-row items-center gap-4 md:gap-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6">
                                {/* QR Code Canvas */}
                                <div className="relative p-2 bg-white rounded-xl md:rounded-2xl shrink-0 shadow-lg flex items-center justify-center">
                                    <QRCodeCanvas
                                        value={joinLink}
                                        size={90}
                                        level="H"
                                        includeMargin={false}
                                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg"
                                    />
                                </div>

                                {/* Link & Instructions */}
                                <div className="flex-1 flex flex-col justify-center gap-2 md:gap-3 text-left">
                                    <div className="space-y-1">
                                        <h3 className="text-sm md:text-base font-black text-foreground">Tham gia nhanh</h3>
                                        <p className="text-[10px] md:text-[11px] text-foreground/60 font-medium leading-tight">Quét mã QR hoặc sao chép đường dẫn trực tiếp.</p>
                                    </div>

                                    <Button
                                        onClick={copyJoinLink}
                                        size="sm"
                                        className="w-full h-8 md:h-9 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-black rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        SAO CHÉP LINK
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* ── Player List ── */}
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex items-center justify-between px-1 md:px-2">
                                <h2 className="text-lg md:text-2xl font-black text-foreground flex items-center gap-2 md:gap-3">
                                    <img src="https://cdn-icons-png.flaticon.com/512/4960/4960731.png" className="w-6 h-6 md:w-8 md:h-8 object-contain" alt="Người chơi" />
                                    Người chơi
                                    <span className="text-xs md:text-sm font-black bg-primary/30 text-primary-foreground rounded-full px-2 py-0.5 md:px-4 md:py-1 ring-1 md:ring-2 ring-primary/20">
                                        {players.length}/20
                                    </span>
                                </h2>

                                {/* Player Profile Button */}
                                <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-card/70 border-white/20 text-foreground hover:bg-card/90 backdrop-blur-md font-extrabold shadow-lg rounded-lg md:rounded-xl text-[10px] md:text-xs h-7 md:h-9 px-2 md:px-3"
                                        >
                                            Tuỳ chỉnh hồ sơ
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 max-w-sm rounded-[2rem] p-4 md:p-6 w-[95vw]">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                                {players.map((p, idx) => (
                                    <div
                                        key={p.userId}
                                        className="group relative bg-card/70 hover:bg-card/90 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col items-center gap-2 md:gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/20"
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                    >
                                        {match && p.userId === match.hostId && (
                                            <span className="absolute -top-2 -right-2 md:-top-3 md:-right-3 text-2xl md:text-3xl animate-bounce drop-shadow-md">👑</span>
                                        )}
                                        <Avatar className="w-12 h-12 md:w-16 md:h-16 ring-2 md:ring-4 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-lg overflow-hidden">
                                            {p.avatarUrl ? (
                                                <AvatarImage src={getAvatarUrl(p.avatarUrl)} alt={p.displayName || p.username} className="object-cover" />
                                            ) : null}
                                            <AvatarFallback className="bg-primary text-primary-foreground text-sm md:text-xl font-black">
                                                {(p.displayName || p.username || "?")[0].toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-foreground font-bold truncate max-w-full text-center text-[10px] md:text-sm">
                                            {p.displayName || p.username}
                                        </span>
                                        {p.userId === user.id && (
                                            <span className="text-[8px] md:text-[10px] uppercase tracking-wider font-black bg-primary/20 text-primary px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                                                Bạn
                                            </span>
                                        )}
                                    </div>
                                ))}

                                {/* Empty slots */}
                                {[...Array(Math.max(0, 4 - players.length))].map((_, i) => (
                                    <div
                                        key={`empty-${i}`}
                                        className="bg-card/30 border-2 border-dashed border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col items-center justify-center gap-2 md:gap-3 min-h-[100px] md:min-h-[140px]"
                                    >
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                            <span className="text-foreground/30 text-xl md:text-3xl font-black">?</span>
                                        </div>
                                        <span className="text-foreground/40 text-[8px] md:text-xs font-black uppercase tracking-widest text-center">Đang chờ...</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ══════ Right Column: Sidebar ══════ */}
                    <div className="flex flex-col gap-4 md:gap-6 lg:sticky lg:top-28 w-full lg:self-start">
                        {/* 1. Quiz Info Card - Compact */}
                        {quiz && (
                            <Card className="order-2 lg:order-1 bg-card/70 backdrop-blur-xl border-white/20 text-foreground overflow-hidden shadow-2xl transition-all hover:shadow-primary/10 rounded-3xl md:rounded-[2rem]">
                                {quiz.image ? (
                                    <div className="relative h-24 md:h-32 overflow-hidden group">
                                        <img
                                            src={quiz.image}
                                            alt={quiz.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-card/80 via-transparent to-transparent" />
                                    </div>
                                ) : (
                                    <div className="h-12 md:h-16 bg-primary/20 flex items-center justify-center">
                                        <span className="text-2xl md:text-3xl">📚</span>
                                    </div>
                                )}
                                <CardHeader className="pb-1 pt-3 md:pb-2 md:pt-4 px-4 md:px-5 border-b border-white/5">
                                    <CardTitle className="text-base md:text-lg font-black tracking-tight line-clamp-1">{quiz.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 md:space-y-3 py-2 md:py-3 px-4 md:px-5">
                                    <CardDescription className="text-foreground/60 text-[10px] md:text-xs font-medium leading-relaxed line-clamp-2">
                                        {quiz.description || "Hãy tham gia cùng mọi người để trải nghiệm bài trắc nghiệm này."}
                                    </CardDescription>
                                    <div className="grid grid-cols-2 gap-2 md:gap-3 pt-1">
                                        <div className="bg-white/5 p-1.5 md:p-2 rounded-lg md:rounded-xl border border-white/5 text-center">
                                            <p className="text-[8px] md:text-[9px] uppercase font-bold text-foreground/40 mb-0.5">Câu hỏi</p>
                                            <p className="font-black text-primary text-xs md:text-sm">{quiz.questions?.length || 0}</p>
                                        </div>
                                        <div className="bg-white/5 p-1.5 md:p-2 rounded-lg md:rounded-xl border border-white/5 text-center">
                                            <p className="text-[8px] md:text-[9px] uppercase font-bold text-foreground/40 mb-0.5">Chủ đề</p>
                                            <p className="font-black text-foreground truncate px-1 text-xs md:text-sm">{quiz.category?.name || "N/A"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 2. Host Controls */}
                        {isHost && (
                            <div className="order-1 lg:order-2 flex gap-2 md:gap-3 w-full">
                                <Button
                                    onClick={startGame}
                                    disabled={players.length < 1}
                                    className="flex-1 h-12 md:h-14 text-sm md:text-lg font-black bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl md:rounded-2xl shadow-xl shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    BẮT ĐẦU!
                                </Button>

                                {/* Settings Dialog */}
                                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-12 h-12 md:w-14 md:h-14 shrink-0 bg-card/70 border-white/20 text-foreground hover:bg-card/90 backdrop-blur-md shadow-lg shadow-black/10 rounded-xl md:rounded-2xl flex items-center justify-center p-0 transition-all hover:scale-[1.02]"
                                        >
                                            <Settings className="w-5 h-5 text-primary" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 max-w-md w-[95vw] p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem]">
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

                                <Button
                                    onClick={cancelRoom}
                                    variant="destructive"
                                    className="w-12 h-12 md:w-14 md:h-14 shrink-0 font-black rounded-xl md:rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-[9px] md:text-[10px] p-0"
                                >
                                    HỦY
                                </Button>
                            </div>
                        )}

                        {/* Non-host waiting message */}
                        {!isHost && (
                            <div className="order-1 lg:order-2 flex flex-col sm:flex-row gap-2 md:gap-3">
                                <Button
                                    onClick={leaveRoom}
                                    variant="outline"
                                    className="order-2 sm:order-1 h-12 md:h-14 text-sm md:text-base font-bold bg-white/5 border-white/10 text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 rounded-xl md:rounded-2xl transition-all shadow-xl px-6 shrink-0"
                                >
                                    Thoát
                                </Button>
                                <div className="order-1 sm:order-2 flex flex-1 items-center justify-center gap-2 md:gap-3 bg-primary/20 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-4 border border-primary/40 shadow-inner">
                                    <div className="relative">
                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 animate-ping absolute" />
                                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 relative" />
                                    </div>
                                    <span className="text-[10px] md:text-[11px] font-black text-primary tracking-wide uppercase drop-shadow-sm">Đang chờ Host bắt đầu...</span>
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
                    <DialogContent showCloseButton={false} className="w-[95vw] sm:max-w-sm border-white/10 bg-card/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl overflow-hidden text-center">
                        <DialogHeader className="space-y-2">
                            <DialogTitle className="text-xl md:text-2xl font-black text-foreground">Trận đấu đang diễn ra!</DialogTitle>
                            <DialogDescription className="text-sm md:text-base text-foreground/70 font-medium leading-relaxed">
                                Bạn có một phòng đang hoạt động (Phòng: <span className="font-black text-primary px-1.5 py-0.5 bg-primary/10 rounded-lg mx-1">{alreadyInMatchPin || alreadyInMatchId}</span>).
                                <br />Tạo phòng mới sẽ xóa dữ liệu ở phòng cũ. Bạn muốn làm gì?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex flex-col gap-3 mt-6">
                            <Button
                                onClick={handleResign}
                                className="w-full h-12 text-sm md:text-base font-black shadow-xl text-white bg-destructive hover:bg-destructive/90 rounded-xl transition-all"
                            >
                                Rời bỏ và làm mới
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReconnect}
                                className="w-full h-12 text-sm md:text-base font-black bg-white/5 border-white/10 text-foreground hover:bg-white/10 rounded-xl transition-all shadow-lg"
                            >
                                Quay về phòng cũ
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
