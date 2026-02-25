import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Volume2 } from 'lucide-react';
import { getRandomQuotes } from '../../data/quotesData';
import { audioManager } from '../../utils/audioUtils';
import type { DailyQuote } from '../../types';

const DailyQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<DailyQuote[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // 每日获取随机金句
    const dailyQuotes = getRandomQuotes(6);
    setQuotes(dailyQuotes);
  }, []);

  // 显示应用内提示
  const showAppToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handlePlayAudio = async (quote: DailyQuote) => {
    if (playingId === quote.id) {
      // 如果正在播放，停止播放
      audioManager.stopAudio();
      setPlayingId(null);
      return;
    }

    try {
      setPlayingId(quote.id);
      await audioManager.playText(quote.english);
    } catch (error) {
      console.error('播放音频失败:', error);
      showAppToast('播放音频失败，请稍后重试', 'error');
    } finally {
      setPlayingId(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-purple-50">
      <AppToast />
      
      {/* 顶部标题 - 添加装饰圆形 */}
      <div className="relative bg-primary px-4 pt-8 pb-6 mb-8 rounded-b-3xl overflow-hidden">
        {/* 装饰圆形 */}
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/20 rounded-full"></div>
        <div className="absolute top-12 right-20 w-12 h-12 bg-white/15 rounded-full"></div>
        <div className="absolute top-2 right-32 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-8 right-2 w-8 h-8 bg-white/25 rounded-full"></div>
        
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">每日金句</h1>
          <p className="text-white/80">每天一句名言，提升英语水平</p>
        </div>
      </div>

      {/* 金句列表 */}
      <div className="px-4 pb-8">
        <div className="space-y-4">
          {quotes.map((quote, index) => (
            <Card key={quote.id} className="overflow-hidden card-shadow animate-fade-in relative" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 英文原文 */}
                  <div className="relative">
                    <blockquote className="text-lg font-medium text-gray-800 leading-relaxed pr-12">
                      "{quote.english}"
                    </blockquote>
                  </div>

                  {/* 中文翻译 */}
                  <p className="text-gray-600 text-base leading-relaxed">
                    {quote.chinese}
                  </p>

                  {/* 作者 */}
                  <div className="pt-2 border-t border-gray-100">
                    <cite className="text-sm font-medium text-primary not-italic">
                      —— {quote.author}
                    </cite>
                  </div>
                </div>

                {/* 读音图标 - 移到右下角 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-4 right-4 text-primary hover:bg-purple-100"
                  onClick={() => handlePlayAudio(quote)}
                  disabled={playingId === quote.id}
                >
                  <Volume2 className={`w-5 h-5 ${playingId === quote.id ? 'animate-pulse' : ''}`} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 刷新按钮 */}
        <div className="mt-8 text-center">
          <Button 
            variant="primary" 
            onClick={() => setQuotes(getRandomQuotes(6))}
            className="px-8"
          >
            换一批金句
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuotes;