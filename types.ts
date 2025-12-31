
export enum ConfidenceLevel {
  UNLIKELY = 'Unlikely',
  MAYBE = 'Maybe',
  VERY_LIKELY = 'Very likely'
}

export enum OptimismLevel {
  VERY_PESSIMISTIC = 1,
  SLIGHTLY_PESSIMISTIC = 2,
  NEUTRAL = 3,
  OPTIMISTIC = 4,
  VERY_OPTIMISTIC = 5
}

export interface Intention {
  id: string;
  text: string;
  confidence?: ConfidenceLevel;
  certainty?: number; // 0-100
  optimism?: OptimismLevel;
}

export interface DayLog {
  date: string; // ISO String
  morning: {
    intentions: Intention[];
    successFactor: string;
    optimism: OptimismLevel; // Global optimism
    completed: boolean;
  };
  evening: {
    actuals: string[];
    unexpected: string;
    deepReflection: string;
    completed: boolean;
  };
  aiInsight?: string;
}

export interface AppState {
  logs: Record<string, DayLog>; // key: YYYY-MM-DD
  settings: {
    notificationsEnabled: boolean;
    enableInsights: boolean;
  };
}
