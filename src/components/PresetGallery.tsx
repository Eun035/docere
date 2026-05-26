import React from "react";
import { PRESET_INSCRIPTIONS } from "../data";
import { PresetInscription } from "../types";
import { MapPin, BookOpen, ChevronRight } from "lucide-react";

interface PresetGalleryProps {
  onSelectPreset: (preset: PresetInscription) => void;
  selectedPresetId?: string;
}

export const PresetGallery: React.FC<PresetGalleryProps> = ({
  onSelectPreset,
  selectedPresetId,
}) => {
  return (
    <div id="preset-gallery-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 id="preset-gallery-title" className="font-serif text-lg font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#b39256]" />
          추천 비문 성지 순례
        </h3>
        <span className="text-xs text-slate-500 font-sans">클릭하여 즉시 분석</span>
      </div>
      
      <div id="presets-grid" className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRESET_INSCRIPTIONS.map((preset) => (
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
    </div>
  );
};
