import { useState, useEffect } from 'react';
import { api } from '../db/supabase';
import type { User } from '../types';

// 模拟用户ID，实际应用中可以从localStorage获取或生成
const MOCK_USER_ID = 'user-123';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [todayStudyTime, setTodayStudyTime] = useState<number>(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        let userData = await api.getUserById(MOCK_USER_ID);
        
        if (!userData) {
          // 创建默认用户
          userData = await api.createUser({
            id: MOCK_USER_ID,
            phone: '',
            nickname: '英语学习者',
            avatar_url: '',
            stars: 5,
            level: 1,
            total_study_time: 0,
            consecutive_days: 1,
            last_study_date: new Date().toISOString().split('T')[0]
          });
        } else {
          // 检查是否需要重置每日星星和更新连续学习天数
          const today = new Date().toDateString();
          const lastStudyDate = userData.last_study_date ? new Date(userData.last_study_date).toDateString() : null;
          
          if (lastStudyDate !== today) {
            // 计算连续学习天数
            let newConsecutiveDays = userData.consecutive_days || 1;
            if (lastStudyDate) {
              const lastDate = new Date(userData.last_study_date!);
              const todayDate = new Date();
              const diffTime = todayDate.getTime() - lastDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                // 连续学习
                newConsecutiveDays += 1;
              } else if (diffDays > 1) {
                // 中断了，重新开始
                newConsecutiveDays = 1;
              }
            }
            
            // 新的一天，重置星星为5个，更新连续学习天数
            await api.updateUser(userData.id, { 
              stars: 5,
              consecutive_days: newConsecutiveDays,
              last_study_date: new Date().toISOString().split('T')[0]
            });
            userData.stars = 5;
            userData.consecutive_days = newConsecutiveDays;
            userData.last_study_date = new Date().toISOString().split('T')[0];
          }
        }
        
        setUser(userData);
        setSessionStartTime(Date.now());
        setTodayStudyTime(0); // 重置今日学习时间
      } catch (error) {
        console.error('加载用户数据失败:', error);
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // 实时更新今日学习时间
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStartTime) {
        const currentTime = Math.floor((Date.now() - sessionStartTime) / 1000 / 60); // 转换为分钟
        setTodayStudyTime(currentTime);
      }
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // 页面卸载时记录学习时间
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user && sessionStartTime) {
        const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000 / 60); // 转换为分钟
        if (sessionTime > 0) {
          await api.updateUser(user.id, {
            total_study_time: user.total_study_time + sessionTime
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // 组件卸载时也记录时间
      handleBeforeUnload();
    };
  }, [user, sessionStartTime]);

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      const success = await api.updateUser(user.id, updates);
      if (success) {
        setUser({ ...user, ...updates });
      }
      return success;
    }
    return false;
  };

  const getTodayStudyTime = () => {
    return todayStudyTime;
  };

  return {
    user,
    loading,
    updateUser,
    getTodayStudyTime
  };
};