export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar_url: string;
  stars: number;
  level: number;
  total_study_time: number;
  consecutive_days: number;
  last_study_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  stage: string;
  level: number;
  completed: boolean;
  stars_earned: number;
  completed_at: string | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
}

export interface ErrorQuestion {
  id: string;
  user_id: string;
  question_id: string;
  question_type: string;
  question_content: string;
  correct_answer: string;
  user_answer: string;
  is_practiced: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  type: 'fill_blank' | 'translate' | 'listen_choose' | 'rearrange' | 'continue_writing' | 'listen_sentence';
  content: string;
  options?: string[];
  word_blocks?: string[];
  correct_answer: string;
  audio_url?: string;
  audio_text?: string;
  explanation?: string;
}

export interface Stage {
  id: string;
  name: string;
  title: string;
  levels: Level[];
}

export interface Level {
  id: number;
  name: string;
  questions: Question[];
  completed: boolean;
  stars: number;
}

export interface DailyQuote {
  id: string;
  english: string;
  chinese: string;
  author: string;
}

export interface Badge {
  type: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
}