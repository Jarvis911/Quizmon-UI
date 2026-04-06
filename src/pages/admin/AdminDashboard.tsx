import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Users, FileQuestion, CreditCard, Cpu } from "lucide-react";

export default function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get("/admin/stats")
        .then(res => setStats(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;
    if (!stats) return <div className="p-8 text-red-500">Lỗi tải số liệu</div>;

    const cards = [
        { label: "Tổng người dùng", value: stats.users, icon: Users, color: "text-blue-500" },
        { label: "Tổng số Quiz", value: stats.quizzes, icon: FileQuestion, color: "text-emerald-500" },
        { label: "Gói đăng ký hoạt động", value: stats.activeSubscriptions, icon: CreditCard, color: "text-purple-500" },
        { label: "Tổng doanh thu", value: `$${stats.revenue.toFixed(2)}`, icon: CreditCard, color: "text-green-600" },
        { label: "Yêu cầu AI đã xử lý", value: stats.aiJobs, icon: Cpu, color: "text-amber-500" },
        { label: "Token Gemini đã dùng", value: stats.totalTokens.toLocaleString(), icon: Cpu, color: "text-indigo-500" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Tổng quan Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Chào mừng trở lại! Dưới đây là các số liệu quan trọng nhất.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {cards.map((s, i) => (
                    <div key={i} className="group relative rounded-4xl border border-white/10 bg-card/40 dark:bg-slate-900/40 p-8 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <s.icon className="h-24 w-24" />
                        </div>
                        <div className="flex items-center justify-between space-y-0 pb-4">
                            <h3 className="tracking-tight text-sm font-black uppercase text-slate-500 dark:text-slate-400">{s.label}</h3>
                            <div className={`p-3 rounded-2xl bg-white/50 dark:bg-white/5 shadow-inner`}>
                                <s.icon className={`h-6 w-6 ${s.color}`} />
                            </div>
                        </div>
                        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{s.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
