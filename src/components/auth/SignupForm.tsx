import { HTMLAttributes, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useAuth } from "../../context/AuthContext"
import { useModal } from "@/context/ModalContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Mail, Lock, UserPlus, ArrowRight, ArrowLeft } from "lucide-react";

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

export function SignUpForm({ className, ...props }: SignupFormProps) {
  const { signup } = useAuth();
  const { showAlert } = useModal();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    mode: "onChange"
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
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
    } catch (err) {
      showAlert({
        title: "Lỗi hệ thống",
        message: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
      {/* Back to Home Navigation */}
      <div className="absolute top-8 left-8 z-20">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="group flex items-center gap-2 font-black text-slate-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
          Trở về trang chủ
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
        className="mb-10 cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <img src="/quizmon.png" alt="Quizmon Logo" className="h-16 w-auto object-contain drop-shadow-sm" />
      </div>

      {/* Main Signup Card */}
      <div className="w-full max-w-md bg-white rounded-4xl p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-800">
            Tham gia Quizmon!
          </h1>
          <p className="text-slate-500 font-bold mt-2">
            Đăng ký để khám phá thế giới học tập.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Tên đăng nhập</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="admin123"
                  {...register("username")}
                  className={`w-full bg-slate-50 border-2 ${errors.username ? 'border-rose-100' : 'border-slate-50'} py-4 pl-12 pr-4 rounded-2xl text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 focus:bg-white transition-all shadow-sm`}
                />
                {errors.username && <p className="text-rose-500 text-[10px] uppercase font-black tracking-widest px-1 mt-1">{String(errors.username.message)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register("email")}
                  className={`w-full bg-slate-50 border-2 ${errors.email ? 'border-rose-100' : 'border-slate-50'} py-4 pl-12 pr-4 rounded-2xl text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 focus:bg-white transition-all shadow-sm`}
                />
                {errors.email && <p className="text-rose-500 text-[10px] uppercase font-black tracking-widest px-1 mt-1">{String(errors.email.message)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full bg-slate-50 border-2 ${errors.password ? 'border-rose-100' : 'border-slate-50'} py-4 pl-12 pr-4 rounded-2xl text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 focus:bg-white transition-all shadow-sm`}
                />
                {errors.password && <p className="text-rose-500 text-[10px] uppercase font-black tracking-widest px-1 mt-1">{String(errors.password.message)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Xác nhận mật khẩu</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`w-full bg-slate-50 border-2 ${errors.confirmPassword ? 'border-rose-100' : 'border-slate-50'} py-4 pl-12 pr-4 rounded-2xl text-lg font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-primary/20 focus:bg-white transition-all shadow-sm`}
                />
                {errors.confirmPassword && <p className="text-rose-500 text-[10px] uppercase font-black tracking-widest px-1 mt-1">{String(errors.confirmPassword.message)}</p>}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full py-7 mt-4 rounded-2xl text-xl font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
            disabled={!isValid || isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Đăng ký ngay!"}
            <UserPlus className="ml-2 size-6" />
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
             className="w-full py-7 rounded-2xl font-black text-lg border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all gap-3 text-slate-600"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="size-6" alt="Google" />
            Đăng ký với Google
          </Button>

          <p className="text-center text-xs font-black text-slate-400 mt-4 leading-relaxed">
            Bằng cách tiếp tục, bạn đồng ý với <span className="text-primary hover:underline cursor-pointer">Điều khoản</span> và <span className="text-primary hover:underline cursor-pointer">Chính sách</span>.
          </p>
        </form>

        <div className="mt-8 text-center text-sm font-bold text-slate-400">
          Đã có tài khoản?{" "}
          <span 
            className="text-primary cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Đăng nhập ngay
          </span>
        </div>
      </div>

      <div className="mt-8 text-slate-300 text-xs font-bold tracking-widest uppercase">
        © 2026 Quizmon Team
      </div>
    </div>
  );
}
