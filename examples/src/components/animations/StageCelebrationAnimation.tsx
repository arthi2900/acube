import React, { useEffect } from 'react';
import { Button } from '../ui/button';
import { Trophy, Star, Gift } from 'lucide-react';

interface StageCelebrationAnimationProps {
  stageName: string;
  badgeName: string;
  onComplete: () => void;
}

const StageCelebrationAnimation: React.FC<StageCelebrationAnimationProps> = ({
  stageName,
  badgeName,
  onComplete
}) => {
  useEffect(() => {
    // 播放庆祝音效（如果需要）
    // playSuccessSound();
  }, []);

  return (
    <>
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3) translateY(-50px); opacity: 0; }
          50% { transform: scale(1.1) translateY(-10px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        
        .animate-bounce-in {
          animation: bounceIn 1s ease-out;
        }
      `}</style>

      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 flex items-center justify-center z-50 overflow-hidden">
        {/* 背景动画粒子 */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* 主要内容 */}
        <div className="relative z-10 text-center text-white px-6 max-w-md">
          {/* 奖杯动画 */}
          <div className="mb-8 animate-bounce-in">
            <div className="w-32 h-32 mx-auto mb-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl">
              <Trophy className="w-16 h-16 text-yellow-800" />
            </div>
          </div>

          {/* 庆祝文字 */}
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h1 className="text-4xl font-bold mb-4">🎉 恭喜！🎉</h1>
            <h2 className="text-2xl font-bold mb-2">完成 {stageName}！</h2>
            <p className="text-lg mb-6 opacity-90">你已获得 "{badgeName}" 徽章</p>
          </div>

          {/* 奖励信息 */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8 animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="flex items-center justify-center space-x-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-yellow-800 fill-current" />
                </div>
                <p className="text-sm font-bold">+5 星星</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Gift className="w-6 h-6 text-purple-800" />
                </div>
                <p className="text-sm font-bold">新徽章</p>
              </div>
            </div>
          </div>

          {/* 星星雨动画 */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <Star
                key={i}
                className="absolute w-6 h-6 text-yellow-400 fill-current animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              />
            ))}
          </div>

          {/* 返回按钮 */}
          <Button
            variant="secondary"
            size="lg"
            onClick={onComplete}
            className="bg-white text-purple-600 hover:bg-white/90 font-bold px-8 animate-fade-in"
            style={{ animationDelay: '1.5s' }}
          >
            返回首页
          </Button>
        </div>
      </div>
    </>
  );
};

export default StageCelebrationAnimation;