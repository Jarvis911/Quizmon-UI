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
} from "lucide-react";
import { Button } from "../components/ui/button";

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
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setAvatarUrl(user.avatarUrl || "");
      setBio(user.bio || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: "Mật khẩu xác nhận không khớp", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.put(
        endpoints.user_profile_update,
        {
          username,
          avatarUrl,
          bio,
          ...(newPassword ? { oldPassword, newPassword } : {}),
        }
      );

      if (response.status === 200) {
        updateUserData(response.data.user);
        setMessage({ text: "Cập nhật trang cá nhân thành công!", type: "success" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
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
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center text-foreground/80 hover:text-foreground font-bold transition-colors bg-card/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Về trang chủ
          </button>
          <h1 className="text-3xl font-black text-foreground drop-shadow-md">Thiết lập tài khoản</h1>
          <div className="w-24"></div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg backdrop-blur-xl border-2 ${
            message.type === 'success' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-rose-500/20 text-rose-100 border-rose-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-bold">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Section */}
          <div className="bg-card/60 backdrop-blur-2xl rounded-4xl shadow-2xl border-2 border-white/5 overflow-hidden transition-all hover:border-white/10">
            <div className="p-6 sm:p-8 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <User className="w-5 h-5 text-indigo-500" />
                </div>
                Thông tin cá nhân
              </h2>
            </div>
            
            <div className="p-6 sm:p-8 space-y-8">
              {/* Avatar Selection */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-4xl overflow-hidden border-4 border-white/20 bg-white/5 flex items-center justify-center shadow-2xl group-hover:border-primary/50 transition-all duration-300">
                    {avatarUrl ? (
                      <img src={getAvatarUrl(avatarUrl)} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-white/20" />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-primary p-2.5 rounded-2xl shadow-xl border-4 border-card hover:scale-110 active:scale-95 transition-all text-primary-foreground"
                  >
                    <Plus className="w-5 h-5 font-bold" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                  />
                </div>
                
                <div className="flex-1 w-full space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-sm font-black text-foreground/90 uppercase tracking-widest">
                        Ảnh đại diện
                      </label>
                      <button 
                        type="button"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="text-xs font-black text-primary hover:underline"
                      >
                        {showTemplates ? "Đóng mẫu" : "Chọn từ mẫu Pokemon"}
                      </button>
                   </div>

                   {showTemplates && (
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 animate-in zoom-in-95 duration-200">
                        {PREDEFINED_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(url);
                              setShowTemplates(false);
                            }}
                            className={`aspect-square rounded-xl overflow-hidden transition-all hover:scale-110 ${avatarUrl === url ? 'ring-4 ring-primary bg-primary/20' : 'bg-white/5 hover:bg-white/10'}`}
                          >
                            <img src={getAvatarUrl(url)} alt="Pokemon" className="w-full h-full object-contain p-1" />
                          </button>
                        ))}
                     </div>
                   )}
                   
                   <p className="text-sm text-muted-foreground font-bold italic">
                     Bạn có thể tải ảnh từ máy hoặc chọn các mẫu Pokemon có sẵn.
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-foreground/90 uppercase tracking-widest">
                    <User className="w-4 h-4" />
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-black text-foreground/90 uppercase tracking-widest">
                    <Mail className="w-4 h-4" />
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-foreground/40 cursor-not-allowed outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-black text-foreground/90 uppercase tracking-widest">
                  <FileText className="w-4 h-4" />
                  Giới thiệu (Bio)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Chia sẻ một chút về bản thân..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-bold resize-none"
                />
              </div>
            </div>
          </div>


          {/* Security Section */}
          <div className="bg-card/60 backdrop-blur-2xl rounded-4xl shadow-2xl border-2 border-white/5 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-black text-foreground flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <Lock className="w-5 h-5 text-rose-500" />
                </div>
                Đổi mật khẩu
              </h2>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground/90 uppercase tracking-widest">Mật khẩu cũ</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground/90 uppercase tracking-widest">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-foreground/90 uppercase tracking-widest">Xác nhận lại</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-foreground placeholder:text-foreground/20 focus:border-primary/50 focus:bg-white/10 transition-all outline-none font-bold"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                Nếu không muốn đổi mật khẩu, bạn có thể để trống các trường trên.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-6 pt-4 pb-20">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-8 py-3 rounded-2xl font-black text-foreground/80 hover:bg-white/10 hover:text-foreground transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-white bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-95 text-lg"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Save className="w-6 h-6" />
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
