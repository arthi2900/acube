import React, { useEffect, useState } from 'react';

const CelebrationAnimation: React.FC = () => {
  const [particles, setParticles] = useState<Array<{ 
    id: number; 
    x: number; 
    y: number; 
    color: string; 
    delay: number;
    type: 'confetti' | 'star';
    rotation: number;
  }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const newParticles = [];
    
    // 彩纸粒子
    for (let i = 0; i < 40; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -50,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        type: 'confetti' as const,
        rotation: Math.random() * 360
      });
    }
    
    // 星星粒子
    for (let i = 40; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        color: '#FFD700',
        delay: Math.random() * 2,
        type: 'star' as const,
        rotation: 0
      });
    }
    
    setParticles(newParticles);
  }, []);

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { 
            transform: translateY(-100vh) rotate(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(100vh) rotate(720deg); 
            opacity: 0; 
          }
        }
        
        @keyframes star-twinkle {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
            filter: brightness(1);
          }
          50% { 
            transform: scale(1.5) rotate(180deg); 
            opacity: 0.7; 
            filter: brightness(1.5);
          }
        }
        
        @keyframes celebration-bounce {
          0% { 
            transform: scale(0.3) translateY(-50px); 
            opacity: 0; 
          }
          50% { 
            transform: scale(1.1) translateY(-10px); 
          }
          100% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 215, 0, 1);
          }
        }
        
        .confetti-particle {
          animation: confetti-fall 3s linear infinite;
        }
        
        .star-particle {
          animation: star-twinkle 1.5s ease-in-out infinite;
        }
        
        .celebration-text {
          animation: celebration-bounce 1s ease-out;
        }
        
        .glow-effect {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-green-600/30 animate-fade-in" />
        
        {/* 庆祝文字 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center celebration-text">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl glow-effect">
              <h2 className="text-4xl font-bold text-purple-600 mb-2 drop-shadow-lg">连击成功！</h2>
              <p className="text-purple-500 text-xl font-medium">连续答对5题！</p>
              <div className="flex justify-center space-x-2 mt-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="text-white font-bold text-lg">★</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* 粒子效果 */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={particle.type === 'confetti' ? 'confetti-particle' : 'star-particle'}
            style={{
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              animationDelay: `${particle.delay}s`,
              zIndex: 30,
              ...(particle.type === 'confetti' ? {
                width: '8px',
                height: '16px',
                backgroundColor: particle.color,
                borderRadius: '3px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transform: `rotate(${particle.rotation}deg)`
              } : {
                fontSize: '24px',
                color: particle.color,
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))'
              })
            }}
          >
            {particle.type === 'star' ? '⭐' : ''}
          </div>
        ))}
        
        {/* 光芒效果 */}
        <div className="absolute inset-0 bg-gradient-radial from-yellow-400/30 via-transparent to-transparent animate-pulse" />
        
        {/* 额外的闪烁星星 */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`extra-star-${i}`}
            className="absolute text-yellow-400 text-2xl animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`,
              zIndex: 30
            }}
          >
            ✨
          </div>
        ))}
      </div>
    </>
  );
};

export default CelebrationAnimation;