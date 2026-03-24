import { useState, useEffect, useRef } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
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
  CheckCircle2
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
      const errorMsg = err.response?.data?.message || "Gửi lời mời thất bại.";
      setMessage({ type: 'error', text: errorMsg });
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
    } catch (err) {
      showAlert({
        title: "Thất bại",
        message: "Xóa thành viên thất bại. Bạn có thể là chủ sở hữu cuối cùng.",
        type: "error"
      });
    }
  };

  if (!currentOrg) return <div className="p-10 text-center font-bold">Chưa chọn tổ chức nào.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
      <header>
        <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-4">
          <img src="https://cdn-icons-png.flaticon.com/512/738/738853.png" alt="Settings" className="w-10 h-10 object-contain drop-shadow-md" /> Cài đặt
        </h1>
        <p className="text-muted-foreground font-bold mt-2">Quản lý thành viên và tùy chọn không gian làm việc của bạn.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Org Info */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-card/40 backdrop-blur-xl border-2 border-white/5 rounded-4xl p-8 shadow-xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-primary" /> Thông tin chung
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Tên tổ chức</label>
                <Input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="bg-white/5 border-white/10 rounded-xl h-12 font-bold focus:ring-primary"
                />
              </div>
              <Button 
                onClick={handleUpdateOrg} 
                className="w-full rounded-xl font-bold h-12"
                disabled={isUpdating || name === currentOrg.name}
              >
                {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                Lưu thay đổi
              </Button>
              {message && (
                <p className={`text-sm font-bold text-center mt-2 ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {message.text}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Member Management */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-card/40 backdrop-blur-xl border-2 border-white/5 rounded-4xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Users size={20} className="text-primary" /> Thành viên
              </h2>
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                {members.length} Thành viên
              </span>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex gap-2 mb-8">
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
                      className="h-14 rounded-2xl border-2 border-primary/20 bg-background/50 pl-12 font-bold focus-visible:ring-primary/30"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail size={20} />
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
              <Button type="submit" className="rounded-xl px-6 font-bold h-12" disabled={isUpdating || isSearching}>
                {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Mời
              </Button>
            </form>

            {/* Members List */}
            <div className="space-y-3">
              {isLoadingMembers ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary">
                        {member.user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-foreground">{member.user.username}</p>
                        <p className="text-xs text-muted-foreground font-bold">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs font-black uppercase tracking-tighter text-primary bg-primary/10 px-2 py-1 rounded-lg">
                        <ShieldCheck size={12} /> {member.role}
                      </div>
                      {member.user.id !== (user as any)?.id && ( // Can't remove yourself
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
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
