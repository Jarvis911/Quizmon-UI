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
    <div className="w-full h-screen bg-white flex flex-row font-sans overflow-hidden">

      {/* Left Panel: Form */}
      <div className="w-full md:w-[60%] lg:w-[50%] h-full flex flex-col relative overflow-y-auto bg-white pt-6">

        {/* Header (Logo & Signup Button) */}
        <div className="w-full flex justify-between items-center px-6 md:px-10 mb-8 md:mb-16">
          <div
            onClick={() => navigate("/")}
            className="text-white text-3xl font-black tracking-tighter cursor-pointer bg-[#A8E6CF] py-2 px-4 rounded-xl shadow-[0_4px_0_0_rgba(133,195,172,1)] hover:bg-[#85C3AC] transition-colors"
          >
            Quizmon
          </div>

          <button
            type="button"
            onClick={onSignUp}
            className="text-slate-500 font-bold border-2 border-slate-200 py-2 px-6 rounded-lg hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
          >
            Sign up
          </button>
        </div>

        {/* Central Form Wrapper */}
        <div className="flex-1 w-full max-w-sm mx-auto flex flex-col items-center justify-center px-4 pb-20">
          <h1 className="text-[2rem] font-black text-slate-700 mb-8 border-b-2 border-transparent">
            Log in
          </h1>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

            <input
              id="email"
              type="text"
              placeholder="Username or email"
              value={email}
              onChange={(e: FormEvent) => setEmail((e.target as HTMLInputElement).value)}
              required
              className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-300 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#A8E6CF] focus:shadow-sm placeholder:text-slate-400 transition-colors"
              autoComplete="email"
            />

            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e: FormEvent) => setPassword((e.target as HTMLInputElement).value)}
              required
              className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-300 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#A8E6CF] focus:shadow-sm placeholder:text-slate-400 transition-colors"
              autoComplete="current-password"
            />

            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

            <button
              type="submit"
              className="w-full mt-2 py-4 rounded-xl bg-slate-300 text-white text-xl font-black shadow-[0_5px_0_0_rgba(203,213,225,1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_rgba(203,213,225,1)] active:translate-y-1 active:shadow-none enabled:bg-slate-300 disabled:opacity-50"
              style={email && password ? { backgroundColor: '#cbd5e1', boxShadow: '0 5px 0 0 #94a3b8' } : {}}
            >
              Let's go!
            </button>
          </form>

          <div className="flex w-full items-center gap-4 my-6 opacity-40">
            <div className="flex-1 h-px bg-slate-500 rounded-full"></div>
            <span className="text-slate-500 font-bold text-xs">or</span>
            <div className="flex-1 h-px bg-slate-500 rounded-full"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-600 text-lg font-bold shadow-[0_3px_0_0_rgba(226,232,240,1)] flex items-center justify-center gap-3 transition-all hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Google
          </button>

          <a href="#" className="mt-8 text-[#4A7A68] font-bold hover:underline text-sm tracking-wide">
            Forgot your password?
          </a>

        </div>
      </div>

      {/* Right Panel: Blooket Style Cyan BG (Hidden on mobile) */}
      <div className="hidden md:flex flex-1 h-full bg-[#A8E6CF] relative items-center justify-center border-l-8 border-slate-100/50 shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Subtle pattern overlays - mimicking Blooket ghost squares */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 20%, transparent 20%)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute w-[200%] h-[200%] rotate-12 flex flex-wrap gap-8 p-12 -z-0 opacity-10">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="w-32 h-32 rounded-[2rem] bg-white opacity-40 shrink-0 shadow-lg"></div>
          ))}
        </div>

        {/* Decorative Center "Mascot" Block */}
        <div className="w-48 h-48 bg-pink-400 rounded-3xl rotate-[25deg] shadow-[15px_15px_0_rgba(0,0,0,0.1)] flex items-center justify-center relative translate-y-[-40px] z-10 animate-bounce" style={{ animationDuration: '3s' }}>
          <Smile className="w-24 h-24 text-white drop-shadow-md -rotate-[25deg]" />
          {/* Mascot "ears" */}
          <div className="absolute -top-3 left-4 w-6 h-10 bg-pink-500 rounded-full rotate-45"></div>
          <div className="absolute -top-3 right-4 w-6 h-10 bg-pink-500 rounded-full -rotate-45"></div>
          {/* Mascot blush */}
          <div className="absolute bottom-6 left-6 w-5 h-5 bg-pink-300 rounded-full"></div>
          <div className="absolute bottom-6 right-6 w-5 h-5 bg-pink-300 rounded-full"></div>
        </div>

        {/* Tagline */}
        <div className="absolute bottom-16 text-center z-10 w-full px-12">
          <h2 className="text-white text-[1.4rem] md:text-[1.8rem] font-bold tracking-tight drop-shadow-md whitespace-pre-line leading-snug font-sans">
            Leveling up engagement,{"\n"}one question at a time.
          </h2>
        </div>
      </div>
    </div>
  );
}
