import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { useModal } from "@/context/ModalContext";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Button } from "@/components/ui/button";
import {
  Check,
  X,
  Loader2,
  Calendar,
  AlertCircle,
  ArrowRight,
  Gift,
  HelpCircle,
  Sparkles,
  Users,
  ShieldAlert,
  RefreshCw,
  Ban,
  Crown,
  Clock,
  ChevronRight,
  Info,
  CircleCheck,
  TriangleAlert,
} from "lucide-react";
import { RiAiGenerate2 } from "react-icons/ri";
import { PiStudent } from "react-icons/pi";
import { CreateOrgModal } from "@/components/modals/CreateOrgModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PromoBanner from "@/components/PromoBanner";

interface Promotion {
  id: number;
  title: string;
  subtitle?: string;
  badgeText?: string;
  bannerColor?: string;
  discountedPriceMonthly: number;
  discountedPriceYearly: number;
  expiresAt: string;
  planId: number;
}

interface Plan {
  id: number;
  type: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: Array<{ featureKey: string; limit: number | null; enabled: boolean }>;
}

interface Usage {
  key: string;
  value: number;
  periodEnd?: string;
}

type PaymentMethodType = "MOMO" | "VNPAY" | "STRIPE";
type BillingCycleType = "MONTHLY" | "YEARLY";

