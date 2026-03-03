// Question components
import ButtonQuestionPlay from "@/components/question/ButtonQuestionPlay";
import CheckboxQuestionPlay from "@/components/question/CheckboxQuestionPlay";
import RangeQuestionPlay from "@/components/question/RangeQuestionPlay";
import ReorderQuestionPlay from "@/components/question/ReorderQuestionPlay";
import TypeAnswerQuestionPlay from "@/components/question/TypeAnswerQuestionPlay";
import LocationQuestionPlay from "@/components/question/LocationQuestionPlay";
import Leaderboard from "@/components/question/Leaderboard";
// Hook
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
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
import socket from "@/services/socket";
import { Howl } from "howler";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import axios from "axios";
import endpoints from "@/api/api";

// ─── Circular Timer Component ──────────────────────────────────
const CircularTimer = ({ time, maxTime }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = maxTime > 0 ? time / maxTime : 0;
  const offset = circumference * (1 - progress);
  const isUrgent = time <= 5;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        {/* Background ring */}
        <circle
          cx="50" cy="50" r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6" fill="none"
        />
        {/* Progress ring */}
        <circle
          cx="50" cy="50" r={radius}
          stroke={isUrgent ? "#ef4444" : "#a78bfa"}
          strokeWidth="6" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
          style={{
            filter: isUrgent ? "drop-shadow(0 0 8px #ef4444)" : "drop-shadow(0 0 6px #a78bfa)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black ${isUrgent ? "text-red-400 animate-pulse" : "text-white"}`}>
          {time}
        </span>
        <span className="text-[10px] text-white/50 uppercase tracking-wider">giây</span>
      </div>
    </div>
  );
};

// ─── Score Sidebar Player Card ─────────────────────────────────
const PlayerScoreCard = ({ player, rank, isCurrentUser }) => {
  const rankColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];
  const rankEmojis = ["🥇", "🥈", "🥉"];

  return (
    <div
      className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all duration-300 ${isCurrentUser
        ? "bg-purple-500/20 border border-purple-400/30"
        : "hover:bg-white/5"
        }`}
    >
      <span className={`text-sm font-bold w-6 text-center ${rankColors[rank] || "text-white/40"}`}>
        {rank < 3 ? rankEmojis[rank] : `#${rank + 1}`}
      </span>
      <Avatar className="w-7 h-7">
        {player.avatarUrl && <AvatarImage src={player.avatarUrl} />}
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
          {(player.displayName || player.username || "?")[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-white text-xs font-medium truncate flex-1">
        {player.displayName || player.username}
      </span>
      <span className="text-white font-bold text-sm tabular-nums">
        {player.score}
      </span>
    </div>
  );
};

// ─── Main MatchPlay Component ──────────────────────────────────
const MatchPlay = () => {
  const { id: matchId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(30);
  const [maxTimer, setMaxTimer] = useState(30);
  const [scores, setScores] = useState([]);
  const [notification, setNotification] = useState(null);
  const [explode, setExplode] = useState(false);
  const [error, setError] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [showScoreboard, setShowScoreboard] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [confirmEndMatch, setConfirmEndMatch] = useState(false);
  const [confirmSurrender, setConfirmSurrender] = useState(false);

  // Homework mode integration
  const [matchMode, setMatchMode] = useState("REALTIME");
  const [homeworkStatus, setHomeworkStatus] = useState("IN_PROGRESS");
  const [homeworkQuestions, setHomeworkQuestions] = useState([]);
  const [homeworkScore, setHomeworkScore] = useState(0);

  const questionRef = useRef(null);
  const backgroundMusicRef = useRef(null);
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
      backgroundMusicRef.current.stop();
      backgroundMusicRef.current.unload();
    };
  }, []);

  // Fetch match to determine host and mode
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await axios.get(endpoints.match(matchId), {
          headers: { Authorization: token },
        });
        setIsHost(res.data.hostId === user.id);
        setMatchMode(res.data.mode || "REALTIME");

        if (res.data.mode === "HOMEWORK") {
          setHomeworkQuestions(res.data.quiz?.questions || []);
          setHomeworkStatus("IN_PROGRESS");
          setQuestionNumber(1);
          if (res.data.quiz?.questions?.length > 0) {
            setQuestion(res.data.quiz.questions[0]);
            setTimer(res.data.quiz.questions[0].timeLimit || 30);
            setMaxTimer(res.data.quiz.questions[0].timeLimit || 30);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatch();
  }, [matchId, token, user.id]);

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
        const res = await axios.post(endpoints.homework_finish(Number(matchId)), {}, {
          headers: { Authorization: token }
        });
        setHomeworkScore(res.data.score || 0);
        setHomeworkStatus("FINISHED");
        setGameOver(true);
        setNotification("Bạn đã hoàn thành bài tập!");
        setTimeout(() => setNotification(null), 5000);
      } catch (err) {
        console.error("Failed to finish homework", err);
        setError("Có lỗi khi nộp bài tập");
        // Even if error, end the game locally to prevent infinite loops
        setGameOver(true);
      }
    }
  };

  // Request first question
  useEffect(() => {
    if (matchMode === "REALTIME") {
      socket.emit("requestCurrentQuestion", { matchId });
    }
  }, [matchMode]);

  // Socket events (Only for REALTIME)
  useEffect(() => {
    if (matchMode !== "REALTIME") return;

    const handleNextQuestion = ({ question, timer }) => {
      setQuestion(question);
      setTimer(timer);
      setMaxTimer(timer);
      setExplode(false);
      setError(null);
      setQuestionNumber((prev) => prev + 1);
      questionRef.current = question;
    };

    const handleTimeUpdate = (remainingTime) => {
      setTimer(remainingTime);
    };

    const handleAnswerResult = ({ userId, isCorrect, questionId }) => {
      if (userId === user.id && questionRef.current?.id === questionId) {
        if (isCorrect) {
          setExplode(true);
          setTimeout(() => setExplode(false), 5000);
        }
      }
    };

    const handleUpdateScores = (newScores) => {
      setScores([...newScores]);
    };

    const handleGameOver = ({ leaderboard }) => {
      backgroundMusicRef.current.stop();
      setLeaderboard(leaderboard);
      setGameOver(true);
      setNotification("Trận đấu đã kết thúc!");
      setTimeout(() => setNotification(null), 5000);
    };

    const handleError = ({ message }) => setError(message);

    const handleNotification = ({ message }) => {
      setNotification(message);
      setTimeout(() => setNotification(null), 5000);
    };

    const handleSurrendered = () => {
      backgroundMusicRef.current?.stop();
      navigate('/');
    };

    const handlePlayerSurrendered = ({ userId: surrenderedId, remainingPlayers }) => {
      const surrenderedPlayer = scores.find(p => p.userId === surrenderedId);
      const name = surrenderedPlayer?.displayName || surrenderedPlayer?.username || `Player ${surrenderedId}`;
      setNotification(`🏳️ ${name} đã đầu hàng!`);
      setTimeout(() => setNotification(null), 4000);
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
    };
  }, [matchId, user.id, matchMode]);

  // TTS
  useEffect(() => {
    if (isTTSEnabled && question?.text) {
      speakQuestion(question.text);
    }
  }, [question, isTTSEnabled]);

  const toggleTTS = () => {
    setIsTTSEnabled((prev) => !prev);
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  };

  const speakQuestion = (text) => {
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

  // Game Over → Leaderboard or Homework Results
  if (gameOver) {
    if (matchMode === "HOMEWORK") {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã nộp bài!</h2>
            <p className="text-gray-600 mb-6">Số điểm bạn đạt được</p>
            <div className="text-5xl font-black text-indigo-600 mb-8">{homeworkScore}</div>
            <button
              onClick={() => navigate('/classrooms')}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors w-full"
            >
              Về danh sách lớp
            </button>
          </div>
        </div>
      );
    }
    return <Leaderboard leaderboard={leaderboard} currentUserId={user.id} />;
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

    const props = { question, socket, matchId, userId: user.id, timer, mode: matchMode, onHomeworkSubmit: matchMode === "HOMEWORK" ? handleNextHomeworkQuestion : undefined };
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
        return <p className="text-red-400 text-center">Loại câu hỏi không hỗ trợ</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* ── Top Bar ── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        {/* Left: Question counter & controls */}
        <div className="flex items-center gap-3">
          {questionNumber > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
              <span className="text-white/60 text-sm">Câu</span>
              <span className="text-white font-bold text-lg">{questionNumber}</span>
            </div>
          )}
          <button
            onClick={toggleTTS}
            className={`p-2 rounded-xl transition-all duration-300 ${isTTSEnabled
              ? "bg-purple-500/30 text-purple-300 hover:bg-purple-500/40"
              : "bg-white/10 text-white/40 hover:bg-white/15"
              }`}
            title={isTTSEnabled ? "Tắt giọng nói" : "Bật giọng nói"}
          >
            {isTTSEnabled ? "🔊" : "🔇"}
          </button>

          {/* Host: End Match / Player: Surrender */}
          {isHost ? (
            <button
              onClick={() => setConfirmEndMatch(true)}
              className="px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-all"
            >
              ⏹ Kết thúc trận
            </button>
          ) : (
            <button
              onClick={() => setConfirmSurrender(true)}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white/60 text-xs font-semibold hover:bg-white/15 hover:text-white/80 transition-all"
            >
              🏳️ Đầu hàng
            </button>
          )}
        </div>

        {/* Center: Timer */}
        <CircularTimer time={timer} maxTime={maxTimer} />

        {/* Right: Score toggle & potential points */}
        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 text-center">
            <span className="text-[10px] text-white/50 uppercase tracking-wider block">Điểm tiềm năng</span>
            <span className="text-white font-bold text-lg tabular-nums">{potentialPoints}</span>
          </div>
          <button
            onClick={() => setShowScoreboard(!showScoreboard)}
            className="p-2 rounded-xl bg-white/10 text-white/60 hover:bg-white/15 transition-all"
            title="Bảng điểm"
          >
            🏆
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
          <div className="mb-3 max-w-xl mx-auto bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 text-white text-center text-sm animate-in fade-in slide-in-from-top-4 duration-500">
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
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sticky top-4">
              <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                🏆 Bảng xếp hạng
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

      {/* ── Confetti ── */}
      {explode && (
        <div className="fixed inset-0 z-50 pointer-events-none">
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

      {/* ── End Match Confirmation (Host) ── */}
      <Dialog open={confirmEndMatch} onOpenChange={setConfirmEndMatch}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-center">⏹ Kết thúc trận đấu?</DialogTitle>
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
              ⏹ Kết thúc ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Surrender Confirmation (Player) ── */}
      <Dialog open={confirmSurrender} onOpenChange={setConfirmSurrender}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-center">🏳️ Đầu hàng?</DialogTitle>
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
              🏳️ Đầu hàng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchPlay;
