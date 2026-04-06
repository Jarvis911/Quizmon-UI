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

const PAYMENT_METHODS: { key: PaymentMethodType; label: string; icon: string; available: boolean }[] = [
  { key: "MOMO", label: "MoMo", icon: "https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png", available: true },
  { key: "VNPAY", label: "VNPay", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTctfygVoR8nCqR7Zj8EEHAyjGIox4QZQcArw&s", available: false },
  { key: "STRIPE", label: "Stripe", icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRi6lqzyuARXvr2e1alBiqwrFIJe2WNPpoOA&s", available: false },
];

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

  useEffect(() => {
    fetchData();
  }, [currentOrg]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const plansRes = await apiClient.get(endpoints.plans);
      setPlans(plansRes.data);

      // Fetch active promotions (non-critical)
      try {
        const promoRes = await apiClient.get(endpoints.promotions_active);
        setPromotions(promoRes.data);
      } catch { /* banner is optional */ }

      // Fetch usage and current subscription
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

  /** Returns the active non-expired promotion for a given plan, if any */
  const getPlanPromotion = (planId: number): Promotion | null => {
    const now = new Date();
    return promotions.find((p) => p.planId === planId && new Date(p.expiresAt) > now) ?? null;
  };

  const getEffectivePrice = (plan: Plan, promo: Promotion | null): number =>
    promo ? promo.discountedPriceMonthly : plan.priceMonthly;

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
        billingCycle: "MONTHLY",
      });
      showAlert({
        title: "🎉 Chúc mừng!",
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
        billingCycle: "MONTHLY",
        paymentMethod: selectedPayment,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      showAlert({
        title: "Lỗi thanh toán",
        message: err?.response?.data?.message || "Failed to initiate checkout. Please try again.",
        type: "error",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-12">
      {/* Promo Banner */}
      <PromoBanner />

      <header className="text-center space-y-6">
        <h1 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-sm flex items-center justify-center gap-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3211/3211596.png"
            alt="Billing"
            className="w-12 h-12 object-contain"
          />
          Gói dịch vụ & <span className="text-primary italic">Thanh toán</span>
        </h1>
        <p className="text-xl text-muted-foreground font-bold max-w-2xl mx-auto">
          Nâng cấp sức mạnh cho lớp học của bạn với AI và không giới hạn lượt chơi.
        </p>
        <div className="flex justify-center">
          <Button
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-2 border-2 border-primary/30 font-black h-12 px-6 rounded-2xl transition-all ${showGuide ? 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90' : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'}`}
          >
            <HelpCircle size={20} />
            {showGuide ? 'Đóng hướng dẫn' : 'Cách hoạt động?'}
          </Button>
        </div>
      </header>

      {/* Billing Guide Section */}
      {showGuide && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-primary/5 border-2 border-primary/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <h3 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
              <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Organization" className="w-6 h-6 object-contain" /> Nâng cấp theo Tổ chức
            </h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
              Gói dịch vụ được áp dụng cho <strong className="font-black text-foreground">Tổ chức đang hoạt động</strong>. Hãy đảm bảo bạn đã chọn đúng tổ chức trước khi thanh toán.
            </p>
          </div>

          <div className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <h3 className="text-xl font-black text-emerald-500 mb-4 flex items-center gap-2">
              <Sparkles size={24} /> Sức mạnh AI Pro
            </h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
              Mở khóa <strong className="font-black text-foreground">không giới hạn</strong> lượt tạo Quiz bằng AI và tăng số lượng học sinh tham gia trận đấu lên đến hàng nghìn người.
            </p>
          </div>

          <div className="bg-amber-500/5 border-2 border-amber-500/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <h3 className="text-xl font-black text-amber-500 mb-4 flex items-center gap-2">
              <Users size={24} /> Một người mua, cả đội dùng
            </h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
              Khi tổ chức được nâng cấp, <strong className="font-black text-foreground">mọi thành viên</strong> trong tổ chức đó đều được hưởng quyền lợi Premium mà không cần mua riêng lẻ.
            </p>
          </div>
        </div>
      )}

      {/* Organization Context / Guidance */}
      <section className="flex justify-center">
        {currentOrg ? (
          <div className="w-full max-w-2xl bg-primary/5 backdrop-blur-md border-2 border-primary/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-primary/5">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
              <img src="https://cdn-icons-png.flaticon.com/512/7713/7713569.png" alt="Organization" className="w-10 h-10 object-contain drop-shadow-md" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-primary/60">Tổ chức đang chọn</p>
              <h3 className="text-2xl font-black text-foreground">{currentOrg.name}</h3>
              <p className="text-sm font-bold text-muted-foreground">Mọi giao dịch thanh toán sẽ được áp dụng cho tổ chức này.</p>
            </div>
            <div className="shrink-0 flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl font-bold border-primary/20 hover:bg-primary/10">
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
          <div className="w-full max-w-2xl bg-amber-500/10 backdrop-blur-md border-2 border-amber-500/20 rounded-3xl p-8 flex flex-col items-center text-center gap-6 shadow-xl shadow-amber-500/5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="text-amber-500 w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">Chưa chọn tổ chức</h3>
              <p className="text-muted-foreground font-bold">
                Bạn cần phải tạo hoặc chọn một tổ chức để có thể đăng ký các gói dịch vụ.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              {organizations.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="rounded-2xl font-black px-8 py-6 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
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
                className={`rounded-2xl font-black px-8 py-6 ${organizations.length === 0
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  }`}
              >
                Tạo tổ chức mới <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Usage Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(() => {
          const matchUsage = usage.find((u) => u.key === "matches_hosted");
          return (
            <UsageCard
              icon={
                <svg className="text-primary w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              icon={<RiAiGenerate2 className="text-primary w-6 h-6" />}
              label="Lượt tạo AI"
              value={aiUsage?.value || 0}
              limit={activeSub?.plan?.features?.find((f: any) => f.featureKey === "AI_GENERATION")?.limit ?? null}
              renewalDate={aiUsage?.periodEnd || activeSub?.currentPeriodEnd}
            />
          );
        })()}
        <UsageCard
          icon={<PiStudent className="text-primary w-7 h-7" />}
          label="Số người tối đa tham gia trong 1 trận đấu"
          value={activeSub?.plan?.features?.find((f: any) => f.featureKey === "MAX_PLAYERS_PER_MATCH")?.limit ?? 10}
        />
      </section>

      {/* Payment Method Selector */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-foreground text-center">Chọn phương thức thanh toán</h2>
        <div className="flex justify-center gap-4 flex-wrap">
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = selectedPayment === pm.key;
            return (
              <button
                key={pm.key}
                onClick={() => pm.available && setSelectedPayment(pm.key)}
                disabled={!pm.available}
                className={`
                  relative flex items-center gap-3 px-6 py-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200
                  ${isSelected
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-105"
                    : pm.available
                      ? "border-white/10 bg-card/40 hover:border-white/20 hover:bg-card/60 cursor-pointer"
                      : "border-white/5 bg-card/20 opacity-50 cursor-not-allowed"
                  }
                `}
              >
                <img src={pm.icon} alt={pm.label} className="w-6 h-6 rounded-md object-contain" />
                <span className="text-foreground">{pm.label}</span>
                {!pm.available && (
                  <span className="absolute -top-2 -right-2 bg-muted text-muted-foreground text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                    Sắp ra mắt
                  </span>
                )}
                {isSelected && <Check className="w-4 h-4 text-primary ml-1" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Pricing Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {plans.map((plan) => {
          const promo = getPlanPromotion(plan.id);
          const effectivePrice = getEffectivePrice(plan, promo);
          const isFree = promo && effectivePrice === 0;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 bg-card/40 backdrop-blur-xl border-2 rounded-5xl shadow-xl transition-all hover:-translate-y-2 ${activeSub?.planId === plan.id
                ? "border-primary ring-4 ring-primary/10"
                : promo
                  ? "border-orange-400/50 ring-2 ring-orange-400/10"
                  : "border-white/5"
                }`}
            >
              {/* Current plan badge */}
              {activeSub?.planId === plan.id && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                  Gói hiện tại
                </span>
              )}

              {/* Promotion badge */}
              {promo && activeSub?.planId !== plan.id && (
                <span
                  className="absolute -top-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1"
                  style={{ background: promo.bannerColor || "#0078D4" }}
                >
                  <Gift className="w-3 h-3" />
                  {promo.badgeText || "KHUYẾN MÃI"}
                </span>
              )}

              {/* Price section */}
              <div className="mb-8">
                <h3 className="text-2xl font-black text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 flex-wrap">
                  {promo ? (
                    <>
                      <span className="text-lg line-through text-muted-foreground/50 font-bold">
                        {`${plan.priceMonthly.toLocaleString("vi-VN")}₫`}
                      </span>
                      <span className="text-3xl font-black" style={{ color: promo.bannerColor || "#0078D4" }}>
                        {isFree ? "MIỄN PHÍ" : `${effectivePrice.toLocaleString("vi-VN")}₫`}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-black">
                        {selectedPayment === "MOMO"
                          ? `${plan.priceMonthly.toLocaleString("vi-VN")}₫`
                          : `$${plan.priceMonthly}`}
                      </span>
                      <span className="text-muted-foreground font-bold">/tháng</span>
                    </>
                  )}
                </div>
                {promo && (
                  <p className="text-[11px] font-bold mt-1" style={{ color: promo.bannerColor || "#0078D4" }}>
                    ⏰ Hết hạn: {new Date(promo.expiresAt).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>

              {/* Features list */}
              <ul className="flex-1 space-y-4 mb-10">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-bold">
                    {feat.enabled ? (
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    )}
                    <span className={feat.enabled ? "text-foreground" : "text-muted-foreground line-through opacity-50"}>
                      {feat.featureKey === "MAX_CLASSROOMS"
                        ? "Số lớp tối đa"
                        : feat.featureKey === "MAX_STUDENTS_PER_CLASSROOM"
                          ? "Học sinh mỗi lớp"
                          : feat.featureKey === "MAX_PLAYERS_PER_MATCH"
                            ? "Số người tối đa/trận"
                            : feat.featureKey === "AI_GENERATION"
                              ? "Lượt tạo AI"
                              : feat.featureKey === "UNLIMITED_MATCHES"
                                ? "Trận đấu tối đa"
                                : feat.featureKey.replace(/_/g, " ")}
                      {feat.limit !== null ? ` (${feat.limit})` : " (Không giới hạn)"}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {isFree ? (
                <Button
                  id={`free-plan-${plan.id}`}
                  className="w-full py-6 rounded-2xl font-black text-lg text-white shadow-[0_8px_0_0_rgba(0,0,0,0.15)]"
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
                  {freeCheckoutLoading === plan.id &&
                    <Loader2 className="animate-spin mr-2" />
                  }
                  {!currentOrg
                    ? "Chọn tổ chức để nhận"
                    : activeSub?.planId === plan.id
                      ? "Đang sử dụng"
                      : "Nhận miễn phí!"}
                </Button>
              ) : (
                <Button
                  id={`buy-plan-${plan.id}`}
                  className={`w-full py-6 rounded-2xl font-black text-lg ${activeSub?.planId === plan.id ? "bg-muted text-muted-foreground" : "shadow-[0_8px_0_0_rgba(0,0,0,0.1)]"
                    }`}
                  disabled={activeSub?.planId === plan.id || checkoutLoading !== null}
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
                  {checkoutLoading === plan.id ? <Loader2 className="animate-spin mr-2" /> : null}
                  {!currentOrg ? "Chọn tổ chức để mua" : activeSub?.planId === plan.id ? "Đang sử dụng" : "Nâng cấp ngay"}
                </Button>
              )}
            </div>
          );
        })}
      </section>

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
    <div className="bg-card/40 backdrop-blur-xl border-2 border-white/5 rounded-4xl p-6 shadow-lg flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner">{icon}</div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            {limit === null ? (
              <span className="text-3xl font-black text-primary italic">Không giới hạn</span>
            ) : (
              <>
                <span className="text-3xl font-black text-foreground">{value}</span>
                {limit !== undefined && <span className="text-muted-foreground font-bold">/ {limit}</span>}
              </>
            )}
          </div>
        </div>
      </div>
      {renewalDate && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Làm mới vào: {new Date(renewalDate).toLocaleDateString("vi-VN")}
          </p>
        </div>
      )}
    </div>
  );
}
