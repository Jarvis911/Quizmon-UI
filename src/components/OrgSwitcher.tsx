import { useState } from "react";
import { ChevronDown, Building2, Check, Plus } from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { CreateOrgModal } from "./modals/CreateOrgModal";

export default function OrgSwitcher() {
  const { organizations, currentOrg, switchOrganization, isLoading } = useOrganization();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (isLoading && !currentOrg) {
    return (
      <div className="h-9 w-32 bg-muted/50 animate-pulse rounded-lg" />
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 px-3 py-2 h-9 rounded-xl hover:bg-white/10 text-primary-foreground border border-white/10 bg-white/5 shadow-sm"
        >
          <Building2 className="w-4 h-4 text-primary" />
          <span className="font-bold max-w-[100px] truncate">
            {currentOrg?.name || "Chọn không gian"}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur-xl border-white/10">
        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground font-black px-2 py-1.5">
          Không gian làm việc
        </DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org.id)}
            className={`cursor-pointer flex items-center justify-between font-bold ${currentOrg?.id === org.id ? 'bg-primary/10 text-primary' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Building2 className={`w-4 h-4 ${currentOrg?.id === org.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="truncate max-w-[140px]">{org.name}</span>
            </div>
            {currentOrg?.id === org.id && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem 
          className="cursor-pointer font-bold text-primary hover:bg-primary/5"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo tổ chức
        </DropdownMenuItem>
      </DropdownMenuContent>

      <CreateOrgModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </DropdownMenu>
  );
}
