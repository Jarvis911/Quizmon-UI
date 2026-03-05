import { useEffect, useState, FormEvent, useMemo } from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { useAuth } from "../../context/AuthContext";
import { useTheme, BACKGROUND_THEMES } from "../../context/ThemeContext";
import { LogOut, TrendingUp, Sparkles, BookOpen, Palette, Home as HomeIcon, Library, ArrowLeft, Bell, Check, Trash } from "lucide-react"
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import endpoints from "../../api/api";
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(endpoints.notifications, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(endpoints.notification_read_all, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await axios.put(endpoints.notification_read(notif.id), {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchNotifications();
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

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
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div className="relative cursor-pointer p-2 rounded-full hover:bg-white/10 transition-colors">
                  <Bell className="w-5 h-5 text-primary-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 shadow-xl overflow-hidden rounded-xl border-white/20 bg-background/95 backdrop-blur-xl">
                <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 bg-muted/30">
                  <span className="font-semibold text-sm">Thông báo</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent px-1">
                      <Check className="w-3 h-3 mr-1" /> Đánh dấu đã đọc
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-foreground/50">
                      Chưa có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors border-b border-foreground/5 last:border-0 hover:bg-muted/50 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-2 w-full justify-between items-start">
                          <span className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                            {notif.message}
                          </span>
                          {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-foreground/50 mt-1">
                          {new Date(notif.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
          </div>
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
