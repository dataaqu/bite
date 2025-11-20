
export interface MacroNutrients {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface FoodItem {
  name: string;
  portion: string;
  macros: MacroNutrients;
}

export interface AnalysisResult {
  foodItems: FoodItem[];
  totalMacros: MacroNutrients;
  isFood: boolean;
  confidenceScore: number;
  summary: string;
}

export interface FoodLogEntry {
  id: string;
  timestamp: number;
  imageUrl?: string;
  analysis: AnalysisResult | null;
  loading: boolean;
  error?: string;
  userProvidedWeight?: number | null;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  DETAILS = 'DETAILS'
}
