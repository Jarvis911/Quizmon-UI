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

    if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
    if (!stats) return <div className="p-8 text-red-500">Failed to load stats</div>;

    const cards = [
        { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-500" },
        { label: "Total Quizzes", value: stats.quizzes, icon: FileQuestion, color: "text-emerald-500" },
        { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-purple-500" },
        { label: "Total Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: CreditCard, color: "text-green-600" },
        { label: "AI Jobs Processed", value: stats.aiJobs, icon: Cpu, color: "text-amber-500" },
        { label: "Gemini Tokens Used", value: stats.totalTokens.toLocaleString(), icon: Cpu, color: "text-indigo-500" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome to your metrics dashboard.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cards.map((s, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</h3>
                            <s.icon className={`h-4 w-4 ${s.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
