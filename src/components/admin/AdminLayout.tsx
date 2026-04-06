import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Users, FileWarning, Cpu, ShieldCheck, Gift } from "lucide-react";

const navItems: { name: string; path: string; icon: any; isImageUrl?: boolean }[] = [
    { 
        name: "Tổng quan", 
        path: "/admin", 
        icon: "https://cdn-icons-png.flaticon.com/512/18570/18570983.png",
        isImageUrl: true 
    },
    { name: "Quản lý Quiz", path: "/admin/quizzes", icon: ShieldCheck },
    { name: "Báo cáo nội dung", path: "/admin/reports", icon: FileWarning },
    { name: "Người dùng & Doanh thu", path: "/admin/users", icon: Users },
    { name: "Cài đặt AI", path: "/admin/ai", icon: Cpu },
    { name: "Khuyến mãi", path: "/admin/promotions", icon: Gift },
];

export default function AdminLayout() {
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-transparent">
            {/* Sidebar */}
            <aside className="w-64  dark:bg-slate-900/20 backdrop-blur-xl border-r border-white/10 flex-shrink-0">
                <div className="p-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Bảng Quản Trị</h2>
                    <nav className="space-y-2 text-sm font-bold">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.path === "/admin"}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${isActive
                                        ? "bg-white/60 dark:bg-white/10 text-primary dark:text-white shadow-lg shadow-primary/10 scale-[1.02]"
                                        : "text-slate-600 hover:bg-white/40 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                                    }`
                                }
                            >
                                {item.isImageUrl ? (
                                    <img src={item.icon} alt={item.name} className="w-5 h-5 object-contain" />
                                ) : (
                                    <item.icon className="w-5 h-5" />
                                )}
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
