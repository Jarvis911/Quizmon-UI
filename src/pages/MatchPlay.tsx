// Question components
import ButtonQuestionPlay from "@/components/question/ButtonQuestionPlay";
import CheckboxQuestionPlay from "@/components/question/CheckboxQuestionPlay";
import RangeQuestionPlay from "@/components/question/RangeQuestionPlay";
import ReorderQuestionPlay from "@/components/question/ReorderQuestionPlay";
import TypeAnswerQuestionPlay from "@/components/question/TypeAnswerQuestionPlay";
import LocationQuestionPlay from "@/components/question/LocationQuestionPlay";
import Leaderboard from "@/components/question/Leaderboard";
// Hook
import { useState, useEffect, useRef, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// UI Components
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import socket from "@/services/socket";
import { Howl } from "howler";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import type { Question, MatchScore, LeaderboardEntry } from "@/types";

interface NextQuestionEvent {
    question: Question;
    timer: number;
}

interface AnswerResultEvent {
    userId: number;
    isCorrect: boolean;
    questionId: number;
}

interface GameOverEvent {
    leaderboard: LeaderboardEntry[];
}

const MatchPlay = () => {
    const { id: matchId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [question, setQuestion] = useState<Question | null>(null);
    const [timer, setTimer] = useState(30);
    const [scores, setScores] = useState<MatchScore[]>([]);
    const [notification, setNotification] = useState<string | null>(null);
    const [explode, setExplode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isTTSEnabled, setIsTTSEnabled] = useState(true);

    const questionRef = useRef<Question | null>(null);
    const backgroundMusicRef = useRef<Howl | null>(null);
    const { width, height } = useWindowSize();

    // Background music
    useEffect(() => {
        backgroundMusicRef.current = new Howl({
            src: ["/audio/background.mp3"],
            loop: true,
            volume: 0.03,
            autoplay: true,
        });

        return () => {
            backgroundMusicRef.current?.stop();
            backgroundMusicRef.current?.unload();
        };
    }, []);

    // Request first question
    useEffect(() => {
        socket.connect();
        socket.emit("requestCurrentQuestion", { matchId });
    }, [matchId]);

    // Socket event handlers
    useEffect(() => {
        if (!user) return;

        const handleNextQuestion = ({ question, timer }: NextQuestionEvent) => {
            console.log("⚡ [Client] nextQuestion received:", question);
            setQuestion(question);
            setTimer(timer);
            setExplode(false);
            setError(null);
            questionRef.current = question;
        };

        const handleTimeUpdate = (remainingTime: number) => {
            setTimer(remainingTime);
        };

        const handleAnswerResult = ({ userId, isCorrect, questionId }: AnswerResultEvent) => {
            if (userId === user.id && questionRef.current?.id === questionId) {
                if (isCorrect) {
                    setExplode(true);
                    setTimeout(() => setExplode(false), 5000);
                }
            }
        };

        const handleUpdateScores = (newScores: MatchScore[]) => {
            setScores([...newScores]);
        };

        const handleGameOver = ({ leaderboard }: GameOverEvent) => {
            backgroundMusicRef.current?.stop();
            console.log("Game over! Leaderboard:", leaderboard);
            setLeaderboard(leaderboard);
            setGameOver(true);
            setNotification("Trận đấu đã kết thúc!");
            setTimeout(() => setNotification(null), 5000);
        };

        const handleError = ({ message }: { message: string }) => {
            setError(message);
        };

        const handleNotification = ({ message }: { message: string }) => {
            setNotification(message);
            setTimeout(() => setNotification(null), 5000);
        };

        socket.on("nextQuestion", handleNextQuestion);
        socket.on("timeUpdate", handleTimeUpdate);
        socket.on("answerResult", handleAnswerResult);
        socket.on("updatedScores", handleUpdateScores);
        socket.on("gameOver", handleGameOver);
        socket.on("error", handleError);
        socket.on("notification", handleNotification);

        return () => {
            socket.off("nextQuestion", handleNextQuestion);
            socket.off("timeUpdate", handleTimeUpdate);
            socket.off("answerResult", handleAnswerResult);
            socket.off("updatedScores", handleUpdateScores);
            socket.off("gameOver", handleGameOver);
            socket.off("error", handleError);
            socket.off("notification", handleNotification);
        };
    }, [matchId, user]);

    // Text-to-speech
    useEffect(() => {
        if (isTTSEnabled && question && "text" in question) {
            speakQuestion((question as Question & { text?: string }).text || "");
        }
    }, [question, isTTSEnabled]);

    const toggleTTS = () => {
        setIsTTSEnabled((prev) => !prev);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    };

    const speakQuestion = (text: string) => {
        if (!window.speechSynthesis) {
            console.warn("[MatchPlay] Web Speech API not supported");
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "vi-VN";
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();
        const vietnameseVoice = voices.find((voice) => voice.lang === "vi-VN");
        if (vietnameseVoice) {
            utterance.voice = vietnameseVoice;
        }
        window.speechSynthesis.speak(utterance);
    };

    if (!user) return null;

    if (gameOver) {
        return <Leaderboard leaderboard={leaderboard} currentUserId={user.id} />;
    }

    const renderQuestion = (): ReactNode => {
        if (!question) {
            return <p className="text-center text-muted-foreground font-medium animate-pulse">Đang chờ câu hỏi...</p>;
        }

        const props = { 
            question, 
            socket, 
            matchId: matchId!, 
            userId: user.id, 
            timer,
            mode: "REALTIME",
            onHomeworkSubmit: () => {} 
        };

        switch (question.type) {
            case "BUTTONS":
                return <ButtonQuestionPlay {...props} />;
            case "CHECKBOXES":
                return <CheckboxQuestionPlay {...props} />;
            case "RANGE":
                return <RangeQuestionPlay {...props} />;
            case "REORDER":
                return <ReorderQuestionPlay {...props} />;
            case "TYPEANSWER":
                return <TypeAnswerQuestionPlay {...props} />;
            case "LOCATION":
                return <LocationQuestionPlay {...props} />;
            default:
                return <p className="text-destructive font-bold">Loại câu hỏi không hỗ trợ</p>;
        }
    };

    return (
        <div className="p-6 top-30 flex flex-col">
            {error && (
                <Alert variant="destructive" className="border-none shadow-xl mb-4">
                    <AlertDescription className="font-bold">{error}</AlertDescription>
                </Alert>
            )}
            {notification && (
                <Alert className="bg-primary/20 border-primary/30 text-primary-foreground mb-4">
                    <AlertDescription className="font-bold">{notification}</AlertDescription>
                </Alert>
            )}
            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-foreground drop-shadow-md">Phòng: {matchId}</h2>
                    <Button className="mt-4 font-bold shadow-md" variant="secondary" onClick={toggleTTS}>
                        {isTTSEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
                    </Button>
                </div>

                <Card className="w-1/3 min-w-48 bg-card/80 backdrop-blur-xl border-white/10 shadow-2xl">
                    <CardHeader className="py-3">
                        <CardTitle className="text-lg font-black text-foreground">Bảng điểm</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                        {scores.map((p) => (
                            <div key={p.userId} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                                <span className="font-semibold text-foreground/90">{p.username}</span>
                                <span className="font-black text-primary">{p.score}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <div className="relative w-full max-w-5xl mx-auto">
                <Progress value={(timer / 30) * 100} className="mb-2 h-4 shadow-inner bg-white/10" />
                <p className="text-center mb-6 text-2xl font-black text-foreground drop-shadow-sm">
                    Điểm: <span className="text-primary">{((timer / 30) * 1000).toFixed(0)}</span>
                </p>
                {renderQuestion()}
                {explode && (
                    <div className="w-full h-full overflow-hidden">
                        <Confetti
                            width={width}
                            height={height}
                            gravity={0.4}
                            recycle={false}
                            numberOfPieces={500}
                            run={explode}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchPlay;
