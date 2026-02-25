/*
# 猫头鹰学英语应用数据库初始化

1. 新建表
  - `users` - 用户信息表
    - `id` (uuid, 主键)
    - `phone` (text, 手机号)
    - `nickname` (text, 昵称)
    - `avatar_url` (text, 头像链接)
    - `stars` (integer, 星星数量)
    - `level` (integer, 当前等级)
    - `total_study_time` (integer, 总学习时间分钟)
    - `consecutive_days` (integer, 连续学习天数)
    - `last_study_date` (date, 最后学习日期)
    - `created_at` (timestamp, 创建时间)
    - `updated_at` (timestamp, 更新时间)

  - `user_progress` - 用户进度表
    - `id` (uuid, 主键)
    - `user_id` (uuid, 用户ID)
    - `stage` (text, 阶段名称)
    - `level` (integer, 关卡等级)
    - `completed` (boolean, 是否完成)
    - `stars_earned` (integer, 获得星星数)
    - `completed_at` (timestamp, 完成时间)

  - `user_badges` - 用户徽章表
    - `id` (uuid, 主键)
    - `user_id` (uuid, 用户ID)
    - `badge_type` (text, 徽章类型)
    - `earned_at` (timestamp, 获得时间)

  - `error_questions` - 错题表
    - `id` (uuid, 主键)
    - `user_id` (uuid, 用户ID)
    - `question_id` (text, 题目ID)
    - `question_type` (text, 题目类型)
    - `question_content` (text, 题目内容)
    - `correct_answer` (text, 正确答案)
    - `user_answer` (text, 用户答案)
    - `is_practiced` (boolean, 是否已练习)
    - `created_at` (timestamp, 创建时间)

2. 安全设置
  - 为所有表启用RLS
  - 添加用户访问策略
*/

-- 用户信息表
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  nickname text DEFAULT '',
  avatar_url text DEFAULT '',
  stars integer DEFAULT 5,
  level integer DEFAULT 1,
  total_study_time integer DEFAULT 0,
  consecutive_days integer DEFAULT 0,
  last_study_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 用户进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stage text NOT NULL,
  level integer NOT NULL,
  completed boolean DEFAULT false,
  stars_earned integer DEFAULT 0,
  completed_at timestamptz
);

-- 用户徽章表
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  earned_at timestamptz DEFAULT now()
);

-- 错题表
CREATE TABLE IF NOT EXISTS error_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  question_type text NOT NULL,
  question_content text NOT NULL,
  correct_answer text NOT NULL,
  user_answer text NOT NULL,
  is_practiced boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_questions ENABLE ROW LEVEL SECURITY;

-- 用户访问策略
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own badges"
  ON user_badges
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own error questions"
  ON error_questions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());