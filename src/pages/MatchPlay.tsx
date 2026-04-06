import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import socket from "@/services/socket";
import apiClient from "@/api/client";
import endpoints, { getAvatarUrl } from "@/api/api";
import { Howl } from "howler";
import { useWindowSize } from "react-use";
import ReactPlayer from "react-player";

// Types
import type { Question, LeaderboardEntry, Quiz } from "../types";

// UI Components
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

// Question components
import ButtonQuestionPlay from "@/components/question/ButtonQuestionPlay";
import CheckboxQuestionPlay from "@/components/question/CheckboxQuestionPlay";
import ReorderQuestionPlay from "@/components/question/ReorderQuestionPlay";
import TypeAnswerQuestionPlay from "@/components/question/TypeAnswerQuestionPlay";
import LocationQuestionPlay from "@/components/question/LocationQuestionPlay";
import Leaderboard from "@/components/question/Leaderboard";

interface PlayerScore {
    userId: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    score: number;
}

interface MatchResponse {
    id: number;
    hostId: number;
    mode: "REALTIME" | "HOMEWORK";
    musicUrl?: string;
    quiz?: Quiz;
    participants?: {
        user: {
            id: number;
            username: string;
            avatarUrl?: string;
        };
    }[];
}

type MatchMode = "REALTIME" | "HOMEWORK";

// ─── Score Progress Bar Component ──────────────────────────────
interface ScoreProgressBarProps {
    time: number;
    maxTime: number;
    potentialPoints: number;
}

const ScoreProgressBar = ({ time, maxTime, potentialPoints }: ScoreProgressBarProps) => {
    const progress = maxTime > 0 ? (time / maxTime) * 100 : 0;
    const isUrgent = time <= 5;

    return (
        <div className="flex-1 max-w-xl mx-4 sm:mx-8 relative">
            <div className="h-6 w-full bg-black/20 backdrop-blur-md rounded-full border-2 border-black/40 overflow-hidden relative shadow-inner">
                {/* The animated decreasing stripe bar */}
                <div
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear animate-stripe-slide rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] ${isUrgent ? "opacity-90" : ""}`}
                    style={{ width: `${progress}%` }}
                >
                    {/* Inner Shadow for depth */}
                    <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]" />
                </div>
                
                {/* Score Number - Positioned dynamically at the end of the progress */}
                <div 
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear flex items-center justify-center"
                    style={{ left: `${Math.max(5, progress)}%` }}
                >
                   <span className="text-white text-sm sm:text-base font-black tabular-nums tracking-tighter drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] px-2 bg-black/20 rounded-full backdrop-blur-sm -translate-x-1/2">
                        {potentialPoints.toLocaleString()}
                    </span>
                </div>
            </div>
            {/* Urgent glow pulse */}
            {isUrgent && (
                <div className="absolute -inset-1 bg-red-500/10 rounded-full blur animate-pulse pointer-events-none" />
            )}
        </div>
    );
};

// ─── Score Sidebar Player Card ─────────────────────────────────
interface PlayerScoreCardProps {
    player: PlayerScore;
    rank: number;
    isCurrentUser: boolean;
}

const PlayerScoreCard = ({ player, rank, isCurrentUser }: PlayerScoreCardProps) => {
    const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-700"];
    const rankEmojis = ["🥇", "🥈", "🥉"];

    return (
        <div
            className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all duration-300 ${isCurrentUser
                ? "bg-primary/20 border border-primary/30 shadow-sm"
                : "hover:bg-card/40"
                }`}
        >
            <span className={`text-sm font-black w-6 text-center ${rankColors[rank] || "text-foreground/30"}`}>
                {rank < 3 ? rankEmojis[rank] : `#${rank + 1}`}
            </span>
            <Avatar className="w-7 h-7 border border-white/10 shadow-sm">
                {player.avatarUrl && <AvatarImage src={getAvatarUrl(player.avatarUrl)} />}
                <AvatarFallback className="bg-primary text-white text-[10px] font-black">
                    {(player.displayName || player.username || "?")[0].toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <span className="text-foreground text-xs font-bold truncate flex-1">
                {player.displayName || player.username}
            </span>
            <span className="text-foreground font-black text-sm tabular-nums">
                {player.score.toLocaleString()}
            </span>
        </div>
    );
};

