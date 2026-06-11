import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Camera,
  Upload,
  X,
  Sparkles,
  Bookmark,
  Check,
  RefreshCw,
  BookMarked,
  AlertTriangle,
  Share2,
  Copy
} from "lucide-react";
import { PresetInscription, AnalysisResult, HistoryItem } from "./types";
import { PresetGallery } from "./components/PresetGallery";
import { InscriptionHistory } from "./components/InscriptionHistory";
import { CameraCapture } from "./components/CameraCapture";

export default function App() {
  // Input states
  const [inputText, setInputText] = useState("");
  const [locationName, setLocationName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  
  // UI and loading states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  
  // Loaded analysis result
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [activeHistoryItem, setActiveHistoryItem] = useState<HistoryItem | null>(null);
  
  // Local persistent history
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied">("idle");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Image input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("latin_docent_history_v1");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
    // First-time visitors see the candlelight welcome screen — no auto-analysis preload.
  }, []);

  // Save changes to localStorage helper
  const saveHistoryList = (newList: HistoryItem[]) => {
    setHistory(newList);
    localStorage.setItem("latin_docent_history_v1", JSON.stringify(newList));
  };

  // Convert files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 12 * 1024 * 1024) {
        setErrorMessage("이미지 파일 크기가 너무 큽니다. 12MB 이하의 이미지를 업로드해 주세요.");
        return;
      }
      setImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageBase64 = reader.result as string;
        setSelectedImage(imageBase64);
        setErrorMessage(null);
        
        // 이미지 첨부 즉시 실시간으로 자동 해석 개시
        handleAnalyze(inputText, locationName || "촬영된 비문 성지", imageBase64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > 12 * 1024 * 1024) {
        setErrorMessage("이미지 파일 크기가 너무 큽니다. 12MB 이하의 이미지를 업로드해 주세요.");
        return;
      }
      setImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageBase64 = reader.result as string;
        setSelectedImage(imageBase64);
        setErrorMessage(null);
        
        // 이미지 드롭 즉시 실시간으로 자동 해석 개시
        handleAnalyze(inputText, locationName || "촬영된 비문 성지", imageBase64, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle live camera capture result
  const handleCameraCapture = (dataUrl: string, mime: string) => {
    setImageMime(mime);
    setSelectedImage(dataUrl);
    setErrorMessage(null);
    setIsCameraOpen(false);
    handleAnalyze(inputText, locationName || "촬영된 비문 성지", dataUrl, mime);
  };

  // Trigger backend analysis
  const handleAnalyze = async (customText?: string, customLocation?: string, customImage?: string, customMime?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsSaved(false);

    const txt = customText !== undefined ? customText : inputText;
    const loc = customLocation !== undefined ? customLocation : locationName;
    const imgData = customImage !== undefined ? customImage : selectedImage;
    const mimeType = customMime !== undefined ? customMime : imageMime;

    try {
      // Remove data URL prefix if uploading raw base64 to backend
      let cleanBase64 = null;
      if (imgData) {
        cleanBase64 = imgData.split(",")[1] || imgData;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: txt,
          image: cleanBase64,
          imageMime: mimeType
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "비문 해석 요청에 실패하였습니다.");
      }

      const result: AnalysisResult = await response.json();
      setActiveAnalysis(result);

      // 이미지에서 판독된 비문 텍스트가 있다면 발견구절 입력창(inputText)에 즉시 자동 동기화!
      if (result.purifiedText) {
        setInputText(result.purifiedText);
      }

      // Create a temporary history item structure
      const tempItem: HistoryItem = {
        id: "temp_" + Date.now(),
        timestamp: new Date().toISOString(),
        inputText: result.purifiedText || txt || "이미지 분석 요청",
        locationName: loc || "알 수 없는 성지",
        result
      };
      setActiveHistoryItem(tempItem);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "도슨트 시스템 분석 요소를 로드하지 못했습니다. 연결을 다시 확인해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Preset Selection -> triggers instant load to look beautiful
  const handleSelectPreset = (preset: PresetInscription) => {
    setSelectedPresetId(preset.id);
    setInputText(preset.originalText);
    setLocationName(`${preset.city} - ${preset.location}`);
    
    // Clear custom image to prioritize preset
    setSelectedImage(null);

    // Run instantly
    handleAnalyze(preset.originalText, `${preset.city} - ${preset.location}`, undefined, undefined);
  };

  // Save to localized library
  const handleSaveToNotebook = () => {
    if (!activeHistoryItem || !activeAnalysis) return;
    
    // Check if already in history list
    const isAlreadySaved = history.some(item => 
      item.result.purifiedText === activeAnalysis.purifiedText && 
      item.locationName === activeHistoryItem.locationName
    );

    if (isAlreadySaved) {
      setIsSaved(true);
      return;
    }

    const itemToSave: HistoryItem = {
      ...activeHistoryItem,
      id: "saved_" + Date.now(), // update temp to persistent ID
      timestamp: new Date().toISOString()
    };

    const newHistoryList = [itemToSave, ...history];
    saveHistoryList(newHistoryList);
    setIsSaved(true);
    setActiveHistoryItem(itemToSave);
  };

  // Share current meditation via Web Share API or clipboard fallback
  const handleShare = async () => {
    if (!activeAnalysis) return;

    const loc = activeHistoryItem?.locationName ? `\n📍 ${activeHistoryItem.locationName}` : "";
    const shareText =
      `🏛️ ${activeAnalysis.purifiedText}${loc}\n\n` +
      `📖 ${activeAnalysis.biblicalReference}\n\n` +
      `✍️ ${activeAnalysis.translationContextual}\n\n` +
      `🕊️ ${activeAnalysis.meditation}\n\n` +
      `— Verbum Vitae 도슨트`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Verbum Vitae — ${activeAnalysis.purifiedText}`,
          text: shareText
        });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch (err) {
      // User cancelled share — silently ignore
      if ((err as any)?.name === "AbortError") return;
      setErrorMessage("공유에 실패했습니다. 브라우저 권한이나 보안 컨텍스트(HTTPS)를 확인해 주세요.");
    }
  };

  // Load past saved meditation
  const handleSelectHistory = (item: HistoryItem) => {
    setActiveAnalysis(item.result);
    setActiveHistoryItem(item);
    setIsSaved(true);
    setInputText(item.inputText || item.result.purifiedText);
    setLocationName(item.locationName || "");
    setSelectedPresetId(undefined);
    setSelectedImage(item.imageUrl || null);
  };

  // Delete saved entry
  const handleDeleteHistoryItem = (id: string) => {
    const newList = history.filter(item => item.id !== id);
    saveHistoryList(newList);
    
    // If the active viewed item was deleted, clear active state or set to first item
    if (activeHistoryItem?.id === id) {
      if (newList.length > 0) {
        handleSelectHistory(newList[0]);
      } else {
        setActiveAnalysis(null);
        setActiveHistoryItem(null);
        setIsSaved(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1A1A1A] font-serif border-8 border-[#E6E2D3] flex flex-col md:flex-row transition-all duration-300">
      
      {/* Sidebar: Historical / Settings Controls */}
      <aside className="w-full md:w-[360px] lg:w-[400px] border-b md:border-b-0 md:border-r border-[#D9D1C1] flex flex-col bg-[#F9F7F2] shrink-0 overflow-y-auto">
        
        {/* Editorial Branding */}
        <div className="p-6 border-b border-[#D9D1C1] bg-[#F4EFE6]/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] tracking-[0.3em] uppercase font-sans text-[#8C7355] font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355] inline-block"></span>
              Theological Epigraphy AI
            </span>
            <div className="text-[9px] font-sans uppercase tracking-widest bg-stone-200/60 px-2 py-0.5 rounded-sm">
              Scholar Mode
            </div>
          </div>
          <h1 className="text-3xl leading-none italic font-black text-[#8C7355] font-serif tracking-tight flex items-center gap-2">
            Verbum Vitae
            <span className="text-xs font-sans tracking-normal not-italic text-slate-500 font-normal">v2.1</span>
          </h1>
          <p className="text-xs font-sans text-stone-500 mt-2 italic">
            유럽 성당과 묘비, 수도원에 묵묵히 새겨진 라틴어 비문 속 역사적 영성과 신학의 숨결을 해독합니다.
          </p>
        </div>

        {/* Dynamic Navigation / Form Controls */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Main Scoped Inscription Scanner Input */}
          <div className="space-y-3">
            <h3 className="text-[11px] uppercase tracking-wider font-sans font-bold text-[#8C7355] border-b border-[#D9D1C1] pb-1">
              🏛️ 도슨트 라틴어 비문 입력
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-sans text-stone-500 uppercase tracking-widest mb-1">
                  1) 성지 / 성당 위치 정보 (선택)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-[#b39256]">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="location-input-name"
                    placeholder="예: 로마 판테온, 바티칸 미술관, 톨레도 성당..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#D9D1C1] rounded-lg text-xs font-sans focus:outline-none focus:border-[#8C7355] focus:ring-1 focus:ring-[#8C7355] text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-sans text-stone-500 uppercase tracking-widest mb-1 font-semibold">
                  2) 라틴어 구절 / 발견 구절 입력
                </label>
                <textarea
                  id="latin-text-input"
                  rows={3}
                  placeholder="예: REQVIESCAT IN PACE 또는 IHS와 같이 마모되거나 알아보기 힘든 비문을 이곳에 입력하세요."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9D1C1] rounded-lg text-xs font-mono focus:outline-none focus:border-[#8C7355] focus:ring-1 focus:ring-[#8C7355] text-stone-800 placeholder-stone-400"
                ></textarea>
              </div>

              {/* Photo Snap / Image Drag and Drop Module */}
              <div className="space-y-1">
                <label className="block text-[10px] font-sans text-stone-500 uppercase tracking-widest mb-1 flex justify-between items-center">
                  <span>3) 비문 촬영 사진 첨부 (선택)</span>
                  {selectedImage && (
                    <button 
                      onClick={clearImage} 
                      className="text-red-500 hover:text-red-600 font-sans text-[9px] uppercase tracking-tighter flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> 삭제
                    </button>
                  )}
                </label>

                {!selectedImage ? (
                  <div className="space-y-2">
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-[#D9D1C1] hover:border-[#8C7355] rounded-lg p-4 text-center cursor-pointer transition-colors bg-white/70 flex flex-col items-center justify-center space-y-1.5"
                    >
                      <Upload className="w-6 h-6 text-[#b39256]" />
                      <p className="text-[10px] font-sans text-stone-500">
                        정밀 인식을 위해 이미지를 드래그하거나 클릭하여 업로드
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setIsCameraOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-lg border border-[#8C7355]/40 bg-white hover:bg-[#F4EFE6] text-[#8C7355] font-sans text-[11px] uppercase tracking-widest font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      카메라로 직접 촬영
                    </button>
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-[#D9D1C1] bg-stone-100 max-h-36 flex justify-center items-center">
                    <img
                      src={selectedImage}
                      alt="Uploaded Pilgrim Inscription"
                      className="max-h-36 object-contain w-full"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/90 text-stone-800 text-[10px] font-sans px-2.5 py-1 rounded-sm border border-[#D9D1C1] flex items-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#8C7355]" />
                        파일 변경
                      </button>
                      <button
                        onClick={() => {
                          setErrorMessage(null);
                          setIsCameraOpen(true);
                        }}
                        className="bg-white/90 text-stone-800 text-[10px] font-sans px-2.5 py-1 rounded-sm border border-[#D9D1C1] flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#8C7355]" />
                        다시 촬영
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  id="analyze-btn"
                  onClick={() => handleAnalyze()}
                  disabled={isLoading || (!inputText && !selectedImage)}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-sans text-xs uppercase tracking-widest font-bold text-white transition-all transform hover:shadow active:scale-95 flex items-center justify-center gap-1.5 ${
                    isLoading 
                      ? "bg-stone-400 cursor-not-allowed" 
                      : (!inputText && !selectedImage)
                        ? "bg-stone-300 cursor-not-allowed text-stone-500"
                        : "bg-[#8C7355] hover:bg-[#725C42] cursor-pointer"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      성구 해독 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#E6E2D3]" />
                      도슨트 스캔해석 개시
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Recommended Preset List inside Sidebar Scroll */}
          <PresetGallery
            onSelectPreset={handleSelectPreset}
            selectedPresetId={selectedPresetId}
          />

          {/* User Pilgrimage Meditations Notebook History */}
          <InscriptionHistory
            items={history}
            onSelectHistory={handleSelectHistory}
            onDeleteItem={handleDeleteHistoryItem}
            selectedId={activeHistoryItem?.id}
          />

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#D9D1C1] bg-stone-100 font-sans text-[10px] text-stone-500 flex justify-between items-center shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355]"></span>
            학술 전승 모드 상공 가용
          </span>
          <span className="opacity-70">Verbum Vitae © 2026</span>
        </div>
      </aside>

      {/* Main Analysis Panel: Styled with pure Editorial Classic Aesthetic */}
      <main className="flex-1 flex flex-col p-6 md:p-12 relative overflow-y-auto">

        {/* Decorative Background Cross/Rosette watermark */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none p-8 text-[#8C7355]">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
          </svg>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 p-4 rounded-lg border border-red-300 bg-red-50 text-red-800 font-sans text-xs shadow-sm"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <div className="flex-1 leading-relaxed">
              <div className="text-[10px] uppercase tracking-widest font-bold text-red-700 mb-0.5">
                도슨트 시스템 오류
              </div>
              <div>{errorMessage}</div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 p-1 -m-1 rounded transition-colors"
              aria-label="오류 메시지 닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Interactive Layout based on whether an analysis exists */}
        {activeAnalysis ? (
          <div className="space-y-8 flex-1 flex flex-col justify-between">
            <div className="space-y-8">
              {/* Dynamic Cathedral Header */}
              <header className="border-b-4 border-[#8C7355]/30 pb-6 relative">
                {activeHistoryItem?.locationName && (
                  <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.25em] mb-2 text-[#8C7355] font-sans font-bold">
                    <MapPin className="w-4 h-4 text-red-700/80" />
                    <span>{activeHistoryItem.locationName}</span>
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-[0.4em] mb-3 text-stone-400 font-sans">
                  Epigraphy Analysis & Biblical Hermeneutics
                </div>
                
                {/* Purified Main Heading */}
                <h2 id="editorial-main-subtitle" className="text-3xl md:text-5xl tracking-tight leading-tight text-stone-900 font-black font-serif italic max-w-4xl">
                  {activeAnalysis.purifiedText}
                </h2>
              </header>

              {/* 4 Grid Columns for Analysis Outputs */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                
                {/* 1. Original text & correction purified */}
                <div className="space-y-1.5">
                  <h3 className="text-[11px] uppercase tracking-widest text-[#8C7355] font-sans font-bold border-b border-[#E6E2D3] pb-1 flex items-center gap-1">
                    <span>🏛️ 1. 원문 정제 (Original Text & Correction)</span>
                  </h3>
                  <p className="text-xl font-bold font-mono text-stone-800 leading-snug">
                    {activeAnalysis.purifiedText}
                  </p>
                  <p className="text-xs text-stone-500 italic font-sans leading-relaxed">
                    [교정] 유효 학령 분석을 도대로 종교 전승 약어 복원 및 마모된 라틴어 철자 자동 정제를 실현하였습니다.
                  </p>
                </div>

                {/* 2. Biblical Reference Match */}
                <div className="space-y-1.5">
                  <h3 className="text-[11px] uppercase tracking-widest text-[#8C7355] font-sans font-bold border-b border-[#E6E2D3] pb-1 flex items-center gap-1">
                    <span>📖 2. 성경 매칭 (Biblical Reference)</span>
                  </h3>
                  <p className="text-lg font-bold text-[#8C7355] font-serif leading-snug">
                    {activeAnalysis.biblicalReference}
                  </p>
                  <p className="text-xs text-stone-500 italic font-sans leading-relaxed">
                    신약 성서 구절이나 오랜 가톨릭 영성 문헌 전승으로부터 원형 출처를 상호 대조 검색해 확보했습니다.
                  </p>
                </div>

                {/* 3. Translations: Literal and Contextual */}
                <div className="space-y-2 lg:col-span-2">
                  <h3 className="text-[11px] uppercase tracking-widest text-[#8C7355] font-sans font-bold border-b border-[#E6E2D3] pb-1">
                    ✍️ 3. 한국어 번역 (Translation)
                  </h3>
                  <div className="space-y-2 bg-[#F9F7F2] p-4 rounded-lg border border-[#E6E2D3]">
                    <div className="text-xs font-sans text-stone-400 uppercase tracking-widest">
                      [직역]
                    </div>
                    <p className="text-sm font-sans text-stone-700 leading-relaxed font-normal">
                      {activeAnalysis.translationLiteral}
                    </p>
                    
                    <div className="border-t border-dashed border-[#D9D1C1] my-2"></div>
                    
                    <div className="text-xs font-sans text-[#8C7355] uppercase tracking-widest font-bold">
                      [가톨릭 성경적 의역]
                    </div>
                    <p className="text-lg font-serif italic font-bold text-[#8C7355] leading-normal underline decoration-dotted underline-offset-4 decoration-[#b39256]">
                      {activeAnalysis.translationContextual}
                    </p>
                  </div>
                </div>

                {/* 4. Linguistic Insights */}
                <div className="space-y-1.5 lg:col-span-2">
                  <h3 className="text-[11px] uppercase tracking-widest text-[#8C7355] font-sans font-bold border-b border-[#E6E2D3] pb-1 flex items-center gap-1">
                    <span>💡 4. 문법 및 어원 팁 (Linguistic Insight)</span>
                  </h3>
                  <div className="bg-white border-l-4 border-[#b39256] pl-4 py-1">
                    <p className="text-sm leading-relaxed text-stone-700 font-sans">
                      {activeAnalysis.linguisticInsight}
                    </p>
                  </div>
                </div>

                {/* 5. Heart-healing Pilgrim Meditation bronze banner */}
                <div className="lg:col-span-2 bg-[#8C7355] text-white p-6 rounded-sm shadow-md mt-2 relative overflow-hidden transition-all duration-500 hover:shadow-xl">
                  {/* Miniature Star Icon */}
                  <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 text-white">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                    </svg>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] font-sans mb-3 text-[#E6E2D3] font-bold">
                    <span>🕊️ 5. 순례자를 위한 묵상 가이드 (Pilgrim Meditation)</span>
                  </div>
                  <p className="text-base md:text-lg italic leading-relaxed font-serif max-w-4xl text-[#FDFCF8] font-medium">
                    &ldquo;{activeAnalysis.meditation}&rdquo;
                  </p>
                </div>

              </section>
            </div>

            {/* Bottom Actions Row to Save, Reset and share analysis */}
            <footer className="mt-12 flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-t border-[#D9D1C1] pt-6 gap-4 font-sans text-xs">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase tracking-widest">
                <BookMarked className="w-4 h-4 text-[#8C7355]" />
                <span>성구 해설본 고해상 보존 가능</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="px-4 py-2 border border-[#8C7355]/40 rounded-md uppercase tracking-wider text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 bg-white hover:bg-[#F4EFE6] text-[#8C7355] cursor-pointer"
                  title="이 묵상을 공유하거나 클립보드로 복사"
                  aria-label="공유"
                >
                  {shareStatus === "copied" ? (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      클립보드 복사됨
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      공유
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveToNotebook}
                  disabled={isSaved}
                  className={`px-5 py-2 border rounded-md uppercase tracking-wider text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSaved
                      ? "bg-[#8C7355]/10 text-[#8C7355] border-[#8C7355]/30 cursor-default"
                      : "bg-[#1A1A1A] hover:bg-[#8C7355] text-white border-stone-800 cursor-pointer"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      성지 묵상 수첩 보존됨
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      묵상 수첩에 보존
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        ) : (
          /* Welcome screen — candlelight hero illustration */
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-8">
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.4em] text-[#8C7355] font-sans font-bold">
                Lumen in Tenebris
              </div>
              <h2 className="text-3xl md:text-4xl font-serif italic text-stone-800">
                Verbum Vitae를 가동하십시오
              </h2>
            </div>
          </div>
        )}

      </main>

      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

    </div>
  );
}
