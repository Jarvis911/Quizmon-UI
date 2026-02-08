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
}

interface UseQuestionSocketReturn {
    isCorrect: boolean | null;
    isWrong: boolean;
    setIsWrong: React.Dispatch<React.SetStateAction<boolean>>;
}

const useQuestionSocket = (
    socket: Socket,
    userId: number,
    questionId: number,
    onCorrect: () => void = () => { },
    onIncorrect: () => void = () => { }
): UseQuestionSocketReturn => {
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isWrong, setIsWrong] = useState(false);

    const correctSound = new Howl({
        src: ["/audio/correct.mp3"],
        volume: 0.5,
    });
    const incorrectSound = new Howl({
        src: ["/audio/incorrect.mp3"],
        volume: 0.5,
    });

    useEffect(() => {
        const handleAnswerSubmitted = ({ questionId: qId }: AnswerSubmittedPayload) => {
            if (qId === questionId) {
                console.log(`Submitted answer for question ${questionId}`);
            }
        };

        const handleAnswerResult = ({
            userId: resUserId,
            isCorrect: resCorrect,
            questionId: qId,
        }: AnswerResultPayload) => {
            if (resUserId === userId && qId === questionId) {
                setIsCorrect(resCorrect);
                if (resCorrect) {
                    correctSound.play();
                    onCorrect();
                } else {
                    incorrectSound.play();
                    setIsWrong(true);
                    setTimeout(() => setIsWrong(false), 600);
                    onIncorrect();
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
    }, [socket, userId, questionId, onCorrect, onIncorrect]);

    return { isCorrect, isWrong, setIsWrong };
};

export default useQuestionSocket;
