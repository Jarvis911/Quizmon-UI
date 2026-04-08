import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
      <div className="max-w-md w-full bg-card/40 backdrop-blur-2xl border-2 border-rose-500/20 rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-center shadow-2xl space-y-6 md:space-y-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <XCircle className="w-10 h-10 md:w-[60px] md:h-[60px]" strokeWidth={3} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground">
            Hủy <span className="text-rose-500 italic">Thanh toán</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-bold">
            Đừng lo lắng! Tài khoản của bạn vẫn chưa bị trừ tiền.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/billing')} 
            className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-base md:text-lg"
          >
            <ArrowLeft className="mr-2 w-4 h-4 md:w-5 md:h-5" /> Về trang gói dịch vụ
          </Button>
        </div>
      </div>
    </div>
  );
}
