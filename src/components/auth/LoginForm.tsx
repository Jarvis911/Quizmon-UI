import { useState, FormEvent, HTMLAttributes } from "react";
import { useAuth } from "../../context/AuthContext"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useEffect } from "react";
import { Sparkles, Smile } from "lucide-react";

interface LoginFormProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const { login, setAuthData } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
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
    const ok = await login(email, password);
    if (!ok) {
      setError("Đăng nhập thất bại, vui lòng thử lại!");
    } else {
      navigate("/");
    }
  };

  const onSignUp = () => {
    navigate(`/sign-up`);
  }

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="w-full h-screen bg-pink-50/30 flex flex-row font-sans overflow-hidden">

      {/* Left Panel: Form */}
      <div className="w-full md:w-[60%] lg:w-[50%] h-full flex flex-col relative overflow-y-auto bg-white pt-6">

        {/* Header (Logo & Signup Button) */}
        <div className="w-full flex justify-between items-center px-6 md:px-10 mb-8 md:mb-16">
          <div
            onClick={() => navigate("/")}
            className="text-white text-3xl font-black tracking-tighter cursor-pointer bg-[#FF758F] py-2 px-4 rounded-xl shadow-[0_4px_0_0_#C9184A] hover:bg-[#FF4D6D] transition-all hover:scale-105 active:scale-95"
          >
            Quizmon
          </div>

          <button
            type="button"
            onClick={onSignUp}
            className="text-pink-600 font-bold border-2 border-pink-100 py-2 px-6 rounded-lg hover:border-pink-200 hover:bg-pink-50 transition-all shadow-sm active:scale-95"
          >
            Đăng ký
          </button>
        </div>

        {/* Central Form Wrapper */}
        <div className="flex-1 w-full max-w-sm mx-auto flex flex-col items-center justify-center px-4 pb-20">
          <h1 className="text-[2.5rem] font-black text-slate-800 mb-2 border-b-2 border-transparent">
            Đăng nhập
          </h1>
          <p className="text-slate-500 font-medium mb-8">Chào mừng bạn quay trở lại! 🌸</p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

            <div className="relative group">
              <input
                id="email"
                type="text"
                placeholder="Tên đăng nhập hoặc email"
                value={email}
                onChange={(e: FormEvent) => setEmail((e.target as HTMLInputElement).value)}
                required
                className="w-full py-4 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#FF758F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,117,143,0.1)] placeholder:text-slate-400 transition-all"
                autoComplete="email"
              />
            </div>

            <div className="relative group">
              <input
                id="password"
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e: FormEvent) => setPassword((e.target as HTMLInputElement).value)}
                required
                className="w-full py-4 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#FF758F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,117,143,0.1)] placeholder:text-slate-400 transition-all"
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-rose-500 text-sm font-bold text-center animate-bounce">{error}</p>}

            <button
              type="submit"
              disabled={!email || !password}
              className="w-full mt-2 py-4 rounded-2xl bg-[#FF758F] text-white text-xl font-black shadow-[0_6px_0_0_#C9184A] transition-all hover:bg-[#FF4D6D] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#A4133C] active:translate-y-1 active:shadow-none disabled:bg-slate-200 disabled:shadow-[0_4px_0_0_#cbd5e1] disabled:translate-y-0 disabled:cursor-not-allowed"
            >
              Bắt đầu thôi!
            </button>
          </form>

          <div className="flex w-full items-center gap-4 my-8 opacity-40">
            <div className="flex-1 h-px bg-slate-300 rounded-full"></div>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">hoặc</span>
            <div className="flex-1 h-px bg-slate-300 rounded-full"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3.5 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 text-lg font-bold shadow-[0_4px_0_0_#f1f5f9] flex items-center justify-center gap-3 transition-all hover:bg-slate-50 hover:border-slate-200 active:translate-y-0.5 active:shadow-none"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Đăng nhập với Google
          </button>

          <a href="#" className="mt-8 text-pink-500 font-bold hover:text-pink-600 hover:underline text-sm tracking-wide transition-colors">
            Quên mật khẩu?
          </a>

        </div>
      </div>

      {/* Right Panel: Pink Theme Concept */}
      <div className="hidden md:flex flex-1 h-full bg-[#FFB3C1] relative items-center justify-center border-l-8 border-pink-50 shadow-[inset_10px_0_30px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Subtle pattern overlays - Blobs and Squares */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 20%, transparent 20%)', backgroundSize: '60px 60px' }}></div>
        
        {/* Animated background elements */}
        <div className="absolute w-[200%] h-[200%] rotate-12 flex flex-wrap gap-12 p-12 z-0 opacity-20">
          {Array.from({ length: 48 }).map((_, i) => (
            <div 
              key={i} 
              className="w-32 h-32 rounded-[2.5rem] bg-white opacity-40 shrink-0 shadow-xl animate-pulse" 
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: '4s' }}
            ></div>
          ))}
        </div>

        {/* Decorative Center "Mascot" Block - Enhanced Pink Mascot */}
        <div className="group relative z-10 transition-transform duration-500 hover:scale-110">
          <div className="w-56 h-56 bg-[#FF758F] rounded-[3rem] rotate-15 shadow-[20px_20px_0_#C9184A] flex items-center justify-center relative animate-bounce" style={{ animationDuration: '3.5s' }}>
            <Smile className="w-32 h-32 text-white drop-shadow-lg -rotate-15" />
            
            {/* Mascot "ears/nubs" */}
            <div className="absolute -top-4 left-6 w-8 h-12 bg-[#FF4D6D] rounded-full rotate-45 shadow-sm"></div>
            <div className="absolute -top-4 right-6 w-8 h-12 bg-[#FF4D6D] rounded-full -rotate-45 shadow-sm"></div>
            
            {/* Mascot cheeks */}
            <div className="absolute bottom-10 left-10 w-6 h-6 bg-pink-300/60 rounded-full blur-[2px]"></div>
            <div className="absolute bottom-10 right-10 w-6 h-6 bg-pink-300/60 rounded-full blur-[2px]"></div>
            
            {/* Sparkles around mascot */}
            <Sparkles className="absolute -top-8 -right-8 w-12 h-12 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute -bottom-4 -left-12 w-8 h-8 text-white opacity-50" />
          </div>
        </div>

        {/* Tagline Box */}
        <div className="absolute bottom-16 text-center z-20 w-full px-12">
          <div className="bg-white/20 backdrop-blur-md py-6 px-8 rounded-3xl border border-white/30 shadow-2xl inline-block transition-transform hover:scale-105">
            <h2 className="text-white text-[1.4rem] md:text-[1.8rem] font-black tracking-tight drop-shadow-sm whitespace-pre-line leading-snug font-sans">
              Trải nghiệm phép màu của{"\n"}Học tập cùng Quizmon
            </h2>
          </div>
        </div>

        {/* Corner shapes */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FF4D6D] rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white rounded-full opacity-10 blur-2xl"></div>
      </div>
    </div>
  );
}
