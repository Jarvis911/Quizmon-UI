import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden px-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            
            <div className="relative z-10 text-center space-y-8 max-w-2xl animate-in fade-in zoom-in duration-700">
                {/* 404 Header */}
                <div className="relative inline-block">
                    <h1 className="text-[150px] sm:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/80 to-blue-600 drop-shadow-2xl opacity-20">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl sm:text-6xl font-black text-foreground tracking-tighter uppercase">
                            Không tìm thấy
                        </span>
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                        Úi! Trang này đã "đi lạc" mất rồi.
                    </h2>
                    <p className="text-muted-foreground font-medium text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                        Có vẻ như đường dẫn bạn đang truy cập không tồn tại hoặc đã bị di dời. 
                        Đừng lo lắng, hãy quay trở lại trang chủ nhé!
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button 
                        onClick={() => navigate("/")}
                        className="h-14 px-8 rounded-2xl text-lg font-black bg-primary text-primary-foreground shadow-2xl shadow-primary/20 hover:scale-105 transition-all group gap-2"
                    >
                        <Home className="w-5 h-5 group-hover:animate-bounce" />
                        Về trang chủ
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="h-14 px-8 rounded-2xl text-lg font-black border-2 border-foreground/5 bg-foreground/5 hover:bg-foreground/10 transition-all gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Quay lại
                    </Button>
                </div>
            </div>

            {/* Bottom Branding */}
            <div className="absolute bottom-12 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">
                Quizmon Intelligence System
            </div>
        </div>
    );
};

export default NotFound;
