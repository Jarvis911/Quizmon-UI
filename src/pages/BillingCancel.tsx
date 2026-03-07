import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillingCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card/40 backdrop-blur-2xl border-2 border-rose-500/20 rounded-[3rem] p-10 text-center shadow-2xl space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <XCircle size={60} strokeWidth={3} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-foreground">
            Payment <span className="text-rose-500 italic">Canceled</span>
          </h1>
          <p className="text-muted-foreground font-bold">
            No worries! Your account hasn't been charged.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            variant="ghost"
            onClick={() => navigate('/billing')} 
            className="w-full h-14 rounded-2xl font-black text-lg"
          >
            <ArrowLeft className="mr-2" /> Back to Billing
          </Button>
        </div>
      </div>
    </div>
  );
}
