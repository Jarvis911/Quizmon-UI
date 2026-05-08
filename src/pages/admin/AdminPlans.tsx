import { useEffect, useState, useCallback } from "react";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Layers } from "lucide-react";
import { useModal } from "@/context/ModalContext";

interface PlanFeature {
  id?: number;
  featureKey: string;
  limit: number | null;
  enabled: boolean;
}

interface Plan {
  id: number;
  type: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  isActive: boolean;
  features: PlanFeature[];
}

const FEATURE_LABELS: Record<string, string> = {
  AI_GENERATION: "Sinh câu hỏi bằng AI",
  AI_IMAGE_GENERATION: "Sinh ảnh minh họa (AI)",
  UNLIMITED_MATCHES: "Số phiên/match (hạn hoặc không giới hạn)",
  ADVANCED_ANALYTICS: "Phân tích nâng cao",
  UNLIMITED_CLASSROOMS: "Lớp học (cờ không giới hạn — legacy)",
  MAX_CLASSROOMS: "Tối đa lớp học",
  MAX_STUDENTS_PER_CLASSROOM: "Tối đa học sinh / lớp",
  MAX_PLAYERS_PER_MATCH: "Tối đa người chơi / phiên",
  CUSTOM_BRANDING: "Tuỳ chỉnh thương hiệu",
  PRIORITY_SUPPORT: "Ưu tiên hỗ trợ",
};

const INPUT =
  "w-full px-4 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50 text-sm md:text-base";

type FeatureDraftRow = { featureKey: string; enabled: boolean; limitStr: string };

type PlanDraft = {
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  isActive: boolean;
  features: FeatureDraftRow[];
};

function buildDraft(plan: Plan, keys: string[]): PlanDraft {
  const map = Object.fromEntries((plan.features || []).map((f) => [f.featureKey, f]));
  return {
    name: plan.name,
    description: plan.description ?? "",
    priceMonthly: String(plan.priceMonthly),
    priceYearly: String(plan.priceYearly),
    isActive: plan.isActive,
    features: keys.map((k) => {
      const f = map[k];
      return {
        featureKey: k,
        enabled: f?.enabled ?? false,
        limitStr: f?.limit == null ? "" : String(f.limit),
      };
    }),
  };
}

