import { HTMLAttributes } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useAuth } from "../../context/AuthContext"
import { useModal } from "@/context/ModalContext";
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
  const { showAlert } = useModal();
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
      showAlert({ 
        title: "Đăng ký thất bại", 
        message: "Vui lòng kiểm tra lại thông tin và thử lại!", 
        type: "error" 
      });
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
    <div className="w-full h-screen bg-pink-50/30 flex flex-row font-sans overflow-hidden">

      {/* Left Panel: Form */}
      <div className="w-full md:w-[60%] lg:w-[50%] h-full flex flex-col relative overflow-y-auto bg-white pt-6">

        {/* Header (Logo & Login Button) */}
        <div className="w-full flex justify-between items-center px-6 md:px-10 mb-6 md:mb-10">
          <div
            onClick={() => navigate("/")}
            className="text-white text-3xl font-black tracking-tighter cursor-pointer bg-[#FF758F] py-2 px-4 rounded-xl shadow-[0_4px_0_0_#C9184A] hover:bg-[#FF4D6D] transition-all hover:scale-105 active:scale-95"
          >
            Quizmon
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="text-pink-600 font-bold border-2 border-pink-100 py-2 px-6 rounded-lg hover:border-pink-200 hover:bg-pink-50 transition-all shadow-sm active:scale-95"
          >
            Đăng nhập
          </button>
        </div>

        {/* Central Form Wrapper */}
        <div className="flex-1 w-full max-w-sm mx-auto flex flex-col items-center justify-center px-4 pb-12">
          <h1 className="text-[2.5rem] font-black text-slate-800 mb-2 border-b-2 border-transparent">
            Đăng ký
          </h1>
          <p className="text-slate-500 font-medium mb-6">Tham gia cuộc cách mạng hồng của giáo dục! 🌸</p>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-3">

            <div className="relative group">
              <input
                id="username"
                type="text"
                placeholder="Tên đăng nhập"
                {...register("username")}
                className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#FF758F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,117,143,0.1)] placeholder:text-slate-400 transition-all"
                autoComplete="username"
              />
              {errors.username && <p className="text-rose-500 text-xs font-bold px-1 mt-1">{String(errors.username.message)}</p>}
            </div>

            <div className="relative group">
              <input
                id="email"
                type="email"
                placeholder="Email"
                {...register("email")}
                className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#FF758F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,117,143,0.1)] placeholder:text-slate-400 transition-all"
                autoComplete="email"
              />
              {errors.email && <p className="text-rose-500 text-xs font-bold px-1 mt-1">{String(errors.email.message)}</p>}
            </div>

            <div className="relative group">
              <input
                id="password"
                type="password"
                placeholder="Mật khẩu"
                {...register("password")}
                className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#FF758F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,117,143,0.1)] placeholder:text-slate-400 transition-all"
                autoComplete="new-password"
              />
              {errors.password && <p className="text-rose-500 text-xs font-bold px-1 mt-1">{String(errors.password.message)}</p>}
            </div>

            <div className="relative group">
              <input
                id="confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu"
                {...register("confirmPassword")}
                className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 text-slate-700 text-lg font-medium focus:outline-none focus:border-[#FF758F] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,117,143,0.1)] placeholder:text-slate-400 transition-all"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-rose-500 text-xs font-bold px-1 mt-1">{String(errors.confirmPassword.message)}</p>}
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="w-full mt-4 py-4 rounded-2xl bg-[#FF758F] text-white text-xl font-black shadow-[0_6px_0_0_#C9184A] transition-all hover:bg-[#FF4D6D] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#A4133C] active:translate-y-1 active:shadow-none disabled:bg-slate-200 disabled:shadow-[0_4px_0_0_#cbd5e1] disabled:translate-y-0 disabled:cursor-not-allowed"
            >
              Bắt đầu thôi!
            </button>
          </form>

          <div className="flex w-full items-center gap-4 my-6 opacity-40">
            <div className="flex-1 h-px bg-slate-300 rounded-full"></div>
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">hoặc</span>
            <div className="flex-1 h-px bg-slate-300 rounded-full"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 text-lg font-bold shadow-[0_4px_0_0_#f1f5f9] flex items-center justify-center gap-3 transition-all hover:bg-slate-50 hover:border-slate-200 active:translate-y-0.5 active:shadow-none"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Đăng ký với Google
          </button>

        </div>
      </div>

      {/* Right Panel: Pink Theme Concept */}
      <div className="hidden md:flex flex-1 h-full bg-[#FFB3C1] relative items-center justify-center border-l-8 border-pink-50 shadow-[inset_10px_0_30px_-10px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Subtle pattern overlays */}
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

        {/* Decorative Center "Mascot" Block - Sparkly Pink Mascot */}
        <div className="group relative z-10 transition-transform duration-500 hover:scale-110">
          <div className="w-56 h-56 bg-[#FF758F] rounded-[3rem] -rotate-15 shadow-[20px_20px_0_#C9184A] flex items-center justify-center relative animate-bounce" style={{ animationDuration: '4s' }}>
            <Sparkles className="w-32 h-32 text-white drop-shadow-lg rotate-15" />
            
            {/* Shapes */}
            <div className="absolute -bottom-6 right-6 w-12 h-12 bg-[#FF4D6D] rounded-2xl rotate-12 shadow-md"></div>
            <div className="absolute -top-8 left-8 w-10 h-10 bg-white/40 rounded-full blur-sm"></div>
            
            {/* Special accents */}
            <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Tagline Box */}
        <div className="absolute bottom-16 text-center z-20 w-full px-12">
          <div className="bg-white/20 backdrop-blur-md py-6 px-8 rounded-3xl border border-white/30 shadow-2xl inline-block transition-transform hover:scale-105">
            <h2 className="text-white text-[1.4rem] md:text-[1.8rem] font-black tracking-tight drop-shadow-sm whitespace-pre-line leading-snug font-sans">
              Tạo tài khoản và{"\n"}thay đổi lớp học của bạn
            </h2>
          </div>
        </div>

        {/* Corner decoration */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#FF85A1] rounded-full opacity-30 blur-3xl"></div>
      </div>
    </div>
  );
}
