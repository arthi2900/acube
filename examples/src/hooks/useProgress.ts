import { useState, useEffect } from 'react';
import { api } from '../db/supabase';
import { useAuth } from './useAuth';
import { stages } from '../data/quizData';
import type { UserProgress, UserBadge } from '../types';

export const useProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      if (user) {
        try {
          const [userProgress, userBadges] = await Promise.all([
            api.getUserProgress(user.id),
            api.getUserBadges(user.id)
          ]);
          setProgress(userProgress);
          setBadges(userBadges);
        } catch (error) {
          console.error('加载进度数据失败:', error);
        }
      }
      setLoading(false);
    };

    loadProgress();
  }, [user]);

  const getStageProgress = (stageId: string) => {
    return progress.filter(p => p.stage === stageId);
  };

  const getLevelProgress = (stageId: string, levelId: number) => {
    return progress.find(p => p.stage === stageId && p.level === levelId);
  };

  const hasBadge = (badgeType: string) => {
    return badges.some(b => b.badge_type === badgeType);
  };

  const isStageCompleted = (stageId: string) => {
    const stageProgress = getStageProgress(stageId);
    const stage = stages.find(s => s.id === stageId);
    const totalLevels = stage?.levels.length || 0;
    const completedLevels = stageProgress.filter(p => p.completed).length;
    return completedLevels === totalLevels;
  };

  const getNextUncompletedLevel = () => {
    // 按顺序检查每个阶段和关卡
    const stageOrder = ['beginner', 'intermediate', 'advanced'];
    
    for (const stageId of stageOrder) {
      const stage = stages.find(s => s.id === stageId);
      if (!stage) continue;
      
      // 检查当前阶段是否已完成
      const isCurrentStageCompleted = isStageCompleted(stageId);
      
      if (!isCurrentStageCompleted) {
        // 如果当前阶段未完成，找到第一个未完成的关卡
        const stageProgress = getStageProgress(stageId);
        
        for (const level of stage.levels) {
          const levelProgress = getLevelProgress(stageId, level.id);
          if (!levelProgress?.completed) {
            return { stageId, levelId: level.id };
          }
        }
      }
    }
    
    // 如果所有关卡都完成了，返回第一关
    return { stageId: 'beginner', levelId: 1 };
  };

  return {
    progress,
    badges,
    loading,
    getStageProgress,
    getLevelProgress,
    hasBadge,
    isStageCompleted,
    getNextUncompletedLevel
  };
};