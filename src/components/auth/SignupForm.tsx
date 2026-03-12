import { HTMLAttributes } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useAuth } from "../../context/AuthContext"
import { usePopup } from "@/context/PopupContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, Smile } from "lucide-react";

// schema validate 
const signUpSchema = z.object({
  username: z.string().min(6, "Tên đăng nhập phải có ít nhất 6 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

interface SignupFormProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

interface User {
  username: string;
  email: string;
  password: string;
}

export function SignUpForm({ className, ...props }: SignupFormProps) {
  const { signup } = useAuth();
  const { showPopup } = usePopup();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    mode: "onChange"
  });

  const onSubmit = async (data: any) => {
    const ok = await signup(data.username, data.email, data.password);
    if (!ok) {
      showPopup("Đăng ký thất bại", "Vui lòng kiểm tra lại thông tin và thử lại!", "destructive");
    }
    else {
      navigate("/quiz/create");
    }
  };

  const onLogin = () => {
    navigate("/login");
  }

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="w-full h-screen bg-white flex flex-row font-sans overflow-hidden">

      {/* Left Panel: Form */}
      <div className="w-full md:w-[60%] lg:w-[50%] h-full flex flex-col relative overflow-y-auto bg-white pt-6">

        {/* Header (Logo & Login Button) */}
        <div className="w-full flex justify-between items-center px-6 md:px-10 mb-6 md:mb-10">
          <div
            onClick={() => navigate("/")}
            className="text-white text-3xl font-black tracking-tighter cursor-pointer bg-[#A8E6CF] py-2 px-4 rounded-xl shadow-[0_4px_0_0_rgba(133,195,172,1)] hover:bg-[#85C3AC] transition-colors"
          >
            Quizmon
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="text-slate-500 font-bold border-2 border-slate-200 py-2 px-6 rounded-lg hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
          >
            Log in
          </button>
        </div>

        {/* Central Form Wrapper */}
        <div className="flex-1 w-full max-w-sm mx-auto flex flex-col items-center justify-center px-4 pb-12">
          <h1 className="text-[2rem] font-black text-slate-700 mb-6 border-b-2 border-transparent">
            Sign up
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-3">

            <input
              id="username"
              type="text"
              placeholder="Username (e.g. triho99)"
              {...register("username")}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-300 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#A8E6CF] focus:shadow-sm placeholder:text-slate-400 transition-colors"
              autoComplete="username"
            />
            {errors.username && <p className="text-red-500 text-xs font-bold px-1 m-0">{String(errors.username.message)}</p>}

            <input
              id="email"
              type="email"
              placeholder="Email (e.g. m@example.com)"
              {...register("email")}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-300 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#A8E6CF] focus:shadow-sm placeholder:text-slate-400 transition-colors"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-500 text-xs font-bold px-1 m-0">{String(errors.email.message)}</p>}

            <input
              id="password"
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-300 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#A8E6CF] focus:shadow-sm placeholder:text-slate-400 transition-colors"
              autoComplete="new-password"
            />
            {errors.password && <p className="text-red-500 text-xs font-bold px-1 m-0">{String(errors.password.message)}</p>}

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              {...register("confirmPassword")}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-300 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#A8E6CF] focus:shadow-sm placeholder:text-slate-400 transition-colors"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs font-bold px-1 m-0">{String(errors.confirmPassword.message)}</p>}

            <button
              type="submit"
              className="w-full mt-4 py-4 rounded-xl bg-slate-300 text-white text-xl font-black shadow-[0_5px_0_0_rgba(203,213,225,1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_rgba(203,213,225,1)] active:translate-y-1 active:shadow-none enabled:bg-slate-300 disabled:opacity-50"
              style={isValid ? { backgroundColor: '#10b981', boxShadow: '0 5px 0 0 #047857' } : {}}
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
            Sign up with Google
          </button>

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
        <div className="w-48 h-48 bg-emerald-400 rounded-3xl -rotate-[15deg] shadow-[15px_15px_0_rgba(0,0,0,0.1)] flex items-center justify-center relative translate-y-[-40px] z-10 animate-pulse" style={{ animationDuration: '4s' }}>
          <Sparkles className="w-24 h-24 text-white drop-shadow-md rotate-[15deg]" />
          {/* Shapes */}
          <div className="absolute -bottom-4 right-4 w-10 h-10 bg-emerald-300 rounded-lg rotate-12"></div>
          <div className="absolute -top-6 left-6 w-8 h-8 bg-emerald-200 rounded-full"></div>
        </div>

        {/* Tagline */}
        <div className="absolute bottom-16 text-center z-10 w-full px-12">
          <h2 className="text-white text-[1.4rem] md:text-[1.8rem] font-bold tracking-tight drop-shadow-md whitespace-pre-line leading-snug font-sans">
            Create an account and{"\n"}transform your classroom.
          </h2>
        </div>
      </div>
    </div>
  );
}
