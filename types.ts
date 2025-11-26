
export interface ReviewItem {
  title: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  tags?: string[];
  category: 'movie' | 'book' | 'music';
}

export interface HighlightReview {
  title: string;
  quote: string; // The specific short sentence
  commentary: string; // Why this is funny/profound
  category: 'movie' | 'book' | 'music';
}

export interface Recommendation {
  title: string;
  type: 'movie' | 'book' | 'music';
  reason: string;
}

export interface AnalysisLayer1 {
  topGenres: { name: string; value: number }[];
  visualPreferences: string[];
  narrativePreferences: string[];
  favoritesAnalysis: string;
  hatedAnalysis: string;
  bookMusicAnalysis?: string; // New: Analysis of books and music habits
  summary: string;
}

export interface AnalysisLayer2 {
  logicScore: number;
  emotionalScore: number;
  criticalThinkingLevel: string;
  vocabularyComplexity: string;
  writingStyleAnalysis: string; // Analysis of their writing style
  summary: string;
}

export interface AnalysisLayer3 {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  mbti: string;
  archetype: string;
  summary: string;
}

export interface AnalysisLayer4 {
  coreValues: string[];
  moralAlignment: string;
  ideologies: string[]; // e.g., "Feminism", "Nihilism"
  philosophicalLeaning: string;
  lifeViewSummary: string;
}

export interface FullProfile {
  layer1: AnalysisLayer1;
  layer2: AnalysisLayer2;
  layer3: AnalysisLayer3;
  layer4: AnalysisLayer4;
  highlightReviews: HighlightReview[];
  recommendations: Recommendation[]; // New field
  avatarPrompt: string; // The prompt used to generate the image
  avatarBase64?: string; // The generated image
  overallSummary: string;
}

export enum AppState {
  IDLE = 'IDLE',
  CRAWLING = 'CRAWLING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
