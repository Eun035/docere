import React, { useEffect, useState } from "react";
import { CandleBookHero } from "./CandleBookHero";

interface SplashScreenProps {
  onComplete: () => void;
  /** Total time the splash is on screen, in ms (including fade transitions). */
  duration?: number;
}

/**
 * Full-screen overlay shown right after the app boots. Reuses the candle+book
 * illustration so the icon → app transition feels like a single ritual: the
 * candle is "lit" before the docent appears.
 *
 * Phases:
 *   enter   — opacity:0, scaled down slightly (initial paint)
 *   visible — fade & scale in over ~600ms
 *   exit    — fade out over ~500ms before unmounting
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 2000,
}) => {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    // Kick off the entrance one tick after mount so the transition actually runs.
    const enterTimer = window.setTimeout(() => setPhase("visible"), 30);
    const exitTimer = window.setTimeout(() => setPhase("exit"), duration - 500);
    const doneTimer = window.setTimeout(onComplete, duration);
    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [duration, onComplete]);

  const handleSkip = () => setPhase("exit");

  const opacity = phase === "visible" ? "opacity-100" : "opacity-0";
  const pointerEvents = phase === "exit" ? "pointer-events-none" : "";
  const heroAnim =
    phase === "enter"
      ? "scale-95 opacity-0"
      : "scale-100 opacity-100";
  const textAnim =
    phase === "enter"
      ? "translate-y-3 opacity-0"
      : "translate-y-0 opacity-100";

  return (
    <div
      role="status"
      aria-label="앱 시작 중"
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center px-6
        bg-[#15110B] cursor-pointer select-none transition-opacity duration-500
        ${opacity} ${pointerEvents}`}
    >
      <div
        className={`w-full max-w-md transition-all duration-700 ease-out ${heroAnim}`}
      >
        <CandleBookHero className="w-full h-auto block rounded-2xl shadow-2xl ring-1 ring-[#8C7355]/30" />
      </div>

      <div
        className={`mt-8 text-center transition-all duration-700 ease-out delay-200 ${textAnim}`}
      >
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#c5a872] font-sans font-bold mb-2">
          Lumen in Tenebris
        </div>
        <h1 className="text-3xl md:text-4xl font-serif italic text-[#E8C275]">
          Verbum Vitae
        </h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-sans mt-3">
          라틴어 비문 도슨트
        </p>
      </div>

      <p className="absolute bottom-6 text-[9px] uppercase tracking-widest font-sans text-stone-600">
        화면을 탭하여 건너뛰기
      </p>
    </div>
  );
};
