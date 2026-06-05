import React, { useEffect, useState } from "react";
import { PRESET_INSCRIPTIONS } from "../data";
import { PresetInscription } from "../types";
import { MapPin, BookOpen, ChevronRight } from "lucide-react";

interface PresetGalleryProps {
  onSelectPreset: (preset: PresetInscription) => void;
  selectedPresetId?: string;
}

// Preload an image and resolve to true/false depending on success.
const verifyImage = (url: string): Promise<boolean> =>
  new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });

export const PresetGallery: React.FC<PresetGalleryProps> = ({
  onSelectPreset,
  selectedPresetId,
}) => {
  // null = still verifying; Set = ids of presets whose images loaded cleanly
  const [validIds, setValidIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      PRESET_INSCRIPTIONS.map(async (p) => [p.id, await verifyImage(p.imageUrl)] as const)
    ).then((results) => {
      if (cancelled) return;
      setValidIds(new Set(results.filter(([, ok]) => ok).map(([id]) => id)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePresets =
    validIds === null
      ? []
      : PRESET_INSCRIPTIONS.filter((p) => validIds.has(p.id));

  const isVerifying = validIds === null;
  const allBroken = validIds !== null && visiblePresets.length === 0;

  return (
    <div id="preset-gallery-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 id="preset-gallery-title" className="font-serif text-lg font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#b39256]" />
          추천 비문 성지 순례
        </h3>
        <span className="text-xs text-slate-500 font-sans">
          {isVerifying ? "사진 검증 중..." : "클릭하여 즉시 분석"}
        </span>
      </div>

      {isVerifying ? (
        <div id="presets-grid-loading" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-slate-200 bg-white animate-pulse"
            >
              <div className="w-full h-32 bg-stone-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
                <div className="h-3 bg-stone-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : allBroken ? (
        <div className="text-center py-6 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            추천 비문 사진을 불러오지 못했습니다. 잠시 후 다시 시도하시거나 직접 비문을 입력·촬영해 주세요.
          </p>
        </div>
      ) : (
        <div id="presets-grid" className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visiblePresets.map((preset) => (
            <button
              key={preset.id}
              id={`preset-card-${preset.id}`}
              onClick={() => onSelectPreset(preset)}
              className={`flex flex-col text-left rounded-xl overflow-hidden border transition-all duration-300 bg-white hover:border-[#c5a872] hover:shadow-md ${
                selectedPresetId === preset.id
                  ? "border-[#c5ac7c] ring-2 ring-[#c5a872]/20 shadow-sm"
                  : "border-slate-200"
              }`}
            >
              <div className="relative w-full h-32 bg-slate-100 overflow-hidden">
                <img
                  src={preset.imageUrl}
                  alt={preset.imageAlt}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={(e) => {
                    // Defensive: if image fails after initial verification (e.g. CDN hiccup),
                    // hide the broken icon so the card stays visually clean.
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-sans px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#c5a872]" />
                  {preset.city}
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-sans font-medium text-xs text-slate-500 line-clamp-1">
                    {preset.location}
                  </h4>
                  <div className="font-serif text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1">
                    {preset.title}
                  </div>
                  <p className="font-mono text-[11px] text-[#b39256] bg-[#fbfaf7] border border-stone-100 px-1.5 py-1 rounded-sm mt-1.5 truncate">
                    {preset.originalText}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-50 font-sans text-slate-400">
                  <span className="line-clamp-1 w-5/6">{preset.description}</span>
                  <ChevronRight className="w-3 h-3 text-[#c5a872] shrink-0" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
