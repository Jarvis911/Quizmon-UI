import { useEffect, useState, FormEvent, HTMLAttributes } from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { useAuth } from "../../context/AuthContext";
import { Plus, LogOut, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";


export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { token, user, logout } = useAuth();
  const [code, setCode] = useState("");
  const navigate = useNavigate();


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
     navigate(`/home`);
  }

  const handleLogin = () => {
    navigate(`/login`);
  };

  const handleLogout = () => {
    logout(); 
    navigate(`/home`); 
  };

  const handleNavigateUserStatistics = () => {
    navigate(`/statistics`);
  }
  return (
    <nav
      className={`fixed top-0 left-0 w-full h-16 flex items-center justify-between px-6 z-50 transition-all 
        bg-white/70 backdrop-blur-md ${scrolled ? "shadow-md" : ""}`}
    >
      {/* Left - Logo */}
      <div className="text-2xl font-bold text-orange-600 cursor-pointer" onClick={handleReturnHome}>Quizmon</div>

      {/* Middle - Search */}
      <div className="flex-1 flex flex-row gap-4 mx-6 max-w-xl">
        <Input
          type="text"
          placeholder="Nhập mã phòng để tham gia..."
          value={code}
          onChange={(e: FormEvent) => setCode((e.target as HTMLInputElement).value)}
          className="w-full border-2 border-orange-400 focus:border-red-500 focus:ring-0"
        />
        <Button className="bg-orange-600 cursor-pointer" variant="default" size="lg" onClick={handleJoinCode}>Tham gia</Button>
      </div>

      {/* Right - Avatar + New Quiz */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="default"
          className="rounded-full p-4 bg-orange-500 hover:bg-orange-600 cursor-pointer text-white"
          onClick={handleCreateQuiz}
        >
          Tạo quiz!
        </Button>

        {token ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                {/* Haven't implement avatar yet */}
                <AvatarImage className={undefined} src={user?.avatar || "https://github.com/shadcn.png"} alt="@user" />
                <AvatarFallback className={undefined}>{user?.username?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-24">
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" inset={undefined}>
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNavigateUserStatistics} className="cursor-pointer" inset={undefined}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Xem lịch sử đấu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="bg-orange-500 hover:bg-orange-400 text-white"
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
