import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileWarning, Cpu, ShieldCheck, Gift, CreditCard, Menu, X, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems: { name: string; path: string; icon: typeof Users }[] = [
  { name: "Quản lý Quiz", path: "/admin/quizzes", icon: ShieldCheck },
  { name: "Báo cáo nội dung", path: "/admin/reports", icon: FileWarning },
  { name: "Người dùng & Doanh thu", path: "/admin/users", icon: Users },
  { name: "Cài đặt AI", path: "/admin/ai", icon: Cpu },
  { name: "Khuyến mãi", path: "/admin/promotions", icon: Gift },
  { name: "Gói & tính năng", path: "/admin/plans", icon: CreditCard },
  { name: "React Admin console", path: "/admin/super", icon: Gauge },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <Button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-md"
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Đóng menu quản trị" : "Mở menu quản trị"}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {isSidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed bottom-0 left-0 top-[64px] z-40 flex h-[calc(100vh-64px)] w-[16rem] flex-col
          border-r bg-card transition-transform duration-300 ease-out lg:static lg:h-auto lg:min-h-[calc(100vh-64px)] lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <LayoutDashboard className="h-5 w-5" />
            Bảng quản trị
          </h2>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")
              }
            >
              {(() => {
                const Ico = item.icon;
                return <Ico className="h-4 w-4 shrink-0" />;
              })()}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/20">
        <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
