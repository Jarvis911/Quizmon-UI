import { useState } from "react";
import { Building2, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { useOrganization } from "@/context/OrganizationContext";
import { useModal } from "@/context/ModalContext";

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateOrgModal({ isOpen, onClose }: CreateOrgModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refreshOrganizations, switchOrganization } = useOrganization();
  const { showAlert } = useModal();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post(endpoints.organizations, { name: name.trim() });
      await refreshOrganizations();
      switchOrganization(res.data.id);
      setName("");
      onClose();
    } catch (err) {
      console.error("Failed to create organization", err);
      showAlert({
        title: "Lỗi",
        message: "Không thể tạo tổ chức. Vui lòng thử lại.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-2xl border-white/10 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Workspace" className="w-8 h-8 object-contain" /> Tạo không gian làm việc
          </DialogTitle>
          <DialogDescription className="font-bold text-muted-foreground">
            Đặt tên cho tổ chức mới của bạn. Bạn có thể mời các thành viên trong nhóm sau đó.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest px-1">Tên tổ chức</Label>
            <Input
              id="name"
              placeholder="VD: Khoa Khoa học, Câu lạc bộ Toán học"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-white/5 border-white/10 rounded-xl font-bold focus:ring-primary"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="rounded-xl font-bold"
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Tạo không gian
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
