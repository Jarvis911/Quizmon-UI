import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";

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

    if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;

    return (
        <div className="space-y-6 md:space-y-8">
            <div className="relative">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Người dùng & Doanh thu</h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">Xem tài khoản người dùng, gói đăng ký và trạng thái doanh thu.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 bg-card/40 dark:bg-slate-900/40 p-4 md:p-6 rounded-3xl md:rounded-4xl border border-white/10 backdrop-blur-md shadow-xl">
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên hoặc email..." 
                        className="w-full h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        className="w-full h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
                        value={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.value)}
                    >
                        <option value="">Tất cả loại tài khoản</option>
                        <option value="true">Chỉ Admin</option>
                        <option value="false">Chỉ người dùng thường</option>
                    </select>
                </div>
            </div>

            <div className="rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-card/30 dark:bg-slate-900/30 overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[800px] md:min-w-0">
                        <thead className="bg-white/10 dark:bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Người dùng</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Gói đăng ký</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Trạng thái</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Ngày tham gia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((user) => {
                                const subInfo = getSubscriptionStatus(user);
                                return (
                                    <tr key={user.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-slate-500">{user.id}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-black text-slate-900 dark:text-white flex items-center gap-3">
                                            {user.username}
                                            {user.isAdmin && (
                                                <span className="bg-indigo-500 text-white text-[9px] md:text-[10px] px-2 py-0.5 rounded-full uppercase font-black shadow-lg shadow-indigo-500/20">
                                                    Admin
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-slate-600 dark:text-slate-300">{user.email}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-slate-500 italic">{subInfo.plan}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5">
                                            <span className={`px-3 md:px-4 py-1 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm ${
                                                subInfo.status === 'HOẠT ĐỘNG' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' :
                                                subInfo.status === 'DÙNG THỬ' ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/20' :
                                                'bg-slate-500/20 text-slate-500 border border-slate-500/20'
                                            }`}>
                                                {subInfo.status}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
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
