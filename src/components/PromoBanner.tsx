import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/client";
import endpoints from "@/api/api";
import { X, Sparkles, ArrowRight, Clock } from "lucide-react";

interface Promotion {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  bannerColor?: string;
  expiresAt: string;
  plan: {
    id: number;
    name: string;
    type: string;
  };
}

function useCountdown(expiresAt: string) {
  const calcRemaining = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  };

  const [remaining, setRemaining] = useState(calcRemaining());

  useEffect(() => {
    const timer = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return remaining;
}

function PromoBannerItem({ promo, onDismiss }: { promo: Promotion; onDismiss: (id: number) => void }) {
  const navigate = useNavigate();
  const remaining = useCountdown(promo.expiresAt);
  const color = promo.bannerColor || "#0078D4";

  if (!remaining) return null;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}dd 0%, ${color}77 100%)`,
        borderBottom: `2px solid ${color}`,
      }}
    >
      {/* Animated shimmer background */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: icon + text */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div>
            <span className="font-black text-sm text-white drop-shadow-sm">{promo.title}</span>
            {promo.subtitle && (
              <span className="text-white/80 font-semibold text-xs ml-2">{promo.subtitle}</span>
            )}
          </div>
        </div>

        {/* Center: countdown */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/70" />
          <div className="flex gap-1.5 items-center">
            {remaining.days > 0 && (
              <CountdownUnit value={remaining.days} label="ngày" color={color} />
            )}
            <CountdownUnit value={remaining.hours} label="giờ" color={color} />
            <span className="text-white/50 font-bold text-sm">:</span>
            <CountdownUnit value={remaining.minutes} label="phút" color={color} />
            <span className="text-white/50 font-bold text-sm">:</span>
            <CountdownUnit value={remaining.seconds} label="giây" color={color} />
          </div>
        </div>

        {/* Right: CTA + close */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/billing")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: color }}
          >
            Xem ngay <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDismiss(promo.id)}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Đóng banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CountdownUnit({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-black text-sm min-w-[28px] text-center px-1.5 py-0.5 rounded-md"
        style={{ background: `rgba(255,255,255,0.2)`, color: "#fff" }}
      >
        {String(value).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function PromoBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    // Load dismissed IDs from sessionStorage
    try {
      const saved = sessionStorage.getItem("quizmon_dismissed_promos");
      if (saved) setDismissed(JSON.parse(saved));
    } catch { }

    const fetchPromos = async () => {
      try {
        const res = await apiClient.get(endpoints.promotions_active);
        setPromotions(res.data);
      } catch {
        // Silently fail — banner is optional
      }
    };
    fetchPromos();
  }, []);

  const handleDismiss = (id: number) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    try {
      sessionStorage.setItem("quizmon_dismissed_promos", JSON.stringify(updated));
    } catch { }
  };

  const visible = promotions.filter((p) => !dismissed.includes(p.id));
  if (visible.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <div className="w-full flex flex-col">
        {visible.map((promo) => (
          <PromoBannerItem key={promo.id} promo={promo} onDismiss={handleDismiss} />
        ))}
      </div>
    </>
  );
}