const PAYMENT_METHODS: { key: PaymentMethodType; label: string; icon: string; available: boolean }[] = [
  { key: "MOMO", label: "MoMo", icon: "https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png", available: true },
  { key: "VNPAY", label: "VNPay", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTctfygVoR8nCqR7Zj8EEHAyjGIox4QZQcArw&s", available: false },
  { key: "STRIPE", label: "Stripe", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRi6lqzyuARXvr2e1alBiqwrFIJe2WNPpoOA&s", available: false },
];

const BILLING_CYCLE_LABELS: Record<string, string> = {
  MONTHLY: "Hàng tháng",
  YEARLY: "Hàng năm",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ACTIVE: {
    label: "Đang hoạt động",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: <CircleCheck className="w-4 h-4" />,
  },
  CANCELED: {
    label: "Đã hủy",
    color: "text-rose-500",
    bg: "bg-rose-500/10 border-rose-500/20",
    icon: <Ban className="w-4 h-4" />,
  },
  TRIALING: {
    label: "Đang dùng thử",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: <Clock className="w-4 h-4" />,
  },
  PAST_DUE: {
    label: "Quá hạn",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: <TriangleAlert className="w-4 h-4" />,
  },
};

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getPeriodProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export default function BillingPage() {
  const { currentOrg, organizations, switchOrganization } = useOrganization();
  const { showAlert } = useModal();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>("MOMO");
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [freeCheckoutLoading, setFreeCheckoutLoading] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycleType>("MONTHLY");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelAgreed, setCancelAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const plansRes = await apiClient.get(endpoints.plans);
      setPlans(plansRes.data);

      try {
        const promoRes = await apiClient.get(endpoints.promotions_active);
        setPromotions(promoRes.data);
      } catch { /* banner is optional */ }

      try {
        const [usageRes, subRes] = await Promise.all([
          apiClient.get(endpoints.subscription_usage),
          apiClient.get(endpoints.subscription_current).catch(() => ({ data: null })),
        ]);
        setUsage(usageRes.data);
        if (subRes.data) {
          setActiveSub(subRes.data);
        } else {
          const freePlan = (plansRes.data as Plan[]).find((p) => p.type === "FREE");
          setActiveSub(freePlan ? { plan: freePlan, planId: freePlan.id } : null);
        }
      } catch (err) {
        console.warn("Failed to fetch usage/subscription", err);
        setUsage([]);
        const freePlan = (plansRes.data as Plan[]).find((p) => p.type === "FREE");
        setActiveSub(freePlan ? { plan: freePlan, planId: freePlan.id } : null);
      }
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanPromotion = (planId: number): Promotion | null => {
    const now = new Date();
    return promotions.find((p) => p.planId === planId && new Date(p.expiresAt) > now) ?? null;
  };

  const getEffectivePrice = (plan: Plan, promo: Promotion | null): number => {
    if (promo) return billingCycle === "YEARLY" ? promo.discountedPriceYearly : promo.discountedPriceMonthly;
    return billingCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
  };

  const getYearlySavingsPercent = (plan: Plan): number => {
    if (!plan.priceMonthly || !plan.priceYearly) return 0;
    const monthly12 = plan.priceMonthly * 12;
    return Math.round(((monthly12 - plan.priceYearly) / monthly12) * 100);
  };

  const handleFreeCheckout = async (planId: number, promotionId: number) => {
    if (!currentOrg) {
      showAlert({ title: "Yêu cầu", message: "Vui lòng chọn một tổ chức trước.", type: "warning" });
      return;
    }
    setFreeCheckoutLoading(planId);
    try {
      await apiClient.post(endpoints.subscription_checkout_free, {
        planId,
        promotionId,
        billingCycle,
      });
      showAlert({
        title: "Chúc mừng!",
        message: "Bạn đã kích hoạt gói dịch vụ miễn phí thành công!",
        type: "success",
      });
      fetchData();
    } catch (err: any) {
      showAlert({
        title: "Lỗi",
        message: err?.response?.data?.message || "Không thể kích hoạt. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setFreeCheckoutLoading(null);
    }
  };

  const handleSubscribe = async (planId: number) => {
    if (!currentOrg) return;
    setCheckoutLoading(planId);
    try {
      const res = await apiClient.post(`${endpoints.subscriptions}/checkout`, {
        planId,
        billingCycle,
        paymentMethod: selectedPayment,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      showAlert({
        title: "Lỗi thanh toán",
        message: err?.response?.data?.message || "Không thể khởi tạo thanh toán. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelAgreed) return;
    setCancelLoading(true);
    try {
      await apiClient.post(endpoints.subscription_cancel);
      showAlert({
        title: "Đã hủy gói",
        message: "Gói dịch vụ của bạn đã được hủy. Bạn có thể đăng ký lại bất cứ lúc nào.",
        type: "success",
      });
      setShowCancelDialog(false);
      setCancelAgreed(false);
      fetchData();
    } catch (err: any) {
      showAlert({
        title: "Lỗi",
        message: err?.response?.data?.message || "Không thể hủy gói. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const isFreePlan = activeSub?.plan?.type === "FREE" || !activeSub?.status;
  const subStatus = activeSub?.status;
  const statusCfg = subStatus ? STATUS_CONFIG[subStatus] : null;
  const daysRemaining = activeSub?.currentPeriodEnd ? getDaysRemaining(activeSub.currentPeriodEnd) : null;
  const periodProgress = activeSub?.currentPeriodStart && activeSub?.currentPeriodEnd
    ? getPeriodProgress(activeSub.currentPeriodStart, activeSub.currentPeriodEnd)
    : null;

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 md:space-y-12">
      {/* Promo Banner */}
      <PromoBanner />

      {/* Header */}
      <header className="text-center space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-foreground drop-shadow-sm flex items-center justify-center gap-2 md:gap-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3211/3211596.png"
            alt="Billing"
            className="w-8 h-8 md:w-12 md:h-12 object-contain"
          />
          Gói dịch vụ & <span className="text-primary italic">Thanh toán</span>
        </h1>
        <p className="text-sm md:text-xl text-muted-foreground font-bold max-w-2xl mx-auto">
          Nâng cấp sức mạnh cho lớp học của bạn với AI và không giới hạn lượt chơi.
        </p>
        <div className="flex justify-center gap-3">
          <Button
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 border-2 border-primary/30 font-black h-10 px-4 md:h-12 md:px-6 rounded-xl md:rounded-2xl transition-all text-xs md:text-base ${showGuide ? 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90' : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'}`}
          >
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
            {showGuide ? 'Đóng hướng dẫn' : 'Cách hoạt động?'}
          </Button>
        </div>
      </header>

      {/* Billing Guide Section */}
      {showGuide && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-primary/5 border-2 border-primary/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
            <h3 className="text-lg md:text-xl font-black text-primary mb-2 md:mb-4 flex items-center gap-2">
              <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Organization" className="w-5 h-5 md:w-6 md:h-6 object-contain" /> Nâng cấp theo Tổ chức
            </h3>
            <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">
              Gói dịch vụ được áp dụng cho <strong className="font-black text-foreground">Tổ chức đang hoạt động</strong>. Hãy đảm bảo bạn đã chọn đúng tổ chức trước khi thanh toán.
            </p>
          </div>
          <div className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
            <h3 className="text-lg md:text-xl font-black text-emerald-500 mb-2 md:mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6" /> Sức mạnh AI Pro
            </h3>
            <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">
              Mở khóa <strong className="font-black text-foreground">không giới hạn</strong> lượt tạo Quiz bằng AI và tăng số lượng học sinh tham gia trận đấu lên đến hàng nghìn người.
            </p>
          </div>
          <div className="bg-amber-500/5 border-2 border-amber-500/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden">
            <h3 className="text-lg md:text-xl font-black text-amber-500 mb-2 md:mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 md:w-6 md:h-6" /> Một người mua, cả đội dùng
            </h3>
            <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">
              Khi tổ chức được nâng cấp, <strong className="font-black text-foreground">mọi thành viên</strong> trong tổ chức đó đều được hưởng quyền lợi Premium mà không cần mua riêng lẻ.
            </p>
          </div>
        </div>
      )}

      {/* Organization Selector */}
      <section className="flex justify-center">
        {currentOrg ? (
          <div className="w-full max-w-2xl bg-primary/5 backdrop-blur-md border-2 border-primary/20 rounded-3xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 shadow-xl shadow-primary/5">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Organization" className="w-6 h-6 md:w-10 md:h-10 object-contain drop-shadow-md" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary/60">Tổ chức đang chọn</p>
              <h3 className="text-xl md:text-2xl font-black text-foreground">{currentOrg.name}</h3>
              <p className="text-xs md:text-sm font-bold text-muted-foreground">Mọi giao dịch thanh toán sẽ được áp dụng cho tổ chức này.</p>
            </div>
            <div className="shrink-0 flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-lg md:rounded-xl font-bold border-primary/20 hover:bg-primary/10 text-xs md:text-sm h-9 md:h-10">
                    Đổi tổ chức
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-xl border-white/10 rounded-2xl p-2">
                  <p className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chọn tổ chức khác</p>
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => switchOrganization(org.id)}
                      className={`rounded-xl font-bold mb-1 cursor-pointer ${org.id === currentOrg.id ? "bg-primary/20 text-primary" : ""}`}
                    >
                      {org.name}
                      {org.id === currentOrg.id && <Check className="w-4 h-4 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                  <div className="h-px bg-white/5 my-2" />
                  <DropdownMenuItem
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-xl font-bold text-primary cursor-pointer"
                  >
                    Tạo tổ chức mới
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-amber-500/10 backdrop-blur-md border-2 border-amber-500/20 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center gap-4 md:gap-6 shadow-xl shadow-amber-500/5">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="text-amber-500 w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-foreground">Chưa chọn tổ chức</h3>
              <p className="text-muted-foreground font-bold text-xs md:text-sm">
                Bạn cần phải tạo hoặc chọn một tổ chức để có thể đăng ký các gói dịch vụ.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
              {organizations.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="rounded-xl md:rounded-2xl font-black px-6 py-4 md:px-8 md:py-6 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 text-xs md:text-sm">
                      Chọn tổ chức sẵn có
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-card/95 backdrop-blur-xl border-white/10 rounded-2xl p-2">
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => switchOrganization(org.id)}
                        className="rounded-xl font-bold mb-1 cursor-pointer"
                      >
                        {org.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant={organizations.length > 0 ? "outline" : "default"}
                className={`rounded-xl md:rounded-2xl font-black px-6 py-4 md:px-8 md:py-6 text-xs md:text-sm ${organizations.length === 0
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  }`}
              >
                Tạo tổ chức mới <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ── Current Subscription Management Card ── */}
      {currentOrg && (
        <section>
          {isFreePlan ? (
            <div className="bg-card/40 backdrop-blur-xl border-2 border-white/5 rounded-3xl md:rounded-4xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                <Crown className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Gói hiện tại</p>
                <h3 className="text-2xl font-black text-foreground">{activeSub?.plan?.name ?? "Miễn phí"}</h3>
                <p className="text-sm font-bold text-muted-foreground mt-1">Nâng cấp để mở khóa AI không giới hạn và thêm nhiều tính năng mạnh mẽ.</p>
              </div>
              <Button
                className="rounded-xl font-black px-6 gap-2 shadow-lg shadow-primary/20"
                onClick={() => document.getElementById("pricing-grid")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Sparkles className="w-4 h-4" /> Nâng cấp ngay
              </Button>
            </div>
          ) : (
            <div className={`border-2 rounded-3xl md:rounded-4xl p-6 md:p-8 shadow-lg space-y-6 ${subStatus === "ACTIVE" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}>
              {/* Header row */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${subStatus === "ACTIVE" ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                  <Crown className={`w-7 h-7 ${subStatus === "ACTIVE" ? "text-emerald-500" : "text-rose-500"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gói hiện tại</p>
                    {statusCfg && (
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusCfg.color} ${statusCfg.bg}`}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    )}
                    {activeSub?.billingCycle && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {BILLING_CYCLE_LABELS[activeSub.billingCycle] ?? activeSub.billingCycle}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-foreground">{activeSub?.plan?.name}</h3>
                </div>
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {subStatus === "ACTIVE" && activeSub?.plan?.type !== "FREE" && (
                    <Button
                      variant="outline"
                      className="rounded-xl font-black text-sm gap-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50"
                      onClick={() => { setCancelAgreed(false); setShowCancelDialog(true); }}
                    >
                      <Ban className="w-4 h-4" /> Hủy gói
                    </Button>
                  )}
                  {subStatus === "CANCELED" && activeSub?.planId && (
                    <Button
                      className="rounded-xl font-black text-sm gap-2 shadow-lg shadow-primary/20"
                      onClick={() => handleSubscribe(activeSub.planId)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Gia hạn lại
                    </Button>
                  )}
                </div>
              </div>

              {/* Period info & progress */}
              {activeSub?.currentPeriodStart && activeSub?.currentPeriodEnd && (
                <div className="space-y-3">
                  <div className="flex flex-wrap justify-between text-xs font-bold text-muted-foreground gap-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Bắt đầu: {new Date(activeSub.currentPeriodStart).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Kết thúc: {new Date(activeSub.currentPeriodEnd).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  {periodProgress !== null && (
                    <div className="relative h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${subStatus === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`}
                        style={{ width: `${periodProgress}%` }}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap justify-between text-xs font-bold gap-2">
                    {daysRemaining !== null && daysRemaining > 0 ? (
                      <span className={`flex items-center gap-1.5 ${daysRemaining <= 7 ? "text-amber-500" : "text-muted-foreground"}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {daysRemaining} ngày còn lại
                        {daysRemaining <= 7 && " — Sắp hết hạn!"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-500">
                        <Clock className="w-3.5 h-3.5" /> Đã hết hạn
                      </span>
                    )}
                    <span className="text-muted-foreground">{periodProgress}% đã sử dụng</span>
                  </div>
                </div>
              )}

              {/* Canceled notice */}
              {subStatus === "CANCELED" && activeSub?.canceledAt && (
                <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                  <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-sm font-bold text-rose-400">
                    Gói đã bị hủy vào {new Date(activeSub.canceledAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}. Đăng ký lại để tiếp tục sử dụng các tính năng Premium.
                  </div>
                </div>
              )}

              {/* Expiry warning */}
              {subStatus === "ACTIVE" && daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                  <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm font-bold text-amber-400">
                    Gói của bạn sẽ hết hạn trong {daysRemaining} ngày. Hãy gia hạn sớm để không bị gián đoạn dịch vụ.
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Usage Stats — four cards in one row on md+ (Pro plan shows AI image quota) */}
      <section className="grid grid-cols-2 gap-2 md:gap-3 md:grid-cols-4">
        {(() => {
          const matchUsage = usage.find((u) => u.key === "matches_hosted");
          return (
            <UsageCard
              icon={
                <svg className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="20" y="60" width="22" height="25" rx="4" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                  <rect x="42" y="50" width="22" height="35" rx="4" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                  <rect x="64" y="65" width="22" height="20" rx="4" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                </svg>
              }
              label="Trận đấu đã tổ chức"
              value={matchUsage?.value || 0}
              limit={activeSub?.plan?.features?.find((f: any) => f.featureKey === "UNLIMITED_MATCHES")?.limit ?? null}
              renewalDate={matchUsage?.periodEnd || activeSub?.currentPeriodEnd}
            />
          );
        })()}
        {(() => {
          const aiUsage = usage.find((u) => u.key === "ai_generations");
          return (
            <UsageCard
              icon={<RiAiGenerate2 className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
              label="Lượt tạo câu hỏi AI"
              value={aiUsage?.value || 0}
              limit={activeSub?.plan?.features?.find((f: any) => f.featureKey === "AI_GENERATION")?.limit ?? null}
              renewalDate={aiUsage?.periodEnd || activeSub?.currentPeriodEnd}
            />
          );
        })()}
        {(() => {
          const imgUsage = usage.find((u) => u.key === "ai_image_generations");
          const imgFeature = activeSub?.plan?.features?.find((f: any) => f.featureKey === "AI_IMAGE_GENERATION");
          if (!imgFeature?.enabled) return null;
          return (
            <UsageCard
              icon={<Sparkles className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
              label="Lượt tạo ảnh AI"
              value={imgUsage?.value || 0}
              limit={imgFeature?.limit ?? null}
              renewalDate={imgUsage?.periodEnd || activeSub?.currentPeriodEnd}
            />
          );
        })()}
        <UsageCard
          icon={<PiStudent className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0" />}
          label="Số người tối đa tham gia trong 1 trận đấu"
          value={activeSub?.plan?.features?.find((f: any) => f.featureKey === "MAX_PLAYERS_PER_MATCH")?.limit ?? 10}
        />
      </section>

      {/* Payment Method Selector */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-black text-foreground text-center">Chọn phương thức thanh toán</h2>
        <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = selectedPayment === pm.key;
            return (
              <button
                key={pm.key}
                onClick={() => pm.available && setSelectedPayment(pm.key)}
                disabled={!pm.available}
                className={`
                  relative flex items-center gap-2 md:gap-3 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border-2 font-bold text-xs md:text-sm transition-all duration-200
                  ${isSelected
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-105"
                    : pm.available
                      ? "border-white/10 bg-card/40 hover:border-white/20 hover:bg-card/60 cursor-pointer"
                      : "border-white/5 bg-card/20 opacity-50 cursor-not-allowed"
                  }
                `}
              >
                <img src={pm.icon} alt={pm.label} className="w-5 h-5 md:w-6 md:h-6 rounded-sm md:rounded-md object-contain" />
                <span className="text-foreground">{pm.label}</span>
                {!pm.available && (
                  <span className="absolute -top-2 -right-2 bg-muted text-muted-foreground text-[8px] md:text-[9px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded-full">
                    Sắp ra mắt
                  </span>
                )}
                {isSelected && <Check className="w-3 h-3 md:w-4 md:h-4 text-primary ml-1" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Billing Cycle Toggle */}
      <section className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center bg-card/40 border-2 border-white/5 rounded-2xl p-1.5 gap-1">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 ${billingCycle === "MONTHLY" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
          >
            Hàng tháng
          </button>
          <button
            onClick={() => setBillingCycle("YEARLY")}
            className={`relative px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-200 flex items-center gap-2 ${billingCycle === "YEARLY" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
          >
            Hàng năm
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full transition-colors ${billingCycle === "YEARLY" ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-500"}`}>
              Tiết kiệm hơn
            </span>
          </button>
        </div>
        {billingCycle === "YEARLY" && (
          <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5" /> Thanh toán 1 lần cho cả năm — tiết kiệm đến vài tháng so với trả hàng tháng
          </p>
        )}
      </section>

      {/* Pricing Grid */}
      <section id="pricing-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {plans.map((plan) => {
          const promo = getPlanPromotion(plan.id);
          const effectivePrice = getEffectivePrice(plan, promo);
          const isFree = promo && effectivePrice === 0;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col p-6 md:p-8 bg-card/40 backdrop-blur-xl border-2 rounded-[2rem] md:rounded-5xl shadow-xl transition-all hover:-translate-y-2 ${activeSub?.planId === plan.id
                ? "border-primary ring-4 ring-primary/10"
                : promo
                  ? "border-orange-400/50 ring-2 ring-orange-400/10"
                  : "border-white/5"
                }`}
            >
              {activeSub?.planId === plan.id && (
                <span className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-lg whitespace-nowrap">
                  Gói hiện tại
                </span>
              )}
              {promo && activeSub?.planId !== plan.id && (
                <span
                  className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap"
                  style={{ background: promo.bannerColor || "#0078D4" }}
                >
                  <Gift className="w-3 h-3" />
                  {promo.badgeText || "KHUYẾN MÃI"}
                </span>
              )}

              <div className="mb-6 md:mb-8">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-xl md:text-2xl font-black text-foreground">{plan.name}</h3>
                  {billingCycle === "YEARLY" && plan.priceMonthly > 0 && getYearlySavingsPercent(plan) > 0 && (
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                      -{getYearlySavingsPercent(plan)}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  {promo ? (
                    <>
                      <span className="text-sm md:text-lg line-through text-muted-foreground/50 font-bold">
                        {billingCycle === "YEARLY"
                          ? `${plan.priceYearly.toLocaleString("vi-VN")}₫`
                          : `${plan.priceMonthly.toLocaleString("vi-VN")}₫`}
                      </span>
                      <span className="text-2xl md:text-3xl font-black" style={{ color: promo.bannerColor || "#0078D4" }}>
                        {isFree ? "MIỄN PHÍ" : `${effectivePrice.toLocaleString("vi-VN")}₫`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl md:text-3xl font-black">
                        {effectivePrice === 0
                          ? "Miễn phí"
                          : selectedPayment === "MOMO"
                            ? `${effectivePrice.toLocaleString("vi-VN")}₫`
                            : `$${effectivePrice}`}
                      </span>
                      {effectivePrice > 0 && (
                        <span className="text-xs md:text-sm text-muted-foreground font-bold">
                          /{billingCycle === "YEARLY" ? "năm" : "tháng"}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {billingCycle === "YEARLY" && plan.priceMonthly > 0 && !promo && (
                  <p className="text-[10px] md:text-[11px] font-bold text-muted-foreground mt-1">
                    ~ {Math.round(plan.priceYearly / 12).toLocaleString("vi-VN")}₫/tháng
                  </p>
                )}
                {promo && (
                  <p className="text-[10px] md:text-[11px] font-bold mt-1" style={{ color: promo.bannerColor || "#0078D4" }}>
                    ⏰ Hết hạn: {new Date(promo.expiresAt).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>

              <ul className="flex-1 space-y-3 md:space-y-4 mb-6 md:mb-10">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs md:text-sm font-bold">
                    {feat.enabled ? (
                      <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500 mt-0.5 shrink-0" />
                    )}
                    <span className={feat.enabled ? "text-foreground" : "text-muted-foreground line-through opacity-50"}>
                      {feat.featureKey === "MAX_CLASSROOMS"
                        ? "Số lớp tối đa"
                        : feat.featureKey === "MAX_STUDENTS_PER_CLASSROOM"
                          ? "Học sinh mỗi lớp"
                          : feat.featureKey === "MAX_PLAYERS_PER_MATCH"
                            ? "Số người tối đa/trận"
                            : feat.featureKey === "AI_GENERATION"
                              ? "Lượt tạo câu hỏi AI"
                              : feat.featureKey === "AI_IMAGE_GENERATION"
                                ? "Lượt tạo ảnh AI"
                                : feat.featureKey === "UNLIMITED_MATCHES"
                                  ? "Trận đấu tối đa"
                                  : feat.featureKey.replace(/_/g, " ")}
                      {feat.limit !== null ? ` (${feat.limit})` : " (Không giới hạn)"}
                    </span>
                  </li>
                ))}
              </ul>

              {isFree ? (
                <Button
                  id={`free-plan-${plan.id}`}
                  className="w-full py-4 md:py-6 rounded-xl md:rounded-2xl font-black text-sm md:text-lg text-white shadow-[0_8px_0_0_rgba(0,0,0,0.15)]"
                  style={{ background: promo!.bannerColor || "#0078D4" }}
                  disabled={activeSub?.planId === plan.id || freeCheckoutLoading !== null}
                  onClick={() => {
                    if (!currentOrg) {
                      organizations.length > 0
                        ? showAlert({ title: "Yêu cầu", message: "Vui lòng chọn một tổ chức trước.", type: "warning" })
                        : setIsCreateModalOpen(true);
                      return;
                    }
                    handleFreeCheckout(plan.id, promo!.id);
                  }}
                >
                  {freeCheckoutLoading === plan.id && <Loader2 className="animate-spin mr-2 w-4 h-4 md:w-5 md:h-5" />}
                  {!currentOrg ? "Chọn tổ chức" : activeSub?.planId === plan.id ? "Đang dùng" : "Nhận miễn phí!"}
                </Button>
              ) : (
                <Button
                  id={`buy-plan-${plan.id}`}
                  className={`w-full py-4 md:py-6 rounded-xl md:rounded-2xl font-black text-sm md:text-lg ${activeSub?.planId === plan.id && subStatus === "ACTIVE" ? "bg-muted text-muted-foreground" : "shadow-[0_8px_0_0_rgba(0,0,0,0.1)]"}`}
                  disabled={(activeSub?.planId === plan.id && subStatus === "ACTIVE") || checkoutLoading !== null}
                  onClick={() => {
                    if (!currentOrg) {
                      organizations.length > 0
                        ? showAlert({ title: "Yêu cầu", message: "Vui lòng chọn một tổ chức trước khi nâng cấp.", type: "warning" })
                        : setIsCreateModalOpen(true);
                      return;
                    }
                    handleSubscribe(plan.id);
                  }}
                >
                  {checkoutLoading === plan.id ? <Loader2 className="animate-spin mr-2 w-4 h-4 md:w-5 md:h-5" /> : null}
                  {!currentOrg
                    ? "Chọn tổ chức"
                    : activeSub?.planId === plan.id && subStatus === "ACTIVE"
                      ? "Đang sử dụng"
                      : activeSub?.planId === plan.id && subStatus === "CANCELED"
                        ? "Gia hạn lại"
                        : plan.priceMonthly === 0
                          ? "Dùng miễn phí"
                          : "Nâng cấp ngay"}
                </Button>
              )}
            </div>
          );
        })}
      </section>

      {/* ── Terms & Disclaimer Section ── */}
      <section className="space-y-4">
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="w-full flex items-center justify-between bg-card/30 border-2 border-white/5 rounded-2xl px-6 py-4 hover:bg-card/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <span className="font-black text-base text-foreground">Điều khoản & Chính sách dịch vụ</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${showTerms ? "rotate-90" : ""}`} />
        </button>

        {showTerms && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <TermsCard
              icon="💳"
              title="Chính sách thanh toán"
              items={[
                "Tất cả giao dịch được xử lý an toàn qua MoMo.",
                "Thanh toán được tính theo chu kỳ (hàng tháng hoặc hàng năm).",
                "Gói dịch vụ được kích hoạt ngay sau khi xác nhận thanh toán thành công.",
                "Giá hiển thị đã bao gồm VAT (nếu có).",
              ]}
            />
            <TermsCard
              icon="🚫"
              title="Chính sách hoàn tiền"
              items={[
                "Quizmon không hoàn tiền sau khi giao dịch đã hoàn thành.",
                "Trường hợp lỗi kỹ thuật từ hệ thống, vui lòng liên hệ hỗ trợ trong 48 giờ.",
                "Nếu đã thanh toán nhưng gói chưa được kích hoạt, hệ thống sẽ tự động xử lý trong vòng 5 phút.",
                "Khuyến mãi 0₫ không áp dụng hoàn tiền.",
              ]}
            />
            <TermsCard
              icon="❌"
              title="Hủy gói dịch vụ"
              items={[
                "Bạn có thể hủy gói bất cứ lúc nào từ trang này.",
                "Việc hủy có hiệu lực ngay lập tức — quyền truy cập Premium sẽ bị thu hồi.",
                "Không hoàn lại phần thời gian còn lại trong chu kỳ thanh toán.",
                "Bạn có thể đăng ký lại bất cứ lúc nào.",
              ]}
            />
            <TermsCard
              icon="🔄"
              title="Gia hạn & Nâng cấp"
              items={[
                "Gia hạn gói sẽ tạo một chu kỳ mới tính từ thời điểm thanh toán.",
                "Nâng cấp lên gói cao hơn sẽ hủy gói hiện tại và kích hoạt gói mới.",
                "Hạ cấp gói: hủy gói hiện tại rồi đăng ký gói mong muốn.",
                "Dữ liệu quiz, lớp học sẽ được giữ nguyên khi thay đổi gói.",
              ]}
            />
            <div className="md:col-span-2 bg-amber-500/5 border-2 border-amber-500/10 rounded-2xl p-5 flex items-start gap-4">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-foreground mb-1">Lưu ý quan trọng</p>
                <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                  Gói dịch vụ áp dụng cho <strong className="text-foreground">toàn bộ tổ chức</strong>, không phải tài khoản cá nhân. Mọi thành viên trong tổ chức đều được hưởng quyền lợi tương ứng. Quản trị viên tổ chức chịu trách nhiệm quản lý đăng ký và thanh toán. Để được hỗ trợ, vui lòng liên hệ qua email hỗ trợ.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Cancel Subscription Dialog ── */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border-2 border-rose-500/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Ban className="w-8 h-8 text-rose-500" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-foreground">Hủy gói dịch vụ?</h2>
              <p className="text-sm font-bold text-muted-foreground">
                Bạn đang hủy gói <span className="text-foreground">{activeSub?.plan?.name}</span>. Hành động này <span className="text-rose-500">có hiệu lực ngay lập tức</span>.
              </p>
            </div>

            {/* What will happen */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-rose-400 mb-3">Điều sẽ xảy ra khi hủy:</p>
              {[
                "Quyền truy cập Premium bị thu hồi ngay lập tức.",
                "Không hoàn lại tiền cho phần thời gian còn lại.",
                "Giới hạn sử dụng sẽ về mức gói Miễn phí.",
                "Dữ liệu quiz và lớp học vẫn được giữ nguyên.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <X className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                  <span className="text-sm font-bold text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>

            {/* Agreement checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${cancelAgreed ? "bg-rose-500 border-rose-500" : "border-white/20 group-hover:border-rose-500/50"}`}
                onClick={() => setCancelAgreed(!cancelAgreed)}
              >
                {cancelAgreed && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-bold text-muted-foreground leading-relaxed">
                Tôi đã đọc và hiểu rằng việc hủy gói có hiệu lực ngay lập tức và <span className="text-foreground">không được hoàn tiền</span>.
              </span>
            </label>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-black border-white/10 hover:bg-white/5"
                onClick={() => { setShowCancelDialog(false); setCancelAgreed(false); }}
                disabled={cancelLoading}
              >
                Giữ lại gói
              </Button>
              <Button
                className="flex-1 rounded-xl font-black bg-rose-500 hover:bg-rose-600 text-white gap-2"
                onClick={handleCancelSubscription}
                disabled={!cancelAgreed || cancelLoading}
              >
                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateOrgModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </div>
  );
}

function UsageCard({
  icon,
  label,
  value,
  limit,
  renewalDate,
}: {
  icon: any;
  label: string;
  value: any;
  limit?: any;
  renewalDate?: string;
}) {
  return (
    <div className="bg-card/40 backdrop-blur-xl border border-white/10 md:border-2 rounded-2xl p-3 md:p-3.5 shadow-md flex flex-col gap-2 min-w-0">
      <div className="flex items-start gap-2 md:gap-2.5 min-w-0">
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center shadow-inner shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wide text-muted-foreground leading-snug mb-0.5 line-clamp-2">
            {label}
          </p>
          <div className="flex items-baseline gap-1 flex-wrap">
            {limit === null ? (
              <span className="text-sm sm:text-base md:text-lg font-black text-primary italic leading-none">Không giới hạn</span>
            ) : (
              <>
                <span className="text-sm sm:text-base md:text-xl font-black text-foreground tabular-nums leading-none">{value}</span>
                {limit !== undefined && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-bold tabular-nums">/ {limit}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {renewalDate && (
        <div className="pt-1.5 border-t border-white/5 mt-auto">
          <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground flex items-center gap-1 leading-tight">
            <Calendar className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">Làm mới: {new Date(renewalDate).toLocaleDateString("vi-VN")}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function TermsCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className="bg-card/30 border-2 border-white/5 rounded-2xl p-5 space-y-3">
      <h4 className="font-black text-foreground flex items-center gap-2">
        <span className="text-lg">{icon}</span> {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <CircleCheck className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <span className="text-xs font-bold text-muted-foreground leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
