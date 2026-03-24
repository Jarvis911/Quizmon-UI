import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Users, FileWarning, Cpu, ShieldCheck } from "lucide-react";

const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Quizzes", path: "/admin/quizzes", icon: ShieldCheck },
    { name: "Reports", path: "/admin/reports", icon: FileWarning },
    { name: "Users & Revenue", path: "/admin/users", icon: Users },
    { name: "AI Settings", path: "/admin/ai", icon: Cpu },
];

export default function AdminLayout() {
    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-transparent">
            {/* Sidebar */}
            <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Admin Panel</h2>
                    <nav className="space-y-1 text-sm font-medium">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.path === "/admin"}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isActive
                                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white"
                                    }`
                                }
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
