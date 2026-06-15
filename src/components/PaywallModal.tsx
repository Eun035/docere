import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import type { UsageStatus } from "../utils/userId";

interface PaywallModalProps {
  userId: string;
  usage: UsageStatus | null;
  onClose: () => void;
}

const DAY_PASS_PRICE_KRW = 1500;

// Toss publishes universal docs test client key — works without a merchant
// account. Override per-environment via VITE_TOSS_CLIENT_KEY.
const FALLBACK_TEST_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const CLIENT_KEY =
  (import.meta as any).env?.VITE_TOSS_CLIENT_KEY || FALLBACK_TEST_CLIENT_KEY;

export const PaywallModal: React.FC<PaywallModalProps> = ({
  userId,
  usage,
  onClose,
}) => {
  const widgetsRef = useRef<any>(null);
  const methodHostRef = useRef<HTMLDivElement>(null);
  const agreementHostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  // Render Toss Payment Widgets on mount.
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const tossPayments = await loadTossPayments(CLIENT_KEY);
        if (cancelled) return;

        const widgets = (tossPayments as any).widgets({ customerKey: ANONYMOUS });
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: "KRW", value: DAY_PASS_PRICE_KRW });
        if (cancelled) return;

        await Promise.all([
          widgets.renderPaymentMethods({
            selector: "#paywall-method-host",
            variantKey: "DEFAULT",
          }),
          widgets.renderAgreement({
            selector: "#paywall-agreement-host",
            variantKey: "AGREEMENT",
          }),
        ]);
        if (!cancelled) setStatus("ready");
      } catch (err: any) {
        if (!cancelled) {
          console.error("Toss widget init failed", err);
          setError(err?.message || "결제 위젯을 불러올 수 없습니다.");
          setStatus("error");
        }
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePay = async () => {
    if (!widgetsRef.current) return;
    setStatus("submitting");
    setError(null);

    const orderId = `vv_${userId.slice(0, 8)}_${Date.now()}`;
    try {
      await widgetsRef.current.requestPayment({
        orderId,
        orderName: "Verbum Vitae 1일권",
        successUrl: `${window.location.origin}/?paymentSuccess=1&uid=${encodeURIComponent(userId)}`,
        failUrl: `${window.location.origin}/?paymentFail=1`,
      });
      // Toss redirects on success — we won't reach the line below in the happy path.
    } catch (err: any) {
      if (err?.code === "USER_CANCEL") {
        setStatus("ready");
        return;
      }
      setError(err?.message || "결제 진행 중 오류가 발생했습니다.");
      setStatus("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="1일권 결제"
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && status !== "submitting") onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#FDFCF8] rounded-2xl shadow-2xl border border-[#D9D1C1] flex flex-col my-8 max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9D1C1] bg-[#F4EFE6]/60 flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#8C7355] font-sans font-bold mb-1">
              Verbum Vitae · 1일권
            </div>
            <h2 className="text-xl font-serif italic text-stone-800 leading-tight">
              오늘의 한도를 다 쓰셨습니다
            </h2>
            <p className="text-xs font-sans text-stone-500 mt-2 leading-relaxed">
              {usage
                ? `오늘 ${usage.used}회 분석하셨고 무료 한도(${usage.limit}회)를 모두 사용하셨습니다.`
                : "오늘의 무료 분석 한도를 모두 사용하셨습니다."}
              <br />
              <strong className="text-[#8C7355]">1일권을 구매하시면 자정(KST)까지 무제한 분석</strong>이
              가능합니다.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={status === "submitting"}
            className="text-stone-400 hover:text-stone-700 p-1 rounded transition-colors disabled:opacity-30"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Price summary */}
        <div className="px-6 py-4 border-b border-[#D9D1C1] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c5a872]" />
            <span className="font-sans text-sm font-semibold text-stone-700">
              1일권 (오늘 자정까지)
            </span>
          </div>
          <div className="font-serif text-xl font-bold text-[#8C7355]">
            ₩{DAY_PASS_PRICE_KRW.toLocaleString()}
          </div>
        </div>

        {/* Toss widget hosts */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 py-12 text-stone-500 font-sans text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              결제 수단을 불러오는 중...
            </div>
          )}

          <div
            id="paywall-method-host"
            ref={methodHostRef}
            className={status === "ready" || status === "submitting" ? "" : "hidden"}
          />
          <div
            id="paywall-agreement-host"
            ref={agreementHostRef}
            className={status === "ready" || status === "submitting" ? "mt-4" : "hidden"}
          />

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 p-3 rounded-lg border border-red-300 bg-red-50 text-red-800 text-xs font-sans"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Pay button */}
        <div className="px-6 py-4 border-t border-[#D9D1C1] bg-[#F9F7F2] space-y-2">
          <button
            onClick={handlePay}
            disabled={status !== "ready"}
            className="w-full py-3 rounded-lg font-sans text-sm uppercase tracking-widest font-bold text-white transition-all bg-[#8C7355] hover:bg-[#725C42] disabled:bg-stone-300 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
          >
            {status === "submitting" ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                결제 진행 중...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                ₩{DAY_PASS_PRICE_KRW.toLocaleString()} 결제하기
              </>
            )}
          </button>
          <p className="text-[10px] font-sans text-stone-400 text-center leading-relaxed">
            토스페이먼츠 안전 결제 · 결제 완료 즉시 자정(KST)까지 무제한 사용
          </p>
        </div>
      </div>
    </div>
  );
};
