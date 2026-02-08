// UI components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTrigger, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Star } from "lucide-react"; 
// Hook
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
// Call api
import axios from "axios";
import endpoints from "@/api/api.js"

const Leaderboard = ({ leaderboard, currentUserId }) => {
  const { id: matchId } = useParams();
  const { token } = useAuth();
  const [quizId, setQuizId] = useState(null);
  const [isRated, setIsRated] = useState(true);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  // Fetch match and check if is rated by user?
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await axios.get(endpoints.match(matchId), {
          headers: { Authorization: token },
        });
        const qId = res.data.quizId;
        setQuizId(qId);
        console.log("quiz Id:", qId);

        const ratedRes = await axios.get(endpoints.quiz_isRated(qId), {
          headers: { Authorization: token },
        });
        if (ratedRes) {
          setIsRated(ratedRes.data.rated);
          setOpen(!ratedRes.data.rated);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatch();
  }, [matchId, token]);

  // When submit rating, reset modals
  const handleSubmitRating = async () => {
    try {
      await axios.post(endpoints.rating, {quizId: quizId, rating, text}, {
        headers: {Authorization: token},
      });

      setOpen(false);
      setIsRated(true);
      alert("Đánh giá thành công!");
    } catch (err) {
      console.error(err);
    }
  }

  const handleGoHome = () => {
    navigate('/home');
  }

  return (
    <div className="min-h-screen min-w-[1000px] flex items-center justify-center">
      <Card className="w-full max-w-lg bg-white/95 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800">
            Bảng Xếp Hạng Cuối Trận
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedLeaderboard.length === 0 ? (
            <p className="text-center text-gray-500">Chưa có dữ liệu xếp hạng</p>
          ) : (
            <div className="space-y-3">
              {sortedLeaderboard.map((player, index) => (
                <div
                  key={player.userId}
                  className={`
                    flex items-center justify-between p-4 rounded-lg transition-all duration-300
                    ${player.userId === currentUserId
                      ? "bg-blue-100 font-semibold"
                      : "hover:bg-gray-100"
                    }
                    animate-in slide-in-from-left-8 duration-700
                    ${index === 0 ? "delay-100" : 
                      index === 1 ? "delay-200" : 
                      index === 2 ? "delay-300" : 
                      index >= 3 ? "delay-400" : ""
                    }
                  `}
                >
                  <div className="flex items-center space-x-4">
                    <span className="w-6 text-center">{getRankIcon(index) || `#${index + 1}`}</span>
                    <span className="text-lg">{player.username}</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">{player.score}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <div className="p-6">
          <Button
            onClick={handleGoHome}
            className="w-full bg-orange-600 hover:bg-orange-600/70 text-white"
          >
            Trở về Home
          </Button>
        </div>
      </Card>

      {/* Modal Rating */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Đánh giá Quiz</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-1 my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <Textarea
            placeholder="Nhập đánh giá của bạn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button onClick={handleSubmitRating} disabled={rating === 0}>
              Gửi đánh giá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leaderboard;