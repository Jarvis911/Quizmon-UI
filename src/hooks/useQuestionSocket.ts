import { useEffect, useState } from "react";
import { Howl } from "howler";
import { Socket } from "socket.io-client";

interface AnswerSubmittedPayload {
    questionId: number;
}

interface AnswerResultPayload {
    userId: number;
    questionId: number;
    isCorrect: boolean;
    verdict?: "correct" | "near" | "wrong";
    phase?: "attempt" | "reveal";
}

interface UseQuestionSocketReturn {
    isCorrect: boolean | null;
    isWrong: boolean;
    setIsWrong: React.Dispatch<React.SetStateAction<boolean>>;
    isNear: boolean;
}

const useQuestionSocket = (
    socket: Socket,
    userId: number,
    questionId: number,
    onCorrect: () => void = () => { },
    onIncorrect: () => void = () => { },
    onNear: () => void = () => { }
): UseQuestionSocketReturn => {
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isWrong, setIsWrong] = useState(false);
    const [isNear, setIsNear] = useState(false);

    const correctSound = new Howl({
        src: ["/audio/correct.mp3"],
        volume: 0.5,
    });
    const incorrectSound = new Howl({
        src: ["/audio/incorrect.mp3"],
        volume: 0.5,
    });

    useEffect(() => {
        // Reset state for new question
        setIsCorrect(null);
        setIsWrong(false);
        setIsNear(false);

        const handleAnswerSubmitted = ({ questionId: qId }: AnswerSubmittedPayload) => {
            if (qId === questionId) {
                console.log(`Submitted answer for question ${questionId}`);
            }
        };

        const handleAnswerResult = ({
            userId: resUserId,
            isCorrect: resCorrect,
            questionId: qId,
            verdict,
            phase,
        }: AnswerResultPayload) => {
            if (resUserId === userId && qId === questionId) {
                // TYPEANSWER receives a second "reveal" event when time is up or everyone submitted.
                // We completely ignore it here to prevent playing sounds or updating attempts twice.
                if (phase === "reveal") return;

                setIsCorrect(resCorrect);
                if (resCorrect) {
                    correctSound.play();
                    onCorrect();
                } else {
                    if (verdict === "near") {
                        setIsNear(true);
                        setTimeout(() => setIsNear(false), 650);
                        onNear();
                    } else {
                        incorrectSound.play();
                        setIsWrong(true);
                        setTimeout(() => setIsWrong(false), 600);
                        onIncorrect();
                    }
                }
            }
        };

        const handleError = (message: string) => {
            console.log("Error:", message);
        };

        socket.on("answerSubmitted", handleAnswerSubmitted);
        socket.on("answerResult", handleAnswerResult);
        socket.on("error", handleError);

        return () => {
            socket.off("answerSubmitted", handleAnswerSubmitted);
            socket.off("answerResult", handleAnswerResult);
            socket.off("error", handleError);
        };
    }, [socket, userId, questionId, onCorrect, onIncorrect, onNear]);

    return { isCorrect, isWrong, setIsWrong, isNear };
};

export default useQuestionSocket;
