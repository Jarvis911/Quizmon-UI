import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/api/client";
import { useOrganization } from "@/context/OrganizationContext";

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentOrg, refreshOrganizations } = useOrganization();
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get("session_id");
  const planId = searchParams.get("plan_id");
  const billingCycle = searchParams.get("billing_cycle");

  useEffect(() => {
    if (sessionId && currentOrg && planId) {
      verifyPayment();
    }
  }, [sessionId, currentOrg, planId]);

  const verifyPayment = async () => {
    try {
      await apiClient.post(`/subscriptions/fulfill`, { 
        sessionId,
        orgId: currentOrg?.id,
        planId: Number(planId),
        billingCycle: billingCycle || 'MONTHLY',
      });
      await refreshOrganizations();
    } catch (err) {
      console.error("Verification failed", err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card/40 backdrop-blur-2xl border-2 border-primary/20 rounded-[3rem] p-10 text-center shadow-2xl space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
            <CheckCircle2 size={60} strokeWidth={3} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center justify-center gap-2">
            Payment <span className="text-emerald-500 italic">Success</span> <PartyPopper className="text-yellow-500" />
          </h1>
          <p className="text-muted-foreground font-bold">
            {isVerifying ? "Verifying your transaction..." : "Your subscription has been activated!"}
          </p>
        </div>

        {isVerifying ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary w-10 h-10" />
          </div>
        ) : (
          <div className="pt-4">
            <Button 
              onClick={() => navigate('/billing')} 
              className="w-full h-14 rounded-2xl font-black text-lg shadow-lg shadow-primary/20"
            >
              Go to Billing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
