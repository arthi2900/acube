import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Star, Trophy, Flag, Key, Lock, Zap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../hooks/useProgress';
import { stages } from '../../data/quizData';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStageProgress, getLevelProgress, getNextUncompletedLevel, isStageCompleted } = useProgress();

  const getStageStatus = (stageId: string) => {
    const stageProgress = getStageProgress(stageId);
    const totalLevels = stages.find(s => s.id === stageId)?.levels.length || 0;
    const completedLevels = stageProgress.filter(p => p.completed).length;
    return { completed: completedLevels, total: totalLevels, isCompleted: completedLevels === totalLevels };
  };

  const isStageUnlocked = (stageIndex: number) => {
    if (stageIndex === 0) return true;
    const prevStage = stages[stageIndex - 1];
    return isStageCompleted(prevStage.id);
  };

  const nextLevel = getNextUncompletedLevel();
  const canStartChallenge = user && user.stars > 0;

  const getLevelIcon = (levelIndex: number) => {
    const icons = [Flag, Trophy, Key];
    const IconComponent = icons[levelIndex % icons.length];
    return IconComponent;
  };

  const getStageGradient = (stageId: string) => {
    switch (stageId) {
      case 'beginner':
        return 'from-[#f2e6ff] to-[#ead6ff]';
      case 'intermediate':
        return 'from-[#dae9fe] to-[#c2dcfe]';
      case 'advanced':
        return 'from-[#cff5d1] to-[#9fe2b9]';
      default:
        return 'from-purple-100 to-purple-200';
    }
  };

  const getStageEmoji = (stageId: string) => {
    switch (stageId) {
      case 'beginner':
        return '🌱';
      case 'intermediate':
        return '⚔️';
      case 'advanced':
        return '👑';
      default:
        return '📚';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部信息块 - 调整高度和布局 */}
      <div className="bg-primary px-4 pt-8 pb-8 mb-4 rounded-b-3xl relative">
        {/* 用户信息 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-2xl">🦉</span>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">你好，小猫头鹰</h1>
              <p className="text-white/80 text-sm">继续你的英语学习之旅</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-white/20 rounded-full px-3 py-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            <span className="text-white font-bold text-lg">{user?.stars || 0}</span>
          </div>
        </div>
      </div>

      {/* 星星不足提醒 - 移到卡片外 */}
      {!canStartChallenge && (
        <div className="px-4 mb-4">
          <div className="flex items-center space-x-2 bg-red-50 rounded-lg p-3 border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600 text-sm">星星不足，无法开始挑战</p>
          </div>
        </div>
      )}

      {/* 每日任务卡片 - 调整位置和样式 */}
      <div className="px-4 mb-8">
        <Card className="bg-gradient-to-r from-[#dbe9fe] to-[#f2e8ff] border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">每日任务</h2>
                <p className="text-gray-600 mb-4">完成今日的学习挑战</p>
                <Button 
                  variant="primary"
                  onClick={() => navigate(`/quiz/${nextLevel.stageId}/${nextLevel.levelId}`)}
                  disabled={!canStartChallenge}
                  className="px-6 bg-primary text-white hover:bg-primary/90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  开始挑战
                </Button>
              </div>
              <div className="text-6xl opacity-20">
                🎯
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 学习阶段 */}
      <div className="px-4 pb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">学习阶段</h3>
        
        <div className="space-y-6">
          {stages.map((stage, stageIndex) => {
            const stageStatus = getStageStatus(stage.id);
            const isUnlocked = isStageUnlocked(stageIndex);
            const isCurrentStage = nextLevel.stageId === stage.id;

            return (
              <Card 
                key={stage.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  !isUnlocked ? 'opacity-50' : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getStageGradient(stage.id)}`} />
                
                {/* 锁定覆盖层 */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                    <div className="bg-white/90 rounded-full p-3">
                      <Lock className="w-8 h-8 text-gray-600" />
                    </div>
                  </div>
                )}

                {/* 阶段完成星星 */}
                {stageStatus.isCompleted && (
                  <div className="absolute top-4 right-4 flex space-x-1 z-20">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current animate-pulse" />
                    ))}
                  </div>
                )}

                {/* 背景插画 */}
                <div className="absolute top-4 right-4 text-6xl opacity-30">
                  {getStageEmoji(stage.id)}
                </div>

                <CardContent className="relative p-6 z-10">
                  <div className="mb-4">
                    <h4 className="text-xl font-bold text-gray-800 mb-1">
                      {stage.name}
                    </h4>
                    <p className="text-gray-600 font-medium">{stage.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {stageStatus.completed}/{stageStatus.total} 关卡完成
                    </p>
                  </div>

                  {/* 关卡按钮 */}
                  {(isUnlocked || isCurrentStage) && (
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {stage.levels.map((level, levelIndex) => {
                        const levelProgress = getLevelProgress(stage.id, level.id);
                        const isLevelCompleted = levelProgress?.completed || false;
                        const isLevelUnlocked = levelIndex === 0 || 
                          getLevelProgress(stage.id, stage.levels[levelIndex - 1].id)?.completed;
                        const IconComponent = getLevelIcon(levelIndex);

                        return (
                          <Button
                            key={level.id}
                            variant={isLevelCompleted ? "primary" : isLevelUnlocked ? "outline" : "ghost"}
                            className={`flex-shrink-0 flex flex-col items-center p-4 h-auto min-w-[80px] ${
                              !isLevelUnlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                            onClick={() => {
                              if (isLevelUnlocked && canStartChallenge) {
                                navigate(`/quiz/${stage.id}/${level.id}`);
                              }
                            }}
                            disabled={!isLevelUnlocked || !canStartChallenge}
                          >
                            <div className="relative mb-2">
                              <IconComponent className="w-6 h-6" />
                              {!isLevelUnlocked && (
                                <Lock className="w-3 h-3 absolute -top-1 -right-1 text-gray-400" />
                              )}
                              {isLevelCompleted && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-medium">Level {level.id}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;