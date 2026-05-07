import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import QuestionMedia from "./QuestionMedia";
import useQuestionSocket from "@/hooks/useQuestionSocket";
import apiClient from "@/api/client";
import endpoints from "../../api/api";

type AttemptVerdict = "correct" | "near" | "wrong";
type Attempt = { text: string; verdict: AttemptVerdict; createdAt: number };

const normalizeAnswer = (s: string) => {
  // Lowercase, remove diacritics, normalize spaces & punctuation for forgiving matching.
  // Note: keep numbers/letters; remove most punctuation.
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[b.length];
};

const getVerdict = (userAnswer: string, correct: string): AttemptVerdict => {
  const ua = normalizeAnswer(userAnswer);
  const ca = normalizeAnswer(correct);
  if (!ua || !ca) return "wrong";
  if (ua === ca) return "correct";

  const dist = levenshtein(ua, ca);
  const maxLen = Math.max(ua.length, ca.length);
  const similarity = maxLen === 0 ? 0 : 1 - dist / maxLen;

  // "Near" heuristic: allow small edits, or high similarity for longer answers
  const nearByDistance = dist <= (maxLen >= 12 ? 2 : 1);
  const nearBySimilarity = similarity >= (maxLen >= 12 ? 0.82 : 0.88);
  return nearByDistance || nearBySimilarity ? "near" : "wrong";
};