export default function AdminPlans() {
  const { showAlert } = useModal();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [featureKeys, setFeatureKeys] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<number, PlanDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingMetaId, setSavingMetaId] = useState<number | null>(null);
  const [savingFeatId, setSavingFeatId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, plansRes] = await Promise.all([
        apiClient.get(endpoints.admin_plan_keys),
        apiClient.get(endpoints.admin_plans),
      ]);
      const keys: string[] = keysRes.data?.keys ?? [];
      setFeatureKeys(keys);
      const list: Plan[] = plansRes.data ?? [];
      setPlans(list);
      const next: Record<number, PlanDraft> = {};
      for (const p of list) {
        next[p.id] = buildDraft(p, keys);
      }
      setDrafts(next);
    } catch (e: any) {
      showAlert({
        title: "Lỗi",
        message: e?.response?.data?.message || "Không tải được gói cước.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const setDraft = (planId: number, updater: (d: PlanDraft) => PlanDraft) => {
    setDrafts((prev) => {
      const cur = prev[planId];
      if (!cur) return prev;
      return { ...prev, [planId]: updater(cur) };
    });
  };

  const saveMeta = async (planId: number) => {
    const d = drafts[planId];
    if (!d) return;
    const pm = Number(d.priceMonthly);
    const py = Number(d.priceYearly);
    if (Number.isNaN(pm) || pm < 0 || Number.isNaN(py) || py < 0) {
      showAlert({ title: "Lỗi", message: "Giá phải là số không âm.", type: "error" });
      return;
    }
    setSavingMetaId(planId);
    try {
      const { data } = await apiClient.put(endpoints.admin_plan(planId), {
        name: d.name.trim(),
        description: d.description.trim() || null,
        priceMonthly: pm,
        priceYearly: py,
        isActive: d.isActive,
      });
      setPlans((prev) => prev.map((p) => (p.id === planId ? data : p)));
      setDraft(planId, () => buildDraft(data, featureKeys));
      showAlert({ title: "Đã lưu", message: "Thông tin gói đã cập nhật.", type: "success" });
    } catch (e: any) {
      showAlert({
        title: "Lỗi",
        message: e?.response?.data?.message || "Không lưu được.",
        type: "error",
      });
    } finally {
      setSavingMetaId(null);
    }
  };

  const saveFeatures = async (planId: number) => {
    const d = drafts[planId];
    if (!d) return;
    const payload: { featureKey: string; enabled: boolean; limit: number | null }[] = [];
    for (const row of d.features) {
      let limit: number | null = null;
      if (row.limitStr.trim() !== "") {
        const n = Number(row.limitStr);
        if (Number.isNaN(n) || n < 0) {
          showAlert({
            title: "Lỗi",
            message: `Hạn mức không hợp lệ cho ${FEATURE_LABELS[row.featureKey] || row.featureKey}.`,
            type: "error",
          });
          return;
        }
        limit = n;
      }
      payload.push({ featureKey: row.featureKey, enabled: row.enabled, limit });
    }

    setSavingFeatId(planId);
    try {
      const { data } = await apiClient.put(endpoints.admin_plan_features(planId), { features: payload });
      setPlans((prev) => prev.map((p) => (p.id === planId ? data : p)));
      setDraft(planId, () => buildDraft(data, featureKeys));
      showAlert({ title: "Đã lưu", message: "Tính năng & hạn mức đã cập nhật.", type: "success" });
    } catch (e: any) {
      showAlert({
        title: "Lỗi",
        message: e?.response?.data?.message || "Không lưu được tính năng.",
        type: "error",
      });
    } finally {
      setSavingFeatId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground font-bold gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        Đang tải gói…
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 flex items-center gap-3">
          <Layers className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          Gói &amp; tính năng
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium max-w-3xl">
          Chỉnh tên, mô tả, giá và bật/tắt gói hiển thị trên trang thanh toán. Tuỳ từng gói, bật tính năng và đặt hạn mức (để trống = không giới hạn khi tính năng bật). Mã gói
          cố định (FREE, TEACHER_PRO, …) — không đổi từ đây.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {plans.map((plan) => {
          const d = drafts[plan.id];
          if (!d) return null;
          return (
            <div
              key={plan.id}
              className="rounded-2xl md:rounded-[2rem] border-2 border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden"
            >
              <div className="px-4 md:px-8 py-4 md:py-5 border-b border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                    {plan.type}
                  </span>
                  {!plan.isActive && (
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Đã ẩn khách
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-medium">Plan id: {plan.id}</p>
              </div>

              <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                      Tên hiển thị
                    </label>
                    <input
                      className={INPUT}
                      value={d.name}
                      onChange={(e) => setDraft(plan.id, (x) => ({ ...x, name: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                      Mô tả
                    </label>
                    <textarea
                      className={`${INPUT} min-h-[88px] resize-y font-medium`}
                      value={d.description}
                      onChange={(e) => setDraft(plan.id, (x) => ({ ...x, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                      Giá tháng (₫)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={INPUT}
                      value={d.priceMonthly}
                      onChange={(e) => setDraft(plan.id, (x) => ({ ...x, priceMonthly: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                      Giá năm (₫)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className={INPUT}
                      value={d.priceYearly}
                      onChange={(e) => setDraft(plan.id, (x) => ({ ...x, priceYearly: e.target.value }))}
                    />
                  </div>
                  <label className="md:col-span-2 flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 accent-primary cursor-pointer"
                      checked={d.isActive}
                      onChange={(e) => setDraft(plan.id, (x) => ({ ...x, isActive: e.target.checked }))}
                    />
                    <span className="text-sm md:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      Hiển thị và cho phép mua / chọn gói này (đồng bộ với trang Billing)
                    </span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => saveMeta(plan.id)}
                    disabled={savingMetaId === plan.id}
                    className="rounded-xl font-black gap-2"
                  >
                    {savingMetaId === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Lưu thông tin gói
                  </Button>
                </div>

                <div>
                  <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 md:mb-4">
                    Tính năng &amp; hạn mức
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium mb-4">
                    Ô hạn mức để trống = không giới hạn (áp dụng khi bật tính năng có quota). Tắt tính năng = chặn dù dù còn hạn.
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="bg-white/[0.04] border-b border-white/10">
                          <th className="text-left p-3 md:p-4 font-black text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider">
                            Tính năng
                          </th>
                          <th className="text-left p-3 md:p-4 font-black text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider w-28">
                            Bật
                          </th>
                          <th className="text-left p-3 md:p-4 font-black text-muted-foreground text-[10px] md:text-xs uppercase tracking-wider">
                            Hạn mức (số)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {d.features.map((row, idx) => (
                          <tr key={row.featureKey} className="hover:bg-white/[0.02]">
                            <td className="p-3 md:p-4 align-middle">
                              <div className="font-bold text-foreground">{FEATURE_LABELS[row.featureKey] || row.featureKey}</div>
                              <div className="text-[10px] md:text-xs text-muted-foreground font-mono mt-0.5">{row.featureKey}</div>
                            </td>
                            <td className="p-3 md:p-4 align-middle">
                              <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-white/20 accent-primary cursor-pointer"
                                checked={row.enabled}
                                onChange={(e) =>
                                  setDraft(plan.id, (x) => {
                                    const feats = [...x.features];
                                    feats[idx] = { ...feats[idx], enabled: e.target.checked };
                                    return { ...x, features: feats };
                                  })
                                }
                              />
                            </td>
                            <td className="p-3 md:p-4 align-middle">
                              <input
                                type="number"
                                min={0}
                                placeholder="Không giới hạn"
                                disabled={!row.enabled}
                                className={`${INPUT} font-mono text-xs md:text-sm ${!row.enabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                value={row.limitStr}
                                onChange={(e) =>
                                  setDraft(plan.id, (x) => {
                                    const feats = [...x.features];
                                    feats[idx] = { ...feats[idx], limitStr: e.target.value };
                                    return { ...x, features: feats };
                                  })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => saveFeatures(plan.id)}
                    disabled={savingFeatId === plan.id}
                    className="rounded-xl font-black gap-2"
                  >
                    {savingFeatId === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Lưu tính năng
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
