import { useState, FormEvent, HTMLAttributes } from "react";
import { BASE_URL } from "../../api/client";
import { useAuth } from "../../context/AuthContext"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";

interface LoginFormProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const { login, setAuthData } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userJson = searchParams.get("user");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    } else if (token && userJson) {
      try {
        const userData = JSON.parse(decodeURIComponent(userJson));
        setAuthData(token, userData);
        navigate("/");
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setError("");
    try {
      const ok = await login(email, password);
      if (!ok) {
        setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] p-4 sm:p-6 relative overflow-hidden">
      {/* Back to Home Navigation */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 font-black text-slate-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Trở về trang chủ</span>
        </Button>
      </div>

      {/* Basic Gradient Style Accents */}
      <div className="absolute -bottom-24 -right-24 size-[600px] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute -top-24 -left-24 size-[600px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.05),transparent_40%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[30%] h-full bg-linear-to-l from-slate-200/20 to-transparent pointer-events-none transform -skew-x-12 translate-x-1/4" />

      {/* Brand Logo */}
      <div 
        onClick={() => navigate("/")}
        className="mb-6 sm:mb-10 cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <img src="/quizmon.png" alt="Quizmon Logo" className="h-10 sm:h-16 w-auto object-contain drop-shadow-sm" />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-800">
            Chào mừng trở lại!
          </h1>
          <p className="text-sm sm:text-slate-500 font-bold mt-1 sm:mt-2">
            Đăng nhập để tiếp tục học tập.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email / Tài khoản</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border-2 border-slate-50 py-3 sm:py-4 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 focus:bg-white transition-all shadow-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">Mật khẩu</label>
                <a href="#" className="text-[10px] sm:text-xs font-black text-primary hover:underline">Quên mật khẩu?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-2 border-slate-50 py-3 sm:py-4 pl-10 sm:pl-12 pr-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 focus:bg-white transition-all shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-500 text-sm font-bold py-3 px-4 rounded-xl border border-rose-100 animate-in fade-in">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full py-5 sm:py-7 rounded-xl sm:rounded-2xl text-base sm:text-xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập ngay!"}
            <ArrowRight className="ml-2 size-5 sm:size-6" />
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 font-black text-slate-300 tracking-widest">hoặc</span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline" 
            onClick={handleGoogleLogin}
            className="w-full py-5 sm:py-7 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all gap-3 text-slate-600"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="size-5 sm:size-6" alt="Google" />
            Tiếp tục với Google
          </Button>
        </form>

        <div className="mt-10 text-center text-sm font-bold text-slate-400">
          Chưa có tài khoản?{" "}
          <span 
            className="text-primary cursor-pointer hover:underline"
            onClick={() => navigate("/sign-up")}
          >
            Đăng ký ngay
          </span>
        </div>
      </div>

      <div className="mt-8 text-slate-300 text-xs font-bold tracking-widest uppercase">
        © 2026 Quizmon Team
      </div>
    </div>
  );
}
