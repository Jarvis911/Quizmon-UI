import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import apiClient from "@/api/client";
import endpoints from "../api/api";

export default function JoinMatch() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    // Focus input on mount & handle query param
    useEffect(() => {
        const codeParam = searchParams.get("code");
        if (codeParam) {
            setCode(codeParam);
        }
        document.getElementById("join-code-input")?.focus();
    }, [searchParams]);

    const handleJoin = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (!code.trim()) {
            setError("Vui lòng nhập mã phòng!");
            return;
        }

        setIsLoading(true);
        try {
            // Check if the match exists before navigating
            const res = await apiClient.get(`${endpoints.matches}/${code.trim()}`);
            const matchId = res.data.id;
            
            if (matchId) {
                navigate(`/match/${matchId}/lobby`);
            } else {
                setError("Mã phòng không hợp lệ.");
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 404) {
                setError("Mã phòng không tồn tại hoặc đã kết thúc!");
            } else {
                setError("Có lỗi xảy ra, vui lòng thử lại.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Main Interactive Card */}
            <div className="bg-card p-6 md:p-8 rounded-4xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border-4 border-white/10 max-w-[320px] w-full text-center relative z-10 transform transition-transform hover:scale-[1.01] duration-300 backdrop-blur-xl">

                <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4 mt-2 tracking-tight">
                    Tham gia!
                </h1>

                <form onSubmit={handleJoin} className="flex flex-col gap-3">
                    <div className="relative">
                        <input
                            id="join-code-input"
                            type="text"
                            placeholder="Game ID"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                if (error) setError("");
                            }}
                            className={`w-full text-center text-xl md:text-2xl font-black text-foreground bg-slate-50/50 border-4 rounded-xl py-3 px-4 placeholder:text-muted-foreground/30 placeholder:font-black focus:outline-none focus:bg-white focus:shadow-inner transition-colors
                                ${error ? 'border-destructive focus:border-destructive' : 'border-primary/30 focus:border-primary'}
                            `}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-1.5 text-destructive font-bold text-xs bg-destructive/10 p-2 rounded-lg border border-destructive/20">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!code.trim() || isLoading}
                        className="w-full h-14 flex items-center justify-center gap-2 text-lg font-black text-primary-foreground bg-primary rounded-xl border-b-4 border-black/10 shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
                    >
                        {isLoading ? "Đang kiểm tra..." : "Tham gia"} <ArrowRight className="w-5 h-5" strokeWidth={3} />
                    </button>

                    <div className="mt-2 text-muted-foreground/60 font-bold text-[13px]">
                        Bạn là giáo viên? <Link to="/login" className="text-primary hover:underline decoration-2 underline-offset-2">Đăng nhập</Link>
                    </div>
                </form>
            </div>

            {/* Footer Information */}
            <div className="absolute bottom-6 left-0 w-full text-center px-4 space-y-2">
                <p className="text-muted-foreground/50 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                    Tạo bộ câu hỏi và trận đấu của riêng bạn miễn phí tại <span className="text-primary/70">Quizmon</span>
                </p>
                <div className="flex items-center justify-center gap-4 text-[9px] md:text-[10px] font-black text-muted-foreground/30 uppercase tracking-tighter">
                    <a href="#" className="hover:text-primary transition-colors">Điều khoản</a>
                    <span className="opacity-20">|</span>
                    <a href="#" className="hover:text-primary transition-colors">Quyền riêng tư</a>
                    <span className="opacity-20">|</span>
                    <a href="#" className="hover:text-primary transition-colors">Thông báo Cookie</a>
                </div>
            </div>
        </div>
    );
}
