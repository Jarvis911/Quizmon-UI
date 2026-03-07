import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import endpoints from "@/api/api";
import type { Quiz, LobbyPlayer } from "../types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MatchResponse {
    quiz: Quiz;
    hostId: number;
}

const MatchLobby = () => {
    const { id: matchId } = useParams<{ id: string }>();
    const { user, token } = useAuth();
    const [players, setPlayers] = useState<LobbyPlayer[]>([]);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !matchId) return;

        const fetchMatch = async () => {
            try {
                const res = await axios.get<MatchResponse>(endpoints.match(Number(matchId)), {
                    headers: { Authorization: token },
                });
                setQuiz(res.data.quiz);
                setIsHost(res.data.hostId === user.id);
            } catch (err) {
                console.error(err);
                setError("Cannot load match data!");
            }
        };
        fetchMatch();

        const updatePlayers = (value: LobbyPlayer[]) => {
            setPlayers(value);
        };

        const updateError = (message: string) => {
            setError(message);
        };

        socket.on("gameStarted", () => navigate(`/match/${matchId}/play`));
        socket.on("playerJoined", updatePlayers);
        socket.on("playerLeft", updatePlayers);
        socket.on("error", updateError);

        socket.emit("joinMatch", { matchId, userId: user.id, username: user.username });

        return () => {
            socket.off("playerJoined");
            socket.off("playerLeft");
            socket.off("error", updateError);
            socket.off("gameStarted");
        };
    }, [matchId, user, token, navigate]);

    const startGame = () => {
        socket.emit("startMatch", { matchId });
    };

    if (!user) return null;

    return (
        <div className="p-6 flex gap-8 absolute left-[50%] -translate-x-1/2 top-30">
            {/* Left: Players and Room Code */}
            <div className="flex-1 space-y-6">
                <h2 className="text-2xl font-black text-foreground drop-shadow-sm">Phòng thi đấu: {matchId}</h2>
                <p className="text-foreground/80 font-medium">Mã phòng: <span className="text-primary font-bold">{matchId}</span> (chia sẻ để bạn bè tham gia)</p>
                {error && (
                    <Alert variant="destructive" className="border-none shadow-lg">
                        <AlertDescription className="font-bold">{error}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-foreground">Người chơi ({players.length}/20)</h3>
                    {players.map((p) => (
                        <div key={p.userId} className="flex items-center gap-4 bg-card/40 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                            <Avatar className="ring-2 ring-primary/30">
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold">{p.username[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-foreground">{p.username}</span>
                            {p.userId === user.id && <span className="text-primary font-black ml-auto opacity-80">(Bạn)</span>}
                        </div>
                    ))}
                </div>
                {isHost && (
                    <Button onClick={startGame} className="mt-4 w-full py-6 text-lg font-black shadow-xl hover:scale-[1.02] transition-transform">
                        Bắt đầu game
                    </Button>
                )}
            </div>

            {/* Right: Quiz Info */}
            {quiz && (
                <Card className="w-1/3 min-w-3xs bg-card/80 backdrop-blur-xl border-white/20 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-black text-foreground">{quiz.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CardDescription className="text-foreground/70 font-medium italic">{quiz.description}</CardDescription>
                        {quiz.image && (
                            <div className="relative group">
                                <img src={quiz.image} alt={quiz.title} className="w-full h-40 object-cover rounded-xl shadow-md border border-white/10 group-hover:scale-[1.02] transition-transform duration-300" />
                                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-white/5 p-3 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Số câu hỏi</p>
                                <p className="text-xl font-black text-primary">{quiz.questions?.length || "0"}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Chủ đề</p>
                                <p className="text-sm font-black text-foreground truncate">{quiz.category?.name || "N/A"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MatchLobby;
