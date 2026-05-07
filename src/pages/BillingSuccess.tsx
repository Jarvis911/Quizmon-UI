import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, PartyPopper, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "@/api/client";
import { useOrganization } from "@/context/OrganizationContext";

// How long to keep retrying while the backend still reports PAY_PENDING.
const PENDING_MAX_ATTEMPTS = 6;
const PENDING_RETRY_DELAY_MS = 2500;

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentOrg, refreshOrganizations } = useOrganization();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Support both MoMo redirect params and legacy session-based params
  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("session_id");

  // MoMo-specific redirect params
  const momoResultCode = searchParams.get("resultCode");
  const momoMessage = searchParams.get("message");

  useEffect(() => {
    if ((orderId || sessionId) && currentOrg) {
      verifyPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, sessionId, currentOrg]);

  const verifyPayment = async () => {
    // If MoMo returned an error result code in the redirect URL, show error
    // immediately. Server-side IPN verification still owns the source of truth.
    if (momoResultCode && momoResultCode !== "0") {
      setError(momoMessage || `Payment failed (code: ${momoResultCode})`);
      setIsVerifying(false);
      return;
    }

    // The backend now derives orgId / planId / billingCycle / paymentMethod
    // from the persisted Payment record (looked up by orderId). We must NOT
    // pass those fields here — they would be ignored, and the previous flow
    // was a known privilege-escalation vector.
    const payload = {
      orderId: orderId || undefined,
      sessionId: sessionId || undefined,
    };

    for (let attempt = 0; attempt < PENDING_MAX_ATTEMPTS; attempt++) {
      try {
        const res = await apiClient.post(`/subscriptions/fulfill`, payload);

        if (res.status === 202) {
          // Payment still pending — IPN hasn't arrived. Wait and retry.
          setIsPending(true);
          await new Promise((r) => setTimeout(r, PENDING_RETRY_DELAY_MS));
          continue;
        }

        // 200 OK — subscription activated.
        await refreshOrganizations();
        setIsPending(false);
        setIsVerifying(false);
        return;
      } catch (err: any) {
        console.error("Verification failed", err);
        setError(
          err?.response?.data?.message ||
            "Xác thực thất bại. Giao dịch của bạn có thể vẫn đang được xử lý."
        );
        setIsVerifying(false);
        return;
      }
    }

    // Exhausted retries while still pending.
    setIsPending(true);
    setIsVerifying(false);
  };

  const showPending = !isVerifying && !error && isPending;

  const borderClass = error
    ? 'border-rose-500/20'
    : showPending
      ? 'border-amber-500/20'
      : 'border-primary/20';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
      <div className={`max-w-md w-full bg-card/40 backdrop-blur-2xl border-2 ${borderClass} rounded-3xl md:rounded-[3rem] p-6 md:p-10 text-center shadow-2xl space-y-6 md:space-y-8`}>
        <div className="flex justify-center">
          {error ? (
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertCircle className="w-10 h-10 md:w-[60px] md:h-[60px]" strokeWidth={3} />
            </div>
          ) : showPending ? (
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-10 h-10 md:w-[60px] md:h-[60px]" strokeWidth={3} />
            </div>
          ) : (
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle2 className="w-10 h-10 md:w-[60px] md:h-[60px]" strokeWidth={3} />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground flex items-center justify-center gap-2">
            {error ? (
              <>Lỗi <span className="text-rose-500 italic">Thanh toán</span></>
            ) : showPending ? (
              <>Đang <span className="text-amber-500 italic">Xác thực</span></>
            ) : (
              <>Thanh toán <span className="text-emerald-500 italic">Thành công</span> <PartyPopper className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" /></>
            )}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-bold">
            {isVerifying
              ? "Đang xác thực giao dịch..."
              : error
                ? error
                : showPending
                  ? "Giao dịch đang chờ xác nhận từ cổng thanh toán. Bạn có thể tải lại trang sau ít phút."
                  : "Gói dịch vụ của bạn đã được kích hoạt!"
            }
          </p>
        </div>

        {isVerifying ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary w-8 h-8 md:w-10 md:h-10" />
          </div>
        ) : (
          <div className="pt-4 space-y-3">
            <Button 
              onClick={() => navigate('/billing')} 
              className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-lg shadow-primary/20"
            >
              Xem gói dịch vụ
            </Button>
            {(error || showPending) && (
              <p className="text-[10px] md:text-xs text-muted-foreground">
                Nếu bạn đã bị trừ tiền, gói dịch vụ sẽ tự động kích hoạt sau vài phút.
                Vui lòng tải lại trang sau.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
