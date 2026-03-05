import { useEffect, useState, FormEvent, useMemo } from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { useAuth } from "../../context/AuthContext";
import { useTheme, BACKGROUND_THEMES } from "../../context/ThemeContext";
import { LogOut, TrendingUp, Sparkles, BookOpen, Palette, Home as HomeIcon, Library, ArrowLeft } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "./dropdown-menu";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { token, user, logout } = useAuth();
  const { selectedTheme, themeId, handleThemeChange } = useTheme();
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Determine variant based on route
  const isCompactVariant = useMemo(() => {
    return location.pathname.startsWith('/quiz');
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleJoinCode = async () => {
    if (code) {
      navigate(`/match/${code}/lobby`);
    }
  };

  const handleCreateQuiz = () => {
    if (token) {
      navigate(`/quiz`);
    }
  };

  const handleReturnHome = () => {
    navigate(`/`);
  }

  const handleLogin = () => {
    navigate(`/login`);
  };

  const handleLogout = () => {
    logout();
    navigate(`/`);
  };

  const handleNavigateUserStatistics = () => {
    navigate(`/statistics`);
  }
  return (
    <nav
      className={`fixed top-0 left-0 w-full flex items-center justify-between px-3 md:px-6 z-50 transition-all duration-300
        ${selectedTheme.className} border-b border-white/20 
        ${scrolled ? "shadow-lg backdrop-blur-md" : "shadow-sm backdrop-blur-sm"}
        ${isCompactVariant ? "h-12 bg-background/90" : "h-16"}`}
    >
      {/* Left - Logo */}
      <div className="flex items-center gap-4">
        {isCompactVariant && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full mr-2 hover:bg-black/10 text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div
          className={`font-black tracking-tighter cursor-pointer drop-shadow-md text-primary transition-all duration-300 ${isCompactVariant ? 'text-xl' : 'text-2xl'}`}
          onClick={handleReturnHome}
        >
          Quizmon
        </div>
      </div>

      {/* Middle - Search & Navigation (Hidden in compact variant) */}
      {!isCompactVariant && (
        <div className="flex-1 flex flex-row items-center justify-center gap-2 md:gap-6 mx-2 md:mx-6 max-w-3xl">
          {/* Main Navigation Links */}
          {token && (
            <div className="hidden md:flex items-center gap-1 bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)]">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="rounded-full text-primary hover:bg-white/40 font-semibold px-4">
                <HomeIcon className="w-4 h-4 mr-2" /> Trang chủ
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/classrooms")} className="rounded-full text-primary hover:bg-white/40 font-semibold px-4">
                <BookOpen className="w-4 h-4 mr-2" /> Lớp học
              </Button>
            </div>
          )}

          {/* Join Form */}
          <div className="flex-1 flex flex-row gap-2 max-w-md ml-auto">
            <Input
              type="text"
              placeholder="Nhập mã phòng..."
              value={code}
              onChange={(e: FormEvent) => setCode((e.target as HTMLInputElement).value)}
              className={`w-full border-2 border-foreground/40 bg-background/20 text-foreground placeholder:text-foreground/80 focus:ring-0 focus:border-primary rounded-lg shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2)]`}
            />
            <Button
              className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-bold
            shadow-[inset_1px_1px_0px_0px_rgba(255,255,255,0.4),inset_-1px_-1px_0px_0px_rgba(0,0,0,0.3)]
            hover:shadow-[inset_0_0_20px_0px_rgba(255,255,255,0.5),0_4px_10px_rgba(0,0,0,0.3)]
            hover:-translate-y-1 hover:brightness-110 transition-all duration-300 ease-out border border-primary/50 text-sm md:text-base rounded-lg px-3 md:px-6"
              variant="default"
              size="default"
              onClick={handleJoinCode}>Tham gia</Button>
          </div>
        </div>
      )}

      {/* Right - Avatar + Actions */}
      <div className="flex items-center gap-3">

        {token ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer ring-2 ring-white/50 hover:ring-white transition-all shadow-md">
                <AvatarImage className={undefined} src={user?.avatar || "https://github.com/shadcn.png"} alt="@user" />
                <AvatarFallback className={undefined}>{user?.username?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-24">
              <DropdownMenuItem onClick={handleNavigateUserStatistics} className="cursor-pointer font-medium text-slate-700 dark:text-slate-300" inset={undefined}>
                <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                Lịch sử đấu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700" inset={undefined}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>


              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                  <Palette className="w-4 h-4 mr-2" />
                  Đổi Giao Diện
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {BACKGROUND_THEMES.map((theme) => (
                      <DropdownMenuItem
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`cursor-pointer mb-1 flex items-center gap-2 ${themeId === theme.id ? 'bg-primary/10 font-semibold text-primary' : ''}`}
                        inset={undefined}
                      >
                        <div className={`w-4 h-4 rounded-full border border-black/10 shadow-sm ${theme.className} ${theme.id === 'default' ? 'bg-slate-200' : ''}`} />
                        {theme.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-bold
            shadow-[inset_1px_1px_0px_0px_rgba(255,255,255,0.4),inset_-1px_-1px_0px_0px_rgba(0,0,0,0.3)]
            hover:shadow-[inset_0_0_20px_0px_rgba(255,255,255,0.5),0_4px_10px_rgba(0,0,0,0.3)]
            hover:-translate-y-1 hover:brightness-110 transition-all duration-300 ease-out border border-primary/50 rounded-lg px-6 h-10"
            variant="default"
            size="default"
            onClick={handleLogin}
          >
            Đăng nhập
          </Button>
        )}
      </div>
    </nav>
  )
}
