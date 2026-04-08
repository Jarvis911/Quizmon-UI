import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Users, FileWarning, Cpu, ShieldCheck, Gift, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-transparent relative">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <Button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="w-14 h-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-white p-0 flex items-center justify-center animate-bounce-subtle"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </Button>
            </div>

            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    className="lg:hidden fixed top-[64px] inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative top-[64px] lg:top-0 bottom-0 left-0 w-64 lg:w-64 z-40
                dark:bg-slate-900/80 lg:dark:bg-slate-900/20 backdrop-blur-2xl lg:backdrop-blur-xl border-r border-white/10 flex-shrink-0
                transition-transform duration-300 ease-in-out transform
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>
                <div className="p-6 h-full flex flex-col bg-card lg:bg-transparent">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight flex items-center gap-2">
                        <img src="https://cdn-icons-png.flaticon.com/512/18570/18570983.png" alt="Admin" className="w-6 h-6 object-contain" />
                        Bảng Quản Trị
                    </h2>
                    <nav className="space-y-2 text-sm font-bold flex-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.path === "/admin"}
                                onClick={() => setIsSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                                    }`
                                }
                            >
                                {item.isImageUrl ? (
                                    <img src={item.icon} alt={item.name} className="w-5 h-5 object-contain brightness-0 dark:brightness-100" />
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
            <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
