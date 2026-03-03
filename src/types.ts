export interface WordExample {
  chinese: string;
  english: string;
}

export type WordCategory =
  | 'classical_idiom'
  | 'modern_tech'
  | 'business'
  | 'literature'
  | 'internet_culture';

export interface WordEntry {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  meaning_zh?: string;
  category: WordCategory;
  examples: WordExample[];
  backstory: string;
  backstory_zh?: string;
}

export interface WordsData {
  generated_at: string;
  entries: WordEntry[];
}
