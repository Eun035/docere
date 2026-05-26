import React from "react";
import { HistoryItem } from "../types";
import { Scroll, Trash2, Calendar, MapPin, Search } from "lucide-react";

interface InscriptionHistoryProps {
  items: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  selectedId?: string;
}

export const InscriptionHistory: React.FC<InscriptionHistoryProps> = ({
  items,
  onSelectHistory,
  onDeleteItem,
  selectedId,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredItems = items.filter((item) => {
    const rawText = item.inputText || "";
    const originalText = item.result.purifiedText || "";
    const transContext = item.result.translationContextual || "";
    const loc = item.locationName || "";
    
    return (
      rawText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transContext.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div id="history-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 id="history-title" className="font-serif text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Scroll className="w-5 h-5 text-[#b39256]" />
          나의 순례 묵상 수첩
        </h3>
        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-sans">
          총 {items.length}개 기록됨
        </span>
      </div>

      <div className="relative">
        <input
          type="text"
          id="history-search-input"
          placeholder="성구, 번역어, 장소로 기록 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-sans focus:outline-none focus:border-[#c5a872] focus:bg-white text-slate-800"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-200">
          <p className="text-xs text-slate-400 font-sans">
            {searchTerm ? "검색 조건에 맞는 기록이 존재하지 않습니다." : "아직 기록된 비문이 없습니다. 위 도슨트 스캐너로 분석을 가동하거나 추천 성지를 탐색하여 첫 묵상을 기록하세요!"}
          </p>
        </div>
      ) : (
        <div id="history-list" className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                selectedId === item.id
                  ? "border-[#c5ac7c] bg-[#fdfbf7] shadow-xs"
                  : "border-stone-100 bg-stone-50/60 hover:bg-white hover:border-stone-200"
              }`}
            >
              <button
                onClick={() => onSelectHistory(item)}
                className="flex-1 text-left mr-2 min-w-0"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans">
                  <Calendar className="w-3 h-3 text-[#b39256]" />
                  <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                  {item.locationName && (
                    <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {item.locationName}
                    </span>
                  )}
                </div>
                
                <h4 className="font-mono text-xs font-semibold text-slate-700 truncate mt-1">
                  {item.result.purifiedText || item.inputText}
                </h4>
                
                <p className="font-serif text-xs text-[#b39256] truncate mt-0.5 font-medium">
                  {item.result.translationContextual}
                </p>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all self-center shrink-0"
                title="기록 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
