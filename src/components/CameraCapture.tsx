import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, SwitchCamera, AlertTriangle } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (dataUrl: string, mimeType: string) => void;
  onClose: () => void;
}

type FacingMode = "environment" | "user";

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<FacingMode>("environment");
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startStream = async (mode: FacingMode) => {
    setIsStarting(true);
    setError(null);
    stopStream();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "이 브라우저는 카메라 API를 지원하지 않습니다. 최신 Chrome/Safari/Edge에서 다시 시도해 주세요."
      );
      setIsStarting(false);
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(
        "카메라 사용에는 보안 연결(HTTPS) 또는 localhost가 필요합니다. 보안 컨텍스트를 확인해 주세요."
      );
      setIsStarting(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(cams.length > 1);
      } catch {
        // enumerateDevices may fail before permission; ignore
      }
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("카메라 접근이 거부되었습니다. 브라우저 주소창 좌측의 권한 설정에서 허용해 주세요.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("사용 가능한 카메라 장치를 찾을 수 없습니다.");
      } else if (name === "NotReadableError") {
        setError("다른 앱이 카메라를 사용 중입니다. 해당 앱을 종료한 뒤 다시 시도해 주세요.");
      } else {
        setError(err?.message || "카메라를 시작할 수 없습니다.");
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    startStream(facing);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  // Stop stream on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopStream();
    onCapture(dataUrl, "image/jpeg");
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const handleSwitch = () => {
    setFacing((prev) => (prev === "environment" ? "user" : "environment"));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="카메라 촬영"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-2xl bg-stone-900 rounded-xl overflow-hidden border border-stone-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700 bg-stone-800">
          <div className="flex items-center gap-2 text-stone-100 font-sans text-sm">
            <Camera className="w-4 h-4 text-[#c5a872]" />
            <span className="font-semibold">실시간 비문 촬영</span>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 ml-2">
              {facing === "environment" ? "후면 카메라" : "전면 카메라"}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-stone-300 hover:text-white p-1 rounded transition-colors"
            aria-label="카메라 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Error area */}
        <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
          {error ? (
            <div className="text-center px-6 py-8 max-w-md">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-stone-100 font-sans text-sm leading-relaxed">{error}</p>
              <button
                onClick={() => startStream(facing)}
                className="mt-4 px-4 py-2 text-xs font-sans uppercase tracking-widest bg-stone-700 hover:bg-stone-600 text-white rounded-md transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-stone-100 font-sans text-xs gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#c5a872]" />
                  카메라 준비 중...
                </div>
              )}
              {/* Framing guide overlay */}
              {!isStarting && (
                <div className="absolute inset-6 border-2 border-dashed border-[#c5a872]/50 rounded-lg pointer-events-none" />
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-4 bg-stone-800 border-t border-stone-700">
          <button
            onClick={handleSwitch}
            disabled={!!error || isStarting || !hasMultipleCameras}
            className="text-stone-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-sans"
            title="전·후면 카메라 전환"
          >
            <SwitchCamera className="w-5 h-5" />
            <span className="hidden sm:inline">전환</span>
          </button>

          <button
            onClick={handleCapture}
            disabled={!!error || isStarting}
            className="w-16 h-16 rounded-full bg-white border-4 border-stone-400 hover:border-[#c5a872] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95 flex items-center justify-center group"
            aria-label="촬영"
          >
            <span className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-[#c5a872]/20 transition-colors" />
          </button>

          <button
            onClick={handleClose}
            className="text-stone-300 hover:text-white p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-sans"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">취소</span>
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
