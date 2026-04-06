import { useEffect, useState, FormEvent, useMemo } from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { useTheme, BACKGROUND_THEMES } from "../../context/ThemeContext";
import { TrendingUp, Sparkles, BookOpen, Home as HomeIcon, Library, ArrowLeft, Bell, Check, Trash, Building2, User, ShieldCheck, Menu } from "lucide-react"
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../../api/client";
import endpoints, { getAvatarUrl } from "../../api/api";
import { SiGoogleclassroom } from "react-icons/si";
import QuizSearch from "../quiz/QuizSearch";
import { Quiz } from "../../types";
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

import OrgSwitcher from "../OrgSwitcher";
import { useOrganization } from "../../context/OrganizationContext";

export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const { token, user, logout } = useAuth();
  const { currentOrg } = useOrganization();
  const { showAlert } = useModal();
  const { selectedTheme, themeId, handleThemeChange } = useTheme();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await apiClient.get(endpoints.notifications);
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

  // Fetch all quizzes for search index
  useEffect(() => {
    const fetchAllQuizzes = async () => {
      try {
        const categoriesRes = await apiClient.get(endpoints.category);
        const categories = categoriesRes.data;

        let allQuizzes: Quiz[] = [];

        // Fetch my quizzes
        if (token) {
          const myQuizzesRes = await apiClient.get(endpoints.quizzes);
          allQuizzes = [...myQuizzesRes.data];
        }

        // Fetch category quizzes
        const categoryPromises = categories.map((cat: any) =>
          apiClient.get(endpoints.getQuizByCategory(cat.id))
        );
        const categoryResponses = await Promise.all(categoryPromises);
        categoryResponses.forEach(res => {
          allQuizzes = [...allQuizzes, ...res.data];
        });

        // Unique by ID
        const uniqueQuizzes = Array.from(new Map(allQuizzes.map(q => [q.id, q])).values());
        setQuizzes(uniqueQuizzes);
      } catch (err) {
        console.error("Navbar: Failed to fetch quizzes for search", err);
      }
    };

    fetchAllQuizzes();
  }, [token]);

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put(endpoints.notification_read_all, {});
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await apiClient.put(endpoints.notification_read(notif.id), {});
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

  const handleJoinCode = () => {
    navigate('/join');
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

  const handlePlayNow = async (quizId: string | number) => {
    try {
      const res = await apiClient.post(
        endpoints.matches,
        { quizId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      navigate(`/match/${res.data.id}/lobby`);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "Không thể tạo trận đấu. Vui lòng thử lại sau.";
      showAlert({
        title: "Lỗi",
        message: errorMessage,
        type: "error"
      });
    }
  };
  return (
    <nav
      className={`fixed top-0 left-0 w-full flex justify-center z-50 transition-all duration-300
        ${scrolled ? "shadow-md backdrop-blur-2xl bg-background/80 border-b border-foreground/5 py-1" : "bg-transparent py-2"}`}
    >
      <div className={`w-full max-w-7xl flex items-center justify-between px-4 md:px-8 transition-all duration-300 ${isCompactVariant ? "h-12" : scrolled ? "h-14 lg:h-16" : "h-20 lg:h-24"}`}>
        {/* Left - Logo */}
        <div className="flex items-center gap-2 md:gap-4">
        {token && !isCompactVariant && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleSidebar} 
            className="rounded-full hover:bg-white/10 text-primary"
          >
            <Menu className="w-6 h-6" />
          </Button>
        )}
        {isCompactVariant && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full mr-2 hover:bg-black/10 text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div
          className={`cursor-pointer transition-all duration-300 flex items-center ${isCompactVariant ? 'h-8' : scrolled ? 'h-10 lg:h-12' : 'h-14 lg:h-16'}`}
          onClick={handleReturnHome}
        >
          <img src="/quizmon.png" alt="Quizmon Logo" className="h-full w-auto object-contain drop-shadow-sm" />
        </div>
      </div>

      {/* Middle - Search & Navigation (Hidden in compact variant) */}
      {!isCompactVariant && (
        <div className="flex-1 flex flex-row items-center justify-center gap-2 md:gap-6 mx-2 md:mx-6 max-w-3xl">
          {/* Main Navigation Links */}
          {token && (
            <div className={`hidden lg:flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-inner transition-opacity duration-300 ${isSearchExpanded ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'}`}>
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className={`rounded-full hover:bg-white/20 font-bold px-4 whitespace-nowrap transition-colors text-foreground`}>
                <img src="https://cdn-icons-png.flaticon.com/512/2544/2544087.png" alt="Home" className="w-5 h-5 mr-2 object-contain" /> Trang chủ
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/classrooms")} className={`rounded-full hover:bg-white/20 font-bold px-4 whitespace-nowrap transition-colors text-foreground`}>
                <img src="https://cdn-icons-png.flaticon.com/512/8388/8388104.png" alt="Classroom" className="w-5 h-5 mr-2 object-contain" /> Lớp học
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/library")} className={`rounded-full hover:bg-white/20 font-bold px-4 whitespace-nowrap transition-colors text-foreground`}>
                <img src="https://cdn-icons-png.flaticon.com/512/3038/3038168.png" alt="Library" className="w-5 h-5 mr-2 object-contain" /> Thư viện
              </Button>
            </div>
          )}

          {/* Search Bar Integration */}
          <div className={`flex items-center transition-all duration-300 ${isSearchExpanded ? 'flex-1 justify-center' : 'w-auto'}`}>
            <QuizSearch
              quizzes={quizzes}
              variant="navbar"
              onExpandChange={setIsSearchExpanded}
              onPlay={handlePlayNow}
              onEdit={(id) => navigate(`/quiz/${id}/editor`)}
            />
          </div>

          {/* Join Form */}
          <div className={`flex flex-row gap-2 max-w-md ml-auto justify-end transition-opacity duration-300 ${isSearchExpanded ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'}`}>
            <Button
              className="text-sm md:text-base font-black px-6 whitespace-nowrap"
              variant="outline"
              size="default"
              onClick={handleJoinCode}>Tham gia đấu</Button>
          </div>
        </div>
      )}

      {/* Right - Avatar + Actions */}
      <div className={`flex items-center gap-3 transition-opacity duration-300 ${isSearchExpanded ? 'hidden md:flex' : 'flex'}`}>

        {token ? (
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div className="relative cursor-pointer p-2 rounded-full hover:bg-white/10 transition-colors">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/1156/1156949.png" 
                    alt="Notifications" 
                    className="w-6 h-6 object-contain transition-colors brightness-100 invert" 
                  />
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
                  <AvatarImage className="object-cover" src={getAvatarUrl(user?.avatarUrl)} alt="@user" />
                  <AvatarFallback className={undefined}>{user?.username?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-white/10">
                <DropdownMenuItem onClick={handleNavigateUserStatistics} className="cursor-pointer font-bold text-foreground hover:bg-primary/10" inset={undefined}>
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/2972/2972415.png" 
                    alt="History" 
                    className="w-5 h-5 mr-2 object-contain" 
                  />
                  Lịch sử đấu
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/profile/settings')} className="cursor-pointer font-bold text-foreground hover:bg-primary/10" inset={undefined}>
                  <img src="https://cdn-icons-png.flaticon.com/512/738/738853.png" alt="Settings" className="w-5 h-5 mr-2 object-contain" />
                  Cài đặt
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground px-2 py-1">Không gian làm việc</DropdownMenuLabel>
                
                {user?.isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer font-bold text-primary dark:text-blue-400 hover:bg-primary/5 dark:hover:bg-blue-500/10">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/18570/18570983.png" 
                      alt="Admin Dashboard" 
                      className="w-5 h-5 mr-2 object-contain" 
                    />
                    Bảng điều khiển Admin
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => navigate('/settings/organization')} className="cursor-pointer font-bold text-foreground hover:bg-primary/10">
                  <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Organization" className="w-5 h-5 mr-2 object-contain" />
                  Quản lý tổ chức
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => navigate('/billing')} className="cursor-pointer font-bold text-foreground hover:bg-primary/10">
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3211/3211596.png" 
                    alt="Billing" 
                    className="w-5 h-5 mr-2 object-contain" 
                  />
                  Gói dịch vụ & Thanh toán
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive font-bold focus:bg-destructive/10 focus:text-destructive" inset={undefined}>
                  <img 
                    src="https://cdn-icons-png.flaticon.com/512/3094/3094700.png" 
                    alt="Logout" 
                    className="w-5 h-5 mr-2 object-contain" 
                  />
                  Đăng xuất
                </DropdownMenuItem>


                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer font-bold text-foreground">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/3308/3308315.png" 
                      alt="Theme" 
                      className="w-5 h-5 mr-2 object-contain" 
                    />
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
            className="font-bold px-6 h-12"
            variant="default"
            size="default"
            onClick={handleLogin}
          >
            Đăng nhập
          </Button>
        )}
      </div>
      </div>
    </nav>
  )
}
