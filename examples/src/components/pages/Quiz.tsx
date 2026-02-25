import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ArrowLeft, Volume2, Star, Trophy, Home, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useQuiz } from '../../hooks/useQuiz';
import { useAuth } from '../../hooks/useAuth';
import { audioManager } from '../../utils/audioUtils';
import { stages } from '../../data/quizData';
import CelebrationAnimation from '../animations/CelebrationAnimation';
import StageCelebrationAnimation from '../animations/StageCelebrationAnimation';

const Quiz: React.FC = () => {
  const { stage, level } = useParams<{ stage: string; level: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [stageCompleteInfo, setStageCompleteInfo] = useState<{stageName: string, badgeName: string} | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [buttonText, setButtonText] = useState('提交答案');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [currentStars, setCurrentStars] = useState(user?.stars || 0);

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    showResult,
    showLevelComplete,
    showCelebration,
    showFailure,
    wrongAnswersCount,
    score,
    correctAnswers,
    consecutiveCorrect,
    submitAnswer,
    retryLevel,
    getNextLevel,
    progress,
    isStageComplete,
    hasAnsweredCurrentQuestion
  } = useQuiz(stage!, parseInt(level!));

  // 获取当前阶段和关卡信息
  const currentStage = stages.find(s => s.id === stage);
  const currentLevel = currentStage?.levels.find(l => l.id === parseInt(level!));

  // 初始化当前星星数
  useEffect(() => {
    setCurrentStars(user?.stars || 0);
  }, [user?.stars]);

  // 显示应用内提示
  const showAppToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    setSelectedAnswer('');
    setSelectedBlocks([]);
    setShowFeedback(false);
    setButtonText('提交答案');
  }, [currentQuestionIndex, currentQuestion]);

  useEffect(() => {
    // 检查阶段完成 - 修复逻辑：只有在关卡完成且阶段完成时才显示阶段庆祝
    if (showLevelComplete && isStageComplete) {
      const stageNames = {
        'beginner': '新手村',
        'intermediate': '勇者试炼', 
        'advanced': '流利殿堂'
      };
      const badgeNames = {
        'beginner': '新手村征服者',
        'intermediate': '勇者试炼胜利者',
        'advanced': '流利殿堂大师'
      };
      
      setStageCompleteInfo({
        stageName: stageNames[stage as keyof typeof stageNames] || stage!,
        badgeName: badgeNames[stage as keyof typeof badgeNames] || '学习达人'
      });
    }
  }, [showLevelComplete, isStageComplete, stage]);

  const handleSubmit = async () => {
    if (showFeedback) {
      // 如果已经显示反馈，点击按钮进入下一题或完成测试
      if (currentQuestionIndex === totalQuestions - 1) {
        // 最后一题，提交答案
        let answer = selectedAnswer;
        if (currentQuestion?.type === 'translate' || currentQuestion?.type === 'rearrange') {
          answer = selectedBlocks.join(' ');
        }
        await submitAnswer(answer);
      } else {
        // 不是最后一题，继续下一题
        setShowFeedback(false);
        setButtonText('提交答案');
        // 这里会触发useEffect重置状态
      }
      return;
    }

    let answer = selectedAnswer;
    
    // 对于翻译题和重组题，使用选中的词块组成答案
    if (currentQuestion?.type === 'translate' || currentQuestion?.type === 'rearrange') {
      answer = selectedBlocks.join(' ');
    }
    
    if (!answer.trim()) return;

    // 检查答案是否正确
    const correct = answer === currentQuestion?.correct_answer;
    setIsCorrect(correct);
    setCurrentExplanation(currentQuestion?.explanation || '');
    setShowFeedback(true);
    
    // 如果答错了，立即扣除星星并更新显示
    if (!correct) {
      const newStars = Math.max(0, currentStars - 1);
      setCurrentStars(newStars);
    }
    
    if (currentQuestionIndex === totalQuestions - 1) {
      setButtonText('完成测试');
    } else {
      setButtonText('下一题');
    }

    // 如果是最后一题，直接提交
    if (currentQuestionIndex === totalQuestions - 1) {
      await submitAnswer(answer);
    }
  };

  const handleNextQuestion = async () => {
    let answer = selectedAnswer;
    if (currentQuestion?.type === 'translate' || currentQuestion?.type === 'rearrange') {
      answer = selectedBlocks.join(' ');
    }
    await submitAnswer(answer);
  };

  const handlePlayAudio = async () => {
    if (!currentQuestion) return;

    try {
      setIsPlayingAudio(true);
      const textToPlay = (currentQuestion as any).audio_text || currentQuestion.correct_answer;
      await audioManager.playText(textToPlay);
    } catch (error) {
      console.error('播放音频失败:', error);
      showAppToast('播放音频失败，请稍后重试', 'error');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleBlockClick = (block: string) => {
    if (showFeedback) return; // 显示反馈时不允许点击
    
    if (selectedBlocks.includes(block)) {
      setSelectedBlocks(prev => prev.filter(b => b !== block));
    } else {
      setSelectedBlocks(prev => [...prev, block]);
    }
  };

  const handleNextLevel = () => {
    const nextLevel = getNextLevel();
    if (nextLevel) {
      // 通关成功时，添加奖励星星到当前显示
      if (isStageComplete) {
        setCurrentStars(prev => prev + 5); // 阶段完成奖励5颗星星
      } else {
        setCurrentStars(prev => prev + 3); // 普通关卡完成奖励3颗星星
      }
      navigate(`/quiz/${nextLevel.stageId}/${nextLevel.levelId}`);
    } else {
      navigate('/');
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'fill_blank': {
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              选择正确的单词填空：
            </h3>
            <p className="text-xl text-center bg-gray-50 p-4 rounded-xl">
              {currentQuestion.content}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === option ? 'primary' : 'outline'}
                  onClick={() => !showFeedback && setSelectedAnswer(option)}
                  className="p-4 text-lg"
                  disabled={showFeedback}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );
      }

      case 'translate': {
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              从词块中选择正确的翻译：
            </h3>
            <p className="text-xl text-center bg-gray-50 p-4 rounded-xl font-bold">
              {currentQuestion.content}
            </p>
            
            {/* 选中的词块显示区域 */}
            <div className="min-h-[60px] p-4 border-2 border-dashed border-gray-300 rounded-xl bg-blue-50">
              <p className="text-sm text-gray-600 mb-2">你的翻译：</p>
              <div className="flex flex-wrap gap-2">
                {selectedBlocks.map((block, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                      showFeedback 
                        ? 'bg-blue-300 text-white cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    onClick={() => !showFeedback && handleBlockClick(block)}
                  >
                    {block}
                  </span>
                ))}
              </div>
            </div>

            {/* 可选词块 */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">可选词块：</p>
              <div className="flex flex-wrap gap-2">
                {(currentQuestion as any).word_blocks?.map((block: string, index: number) => (
                  <span
                    key={index}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedBlocks.includes(block)
                        ? 'bg-gray-300 text-gray-500'
                        : showFeedback
                        ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => !showFeedback && !selectedBlocks.includes(block) && handleBlockClick(block)}
                  >
                    {block}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'listen_choose': {
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              听音选择正确的单词：
            </h3>
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className="mb-6"
              >
                <Volume2 className={`w-6 h-6 mr-2 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                {isPlayingAudio ? '播放中...' : '点击播放'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options?.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === option ? 'primary' : 'outline'}
                  onClick={() => !showFeedback && setSelectedAnswer(option)}
                  className="p-4 text-lg"
                  disabled={showFeedback}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );
      }

      default: {
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {currentQuestion.content}
            </h3>
            <textarea
              value={selectedAnswer}
              onChange={(e) => !showFeedback && setSelectedAnswer(e.target.value)}
              placeholder="请输入答案..."
              className="w-full p-4 border border-gray-300 rounded-xl resize-none h-24 text-lg"
              disabled={showFeedback}
            />
          </div>
        );
      }
    }
  };

  // 应用内Toast组件
  const AppToast = () => {
    if (!showToast) return null;

    return (
      <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
        <div className={`p-4 rounded-xl shadow-lg ${
          toastType === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <p className="text-center font-medium">{toastMessage}</p>
        </div>
      </div>
    );
  };

  // 通关失败页面
  if (showFailure) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-shadow">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              通关失败
            </h2>
            
            <p className="text-gray-600 mb-6">
              答错{wrongAnswersCount}道题，需要全部答对才能通关
            </p>
            
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={retryLevel}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重新挑战
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 阶段庆祝页面 - 修复条件：只有在关卡完成且阶段完成时才显示
  if (showLevelComplete && isStageComplete && stageCompleteInfo) {
    return (
      <StageCelebrationAnimation 
        stageName={stageCompleteInfo.stageName}
        badgeName={stageCompleteInfo.badgeName}
        onComplete={() => navigate('/')}
      />
    );
  }

  // 关卡完成页面（通关成功但阶段未完成）
  if (showLevelComplete && !isStageComplete) {
    const nextLevel = getNextLevel();
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md card-shadow">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🎉 通关成功！🎉
            </h2>
            
            <p className="text-gray-600 mb-2">
              全部答对，完美通关！
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              获得 3 颗星星奖励
            </p>
            
            <div className="space-y-3">
              {nextLevel && (
                <Button
                  variant="primary"
                  onClick={handleNextLevel}
                  className="w-full"
                >
                  进入下一关
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasValidAnswer = () => {
    if (currentQuestion?.type === 'translate' || currentQuestion?.type === 'rearrange') {
      return selectedBlocks.length > 0;
    }
    return selectedAnswer.trim().length > 0;
  };

  return (
    <div className="min-h-screen gradient-bg">
      {showCelebration && <CelebrationAnimation />}
      <AppToast />
      
      {/* 顶部导航 */}
      <div className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="text-white text-center">
          <p className="text-sm opacity-90 font-medium">
            {currentStage?.name} - 第{currentLevel?.id}关
          </p>
          <div className="flex items-center justify-center space-x-1 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm opacity-90">剩余 {currentStars} 颗星星</span>
          </div>
        </div>
        
        <div className="w-10" />
      </div>

      {/* 进度条 */}
      <div className="px-4 mb-6">
        <Progress value={progress} className="h-3" />
      </div>

      {/* 题目内容 */}
      <div className="px-4 pb-8">
        <Card className="card-shadow">
          <CardContent className="p-6">
            {renderQuestionContent()}
            
            {/* 答题反馈 */}
            {showFeedback && (
              <div className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? '回答正确！' : '回答错误'}
                  </p>
                </div>
                
                {!isCorrect && (
                  <div className="space-y-2">
                    <p className="text-red-700">
                      <strong>正确答案：</strong>{currentQuestion?.correct_answer}
                    </p>
                    <p className="text-red-600 text-sm">
                      消耗1颗星星，还有 {currentStars} 次错题机会
                    </p>
                  </div>
                )}
                
                {currentExplanation && (
                  <p className={`text-sm mt-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    <strong>解析：</strong>{currentExplanation}
                  </p>
                )}
              </div>
            )}
            
            <Button
              variant="primary"
              onClick={showFeedback ? handleNextQuestion : handleSubmit}
              disabled={!showFeedback && !hasValidAnswer()}
              className="w-full mt-6"
              size="lg"
            >
              {buttonText}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quiz;