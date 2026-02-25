import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle, BookOpen, Volume2, X, ArrowLeft, XCircle } from 'lucide-react';
import { api } from '../../db/supabase';
import { useAuth } from '../../hooks/useAuth';
import { audioManager } from '../../utils/audioUtils';
import { stages } from '../../data/quizData';
import type { ErrorQuestion } from '../../types';

const ErrorBook: React.FC = () => {
  const { user } = useAuth();
  const [errorQuestions, setErrorQuestions] = useState<ErrorQuestion[]>([]);
  const [filter, setFilter] = useState<'all' | 'unpracticed'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<ErrorQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    loadErrorQuestions();
  }, [user]);

  // 显示应用内提示
  const showAppToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const loadErrorQuestions = async () => {
    if (user) {
      try {
        const questions = await api.getErrorQuestions(user.id);
        setErrorQuestions(questions);
      } catch (error) {
        console.error('加载错题失败:', error);
        showAppToast('加载错题失败，请稍后重试', 'error');
      }
    }
    setLoading(false);
  };

  const handleQuestionClick = (question: ErrorQuestion) => {
    setSelectedQuestion(question);
    setSelectedAnswer('');
    setSelectedBlocks([]);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  // 获取填空题的选项
  const getFillBlankOptions = (question: ErrorQuestion) => {
    // 从题库中找到对应的题目获取选项
    for (const stage of stages) {
      for (const level of stage.levels) {
        for (const q of level.questions) {
          if (q.id === question.question_id && q.type === 'fill_blank') {
            return q.options || [];
          }
        }
      }
    }
    
    // 如果找不到原题，生成默认选项
    const correctAnswer = question.correct_answer;
    const userAnswer = question.user_answer;
    const defaultOptions = [correctAnswer];
    
    if (userAnswer && userAnswer !== correctAnswer) {
      defaultOptions.push(userAnswer);
    }
    
    // 添加一些常见的干扰项
    const commonWords = ['is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would', 'can', 'could', 'should', 'must'];
    const filteredCommonWords = commonWords.filter(word => 
      word !== correctAnswer && word !== userAnswer
    );
    
    while (defaultOptions.length < 4 && filteredCommonWords.length > 0) {
      const randomWord = filteredCommonWords.splice(Math.floor(Math.random() * filteredCommonWords.length), 1)[0];
      defaultOptions.push(randomWord);
    }
    
    // 如果还不够4个选项，添加更多干扰项
    const moreWords = ['the', 'a', 'an', 'to', 'of', 'in', 'for', 'with', 'on', 'at'];
    const filteredMoreWords = moreWords.filter(word => 
      !defaultOptions.includes(word)
    );
    
    while (defaultOptions.length < 4 && filteredMoreWords.length > 0) {
      const randomWord = filteredMoreWords.splice(Math.floor(Math.random() * filteredMoreWords.length), 1)[0];
      defaultOptions.push(randomWord);
    }
    
    // 打乱选项顺序
    return defaultOptions.sort(() => Math.random() - 0.5);
  };

  // 获取听音选词题的选项
  const getListenChooseOptions = (question: ErrorQuestion) => {
    // 从题库中找到对应的题目获取选项
    for (const stage of stages) {
      for (const level of stage.levels) {
        for (const q of level.questions) {
          if (q.id === question.question_id && q.type === 'listen_choose') {
            return q.options || [];
          }
        }
      }
    }
    
    // 如果找不到原题，生成听音选词的默认选项
    const correctAnswer = question.correct_answer;
    const userAnswer = question.user_answer;
    const defaultOptions = [correctAnswer];
    
    if (userAnswer && userAnswer !== correctAnswer) {
      defaultOptions.push(userAnswer);
    }
    
    // 为听音选词题生成相似发音的干扰项
    const generateSimilarWords = (word: string) => {
      const similarWords: Record<string, string[]> = {
        'cat': ['cut', 'cot', 'cap'],
        'sun': ['son', 'sin', 'sum'],
        'book': ['back', 'buck', 'bike'],
        'dog': ['dig', 'duck', 'door'],
        'pen': ['pan', 'pin', 'pun'],
        'red': ['read', 'rid', 'rod'],
        'hello': ['yellow', 'hollow', 'follow'],
        'good': ['food', 'wood', 'mood'],
        'morning': ['warning', 'turning', 'burning'],
        'thank': ['think', 'thick', 'thing'],
        'please': ['place', 'peace', 'piece'],
        'welcome': ['welcome', 'welcome', 'welcome'],
        'have': ['half', 'hand', 'head'],
        'like': ['lake', 'look', 'luck'],
        'home': ['hope', 'hole', 'hold'],
        'family': ['finally', 'friendly', 'fairly'],
        'school': ['skill', 'scale', 'score'],
        'friend': ['front', 'fresh', 'frame']
      };
      
      return similarWords[word.toLowerCase()] || [];
    };
    
    const similarWords = generateSimilarWords(correctAnswer);
    const filteredSimilarWords = similarWords.filter(word => 
      word !== correctAnswer && word !== userAnswer
    );
    
    // 添加相似发音的词汇
    while (defaultOptions.length < 4 && filteredSimilarWords.length > 0) {
      const randomWord = filteredSimilarWords.splice(Math.floor(Math.random() * filteredSimilarWords.length), 1)[0];
      defaultOptions.push(randomWord);
    }
    
    // 如果相似词汇不够，添加其他常见单词
    if (defaultOptions.length < 4) {
      const commonWords = ['cat', 'dog', 'book', 'pen', 'red', 'blue', 'big', 'small', 'good', 'bad'];
      const filteredCommonWords = commonWords.filter(word => 
        !defaultOptions.includes(word)
      );
      
      while (defaultOptions.length < 4 && filteredCommonWords.length > 0) {
        const randomWord = filteredCommonWords.splice(Math.floor(Math.random() * filteredCommonWords.length), 1)[0];
        defaultOptions.push(randomWord);
      }
    }
    
    // 打乱选项顺序
    return defaultOptions.sort(() => Math.random() - 0.5);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedQuestion) return;

    let answer = selectedAnswer;
    if (selectedQuestion.question_type === 'translate') {
      answer = selectedBlocks.join(' ');
    }

    if (!answer.trim()) return;

    const correct = answer === selectedQuestion.correct_answer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      // 答对了，标记为已练习
      try {
        await api.updateErrorQuestion(selectedQuestion.id, { is_practiced: true });
        setErrorQuestions(prev => 
          prev.map(q => q.id === selectedQuestion.id ? { ...q, is_practiced: true } : q)
        );
      } catch (error) {
        console.error('更新错题状态失败:', error);
        showAppToast('更新失败，请稍后重试', 'error');
      }
    }
  };

  const handlePlayAudio = async () => {
    if (!selectedQuestion) return;

    try {
      setIsPlayingAudio(true);
      const textToPlay = (selectedQuestion as any).audio_text || selectedQuestion.correct_answer;
      await audioManager.playText(textToPlay);
    } catch (error) {
      console.error('播放音频失败:', error);
      showAppToast('播放音频失败，请稍后重试', 'error');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleBlockClick = (block: string) => {
    if (showFeedback) return;
    
    if (selectedBlocks.includes(block)) {
      setSelectedBlocks(prev => prev.filter(b => b !== block));
    } else {
      setSelectedBlocks(prev => [...prev, block]);
    }
  };

  const handleCloseDialog = () => {
    setSelectedQuestion(null);
    setSelectedAnswer('');
    setSelectedBlocks([]);
    setShowFeedback(false);
    setIsCorrect(false);
  };

  const filteredQuestions = errorQuestions.filter(q => 
    filter === 'all' ? true : !q.is_practiced
  );

  const totalErrors = errorQuestions.length;
  const unpracticedErrors = errorQuestions.filter(q => !q.is_practiced).length;

  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'fill_blank': '填空题',
      'translate': '翻译题',
      'listen_choose': '听音选择',
      'rearrange': '句子重组',
      'continue_writing': '短文续写',
      'listen_sentence': '听音选句'
    };
    return typeMap[type] || type;
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

  const renderQuestionDialog = () => {
    if (!selectedQuestion) return null;

    const isListenType = selectedQuestion.question_type === 'listen_choose';
    const isTranslateType = selectedQuestion.question_type === 'translate';
    const isFillBlankType = selectedQuestion.question_type === 'fill_blank';
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">练习错题</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseDialog}
              className="text-gray-500"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-2 border-purple-200 text-purple-600">
                {getQuestionTypeLabel(selectedQuestion.question_type)}
              </Badge>
              
              {isListenType ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">听音选择正确的单词：</p>
                  <Button
                    variant="primary"
                    onClick={handlePlayAudio}
                    disabled={isPlayingAudio}
                    className="mb-4"
                  >
                    <Volume2 className={`w-5 h-5 mr-2 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    {isPlayingAudio ? '播放中...' : '点击播放'}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                  {selectedQuestion.question_content}
                </p>
              )}
            </div>

            {/* 翻译题的词块选择 */}
            {isTranslateType ? (
              <div className="space-y-4">
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

                {/* 可选词块 - 这里简化处理，使用正确答案的词汇作为选项 */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">可选词块：</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.correct_answer.split(' ').concat(['book', 'happy', 'water', 'run', 'fast', 'green']).map((block: string, index: number) => (
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
            ) : (isFillBlankType || isListenType) ? (
              /* 填空题和听音选择题的选项 */
              <div className="grid grid-cols-2 gap-3">
                {(isFillBlankType ? getFillBlankOptions(selectedQuestion) : getListenChooseOptions(selectedQuestion)).map((option, index) => (
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
            ) : (
              /* 其他题型的输入框 */
              <div>
                <p className="text-sm text-gray-600 mb-2">你的答案：</p>
                <input
                  type="text"
                  value={selectedAnswer}
                  onChange={(e) => !showFeedback && setSelectedAnswer(e.target.value)}
                  placeholder="请输入答案"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  disabled={showFeedback}
                />
              </div>
            )}

            {/* 答题反馈 */}
            {showFeedback && (
              <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
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
                
                <div className="space-y-2">
                  <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                    <strong>正确答案：</strong>{selectedQuestion.correct_answer}
                  </p>
                  {isCorrect && (
                    <p className="text-green-600 text-sm">
                      这道错题已标记为已练习！
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              {showFeedback ? (
                <Button
                  variant="primary"
                  onClick={handleCloseDialog}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回错题列表
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleAnswerSubmit}
                  disabled={isTranslateType ? selectedBlocks.length === 0 : !selectedAnswer.trim()}
                  className="w-full"
                >
                  提交答案
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100">
      <AppToast />
      
      {/* 顶部标题 - 添加装饰圆形 */}
      <div className="relative bg-primary px-4 pt-8 pb-6 mb-8 rounded-b-3xl overflow-hidden">
        {/* 装饰圆形 */}
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/20 rounded-full"></div>
        <div className="absolute top-12 right-20 w-12 h-12 bg-white/15 rounded-full"></div>
        <div className="absolute top-2 right-32 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-8 right-2 w-8 h-8 bg-white/25 rounded-full"></div>
        
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">错题本</h1>
          <p className="text-white/80">温故而知新，错题是进步的阶梯</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-4 pb-6">
        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{totalErrors}</p>
                <p className="text-sm text-gray-600">错题总数</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{unpracticedErrors}</p>
                <p className="text-sm text-gray-600">待练习</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选按钮 */}
      <div className="px-4 mb-6">
        <div className="flex space-x-3">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
            className={`flex-1 ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200'
            }`}
          >
            全部错题 ({totalErrors})
          </Button>
          <Button
            variant={filter === 'unpracticed' ? 'primary' : 'outline'}
            onClick={() => setFilter('unpracticed')}
            className={`flex-1 ${
              filter === 'unpracticed' 
                ? 'bg-primary text-white' 
                : 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200'
            }`}
          >
            待练习 ({unpracticedErrors})
          </Button>
        </div>
      </div>

      {/* 错题列表 */}
      <div className="px-4 pb-8">
        {filteredQuestions.length === 0 ? (
          <Card className="card-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {filter === 'unpracticed' ? '没有待练习的错题' : '还没有错题'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unpracticed' ? '所有错题都已练习完成！' : '继续努力学习，避免出错！'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <Card 
                key={question.id} 
                className="card-shadow animate-fade-in cursor-pointer hover:shadow-lg transition-shadow" 
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleQuestionClick(question)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      <Badge variant="outline" className="mr-2 border-purple-200 text-purple-600">
                        {getQuestionTypeLabel(question.question_type)}
                      </Badge>
                    </CardTitle>
                    {question.is_practiced ? (
                      <Badge className="bg-purple-100 text-purple-700">已练习</Badge>
                    ) : (
                      <Badge variant="outline" className="text-purple-600 border-purple-200">待练习</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-800">{question.question_content}</p>
                    </div>
                    
                    <div className="text-center">
                      <Button
                        variant="primary"
                        size="sm"
                        className="px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionClick(question);
                        }}
                      >
                        重新练习
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 答题对话框 */}
      {renderQuestionDialog()}
    </div>
  );
};

export default ErrorBook;