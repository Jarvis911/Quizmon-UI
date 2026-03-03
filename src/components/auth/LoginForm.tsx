import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useState, FormEvent, HTMLAttributes } from "react";
import { useAuth } from "../../context/AuthContext"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useEffect } from "react";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (!ok) {
      setError("Đăng nhập thất bại, vui lòng thử lại!");
    }
    navigate("/");
  };

  const onSignUp = () => {
    navigate(`/sign-up`);
  }

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className={cn("absolute top-30 left-[50%] -translate-x-1/2 flex flex-col gap-6", className)} {...props}>
      <Card className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Chào mừng trở lại</CardTitle>
          <CardDescription className={undefined}>
            Đăng nhập bằng tài khoản Apple hoặc Google
          </CardDescription>
        </CardHeader>
        <CardContent className={undefined}>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="flex flex-col gap-4">
                <Button variant="outline" size="default" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor" />
                  </svg>
                  Đăng nhập với Apple
                </Button>
                <Button variant="outline" size="default" className="w-full" onClick={handleGoogleLogin} type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor" />
                  </svg>
                  Đăng nhập với Google
                </Button>
              </div>
              <div
                className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="text-muted-foreground relative z-10 px-2">
                  Hoặc tiếp tục với
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label className={undefined} htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e: FormEvent) => setEmail((e.target as HTMLInputElement).value)} required className="border-slate-300" />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label className={undefined} htmlFor="password">Mật khẩu</Label>
                    <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
                      Quên mật khẩu?
                    </a>
                  </div>
                  <Input id="password" type="password" value={password} onChange={(e: FormEvent) => setPassword((e.target as HTMLInputElement).value)} required className="border-slate-300" />
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <Button type="submit" variant="default" size="default" className="w-full">
                  Đăng nhập
                </Button>
              </div>
              <div className="text-center text-sm">
                Chưa có tài khoản?{" "}
                <a href="#" onClick={onSignUp} className="underline underline-offset-4">
                  Đăng ký
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div
        className="text-black *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Bằng cách tiếp tục, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a>{" "}
        và <a href="#">Chính sách bảo mật</a>.
      </div>
    </div>
  );
}
