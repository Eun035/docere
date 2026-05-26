export interface AnalysisResult {
  purifiedText: string;
  biblicalReference: string;
  translationLiteral: string;
  translationContextual: string;
  linguisticInsight: string;
  meditation: string;
  rawMarkdown: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  inputText?: string;
  imageUrl?: string;
  locationName?: string;
  result: AnalysisResult;
}

export interface PresetInscription {
  id: string;
  title: string;
  originalText: string;
  location: string;
  city: string;
  imageAlt: string;
  imageUrl: string;
  description: string;
}
