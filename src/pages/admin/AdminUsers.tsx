import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Search } from "lucide-react";
import {
    AdminLoading,
    AdminPageHeader,
    adminFieldClass,
    adminFilterPanelClass,
    adminTableShellClass,
} from "@/components/admin/adminQuizmonChrome";

export default function AdminUsers() {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAdmin, setIsAdmin] = useState("");

    const loadUsers = () => {
        apiClient.get("/admin/users", { params: { search, isAdmin: isAdmin === "" ? undefined : isAdmin } })
        .then(res => setUsers(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadUsers();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [token, search, isAdmin]);

    const getSubscriptionStatus = (user: any) => {
        const orgMember = user.organizationMembers?.[0];
        if (!orgMember) return { status: 'Miễn phí', plan: 'N/A' };
        const sub = orgMember.organization?.subscriptions?.[0];
        if (!sub) return { status: 'Miễn phí', plan: 'N/A' };
        
        return { 
            status: sub.status === 'ACTIVE' ? 'HOẠT ĐỘNG' : sub.status === 'TRIALING' ? 'DÙNG THỬ' : sub.status, 
            plan: sub.plan?.name || "Không rõ"
        };
    };

    if (loading) return <AdminLoading />;

    return (
        <div className="space-y-6 md:space-y-8">
            <AdminPageHeader
              title="Người dùng & Doanh thu"
              subtitle="Theo dõi tài khoản, gói đăng ký và vai trò nội bộ."
            />

            {/* Filters */}
            <div className={adminFilterPanelClass}>
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên hoặc email…" 
                        className={`${adminFieldClass} pl-11`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        className={`${adminFieldClass} appearance-none`}
                        value={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.value)}
                    >
                        <option value="">Tất cả loại tài khoản</option>
                        <option value="true">Chỉ Admin</option>
                        <option value="false">Chỉ người dùng thường</option>
                    </select>
                </div>
            </div>

            <div className={adminTableShellClass}>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[800px] md:min-w-0">
                        <thead className="border-b border-primary/10 bg-primary/10 dark:bg-primary/15">
                            <tr>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">ID</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Người dùng</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Email</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Gói đăng ký</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Ngày tham gia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => {
                                const subInfo = getSubscriptionStatus(user);
                                return (
                                    <tr key={user.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-muted-foreground">{user.id}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 flex items-center gap-3 font-black text-foreground">
                                            {user.username}
                                            {user.isAdmin && (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black uppercase text-primary-foreground shadow-md shadow-primary/25 md:text-[10px]">
                                                    Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-foreground/80">{user.email}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-bold italic text-muted-foreground">{subInfo.plan}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5">
                                            <span className={`px-3 md:px-4 py-1 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm ${
                                                subInfo.status === 'HOẠT ĐỘNG' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' :
                                                subInfo.status === 'DÙNG THỬ' ? 'border border-primary/25 bg-primary/15 text-primary' :
                                                'bg-slate-500/20 text-slate-500 border border-slate-500/20'
                                            }`}>
                                                {subInfo.status}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
