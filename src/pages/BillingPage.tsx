import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Check, 
  X, 
  Activity, 
  Gamepad2, 
  BrainCircuit, 
  Users,
  Loader2
} from "lucide-react";

interface Plan {
  id: number;
  type: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Array<{ featureKey: string, limit: number | null, enabled: boolean }>;
}

interface Usage {
  key: string;
  value: number;
}

export default function BillingPage() {
  const { currentOrg } = useOrganization();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);

  useEffect(() => {
    if (currentOrg) {
      fetchData();
    } else {
      // If we've finished loading orgs and still have none, stop loading billing
      setIsLoading(false);
    }
  }, [currentOrg]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, usageRes, subRes] = await Promise.all([
        apiClient.get(endpoints.plans),
        apiClient.get(endpoints.subscription_usage),
        apiClient.get(endpoints.subscription_current).catch(() => ({ data: null }))
      ]);
      setPlans(plansRes.data);
      setUsage(usageRes.data);
      setActiveSub(subRes.data);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    if (!currentOrg) return;
    try {
      // Initiate checkout session
      const res = await apiClient.post(`${endpoints.subscriptions}/checkout`, { 
        planId, 
        billingCycle: 'MONTHLY' 
      });
      
      // Redirect to the checkout URL (success URL in our mock)
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert("Failed to initiate checkout. Please try again.");
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-sm">
          Gói dịch vụ & <span className="text-primary italic">Thanh toán</span>
        </h1>
        <p className="text-xl text-muted-foreground font-bold">Nâng cấp sức mạnh cho lớp học của bạn với AI và không giới hạn lượt chơi.</p>
      </header>

      {/* Usage Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard 
          icon={<Gamepad2 className="text-indigo-500" />} 
          label="Matches Hosted" 
          value={usage.find(u => u.key === 'matches_hosted')?.value || 0} 
          limit={activeSub?.plan?.features?.find((f: any) => f.featureKey === 'UNLIMITED_MATCHES')?.limit ?? null}
        />
        <UsageCard 
          icon={<BrainCircuit className="text-rose-500" />} 
          label="AI Generations" 
          value={usage.find(u => u.key === 'ai_generations')?.value || 0} 
          limit={activeSub?.plan?.features?.find((f: any) => f.featureKey === 'AI_GENERATION')?.limit ?? null}
        />
        <UsageCard 
          icon={<Users className="text-emerald-500" />} 
          label="Max Students" 
          value="N/A" 
          limit={activeSub?.plan?.features?.find((f: any) => f.featureKey === 'MAX_PLAYERS_PER_MATCH')?.limit ?? null}
        />
      </section>

      {/* Pricing Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
        {plans.map(plan => (
          <div 
            key={plan.id}
            className={`relative flex flex-col p-8 bg-card/40 backdrop-blur-xl border-2 rounded-5xl shadow-xl transition-all hover:-translate-y-2 ${activeSub?.planId === plan.id ? 'border-primary ring-4 ring-primary/10' : 'border-white/5'}`}
          >
            {activeSub?.planId === plan.id && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Current Plan
              </span>
            )}
            
            <div className="mb-8">
              <h3 className="text-2xl font-black text-foreground mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">${plan.priceMonthly}</span>
                <span className="text-muted-foreground font-bold">/tháng</span>
              </div>
            </div>

            <ul className="flex-1 space-y-4 mb-10">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-bold">
                  {feat.enabled ? (
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  )}
                  <span className={feat.enabled ? "text-foreground" : "text-muted-foreground line-through opacity-50"}>
                    {feat.featureKey.replace(/_/g, ' ')} {feat.limit && `(Lên đến ${feat.limit})`}
                  </span>
                </li>
              ))}
            </ul>

            <Button 
              className={`w-full py-6 rounded-2xl font-black text-lg ${activeSub?.planId === plan.id ? 'bg-muted text-muted-foreground' : 'shadow-[0_8px_0_0_rgba(0,0,0,0.1)]'}`}
              disabled={activeSub?.planId === plan.id}
              onClick={() => handleSubscribe(plan.id)}
            >
              {activeSub?.planId === plan.id ? 'Active' : 'Nâng cấp ngay'}
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}

function UsageCard({ icon, label, value, limit }: { icon: any, label: string, value: any, limit: any }) {
  return (
    <div className="bg-card/40 backdrop-blur-xl border-2 border-white/5 rounded-4xl p-6 shadow-lg flex items-center gap-6">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-foreground">{value}</span>
          <span className="text-muted-foreground font-bold">/ {limit === null ? '∞' : limit}</span>
        </div>
      </div>
    </div>
  );
}
