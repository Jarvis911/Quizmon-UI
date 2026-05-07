import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw, HelpCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
      <div className="max-w-lg w-full space-y-4">
        {/* Main card */}
        <div className="bg-card/40 backdrop-blur-2xl border-2 border-rose-500/20 rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-center shadow-2xl space-y-6 md:space-y-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <XCircle className="w-10 h-10 md:w-[60px] md:h-[60px]" strokeWidth={2.5} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground">
              Đã hủy <span className="text-rose-500 italic">thanh toán</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-bold">
              Bạn đã hủy quá trình thanh toán. Tài khoản của bạn <span className="text-foreground">chưa bị trừ tiền</span>.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/billing")}
              className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-lg shadow-primary/20 gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Thử lại
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-base md:text-lg"
            >
              <ArrowLeft className="mr-2 w-4 h-4 md:w-5 md:h-5" /> Về trang chủ
            </Button>
          </div>
        </div>

        {/* Helpful info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card/30 border-2 border-white/5 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-foreground mb-0.5">Thanh toán an toàn</p>
              <p className="text-xs font-bold text-muted-foreground">
                Mọi giao dịch được mã hóa và bảo mật. Không có thông tin nào bị lưu lại khi hủy.
              </p>
            </div>
          </div>
          <div className="bg-card/30 border-2 border-white/5 rounded-2xl p-4 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-foreground mb-0.5">Gặp sự cố?</p>
              <p className="text-xs font-bold text-muted-foreground">
                Nếu bị trừ tiền nhưng chưa kích hoạt gói, hệ thống sẽ tự xử lý hoặc bạn có thể liên hệ hỗ trợ.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
