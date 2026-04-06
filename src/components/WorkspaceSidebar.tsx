import { X, Building2, Check, Plus, Settings, Info, Shuffle, ShieldCheck, Users2 } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { Button } from "./ui/button";
import { CreateOrgModal } from "./modals/CreateOrgModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface WorkspaceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkspaceSidebar({ isOpen, onClose }: WorkspaceSidebarProps) {
  const { organizations, currentOrg, switchOrganization, isLoading } = useOrganization();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-card/95 backdrop-blur-2xl border-r border-white/10 z-70 transition-transform duration-500 ease-out shadow-2xl flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Organization" className="w-6 h-6 object-contain" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Không gian</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="px-2 mb-4">
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Danh sách tổ chức</p>
          </div>

          {isLoading && !currentOrg && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-full bg-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          )}

          {organizations.map((org) => {
            const isActive = currentOrg?.id === org.id;
            return (
              <button
                key={org.id}
                onClick={() => {
                  switchOrganization(org.id);
                  // Optional: close sidebar on selection for mobile
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-white/10 text-foreground"}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-white/20" : "bg-white/5 group-hover:bg-primary/20 transition-colors"}`}>
                    <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Org" className="w-4 h-4 object-contain" />
                  </div>
                  <span className="font-bold truncate text-left">{org.name}</span>
                </div>
                {isActive && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}

          <div className="mt-8 px-2 space-y-4">
            <div className="bg-primary/5 border border-primary/10 rounded-4xl p-5 relative overflow-hidden group">
              <h3 className="text-sm font-black text-primary mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary text-white">
                  <Info size={14} />
                </div>
                Mẹo sử dụng
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <div className="p-2 rounded-xl bg-white/5 text-primary mt-0.5 group-hover:bg-primary/10 transition-colors">
                    <Shuffle size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground mb-0.5">Chuyển đổi linh hoạt</p>
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">Nhấn vào tên để di chuyển giữa các không gian quản lý khác nhau.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="p-2 rounded-xl bg-white/5 text-primary mt-0.5 group-hover:bg-primary/10 transition-colors">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground mb-0.5">Dữ liệu tách biệt</p>
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">Mỗi tổ chức có bộ câu hỏi, lớp học và thành viên riêng tư tuyệt đối.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 space-y-2">
          <Button 
            className="w-full justify-start h-12 rounded-2xl font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-3" />
            Tạo tổ chức mới
          </Button>
          
          <Button 
            className="w-full justify-start h-12 rounded-2xl font-bold hover:bg-white/10 border-none"
            variant="ghost"
            onClick={() => {
              navigate('/settings/organization');
              onClose();
            }}
          >
            <img src="https://cdn-icons-png.flaticon.com/512/738/738853.png" alt="Settings" className="w-5 h-5 mr-3 object-contain" />
            Cài đặt tổ chức
          </Button>
        </div>

        <CreateOrgModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      </aside>
    </>
  );
}
