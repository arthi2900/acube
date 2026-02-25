import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, BookOpen } from 'lucide-react';
import type { Question, Lesson, DifficultyDistribution } from '@/types/types';

interface SmartSelectionPanelProps {
  availableQuestions: Question[];
  selectedQuestions: string[];
  lessons: Lesson[];
  onAutoSelect: (questionIds: string[]) => void;
}

export function SmartSelectionPanel({
  availableQuestions,
  selectedQuestions,
  lessons,
  onAutoSelect,
}: SmartSelectionPanelProps) {
  // Calculate current statistics
  const selectedQuestionsArray = availableQuestions.filter(q => selectedQuestions.includes(q.id));
  
  const totalMarks = selectedQuestionsArray.reduce((sum, q) => sum + (q.marks || 0), 0);
  
  const difficultyStats = {
    easy: selectedQuestionsArray.filter(q => q.difficulty === 'easy').length,
    medium: selectedQuestionsArray.filter(q => q.difficulty === 'medium').length,
    hard: selectedQuestionsArray.filter(q => q.difficulty === 'hard').length,
  };

  const totalSelected = selectedQuestionsArray.length;
  const difficultyPercent = {
    easy: totalSelected > 0 ? Math.round((difficultyStats.easy / totalSelected) * 100) : 0,
    medium: totalSelected > 0 ? Math.round((difficultyStats.medium / totalSelected) * 100) : 0,
    hard: totalSelected > 0 ? Math.round((difficultyStats.hard / totalSelected) * 100) : 0,
  };

  // Calculate lesson coverage
  const coveredLessons = new Set(
    selectedQuestionsArray
      .map(q => q.lesson_id)
      .filter(Boolean)
  );

  const lessonCoveragePercent = lessons.length > 0
    ? Math.round((coveredLessons.size / lessons.length) * 100)
    : 0;

  // Auto-select functions
  const handleAutoSelectBalanced = () => {
    // Target: 40% Easy, 40% Medium, 20% Hard
    const targetTotal = 20; // Select 20 questions
    const target = {
      easy: Math.round(targetTotal * 0.4),
      medium: Math.round(targetTotal * 0.4),
      hard: Math.round(targetTotal * 0.2),
    };

    const easyQuestions = availableQuestions.filter(q => q.difficulty === 'easy');
    const mediumQuestions = availableQuestions.filter(q => q.difficulty === 'medium');
    const hardQuestions = availableQuestions.filter(q => q.difficulty === 'hard');

    const selected: string[] = [];

    // Randomly select from each difficulty
    const selectRandom = (questions: Question[], count: number) => {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, questions.length)).map(q => q.id);
    };

    selected.push(...selectRandom(easyQuestions, target.easy));
    selected.push(...selectRandom(mediumQuestions, target.medium));
    selected.push(...selectRandom(hardQuestions, target.hard));

    onAutoSelect(selected);
  };

  const handleAutoSelectByLesson = () => {
    // Select questions to cover all lessons evenly
    const questionsPerLesson = Math.ceil(20 / lessons.length);
    const selected: string[] = [];

    lessons.forEach(lesson => {
      const lessonQuestions = availableQuestions.filter(q => q.lesson_id === lesson.id);
      const shuffled = [...lessonQuestions].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, Math.min(questionsPerLesson, lessonQuestions.length)).map(q => q.id));
    });

    onAutoSelect(selected.slice(0, 20));
  };

  const handleAutoSelectEasy = () => {
    const easyQuestions = availableQuestions.filter(q => q.difficulty === 'easy');
    const shuffled = [...easyQuestions].sort(() => Math.random() - 0.5);
    onAutoSelect(shuffled.slice(0, 15).map(q => q.id));
  };

  return (
    <div className="space-y-4">
      {/* Real-time Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Real-time Statistics
          </CardTitle>
          <CardDescription>Current selection analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Marks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Marks</span>
              <Badge variant="secondary" className="text-lg">
                {totalMarks}
              </Badge>
            </div>
          </div>

          {/* Questions Selected */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Questions Selected</span>
              <Badge variant="outline">
                {totalSelected} / {availableQuestions.length}
              </Badge>
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Difficulty Distribution</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Easy</span>
                  <span className="text-xs font-medium">
                    {difficultyStats.easy} ({difficultyPercent.easy}%)
                  </span>
                </div>
                <Progress value={difficultyPercent.easy} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Medium</span>
                  <span className="text-xs font-medium">
                    {difficultyStats.medium} ({difficultyPercent.medium}%)
                  </span>
                </div>
                <Progress value={difficultyPercent.medium} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Hard</span>
                  <span className="text-xs font-medium">
                    {difficultyStats.hard} ({difficultyPercent.hard}%)
                  </span>
                </div>
                <Progress value={difficultyPercent.hard} className="h-2" />
              </div>
            </div>
          </div>

          {/* Lesson Coverage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lesson Coverage
              </span>
              <Badge variant="outline">
                {coveredLessons.size} / {lessons.length}
              </Badge>
            </div>
            <Progress value={lessonCoveragePercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {lessonCoveragePercent}% of lessons covered
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Smart Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Selection
          </CardTitle>
          <CardDescription>Auto-select questions based on criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleAutoSelectBalanced}
          >
            <div className="text-left">
              <div className="font-medium">Balanced Distribution</div>
              <div className="text-xs text-muted-foreground">
                40% Easy, 40% Medium, 20% Hard
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleAutoSelectByLesson}
          >
            <div className="text-left">
              <div className="font-medium">Even Lesson Coverage</div>
              <div className="text-xs text-muted-foreground">
                Equal questions from each lesson
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleAutoSelectEasy}
          >
            <div className="text-left">
              <div className="font-medium">Easy Questions Only</div>
              <div className="text-xs text-muted-foreground">
                Select 15 easy questions
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {totalSelected > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-sm">Recommendations</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {difficultyPercent.hard > 30 && (
                <li>⚠️ High percentage of hard questions may be challenging</li>
              )}
              {lessonCoveragePercent < 50 && (
                <li>💡 Consider adding questions from more lessons</li>
              )}
              {totalMarks < 50 && (
                <li>📝 Total marks seem low for a full exam</li>
              )}
              {totalMarks > 150 && (
                <li>⏰ High total marks may require extended time</li>
              )}
              {difficultyPercent.easy > 60 && (
                <li>✨ Consider adding more challenging questions</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
