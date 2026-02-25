import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, AlertCircle, User } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/quotes', icon: BookOpen, label: '每日金句' },
    { path: '/errors', icon: AlertCircle, label: '错题本' },
    { path: '/profile', icon: User, label: '个人中心' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 mobile-safe-area z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-primary text-white transform scale-110' 
                  : 'text-gray-500 hover:text-purple-400 hover:bg-purple-50'
              }`}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;