const TypeAnswerQuestionPlay = ({ question, socket, matchId, userId, timer, mode, onHomeworkSubmit, onResult, onAnswered, correctAnswer }) => {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [flash, setFlash] = useState<AttemptVerdict | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLockedCorrect, setIsLockedCorrect] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);

  const localCorrectAnswer = useMemo(() => {
    // Prefer question data (if present); fall back to `correctAnswer` (parent-provided) for homework/review contexts.
    const fromData = question?.data?.correctAnswer;
    if (typeof fromData === "string" && fromData.trim()) return fromData.trim();
    if (typeof correctAnswer === "string" && correctAnswer.trim()) return correctAnswer.trim();
    return null;
  }, [question, correctAnswer]);

  const attemptKeySet = useMemo(() => new Set(attempts.map((a) => normalizeAnswer(a.text))), [attempts]);

  const pushAttempt = (text: string, verdict: AttemptVerdict) => {
    setAttempts((prev) => [{ text, verdict, createdAt: Date.now() }, ...prev].slice(0, 8));
  };

  const pulse = (verdict: AttemptVerdict) => {
    setFlash(verdict);
    window.setTimeout(() => setFlash(null), 650);
  };

  const { isCorrect, isWrong, setIsWrong } = useQuestionSocket(
    socket,
    userId,
    question.id,
    () => {
      setIsLockedCorrect(true);
      pulse("correct");
      onResult?.(true);
      onAnswered?.(); // Mark final only when actually correct
      if (lastSubmitted) pushAttempt(lastSubmitted, "correct");
    },
    () => {
      // Wrong attempt should not end the question.
      onResult?.(false);
      // keep existing shake behavior from the hook, but also flash red background locally
      pulse("wrong");
      if (lastSubmitted) pushAttempt(lastSubmitted, "wrong");
    },
    () => {
      // Near-correct: do not shake, just highlight
      pulse("near");
      if (lastSubmitted) pushAttempt(lastSubmitted, "near");
    }
  );

  useEffect(() => {
    setAnswer("");
    setAttempts([]);
    setFlash(null);
    setIsSubmitting(false);
    setIsLockedCorrect(false);
    setLastSubmitted(null);
  }, [question.id]);

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting || isLockedCorrect || timer <= 0) return;
    const finalAnswer = answer.trim();
    setLastSubmitted(finalAnswer);
    const key = normalizeAnswer(finalAnswer);
    if (!key || attemptKeySet.has(key)) {
      // Avoid re-sending identical attempts; still give a subtle hint.
      pulse("near");
      return;
    }

    setIsSubmitting(true);

    // If we have a local correct answer (homework contexts), we can grade immediately for "near".
    if (localCorrectAnswer && mode === "HOMEWORK") {
      const verdict = getVerdict(finalAnswer, localCorrectAnswer);
      if (verdict === "correct") {
        pushAttempt(finalAnswer, "correct");
        setIsLockedCorrect(true);
        pulse("correct");
        onResult?.(true);
        onAnswered?.();
        setIsSubmitting(false);
        return;
      }
      pushAttempt(finalAnswer, verdict);
      if (verdict === "near") pulse("near");
      else {
        // keep shake consistent with other question types
        setIsWrong(true);
        window.setTimeout(() => setIsWrong(false), 600);
        pulse("wrong");
      }
    } else {
      // Realtime: server will return verdict; don't pre-classify here.
    }

    if (mode === "HOMEWORK") {
      try {
        const res = await apiClient.post(endpoints.homework_answer(Number(matchId)), {
          questionId: question.id,
          answerData: finalAnswer
        });
        if (res.data.isCorrect) {
          setIsLockedCorrect(true);
          pulse("correct");
          onResult?.(true);
          onAnswered?.();
          if (onHomeworkSubmit) onHomeworkSubmit();
        } else {
          pulse(localCorrectAnswer ? getVerdict(finalAnswer, localCorrectAnswer) : "wrong");
          onResult?.(false);
        }
      } catch (err) {
        console.error("Failed to submit homework answer", err);
      }
    } else {
      socket.emit("submitAnswer", {
        matchId,
        userId,
        questionId: question.id,
        answer: finalAnswer,
      });
      // allow user to try again immediately; clear input for faster iteration
      setAnswer("");
    }
    // small debounce to prevent double submits
    window.setTimeout(() => setIsSubmitting(false), 450);
  };

  // Auto-submit when timer runs out
  useEffect(() => {
    if (timer === 0 && mode !== "HOMEWORK" && !isLockedCorrect) {
      // do nothing: we don't want to auto-submit a potentially wrong attempt and end/lock UX
    }
  }, [timer, mode, isLockedCorrect]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const wrapperClass = `w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 p-4 relative transition-all duration-300 ${isWrong ? "animate-shake" : ""}`;

  const inputFlashClass =
    flash === "correct"
      ? "border-green-500/60 bg-green-500/10 text-green-300"
      : flash === "near"
        ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-200"
        : flash === "wrong"
          ? "border-red-500/60 bg-red-500/10 text-red-200"
          : "";

  return (
    <div className={wrapperClass}>
      <QuestionMedia media={question.media?.[0]} />
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl text-foreground flex-1 flex flex-col justify-between">
        <div>
          <h2 className="min-w-[250px] max-w-full wrap-break-word text-2xl font-black mb-6 text-foreground drop-shadow-sm">
            {question.text}
          </h2>
          <div className="relative">
            <Input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu trả lời..."
              disabled={isLockedCorrect || timer <= 0}
              className={`bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/40 text-xl py-8 rounded-2xl focus:ring-primary focus:border-primary transition-all border-2 ${inputFlashClass} ${isLockedCorrect ? "border-green-500/50 bg-green-500/5 text-green-400" : ""}`}
            />
            {attempts.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                  Bạn đã nhập
                </p>
                <div className="flex flex-wrap gap-2">
                  {attempts.map((a) => {
                    const badgeClass =
                      a.verdict === "correct"
                        ? "border-green-500/30 bg-green-500/10 text-green-200"
                        : a.verdict === "near"
                          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
                          : "border-red-500/30 bg-red-500/10 text-red-200";
                    const label = a.verdict === "correct" ? "Đúng" : a.verdict === "near" ? "Gần đúng" : "Sai";
                    return (
                      <div
                        key={`${a.createdAt}-${a.text}`}
                        className={`px-3 py-2 rounded-xl border text-sm font-bold ${badgeClass}`}
                        title={label}
                      >
                        <span className="opacity-80 mr-2 text-[10px] font-black uppercase tracking-widest">{label}</span>
                        <span className="font-black">{a.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting || isLockedCorrect || timer <= 0}
          className="mt-6 w-full text-lg font-black bg-primary text-primary-foreground rounded-2xl py-6 shadow-lg hover:translate-y-[-2px] active:translate-y-px transition-all"
        >
          {isLockedCorrect ? "CHÍNH XÁC!" : isSubmitting ? "ĐANG KIỂM TRA..." : "XÁC NHẬN"}
        </Button>
      </div>
    </div>
  );
};

export default TypeAnswerQuestionPlay;