// ─── Main MatchPlay Component ──────────────────────────────────
const MatchPlay = () => {
    const { id: matchId } = useParams<{ id: string }>();
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [question, setQuestion] = useState<Question | null>(null);
    const [timer, setTimer] = useState(30);
    const [maxTimer, setMaxTimer] = useState(30);
    const [scores, setScores] = useState<PlayerScore[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isTTSEnabled, setIsTTSEnabled] = useState(true);
    const [explode, setExplode] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [showScoreboard, setShowScoreboard] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [confirmEndMatch, setConfirmEndMatch] = useState(false);
    const [confirmSurrender, setConfirmSurrender] = useState(false);
    const [musicUrl, setMusicUrl] = useState<string>("/audio/background.mp3");
    const [correctAnswerInfo, setCorrectAnswerInfo] = useState<any>(null);
    const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

    // Homework mode integration
    const [matchMode, setMatchMode] = useState<MatchMode>("REALTIME");
    const [homeworkQuestions, setHomeworkQuestions] = useState<Question[]>([]);
    const [homeworkScore, setHomeworkScore] = useState(0);

    const questionRef = useRef<Question | null>(null);
    const { width, height } = useWindowSize();

    // Fetch match to determine host and mode
    useEffect(() => {
        if (!matchId) return;
        const fetchMatch = async () => {
            try {
                const res = await apiClient.get<MatchResponse>(endpoints.match(Number(matchId)));
                setIsHost(res.data.hostId === user?.id);
                setMatchMode(res.data.mode || "REALTIME");
                if (res.data.musicUrl) {
                    setMusicUrl(res.data.musicUrl);
                }

                if (res.data.mode === "HOMEWORK") {
                    const qList = res.data.quiz?.questions || [];
                    setHomeworkQuestions(qList);
                    setQuestionNumber(1);
                    if (qList.length > 0) {
                        const firstQ = qList[0];
                        setQuestion(firstQ);
                        setTimer(firstQ.timeLimit || 30);
                        setMaxTimer(firstQ.timeLimit || 30);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchMatch();
    }, [matchId, token, user?.id]);

    // Handle Homework specific countdown and submission
    useEffect(() => {
        if (matchMode !== "HOMEWORK" || gameOver || !question) return;

        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0; // The Question component will auto-submit when timer hits 0
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [matchMode, gameOver, question]);

    const handleNextHomeworkQuestion = async () => {
        if (questionNumber < homeworkQuestions.length) {
            const nextQ = homeworkQuestions[questionNumber];
            setQuestion(nextQ);
            setQuestionNumber((prev) => prev + 1);
            setTimer(nextQ.timeLimit || 30);
            setMaxTimer(nextQ.timeLimit || 30);
        } else {
            // Finish homework
            try {
                const res = await apiClient.post<{ score: number }>(endpoints.homework_finish(Number(matchId)), {});
                setHomeworkScore(res.data.score || 0);
                setGameOver(true);
                setNotification("Bạn đã hoàn thành bài tập!");
                setTimeout(() => setNotification(null), 5000);
            } catch (err) {
                console.error("Failed to finish homework", err);
                setError("Có lỗi khi nộp bài tập");
                setGameOver(true);
            }
        }
    };

    // Request first question
    useEffect(() => {
        if (matchMode === "REALTIME") {
            socket.emit("requestCurrentQuestion", { matchId });
        }
    }, [matchMode, matchId]);

    // Socket events (Only for REALTIME)
    useEffect(() => {
        if (matchMode !== "REALTIME" || !user) return;

        const handleNextQuestion = ({ question, timer, isPaused: initialPaused }: { question: Question, timer: number, isPaused?: boolean }) => {
            setQuestion(question);
            setTimer(timer);
            setMaxTimer(timer);
            setIsPaused(initialPaused || false);
            setExplode(false);
            setError(null);
            setFeedback(null); // Clear previous feedback
            setCorrectAnswerInfo(null);
            setShowCorrectAnswer(false);
            setQuestionNumber((prev) => prev + 1);
            questionRef.current = question;
        };

        const handleTimeUpdate = (remainingTime: number) => {
            setTimer(remainingTime);
        };

        const handleAnswerResult = ({ userId, isCorrect, questionId, correctAnswer }: { userId: number, isCorrect: boolean, questionId: number, correctAnswer?: any }) => {
            if (userId === user.id && questionRef.current?.id === questionId) {
                triggerFeedback(isCorrect);
            }
            // Always store correct answer for current question
            if (questionRef.current?.id === questionId) {
                setCorrectAnswerInfo(correctAnswer);
                setShowCorrectAnswer(true);
            }
        };

        const handleUpdateScores = (newScores: PlayerScore[]) => {
            setScores([...newScores]);
        };

        const handleGameOver = ({ leaderboard }: { leaderboard: LeaderboardEntry[] }) => {
            setLeaderboard(leaderboard);
            setGameOver(true);
            setNotification("Trận đấu đã kết thúc!");
            setTimeout(() => setNotification(null), 5000);
        };

        const handleError = ({ message }: { message: string }) => setError(message);

        const handleNotification = ({ message }: { message: string }) => {
            setNotification(message);
            setTimeout(() => setNotification(null), 5000);
        };

        const handleSurrendered = () => {
            navigate('/');
        };

        const handlePlayerSurrendered = ({ userId: surrenderedId }: { userId: number, remainingPlayers: number }) => {
            const surrenderedPlayer = scores.find(p => p.userId === surrenderedId);
            const name = surrenderedPlayer?.displayName || surrenderedPlayer?.username || `Người chơi ${surrenderedId}`;
            setNotification(`${name} đã đầu hàng!`);
            setTimeout(() => setNotification(null), 4000);
        };

        const handlePauseStatusUpdated = ({ isPaused }: { isPaused: boolean }) => {
            setIsPaused(isPaused);
        };

        const handleSettingsUpdated = (settings: { musicUrl?: string }) => {
            if (settings.musicUrl !== undefined) {
                setMusicUrl(settings.musicUrl || "/audio/background.mp3");
            }
        };

        socket.on("nextQuestion", handleNextQuestion);
        socket.on("timeUpdate", handleTimeUpdate);
        socket.on("answerResult", handleAnswerResult);
        socket.on("updatedScores", handleUpdateScores);
        socket.on("gameOver", handleGameOver);
        socket.on("error", handleError);
        socket.on("notification", handleNotification);
        socket.on("surrendered", handleSurrendered);
        socket.on("playerSurrendered", handlePlayerSurrendered);
        socket.on("matchSettingsUpdated", handleSettingsUpdated);
        socket.on("pauseStatusUpdated", handlePauseStatusUpdated);

        return () => {
            socket.off("nextQuestion", handleNextQuestion);
            socket.off("timeUpdate", handleTimeUpdate);
            socket.off("answerResult", handleAnswerResult);
            socket.off("updatedScores", handleUpdateScores);
            socket.off("gameOver", handleGameOver);
            socket.off("error", handleError);
            socket.off("notification", handleNotification);
            socket.off("surrendered", handleSurrendered);
            socket.off("playerSurrendered", handlePlayerSurrendered);
            socket.off("matchSettingsUpdated", handleSettingsUpdated);
            socket.off("pauseStatusUpdated", handlePauseStatusUpdated);
        };
    }, [matchId, user, matchMode, scores, navigate]);

    // TTS
    useEffect(() => {
        if (isTTSEnabled && question?.title) {
            speakQuestion(question.title);
        }
    }, [question, isTTSEnabled]);

    const toggleTTS = () => {
        setIsTTSEnabled((prev) => !prev);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    };

    const speakQuestion = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "vi-VN";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const vietnameseVoice = voices.find((v) => v.lang === "vi-VN");
        if (vietnameseVoice) utterance.voice = vietnameseVoice;
        window.speechSynthesis.speak(utterance);
    };

    const triggerFeedback = (isCorrect: boolean) => {
        setFeedback(isCorrect ? 'correct' : 'wrong');
        // Removed timeout to persist feedback until next question
    };

    // Game Over → Leaderboard or Homework Results
    if (gameOver) {
        if (matchMode === "HOMEWORK") {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
                    <div className="bg-card/40 backdrop-blur-3xl rounded-4xl shadow-2xl overflow-hidden border border-white/10 p-10 max-w-md w-full text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-primary/10">
                            <span className="text-5xl font-black">🎉</span>
                        </div>
                        <h2 className="text-3xl font-black text-foreground mb-2 drop-shadow-sm">Hoàn thành!</h2>
                        <p className="text-foreground/60 font-bold mb-8 uppercase tracking-widest text-xs">Số điểm đạt được</p>
                        <div className="text-7xl font-black text-primary mb-10 drop-shadow-2xl tabular-nums animate-pulse">{homeworkScore.toLocaleString()}</div>
                        <button
                            onClick={() => navigate('/classrooms')}
                            className="px-8 py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 transition-all w-full shadow-xl shadow-primary/20 hover:translate-y-[-2px] active:translate-y-px"
                        >
                            VỀ DANH SÁCH LỚP
                        </button>
                    </div>
                </div>
            );
        }
        return <Leaderboard leaderboard={leaderboard} currentUserId={user?.id || 0} />;
    }

    // Sorted scores for sidebar
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const potentialPoints = maxTimer > 0 ? Math.round((timer / maxTimer) * 1000) : 0;

    // Render question by type
    const renderQuestion = () => {
        if (!question) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-white/40">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-purple-400 rounded-full animate-spin mb-4" />
                    <p className="text-lg">Đang chờ câu hỏi...</p>
                </div>
            );
        }

        const props = {
            question,
            socket,
            matchId: Number(matchId),
            userId: user?.id || 0,
            timer,
            mode: matchMode,
            onHomeworkSubmit: matchMode === "HOMEWORK" ? handleNextHomeworkQuestion : undefined,
            onResult: triggerFeedback,
            correctAnswer: correctAnswerInfo
        };

        // Casting to any for component props to avoid complex discriminative union issues in this view
        switch (question.type) {
            case "BUTTONS":
                return <ButtonQuestionPlay {...(props as any)} />;
            case "CHECKBOXES":
                return <CheckboxQuestionPlay {...(props as any)} />;
            case "REORDER":
                return <ReorderQuestionPlay {...(props as any)} />;
            case "TYPEANSWER":
                return <TypeAnswerQuestionPlay {...(props as any)} />;
            case "LOCATION":
                return <LocationQuestionPlay {...(props as any)} />;
            default:
                return <p className="text-red-400 text-center">Loại câu hỏi không hỗ trợ</p>;
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col">
            {/* Feedback Overlay */}

            {/* Feedback Overlay */}
            <div
                className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-300 ${feedback === 'correct'
                    ? 'bg-green-500/20 opacity-100'
                    : feedback === 'wrong'
                        ? 'bg-red-500/20 opacity-100'
                        : 'opacity-0'
                    }`}
            />

            {/* --- Removed redundant overlay because each question component now highlights its own correct answer. --- */}

            {/* Pause Overlay */}
            {isPaused && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-[blur(2px)] animate-in fade-in duration-300">
                    <div className="bg-card/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl text-center scale-up-center max-w-sm w-full mx-4">
                        <div className="w-24 h-24 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-amber-500/10">
                            <span className="text-5xl animate-pulse">⏸️</span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Đang tạm dừng</h2>
                        <p className="text-white/50 font-bold uppercase tracking-widest text-[10px] mb-8">
                            {isHost ? "Bạn đã tạm dừng trận đấu" : "Vui lòng chờ host tiếp tục"}
                        </p>
                        
                        {isHost && (
                            <button
                                onClick={() => socket.emit("togglePause", { matchId })}
                                className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                TIẾP TỤC TRẬN ĐẤU
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Hidden Background Music Player */}
            <div className="hidden">
                <ReactPlayer
                    url={musicUrl}
                    playing={!gameOver}
                    loop={true}
                    volume={0.03}
                    width={0}
                    height={0}
                />
            </div>

            {/* ── Top Bar ── */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4">
                {/* Left: Question counter & controls */}
                <div className="flex items-center gap-3">
                    {questionNumber > 0 && (
                        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm">
                            <span className="text-foreground/60 text-sm">Câu</span>
                            <span className="text-foreground font-extrabold text-lg">{questionNumber}</span>
                        </div>
                    )}
                    <button
                        onClick={toggleTTS}
                        className={`p-2 rounded-xl transition-all duration-300 font-bold text-sm ${isTTSEnabled
                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                            : "bg-card/40 text-foreground/40 hover:bg-card/60"
                            }`}
                        title={isTTSEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
                    >
                        {isTTSEnabled ? "Âm thanh" : "Tắt âm"}
                    </button>

                    {/* Host: Game Controls */}
                    {isHost && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => socket.emit("togglePause", { matchId })}
                                className={`px-3 py-2 rounded-xl border font-black uppercase text-[10px] tracking-tight transition-all shadow-sm ${
                                    isPaused 
                                    ? "bg-green-500/20 border-green-500/30 text-green-500 hover:bg-green-500/30" 
                                    : "bg-amber-500/20 border-amber-500/30 text-amber-500 hover:bg-amber-500/30"
                                }`}
                            >
                                {isPaused ? "Tiếp tục" : "Tạm dừng"}
                            </button>
                            <button
                                onClick={() => socket.emit("skipQuestion", { matchId })}
                                className="px-3 py-2 rounded-xl bg-slate-500/20 border border-slate-500/30 text-slate-400 text-[10px] font-black uppercase tracking-tight hover:bg-slate-500/30 transition-all shadow-sm"
                            >
                                Bỏ qua câu
                            </button>
                        </div>
                    )}

                    {/* Host: End Match / Player: Surrender */}
                    {isHost ? (
                        <button
                            onClick={() => setConfirmEndMatch(true)}
                            className="px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-black uppercase tracking-tight hover:bg-destructive/20 transition-all shadow-sm"
                        >
                            Kết thúc
                        </button>
                    ) : (
                        <button
                            onClick={() => setConfirmSurrender(true)}
                            className="px-3 py-2 rounded-xl bg-card/40 border border-white/10 text-foreground/60 text-xs font-black uppercase tracking-tight hover:bg-card/60 hover:text-foreground transition-all shadow-sm"
                        >
                            Đầu hàng
                        </button>
                    )}
                </div>

                {/* Center: Score & Progress */}
                <ScoreProgressBar time={timer} maxTime={maxTimer} potentialPoints={potentialPoints} />

                {/* Right: Score toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowScoreboard(!showScoreboard)}
                        className="p-3 rounded-xl bg-card/40 text-foreground/60 hover:bg-card/60 hover:text-foreground transition-all shadow-sm"
                        title="Bảng điểm"
                    >
                        Bảng điểm
                    </button>
                </div>
            </div>

            {/* ── Notifications ── */}
            <div className="relative z-20 px-6">
                {error && (
                    <Alert variant="destructive" className="mb-3 max-w-xl mx-auto">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {notification && (
                    <div className="mb-3 max-w-xl mx-auto bg-primary/20 backdrop-blur-xl border border-primary/30 rounded-xl px-4 py-3 text-primary font-bold text-center text-sm shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                        {notification}
                    </div>
                )}
            </div>

            {/* ── Main Content Area ── */}
            <div className="relative z-10 flex px-6 pb-6 gap-4" style={{ minHeight: "calc(100vh - 140px)" }}>
                {/* Question Area */}
                <div className="flex-1 flex items-start justify-center">
                    <div className="w-full max-w-4xl">
                        {renderQuestion()}
                    </div>
                </div>

                {/* ── Scoreboard Sidebar ── */}
                {showScoreboard && sortedScores.length > 0 && (
                    <div className="w-64 shrink-0 animate-in slide-in-from-right-8 duration-500">
                        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sticky top-4 shadow-xl">
                            <h3 className="text-foreground/40 text-[10px] font-black uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                                Bảng xếp hạng
                            </h3>
                            <div className="space-y-1">
                                {sortedScores.map((player, idx) => (
                                    <PlayerScoreCard
                                        key={player.userId}
                                        player={player}
                                        rank={idx}
                                        isCurrentUser={player.userId === user.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* ── End Match Confirmation (Host) ── */}
            <Dialog open={confirmEndMatch} onOpenChange={setConfirmEndMatch}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white text-center">Kết thúc trận đấu?</DialogTitle>
                    </DialogHeader>
                    <p className="text-white/60 text-sm text-center">
                        Trận đấu sẽ kết thúc ngay lập tức. Bảng xếp hạng cuối trận sẽ được hiển thị cho tất cả người chơi.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmEndMatch(false)}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                        >
                            Huỷ
                        </Button>
                        <Button
                            onClick={() => {
                                socket.emit("endMatch", { matchId });
                                setConfirmEndMatch(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Kết thúc ngay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Surrender Confirmation (Player) ── */}
            <Dialog open={confirmSurrender} onOpenChange={setConfirmSurrender}>
                <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white text-center">Đầu hàng?</DialogTitle>
                    </DialogHeader>
                    <p className="text-white/60 text-sm text-center">
                        Bạn sẽ rời khỏi trận đấu và không thể quay lại. Điểm số hiện tại sẽ được giữ lại.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmSurrender(false)}
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                        >
                            Tiếp tục chơi
                        </Button>
                        <Button
                            onClick={() => {
                                socket.emit("surrender", { matchId });
                                setConfirmSurrender(false);
                            }}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            Đầu hàng
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatchPlay;
