import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import endpoints, { getAvatarUrl } from "../api/api";
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  ArrowLeft, 
  Lock, 
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

const PREDEFINED_AVATARS = [
  "https://projectpokemon.org/images/normal-sprite/bulbasaur.gif",
  "https://projectpokemon.org/images/normal-sprite/charmander.gif",
  "https://projectpokemon.org/images/normal-sprite/squirtle.gif",
  "https://projectpokemon.org/images/normal-sprite/pikachu.gif",
  "https://projectpokemon.org/images/normal-sprite/eevee.gif",
  "https://projectpokemon.org/images/normal-sprite/mew.gif",
];

const ProfileSettings = () => {
  const { user, token, updateUserData } = useAuth();
  const { selectedTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [bio, setBio] = useState(user?.bio || "");
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const toastTimeoutRef = useRef<any | null>(null);

  useEffect(() => {
    if (message) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [message]);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setAvatarUrl(user.avatarUrl || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: "Mật khẩu xác nhận không khớp", type: "error" });
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await apiClient.put(endpoints.user_profile_update, {
        oldPassword,
        newPassword,
      });

      if (response.status === 200) {
        setMessage({ text: "Đổi mật khẩu thành công!", type: "success" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsPasswordModalOpen(false);
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.message || "Lỗi khi đổi mật khẩu", 
        type: "error" 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await apiClient.put(
        endpoints.user_profile_update,
        {
          username,
          avatarUrl,
          bio,
        }
      );

      if (response.status === 200) {
        updateUserData(response.data.user);
        setMessage({ text: "Cập nhật trang cá nhân thành công!", type: "success" });
      }
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const response = await apiClient.post(endpoints.user_avatar_upload, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (response.status === 200) {
        setAvatarUrl(response.data.user.avatarUrl);
        updateUserData(response.data.user);
        setMessage({ text: "Tải ảnh đại diện thành công!", type: "success" });
      }
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      setMessage({ text: "Lỗi khi tải ảnh đại diện", type: "error" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-all duration-300`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center text-foreground/80 hover:text-foreground font-bold transition-colors bg-card/40 px-3 py-2 md:px-4 md:py-2 rounded-lg md:rounded-xl backdrop-blur-md border border-white/10 text-xs md:text-sm"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Về trang chủ</span>
          </button>
          <h1 className="text-xl md:text-3xl font-black text-foreground drop-shadow-md text-center">Thiết lập tài khoản</h1>
          <div className="w-10 sm:w-24"></div>
        </div>

        {message && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`px-6 py-4 rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl border-2 ${
              message.type === 'success' 
                ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
                : 'bg-rose-500/90 text-white border-rose-400/50'
            }`}>
              <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-white/20' : 'bg-white/20'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div className="flex flex-col">
                <p className="font-black text-sm uppercase tracking-tight">{message.type === 'success' ? 'Thành công' : 'Thất bại'}</p>
                <p className="font-bold text-lg leading-tight">{message.text}</p>
              </div>
              <button 
                onClick={() => setMessage(null)}
                className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="Đóng"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleProfileUpdate} className="space-y-8">
          {/* Profile Section */}
          <div className="bg-card/60 backdrop-blur-2xl rounded-3xl md:rounded-4xl shadow-2xl border-2 border-white/5 overflow-hidden transition-all hover:border-white/10">
            <div className="p-4 sm:p-6 md:p-8 border-b border-white/5 bg-white/5">
              <h2 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-indigo-500/20 rounded-lg md:rounded-xl">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                </div>
                Thông tin cá nhân
              </h2>
            </div>
            
            <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
              {/* Avatar Selection */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 md:gap-8">
                <div className="relative group">
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-4 border-white/20 bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center shadow-2xl group-hover:border-primary/50 transition-all duration-500 relative">
                    {avatarUrl ? (
                      <img src={getAvatarUrl(avatarUrl)} alt="Avatar Preview" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-primary/20 via-primary/10 to-transparent">
                          <span className="text-2xl md:text-4xl font-black text-primary/40 mb-1 drop-shadow-sm">
                            {username ? username[0].toUpperCase() : "?"}
                          </span>
                          <User className="w-6 h-6 md:w-8 md:h-8 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <Camera className="w-6 h-6 md:w-8 md:h-8 text-white scale-75 group-hover:scale-100 transition-transform" />
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-primary w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl shadow-xl border-[3px] md:border-4 border-card flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-primary-foreground group/plus z-10"
                    title="Tải ảnh lên"
                  >
                    <Plus className="w-4 h-4 md:w-6 md:h-6 font-bold group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                  />
                </div>
                
                <div className="flex-1 w-full space-y-3 md:space-y-4">
                   <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2">
                      <label className="text-xs md:text-sm font-black text-foreground/90 uppercase tracking-widest text-center sm:text-left">
                        Ảnh đại diện
                      </label>
                      <button 
                        type="button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="text-[10px] md:text-xs font-black text-primary hover:underline"
                      >
                        {showTemplates ? "Đóng mẫu" : "Chọn từ mẫu Pokemon"}
                      </button>
                   </div>

                   {showTemplates && (
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3 p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                        {PREDEFINED_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(url);
                              setShowTemplates(false);
                            }}
                            className={`aspect-square rounded-lg md:rounded-xl overflow-hidden transition-all hover:scale-110 ${avatarUrl === url ? 'ring-2 md:ring-4 ring-primary bg-primary/20' : 'bg-white/5 hover:bg-white/10'}`}
                          >
                            <img src={getAvatarUrl(url)} alt="Pokemon" className="w-full h-full object-contain p-1" />
                          </button>
                        ))}
                     </div>
                   )}
                   
                   <p className="text-xs md:text-sm text-muted-foreground font-bold italic text-center sm:text-left">
                     Bạn có thể tải ảnh từ máy hoặc chọn các mẫu Pokemon có sẵn.
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1 md:space-y-2">
                  <label className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-black text-foreground/90 uppercase tracking-widest">
                    <User className="w-3 h-3 md:w-4 md:h-4" />
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-white/5 border-2 border-white/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-bold text-sm md:text-base"
                  />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-black text-foreground/90 uppercase tracking-widest">
                    <Mail className="w-3 h-3 md:w-4 md:h-4" />
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-white/5 border-2 border-white/10 text-foreground/40 cursor-not-allowed outline-none font-bold text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <label className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-sm font-black text-foreground/90 uppercase tracking-widest">
                  <FileText className="w-3 h-3 md:w-4 md:h-4" />
                  Giới thiệu (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Chia sẻ một chút về bản thân..."
                  className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-white/5 border-2 border-white/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-bold resize-none text-sm md:text-base"
                />
              </div>

              {/* Security trigger - hidden password change */}
              <div className="pt-4">
                <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group group-hover:border-rose-500/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                          <Lock className="w-6 h-6 text-rose-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-foreground">Bảo mật</p>
                          <p className="text-xs font-bold text-foreground/40 uppercase">Cập nhật mật khẩu định kỳ để bảo vệ tài khoản</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-foreground/20 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-card/40 backdrop-blur-3xl border-white/10 max-w-sm rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-linear-to-br from-rose-500/10 via-transparent to-rose-500/5 pointer-events-none" />
                    <DialogHeader className="p-8 pb-4 relative z-10">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center shadow-inner ring-4 ring-rose-500/10">
                          <Lock className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-black text-foreground">Đổi mật khẩu</DialogTitle>
                          <DialogDescription className="text-[10px] font-black text-foreground/40 uppercase tracking-widest leading-none">An toàn là trên hết</DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="p-8 py-4 space-y-5 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Mật khẩu hiện tại</label>
                        <div className="relative group">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full h-14 pl-4 pr-12 rounded-2xl bg-white/5 border border-white/10 focus:border-rose-500/50 transition-all outline-none font-bold"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-rose-500 transition-colors"
                          >
                            {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Mật khẩu mới</label>
                          <div className="relative group">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full h-14 pl-4 pr-12 rounded-2xl bg-white/5 border border-white/10 focus:border-rose-500/50 transition-all outline-none font-bold"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-rose-500 transition-colors"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest pl-1">Xác nhận mật khẩu</label>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-14 px-4 rounded-2xl bg-white/5 border border-white/10 focus:border-rose-500/50 transition-all outline-none font-bold"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="p-8 pt-4 relative z-10">
                      <Button
                        onClick={handlePasswordChange}
                        disabled={passwordLoading || !oldPassword || !newPassword}
                        className="w-full h-14 bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black rounded-2xl shadow-xl shadow-rose-500/20 uppercase tracking-tighter flex items-center justify-center gap-2 group"
                      >
                        {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                        XÁC NHẬN ĐỔI MỚI
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-6 pt-2 md:pt-4 pb-20">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black text-foreground/80 hover:bg-white/10 hover:text-foreground transition-all text-sm md:text-base border border-white/10 sm:border-none"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleProfileUpdate}
              type="button"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black text-white bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-2xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 text-base md:text-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
              ) : (
                <Save className="w-5 h-5 md:w-6 md:h-6" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
