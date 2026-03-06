import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import axios from "axios";
import endpoints from "../api/api";

export default function JoinMatch() {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Focus input on mount
    useEffect(() => {
        document.getElementById("join-code-input")?.focus();
    }, []);

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
            await axios.get(`${endpoints.matches}/${code.trim()}`);
            navigate(`/match/${code.trim()}/lobby`);
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
        <div className="min-h-screen bg-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Playful Background Shapes */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-400 rounded-full opacity-50 animate-bounce cursor-default" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-400 rounded-3xl rotate-12 opacity-50 animate-bounce cursor-default" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-emerald-400 rounded-2xl -rotate-12 opacity-50 animate-bounce cursor-default" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
            <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-orange-400 rounded-full opacity-50 animate-bounce cursor-default" style={{ animationDuration: '4.5s', animationDelay: '2s' }} />

            {/* Main Interactive Card */}
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_16px_0_0_rgba(30,58,138,0.5)] border-8 border-slate-100 max-w-sm w-full text-center relative z-10 mx-auto mt-[-80px] transform transition-transform hover:scale-[1.02] duration-300">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-blue-600 border-8 border-white rounded-full flex items-center justify-center shadow-lg cursor-default">
                    <Sparkles className="w-8 h-8 text-white fill-white" />
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 mt-4 tracking-tight">
                    Tham gia!
                </h1>

                <form onSubmit={handleJoin} className="flex flex-col gap-4">
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
                            className={`w-full text-center text-2xl md:text-3xl font-black text-slate-700 bg-slate-100 border-4 rounded-2xl py-4 px-4 placeholder:text-slate-400 placeholder:font-black focus:outline-none focus:bg-white transition-colors
                                ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}
                            `}
                        />
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-1.5 text-red-500 font-bold text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!code.trim() || isLoading}
                        className="w-full flex items-center justify-center gap-2 text-xl font-black text-white bg-blue-500 rounded-2xl py-4 border-4 border-blue-700 shadow-[0_6px_0_0_rgba(29,78,216,1)] hover:bg-blue-400 hover:-translate-y-1 hover:shadow-[0_8px_0_0_rgba(29,78,216,1)] active:translate-y-1.5 active:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_0_0_rgba(29,78,216,1)] cursor-pointer mt-2"
                    >
                        {isLoading ? "Đang kiểm tra..." : "Tham gia"} <ArrowRight className="w-6 h-6" strokeWidth={3} />
                    </button>

                    <div className="mt-4 text-slate-500 font-bold text-sm">
                        Bạn là giáo viên? <Link to="/login" className="text-blue-600 hover:text-blue-500 underline decoration-2 underline-offset-2">Đăng nhập</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
