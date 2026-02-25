import { useState, useEffect } from 'react';
import { stages } from '../data/quizData';
import { api } from '../db/supabase';
import { useAuth } from './useAuth';
import type { Question, UserProgress } from '../types';

export const useQuiz = (stageId: string, levelId: number) => {
  const { user, updateUser } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [isStageComplete, setIsStageComplete] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [hasAnsweredCurrentQuestion, setHasAnsweredCurrentQuestion] = useState(false);

  const stage = stages.find(s => s.id === stageId);
  const level = stage?.levels.find(l => l.id === levelId);
  const questions = level?.questions || [];
  
  const currentQuestion = currentQuestions[currentQuestionIndex];

  // 生成不重复的题目
  const generateUniqueQuestions = () => {
    const availableQuestions = questions.filter(q => !usedQuestionIds.has(q.id));
    
    // 如果可用题目不足6道，重置已使用题目集合
    if (availableQuestions.length < 6) {
      setUsedQuestionIds(new Set());
      return questions.slice(0, 6);
    }
    
    // 随机选择6道题目
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 6);
    
    // 更新已使用题目集合
    setUsedQuestionIds(prev => {
      const newSet = new Set(prev);
      selectedQuestions.forEach(q => newSet.add(q.id));
      return newSet;
    });
    
    return selectedQuestions;
  };

  useEffect(() => {
    // 重置状态并生成新题目
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResult(false);
    setScore(0);
    setCorrectAnswers(0);
    setConsecutiveCorrect(0);
    setIsStageComplete(false);
    setShowLevelComplete(false);
    setShowCelebration(false);
    setShowFailure(false);
    setWrongAnswersCount(0);
    setHasAnsweredCurrentQuestion(false);
    
    // 生成6道不重复题目
    const newQuestions = generateUniqueQuestions();
    setCurrentQuestions(newQuestions);
  }, [stageId, levelId]);

  const submitAnswer = async (answer: string) => {
    if (hasAnsweredCurrentQuestion) return;
    
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);
    setHasAnsweredCurrentQuestion(true);

    const isCorrect = answer === currentQuestion.correct_answer;
    let newCorrectAnswers = correctAnswers;
    let newConsecutiveCorrect = consecutiveCorrect;
    let newWrongAnswers = wrongAnswersCount;

    if (isCorrect) {
      newCorrectAnswers += 1;
      newConsecutiveCorrect += 1;
      setCorrectAnswers(newCorrectAnswers);
      setConsecutiveCorrect(newConsecutiveCorrect);
    } else {
      newConsecutiveCorrect = 0;
      newWrongAnswers += 1;
      setConsecutiveCorrect(0);
      setWrongAnswersCount(newWrongAnswers);
      
      if (user) {
        // 添加到错题本
        await api.addErrorQuestion({
          user_id: user.id,
          question_id: currentQuestion.id,
          question_type: currentQuestion.type,
          question_content: currentQuestion.content,
          correct_answer: currentQuestion.correct_answer,
          user_answer: answer,
          is_practiced: false
        });

        // 立即消耗星星并更新UI
        const newStars = Math.max(0, user.stars - 1);
        await updateUser({ stars: newStars });
      }
    }

    // 检查是否连续答对5题（显示庆祝动画）
    if (newConsecutiveCorrect === 5) {
      setShowCelebration(true);
      // 2秒后自动关闭庆祝动画并继续下一题
      setTimeout(() => {
        setShowCelebration(false);
        if (currentQuestionIndex < currentQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setHasAnsweredCurrentQuestion(false);
        } else {
          // 如果是最后一题，处理关卡完成
          handleLevelComplete(newCorrectAnswers, newWrongAnswers);
        }
      }, 2000);
      return;
    }

    if (currentQuestionIndex < currentQuestions.length - 1) {
      // 继续下一题
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setHasAnsweredCurrentQuestion(false);
      }, 500);
    } else {
      // 完成所有题目
      handleLevelComplete(newCorrectAnswers, newWrongAnswers);
    }
  };

  const handleLevelComplete = async (finalCorrectAnswers: number, finalWrongAnswers: number) => {
    const finalScore = Math.round((finalCorrectAnswers / currentQuestions.length) * 100);
    setScore(finalScore);
    
    // 检查是否全部答对（通关成功）
    if (finalWrongAnswers === 0) {
      // 通关成功
      setShowLevelComplete(true);
      
      if (user) {
        // 更新进度
        await api.updateProgress({
          user_id: user.id,
          stage: stageId,
          level: levelId,
          completed: true,
          stars_earned: 3,
          completed_at: new Date().toISOString()
        });

        // 检查是否完成整个阶段 - 修复逻辑
        const stageProgress = await api.getUserProgress(user.id);
        const currentStageProgress = stageProgress.filter(p => p.stage === stageId && p.completed);
        const totalLevelsInStage = stage?.levels.length || 0;
        
        // 只有当前关卡完成后，总完成关卡数等于阶段总关卡数时，才算阶段完成
        if (currentStageProgress.length === totalLevelsInStage) {
          setIsStageComplete(true);
          // 阶段完成奖励5颗星星
          await updateUser({ 
            stars: user.stars + 5,
            total_study_time: user.total_study_time + 10
          });
          
          // 添加阶段徽章
          const badgeTypes = {
            'beginner': 'beginner_complete',
            'intermediate': 'intermediate_complete', 
            'advanced': 'advanced_complete'
          };
          
          await api.addBadge({
            user_id: user.id,
            badge_type: badgeTypes[stageId as keyof typeof badgeTypes] || 'stage_complete'
          });
        } else {
          // 普通关卡完成奖励3颗星星
          await updateUser({ 
            stars: user.stars + 3,
            total_study_time: user.total_study_time + 10
          });
        }

        // 检查连击徽章
        if (consecutiveCorrect >= 5) {
          const userBadges = await api.getUserBadges(user.id);
          const hasComboMaster = userBadges.some(b => b.badge_type === 'combo_master');
          if (!hasComboMaster) {
            await api.addBadge({
              user_id: user.id,
              badge_type: 'combo_master'
            });
          }
        }
      }
    } else {
      // 通关失败
      setShowFailure(true);
    }
  };

  const retryLevel = () => {
    // 重新开始当前关卡，生成新题目
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setShowResult(false);
    setScore(0);
    setCorrectAnswers(0);
    setConsecutiveCorrect(0);
    setShowFailure(false);
    setWrongAnswersCount(0);
    setHasAnsweredCurrentQuestion(false);
    
    // 生成新的6道题目
    const newQuestions = generateUniqueQuestions();
    setCurrentQuestions(newQuestions);
  };

  const getNextLevel = () => {
    const currentStage = stages.find(s => s.id === stageId);
    if (!currentStage) return null;

    const currentLevelIndex = currentStage.levels.findIndex(l => l.id === levelId);
    
    // 如果还有下一关
    if (currentLevelIndex < currentStage.levels.length - 1) {
      return {
        stageId,
        levelId: currentStage.levels[currentLevelIndex + 1].id
      };
    }
    
    // 如果当前阶段已完成，返回下一阶段的第一关
    const currentStageIndex = stages.findIndex(s => s.id === stageId);
    if (currentStageIndex < stages.length - 1) {
      const nextStage = stages[currentStageIndex + 1];
      return {
        stageId: nextStage.id,
        levelId: nextStage.levels[0].id
      };
    }
    
    return null;
  };

  return {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions: currentQuestions.length,
    showResult,
    showLevelComplete,
    showCelebration,
    showFailure,
    wrongAnswersCount,
    score,
    correctAnswers,
    consecutiveCorrect,
    isStageComplete,
    submitAnswer,
    retryLevel,
    getNextLevel,
    progress: ((currentQuestionIndex + 1) / currentQuestions.length) * 100,
    hasAnsweredCurrentQuestion
  };
};