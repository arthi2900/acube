import Home from './components/pages/Home';
import DailyQuotes from './components/pages/DailyQuotes';
import ErrorBook from './components/pages/ErrorBook';
import Profile from './components/pages/Profile';
import Quiz from './components/pages/Quiz';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: '首页',
    path: '/',
    element: <Home />
  },
  {
    name: '每日金句',
    path: '/quotes',
    element: <DailyQuotes />
  },
  {
    name: '错题本',
    path: '/errors',
    element: <ErrorBook />
  },
  {
    name: '个人中心',
    path: '/profile',
    element: <Profile />
  },
  {
    name: '答题',
    path: '/quiz/:stage/:level',
    element: <Quiz />
  }
];

export default routes;