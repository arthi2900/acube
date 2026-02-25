import { createClient } from '@supabase/supabase-js';
import type { User, UserProgress, UserBadge, ErrorQuestion } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const customFetch = async (
  input: string | Request | URL,
  init?: RequestInit
): Promise<Response> => {
  const urlParts = new URL(String(input));
  let url = urlParts.pathname + urlParts.search;
  if (!/((bce|console).*.baidu.*\.com)$|(\.)?miaoda\.(cn|ai)$/.test(document.location.hostname)) {
    url = url.replace(/(\/miaoda([-_\w]+)?)(\/backend)/, '$1/runtime$3');
  }
  return fetch(url, init);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: (import.meta.env.VITE_APP_ID || "sb") + "-auth-token"
  },

  global: {
    fetch: import.meta.env.VITE_SUPABASE_PROXY !== "false" ? customFetch : undefined
  }
});

export const api = {
  // 暴露 supabase 实例供其他地方使用
  supabase,

  // 用户相关
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
    return data;
  },

  async createUser(userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userData.id,
        phone: userData.phone || '',
        nickname: userData.nickname || '',
        avatar_url: userData.avatar_url || '',
        stars: userData.stars || 5,
        level: userData.level || 1,
        total_study_time: userData.total_study_time || 0,
        consecutive_days: userData.consecutive_days || 0,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('创建用户失败:', error);
      return null;
    }
    return data;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('更新用户信息失败:', error);
      return false;
    }
    return true;
  },

  // 进度相关
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('获取用户进度失败:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async updateProgress(progressData: Partial<UserProgress>): Promise<boolean> {
    const { error } = await supabase
      .from('user_progress')
      .upsert([progressData]);
    
    if (error) {
      console.error('更新进度失败:', error);
      return false;
    }
    return true;
  },

  // 徽章相关
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('获取用户徽章失败:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async addBadge(badgeData: Partial<UserBadge>): Promise<boolean> {
    const { error } = await supabase
      .from('user_badges')
      .insert([badgeData]);
    
    if (error) {
      console.error('添加徽章失败:', error);
      return false;
    }
    return true;
  },

  // 错题相关
  async getErrorQuestions(userId: string): Promise<ErrorQuestion[]> {
    const { data, error } = await supabase
      .from('error_questions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取错题失败:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async addErrorQuestion(errorData: Partial<ErrorQuestion>): Promise<boolean> {
    const { error } = await supabase
      .from('error_questions')
      .insert([errorData]);
    
    if (error) {
      console.error('添加错题失败:', error);
      return false;
    }
    return true;
  },

  async updateErrorQuestion(id: string, updates: Partial<ErrorQuestion>): Promise<boolean> {
    const { error } = await supabase
      .from('error_questions')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('更新错题失败:', error);
      return false;
    }
    return true;
  },
};