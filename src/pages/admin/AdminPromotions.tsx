import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Gift,
  Sparkles,
  ArrowRight,
  Clock,
  X,
  Check,
} from "lucide-react";
import { useModal } from "@/context/ModalContext";

interface Plan {
  id: number;
  type: string;
  name: string;
  priceMonthly: number;
}

interface Promotion {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  planId: number;
  plan: { id: number; type: string; name: string };
  discountedPriceMonthly: number;
  discountedPriceYearly: number;
  expiresAt: string;
  isActive: boolean;
  isPublished: boolean;
  bannerColor?: string;
  badgeText?: string;
  createdAt: string;
}

const DEFAULT_FORM = {
  title: "",
  subtitle: "",
  description: "",
  planId: "",
  discountedPriceMonthly: "0",
  discountedPriceYearly: "0",
  expiresAt: "",
  isPublished: false,
  bannerColor: "#0078D4",
  badgeText: "KHUYẾN MÃI",
};

export default function AdminPromotions() {
  const { showAlert } = useModal();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [promoRes, plansRes] = await Promise.all([
        apiClient.get(endpoints.admin_promotions),
        apiClient.get(endpoints.plans),
      ]);
      setPromotions(promoRes.data);
      setPlans(plansRes.data);
    } catch (e: any) {
      showAlert({ title: "Lỗi", message: e?.response?.data?.message || "Không thể tải dữ liệu.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setShowForm(true);
  };

  const openEdit = (promo: Promotion) => {
    setEditingId(promo.id);
    setForm({
      title: promo.title,
      subtitle: promo.subtitle || "",
      description: promo.description || "",
      planId: String(promo.planId),
      discountedPriceMonthly: String(promo.discountedPriceMonthly),
      discountedPriceYearly: String(promo.discountedPriceYearly),
      expiresAt: promo.expiresAt.slice(0, 16), // datetime-local format
      isPublished: promo.isPublished,
      bannerColor: promo.bannerColor || "#0078D4",
      badgeText: promo.badgeText || "KHUYẾN MÃI",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.planId || !form.expiresAt) {
      showAlert({ title: "Thiếu thông tin", message: "Vui lòng điền đầy đủ: tiêu đề, gói, ngày hết hạn.", type: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        planId: Number(form.planId),
        discountedPriceMonthly: Number(form.discountedPriceMonthly),
        discountedPriceYearly: Number(form.discountedPriceYearly),
        expiresAt: new Date(form.expiresAt).toISOString(),
        isPublished: form.isPublished,
        bannerColor: form.bannerColor,
        badgeText: form.badgeText,
      };

      if (editingId) {
        await apiClient.put(endpoints.admin_promotion(editingId), payload);
        showAlert({ title: "Thành công", message: "Đã cập nhật khuyến mãi.", type: "success" });
      } else {
        await apiClient.post(endpoints.admin_promotions, payload);
        showAlert({ title: "Thành công", message: "Đã tạo khuyến mãi mới.", type: "success" });
      }
      setShowForm(false);
      fetchAll();
    } catch (e: any) {
      showAlert({ title: "Lỗi", message: e?.response?.data?.message || "Không thể lưu.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa khuyến mãi này?")) return;
    try {
      await apiClient.delete(endpoints.admin_promotion(id));
      showAlert({ title: "Đã xóa", message: "Khuyến mãi đã được xóa.", type: "success" });
      fetchAll();
    } catch (e: any) {
      showAlert({ title: "Lỗi", message: e?.response?.data?.message || "Không thể xóa.", type: "error" });
    }
  };

  const handleTogglePublish = async (promo: Promotion) => {
    setTogglingId(promo.id);
    try {
      await apiClient.put(endpoints.admin_promotion_publish(promo.id), {
        isPublished: !promo.isPublished,
      });
      fetchAll();
    } catch (e: any) {
      showAlert({ title: "Lỗi", message: e?.response?.data?.message || "Không thể cập nhật.", type: "error" });
    } finally {
      setTogglingId(null);
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            Quản lý Khuyến Mãi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
            Tạo và quản lý các chiến dịch quảng bá. <span className="font-bold text-indigo-500">Publish</span> để hiển thị banner trên giao diện người dùng.
          </p>
        </div>
        <Button
          id="create-promotion-btn"
          onClick={openCreate}
          className="rounded-2xl font-black px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center gap-2 h-auto"
        >
          <Plus className="w-5 h-5" />
          Tạo khuyến mãi
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border-2 border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-black text-foreground">
                {editingId ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi mới"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                  Tiêu đề banner *
                </label>
                <input
                  id="promo-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Gói Giáo Viên - MIỄN PHÍ!"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                  Subtitle
                </label>
                <input
                  id="promo-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="VD: Ưu đãi áp dụng đến hết tháng 9"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
              </div>

              {/* Plan */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                  Gói được khuyến mãi *
                </label>
                <select
                  id="promo-plan"
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="">-- Chọn gói --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.priceMonthly.toLocaleString("vi-VN")}₫/tháng)
                    </option>
                  ))}
                </select>
              </div>

              {/* Price row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                    Giá KM hàng tháng (₫)
                  </label>
                  <input
                    id="promo-price-monthly"
                    type="number"
                    min="0"
                    value={form.discountedPriceMonthly}
                    onChange={(e) => setForm({ ...form, discountedPriceMonthly: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                    Giá KM hàng năm (₫)
                  </label>
                  <input
                    id="promo-price-yearly"
                    type="number"
                    min="0"
                    value={form.discountedPriceYearly}
                    onChange={(e) => setForm({ ...form, discountedPriceYearly: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                  Ngày hết hạn *
                </label>
                <input
                  id="promo-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Banner Color + Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                    Màu banner
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.bannerColor}
                      onChange={(e) => setForm({ ...form, bannerColor: e.target.value })}
                      className="w-12 h-12 rounded-xl border-2 border-white/10 bg-transparent cursor-pointer"
                    />
                    <span className="text-sm font-bold text-muted-foreground">{form.bannerColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                    Badge text
                  </label>
                  <input
                    value={form.badgeText}
                    onChange={(e) => setForm({ ...form, badgeText: e.target.value })}
                    placeholder="KHUYẾN MÃI"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-bold focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Published toggle */}
              <div
                className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer"
                style={{ background: form.isPublished ? `${form.bannerColor}22` : "rgba(255,255,255,0.02)", border: `2px solid ${form.isPublished ? form.bannerColor + "55" : "rgba(255,255,255,0.05)"}` }}
                onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
              >
                <div
                  className="w-10 h-6 rounded-full relative transition-all"
                  style={{ background: form.isPublished ? form.bannerColor : "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow"
                    style={{ left: form.isPublished ? "22px" : "4px" }}
                  />
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">Publish lên banner</p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {form.isPublished ? "Sẽ hiển thị banner trên trang chủ và trang billing." : "Chưa hiển thị cho người dùng."}
                  </p>
                </div>
              </div>

              {/* Banner Preview */}
              {form.title && (
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 pt-2">
                    Xem trước banner
                  </p>
                  <div
                    className="p-3 flex items-center justify-between gap-3"
                    style={{ background: `${form.bannerColor}22`, borderTop: `2px solid ${form.bannerColor}44` }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: form.bannerColor }}
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-black text-sm">{form.title}</span>
                        {form.subtitle && (
                          <span className="text-xs text-muted-foreground font-semibold ml-2">{form.subtitle}</span>
                        )}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-black"
                      style={{ background: form.bannerColor }}
                    >
                      Xem ngay <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-2xl font-black"
              >
                Hủy
              </Button>
              <Button
                id="save-promotion-btn"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-2xl font-black"
              >
                {saving ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 w-4 h-4" />}
                {editingId ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Promotions Table */}
      {promotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Gift className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-xl font-black text-muted-foreground">Chưa có khuyến mãi nào</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Tạo khuyến mãi đầu tiên để bắt đầu chiến dịch.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promo) => {
            const expired = isExpired(promo.expiresAt);
            return (
              <div
                key={promo.id}
                className={`relative p-8 rounded-[2.5rem] border border-white/10 bg-card/40 dark:bg-slate-900/40 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${promo.isPublished && !expired
                  ? "border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                  : expired
                    ? "opacity-60 grayscale-[0.5]"
                    : "shadow-xl"
                  }`}
              >
                {/* Color indicator */}
                <div
                  className="w-2 h-full absolute left-0 top-0 bottom-0 rounded-l-3xl"
                  style={{ background: promo.bannerColor || "#0078D4" }}
                />

                <div className="flex-1 pl-2 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-foreground text-lg">{promo.title}</span>
                    {promo.isPublished && !expired && (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    )}
                    {expired && (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        Hết hạn
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      {promo.plan.name}
                    </span>
                    <span className="flex items-center gap-1">
                      💰 {promo.discountedPriceMonthly === 0 ? "Miễn phí" : `${promo.discountedPriceMonthly.toLocaleString("vi-VN")}₫/tháng`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Hết hạn: {new Date(promo.expiresAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Publish toggle */}
                  <button
                    id={`toggle-publish-${promo.id}`}
                    onClick={() => handleTogglePublish(promo)}
                    disabled={togglingId === promo.id || expired}
                    title={promo.isPublished ? "Unpublish khỏi banner" : "Publish lên banner"}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${promo.isPublished
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {togglingId === promo.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : promo.isPublished ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    {promo.isPublished ? "Published" : "Unpublished"}
                  </button>

                  {/* Edit */}
                  <button
                    id={`edit-promo-${promo.id}`}
                    onClick={() => openEdit(promo)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    id={`delete-promo-${promo.id}`}
                    onClick={() => handleDelete(promo.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
