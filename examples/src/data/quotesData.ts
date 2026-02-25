import type { DailyQuote } from '../types';

export const dailyQuotes: DailyQuote[] = [
  {
    id: '1',
    english: 'The only way to do great work is to love what you do.',
    chinese: '做出伟大工作的唯一方法就是热爱你所做的事情。',
    author: 'Steve Jobs'
  },
  {
    id: '2',
    english: 'Life is what happens to you while you\'re busy making other plans.',
    chinese: '生活就是当你忙于制定其他计划时发生在你身上的事情。',
    author: 'John Lennon'
  },
  {
    id: '3',
    english: 'The future belongs to those who believe in the beauty of their dreams.',
    chinese: '未来属于那些相信自己梦想之美的人。',
    author: 'Eleanor Roosevelt'
  },
  {
    id: '4',
    english: 'It is during our darkest moments that we must focus to see the light.',
    chinese: '正是在我们最黑暗的时刻，我们必须专注于看到光明。',
    author: 'Aristotle'
  },
  {
    id: '5',
    english: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    chinese: '成功不是终点，失败不是致命的：重要的是继续前进的勇气。',
    author: 'Winston Churchill'
  },
  {
    id: '6',
    english: 'The way to get started is to quit talking and begin doing.',
    chinese: '开始的方法就是停止空谈，开始行动。',
    author: 'Walt Disney'
  }
];

export const getRandomQuotes = (count: number = 5): DailyQuote[] => {
  const shuffled = [...dailyQuotes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};