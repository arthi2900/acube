import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Star, Clock, Calendar, Trophy, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from '../../hooks/useProgress';
import { api } from '../../db/supabase';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, updateUser, getTodayStudyTime } = useAuth();
  const { badges } = useProgress();
  const navigate = useNavigate();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // 显示应用内提示
  const showAppToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const badgeConfig = {
    'beginner_complete': { name: '新手村', icon: '🌱', description: '完成新手村所有关卡' },
    'combo_master': { name: '连击高手', icon: '🔥', description: '单次答对5题以上' },
    'week_streak': { name: '连续一周', icon: '📅', description: '连续学习7天' },
    'intermediate_complete': { name: '勇者试炼', icon: '⚔️', description: '完成勇者试炼所有关卡' },
    'language_master': { name: '语言大师', icon: '🎓', description: '完成所有语法练习' },
    'advanced_complete': { name: '王者殿堂', icon: '👑', description: '完成流利殿堂所有关卡' },
  };

  const userBadges = badges.map(b => ({
    ...badgeConfig[b.badge_type as keyof typeof badgeConfig],
    earned_at: b.earned_at
  })).filter(Boolean);

  // 获取今日学习时间
  const todayStudyTime = getTodayStudyTime();

  // 检查连续学习天数奖励
  const shouldGetBonusStar = (user?.consecutive_days || 0) > 0 && (user?.consecutive_days || 0) % 3 === 0;

  const handleResetProgress = async () => {
    if (!user) return;
    
    setIsResetting(true);
    try {
      // 重置用户数据
      await updateUser({
        stars: 5,
        level: 1,
        total_study_time: 0,
        consecutive_days: 1,
        last_study_date: new Date().toISOString().split('T')[0]
      });

      // 清空进度数据
      const { error: progressError } = await api.supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id);

      if (progressError) {
        console.error('清空进度数据失败:', progressError);
      }

      // 清空徽章数据
      const { error: badgeError } = await api.supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);

      if (badgeError) {
        console.error('清空徽章数据失败:', badgeError);
      }

      // 清空错题数据
      const { error: errorError } = await api.supabase
        .from('error_questions')
        .delete()
        .eq('user_id', user.id);

      if (errorError) {
        console.error('清空错题数据失败:', errorError);
      }

      setShowResetDialog(false);
      showAppToast('重置成功！即将返回首页', 'success');
      
      // 延迟跳转到首页
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('重置进度失败:', error);
      showAppToast('重置失败，请稍后重试', 'error');
    } finally {
      setIsResetting(false);
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

  const ResetDialog = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">重置学习信息</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowResetDialog(false)}
            className="text-gray-500"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <p className="text-gray-600 mb-6">
          是否真的要重置学习信息，重置后数据不可恢复
        </p>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(false)}
            className="flex-1"
            disabled={isResetting}
          >
            我再想想
          </Button>
          <Button
            variant="primary"
            onClick={handleResetProgress}
            className="flex-1"
            disabled={isResetting}
          >
            {isResetting ? '重置中...' : '立即重置'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-50 to-purple-100">
      <AppToast />
      
      {/* 顶部用户信息块 - 添加装饰圆形 */}
      <div className="relative bg-primary px-4 pt-8 pb-8 mb-8 rounded-b-3xl overflow-hidden">
        {/* 装饰圆形 */}
        <div className="absolute top-6 right-8 w-24 h-24 bg-white/20 rounded-full"></div>
        <div className="absolute top-12 right-20 w-16 h-16 bg-white/15 rounded-full"></div>
        <div className="absolute top-2 right-32 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute top-16 right-2 w-12 h-12 bg-white/25 rounded-full"></div>
        
        <div className="relative z-10 flex items-center space-x-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src="https://images.unsplash.com/photo-010-xxxxxxxx02-d1d0cf377fde?w=200&h=200&fit=crop&crop=face" />
            <AvatarFallback className="owl-avatar text-3xl">
              🦉
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.nickname || '英语学习者'}</h2>
            <p className="text-white/80 text-sm">Level {user?.level || 1}</p>
            <div className="flex items-center space-x-1 mt-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span className="text-lg font-bold text-white">{user?.stars || 0}</span>
              <span className="text-sm text-white/80">星星</span>
            </div>
          </div>
        </div>
      </div>

      {/* 学习统计 */}
      <div className="px-4 mb-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg">学习统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{todayStudyTime}min</p>
                <p className="text-sm text-gray-600">今日学习时间</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl relative">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{user?.consecutive_days || 1}</p>
                <p className="text-sm text-gray-600">连续学习天数</p>
                {shouldGetBonusStar && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                    <Star className="w-4 h-4 text-white fill-current" />
                  </div>
                )}
              </div>
            </div>
            {shouldGetBonusStar && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-sm text-yellow-800">
                  🎉 连续学习{user?.consecutive_days}天，第4天赠送1颗星星！
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 成就徽章 */}
      <div className="px-4 mb-6">
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
              成就徽章
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userBadges.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-600">还没有获得徽章</p>
                <p className="text-sm text-gray-500 mt-1">继续学习来解锁成就吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(badgeConfig).map(([key, badge], index) => {
                  const isEarned = userBadges.some(ub => ub.name === badge.name);
                  return (
                    <div 
                      key={key}
                      className={`text-center p-4 rounded-xl border-2 transition-all ${
                        isEarned 
                          ? 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 animate-bounce-in' 
                          : 'bg-gray-50 border-gray-200 opacity-50'
                      }`}
                      style={isEarned ? { animationDelay: `${index * 200}ms` } : {}}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <h4 className="font-bold text-gray-800 text-sm">{badge.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                      <div className="mt-2 h-6 flex items-center justify-center">
                        {/* 移除已获得标签 */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 设置选项 */}
      <div className="px-4 pb-8">
        <Card className="card-shadow">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              <button 
                onClick={() => setShowResetDialog(true)}
                className="w-full p-4 text-left hover:bg-orange-50 transition-colors text-orange-600"
              >
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5" />
                  <span>重置学习信息</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 重置确认对话框 */}
      {showResetDialog && <ResetDialog />}
    </div>
  );
};

export default Profile;