import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/client";
import { useOrganization } from "@/context/OrganizationContext";
import { useModal } from "@/context/ModalContext";

// How long to keep retrying while the backend still reports PAY_PENDING.
const PENDING_MAX_ATTEMPTS = 6;
const PENDING_RETRY_DELAY_MS = 2500;

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentOrg, refreshOrganizations } = useOrganization();
  const { showAlert } = useModal();

  // Support both MoMo redirect params and legacy session-based params
  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("session_id");

  // MoMo-specific redirect params
  const momoResultCode = searchParams.get("resultCode");
  const momoMessage = searchParams.get("message");

  useEffect(() => {
    if (!orderId && !sessionId) {
      navigate('/billing', { replace: true });
      return;
    }

    if ((orderId || sessionId) && currentOrg) {
      verifyPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, sessionId, currentOrg]);

  const verifyPayment = async () => {
    // If MoMo returned an error result code in the redirect URL, show error
    // immediately. Server-side IPN verification still owns the source of truth.
    if (momoResultCode && momoResultCode !== "0") {
      showAlert({
        title: "Thanh toán thất bại",
        message: momoMessage || `Giao dịch đã bị hủy hoặc thất bại (mã lỗi: ${momoResultCode})`,
        type: "error"
      });
      navigate('/billing', { replace: true });
      return;
    }

    // The backend now derives orgId / planId / billingCycle / paymentMethod
    // from the persisted Payment record (looked up by orderId).
    const payload = {
      orderId: orderId || undefined,
      sessionId: sessionId || undefined,
    };

    for (let attempt = 0; attempt < PENDING_MAX_ATTEMPTS; attempt++) {
      try {
        const res = await apiClient.post(`/subscriptions/fulfill`, payload);

        if (res.status === 202) {
          // Payment still pending — IPN hasn't arrived. Wait and retry.
          await new Promise((r) => setTimeout(r, PENDING_RETRY_DELAY_MS));
          continue;
        }

        // 200 OK — subscription activated.
        await refreshOrganizations();
        showAlert({
          title: "Thanh toán thành công!",
          message: "Chúc mừng! Gói dịch vụ của bạn đã được kích hoạt thành công.",
          type: "success"
        });
        navigate('/billing', { replace: true });
        return;
      } catch (err: any) {
        console.error("Verification failed", err);
        showAlert({
          title: "Thanh toán thất bại",
          message: err?.response?.data?.message || "Xác thực thất bại. Giao dịch của bạn có thể vẫn đang được xử lý.",
          type: "error"
        });
        navigate('/billing', { replace: true });
        return;
      }
    }

    // Exhausted retries while still pending.
    showAlert({
      title: "Đang chờ xác nhận",
      message: "Giao dịch đang chờ xác nhận từ cổng thanh toán. Bạn có thể tải lại trang sau ít phút.",
      type: "warning"
    });
    navigate('/billing', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <Loader2 className="animate-spin text-primary w-12 h-12 mb-4 md:w-16 md:h-16" />
      <h2 className="text-xl md:text-2xl font-black tracking-tighter text-foreground">Đang xử lý giao dịch...</h2>
      <p className="text-sm md:text-base text-muted-foreground font-bold mt-2">Vui lòng không đóng trang này</p>
    </div>
  );
}
