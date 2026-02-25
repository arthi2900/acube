import { LoginPanel } from "miaoda-auth-react";
import { api } from '../../db/supabase';

const login_config = {
  title: '猫头鹰学英语登录',
  desc: '开启你的英语学习之旅',
  onLoginSuccess: async (user: any) => {
    console.log("user:", user);

    try {
      const existingProfile = await api.getUserById(user.id);

      if (!existingProfile) {
        await api.createUser({
          id: user.id,
          phone: user.phone || '',
          nickname: '英语学习者',
          avatar_url: '',
          stars: 5,
          level: 1,
          total_study_time: 0,
          consecutive_days: 0
        });
      }
    } catch (error) {
      console.error('用户初始化失败:', error);
    }
  },
  privacyPolicyUrl: import.meta.env.VITE_PRIVACY_POLICY_URL,
  userPolicyUrl: import.meta.env.VITE_USER_POLICY_URL,
  showPolicy: import.meta.env.VITE_SHOW_POLICY,
  policyPrefix: import.meta.env.VITE_POLICY_PREFIX
};

export default function Login() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full owl-avatar flex items-center justify-center">
            <span className="text-3xl">🦉</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">猫头鹰学英语</h1>
          <p className="text-white/80">让学习变得更有趣</p>
        </div>
        <LoginPanel {...login_config} />
      </div>
    </div>
  );
}