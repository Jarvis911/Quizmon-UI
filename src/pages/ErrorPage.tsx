import { useRouteError, useNavigate, isRouteErrorResponse } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home, Ghost, ShieldAlert } from "lucide-react";

export default function ErrorPage() {
    const error = useRouteError();
    const navigate = useNavigate();

    let errorMessage = "Đã có lỗi xảy ra ngoài ý muốn.";
    let errorStatus = "Opps!";

    if (isRouteErrorResponse(error)) {
        errorMessage = error.data?.message || error.statusText || errorMessage;
        errorStatus = error.status.toString();
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 font-sans">
            <div className="relative max-w-2xl w-full">
                {/* Decorative Background Elements */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />

                <div className="relative bg-card/60 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-8 md:p-16 shadow-2xl overflow-hidden text-center">
                    {/* Top Accent Strip */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-rose-500 via-primary to-indigo-500" />

                    <div className="mb-10 relative inline-block">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-2xl animate-bounce-slow">
                            <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-rose-500" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-background border-2 border-rose-500/20 rounded-full flex items-center justify-center animate-spin-slow">
                            <Ghost className="w-4 h-4 text-rose-400" />
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter mb-4 opacity-20 select-none">
                        {errorStatus}
                    </h1>
                    
                    <h2 className="text-2xl md:text-3xl font-black text-foreground mb-4 tracking-tight">
                        Hệ thống gặp sự cố kĩ thuật
                    </h2>

                    <p className="text-muted-foreground text-sm md:text-base font-medium mb-10 max-w-md mx-auto leading-relaxed">
                        Đừng lo lắng, đây chỉ là một lỗi nhỏ trong vũ trụ Quizmon. <br/>
                        <span className="text-rose-500/80 font-mono text-[10px] md:text-xs block mt-4 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 break-words">
                            Error Log: {errorMessage}
                        </span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => window.location.reload()}
                            className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Thử lại ngay
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/")}
                            className="h-14 px-8 rounded-2xl border-white/10 bg-foreground/5 hover:bg-foreground/10 text-foreground font-black text-sm uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Về Trang Chủ
                        </Button>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-4 text-muted-foreground/30 font-black text-[10px] uppercase tracking-[0.3em]">
                        <span>Secure Mode</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>System Recovery Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
