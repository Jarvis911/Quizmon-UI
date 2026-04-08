import { useState, useEffect, useRef } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { sanitizeError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  Mail,
  Loader2,
  CheckCircle2,
  HelpCircle,
  CreditCard,
  Target
} from "lucide-react";

interface Member {
  id: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
  };
}

export default function OrganizationSettings() {
  const { currentOrg, refreshOrganizations } = useOrganization();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  const [name, setName] = useState(currentOrg?.name || "");
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setName(currentOrg.name);
      fetchMembers();
    }
  }, [currentOrg]);

  const fetchMembers = async () => {
    if (!currentOrg) return;
    setIsLoadingMembers(true);
    try {
      const res = await apiClient.get(endpoints.organization(currentOrg.id));
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Failed to fetch members", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleUpdateOrg = async () => {
    if (!currentOrg) return;
    setIsUpdating(true);
    setMessage(null);
    try {
      await apiClient.put(endpoints.organization(currentOrg.id), { name });
      await refreshOrganizations();
      setMessage({ type: 'success', text: "Đã cập nhật tổ chức thành công!" });
    } catch (err) {
      setMessage({ type: 'error', text: "Cập nhật tổ chức thất bại." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !inviteEmail.trim()) return;

    setIsUpdating(true); // Reusing isUpdating for invite loading state
    setMessage(null);

    try {
      await apiClient.post(endpoints.organization_members(currentOrg.id), {
        email: inviteEmail.trim(),
        role: 'MEMBER'
      });
      setMessage({ type: 'success', text: "Gửi lời mời thành công!" });
      setInviteEmail("");
      fetchMembers();
    } catch (err: any) {
      setMessage({ type: 'error', text: sanitizeError(err, "Gửi lời mời thất bại.") });
    } finally {
      setIsUpdating(false);
    }
  };

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`${endpoints.organizations}/users/search`, { params: { query } });
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!currentOrg) return;
    const confirmed = await showConfirm({
      title: "Xác nhận xóa",
      message: "Bạn có chắc chắn muốn xóa thành viên này?",
      type: "confirm"
    });
    if (!confirmed) return;

    try {
      await apiClient.delete(`${endpoints.organization_members(currentOrg.id)}/${userId}`);
      fetchMembers();
      showAlert({
        title: "Thành công",
        message: "Đã xóa thành viên khỏi tổ chức.",
        type: "success"
      });
    } catch (err: any) {
      showAlert({
        title: "Thất bại",
        message: sanitizeError(err, "Xóa thành viên thất bại. Vui lòng thử lại."),
        type: "error"
      });
    }
  };

  if (!currentOrg) return <div className="p-10 text-center font-bold">Chưa chọn tổ chức nào.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3 md:gap-4">
            <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Organization" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-md" /> Cài đặt tổ chức
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground font-bold mt-1 md:mt-2">Quản lý thành viên và tùy chọn không gian làm việc của bạn.</p>
        </div>
        <Button
          onClick={() => setShowGuide(!showGuide)}
          className={`flex items-center justify-center gap-2 border-2 border-primary/30 font-black h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl transition-all w-full md:w-auto text-sm md:text-base ${showGuide ? 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90' : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'}`}
        >
          <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
          {showGuide ? 'Đóng hướng dẫn' : 'Tổ chức là gì?'}
        </Button>
      </header>

      {/* Organization Guide Section */}
      {showGuide && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-primary/5 border-2 border-primary/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group">
            <h3 className="text-lg md:text-xl font-black text-primary mb-3 md:mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 md:w-6 md:h-6" /> Tổ chức là gì?
            </h3>
            <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
              Là một <strong className="font-black text-foreground">không gian làm việc chung</strong> (Team, Trường học, Công ty) giúp bạn quản lý bài trắc nghiệm và thành viên tại một nơi duy nhất.
            </p>
          </div>

          <div className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group">
            <h3 className="text-lg md:text-xl font-black text-emerald-500 mb-3 md:mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6" /> Lợi ích dùng chung
            </h3>
            <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
              <strong className="font-black text-foreground text-emerald-600 dark:text-emerald-400">Tiết kiệm chi phí</strong>: Khi Tổ chức được nâng cấp gói trả phí, <strong className="font-black text-foreground text-emerald-600 dark:text-emerald-400">tất cả thành viên</strong> trong đó đều được sử dụng các tính năng Premium mà không cần mua lẻ.
            </p>
          </div>

          <div className="bg-amber-500/5 border-2 border-amber-500/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group">
            <h3 className="text-lg md:text-xl font-black text-amber-500 mb-3 md:mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" /> Vai trò & Bảo mật
            </h3>
            <ul className="text-xs md:text-sm font-medium text-muted-foreground space-y-1 md:space-y-2 relative z-10">
              <li>• <strong className="font-black text-foreground">Chủ sở hữu</strong>: Quản lý thành viên, tên tổ chức và thanh toán.</li>
              <li>• <strong className="font-black text-foreground">Thành viên</strong>: Tham gia tổ chức để cùng làm việc và hưởng gói Premium.</li>
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* Org Info */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-card/40 backdrop-blur-xl border-2 border-white/5 rounded-3xl md:rounded-4xl p-5 md:p-8 shadow-xl">
            <h2 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-2">
              Thông tin chung
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Tên tổ chức</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-xl h-10 md:h-12 font-bold focus:ring-primary text-sm md:text-base"
                />
              </div>
              <Button
                onClick={handleUpdateOrg}
                className="w-full rounded-xl font-bold h-10 md:h-12 text-sm md:text-base"
                disabled={isUpdating || name === currentOrg.name}
              >
                {isUpdating ? <Loader2 className="animate-spin mr-2 w-4 h-4 md:w-5 md:h-5" /> : <CheckCircle2 className="mr-2 w-4 h-4 md:w-5 md:h-5" />}
                Lưu thay đổi
              </Button>
              {message && (
                <p className={`text-xs md:text-sm font-bold text-center mt-2 ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {message.text}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Member Management */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-card/40 backdrop-blur-xl border-2 border-white/5 rounded-3xl md:rounded-4xl p-5 md:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 md:gap-0 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                Thành viên
              </h2>
              <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-tighter w-fit">
                {members.length} Thành viên
              </span>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 mb-6 md:mb-8">
              <div className="relative flex-1">
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Nhập email hoặc tên người dùng..."
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        debouncedSearch(e.target.value);
                      }}
                      className="h-12 md:h-14 rounded-xl md:rounded-2xl border-2 border-primary/20 bg-background/50 pl-10 md:pl-12 font-bold focus-visible:ring-primary/30 text-sm md:text-base"
                    />
                    <div className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="w-4 h-4 md:w-5 md:h-5" />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-primary/20 rounded-2xl shadow-xl z-50 overflow-hidden">
                        {searchResults.map((user: any) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setInviteEmail(user.email);
                              setSearchResults([]);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors border-b last:border-0 border-muted font-bold flex items-center justify-between"
                          >
                            <span>{user.username || user.email}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button type="submit" className="rounded-xl px-6 font-bold h-12 md:h-14 w-full sm:w-auto text-sm md:text-base" disabled={isUpdating || isSearching}>
                {isUpdating ? <Loader2 className="animate-spin mr-2 w-4 h-4 md:w-5 md:h-5" /> : <UserPlus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />}
                Mời
              </Button>
            </form>

            {/* Members List */}
            <div className="space-y-2 md:space-y-3">
              {isLoadingMembers ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="group flex items-center justify-between p-3 md:p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl md:rounded-2xl transition-all gap-2">
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-sm md:text-base">
                        {member.user.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-foreground text-sm md:text-base truncate">{member.user.username}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground font-bold truncate max-w-24 xs:max-w-32 sm:max-w-none">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                      <div className="flex items-center gap-1 text-[10px] md:text-xs font-black uppercase tracking-tighter text-primary bg-primary/10 px-2 py-1 rounded-lg">
                        <ShieldCheck className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">{member.role}</span>
                      </div>
                      {member.user.id !== (user as any)?.id && ( // Can't remove yourself
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="md:opacity-0 md:group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-lg md:rounded-xl transition-all h-8 w-8 md:h-10 md:w-10"
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
