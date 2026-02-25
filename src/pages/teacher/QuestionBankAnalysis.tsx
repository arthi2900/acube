import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { analysisApi, profileApi, questionApi } from '@/db/api';
import { ArrowLeft, BarChart3, Loader2, Download, AlertCircle, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Users } from 'lucide-react';
import type { Profile, QuestionWrongAnswerStats, QuestionType, DifficultyLevel, StudentWrongAnswer } from '@/types/types';

type SortColumn = 'question_text' | 'question_type' | 'difficulty' | 'wrong_attempts_count' | 'total_attempts_count' | 'wrong_percentage';
type SortDirection = 'asc' | 'desc' | null;

export default function QuestionBankAnalysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  
  // Filter states
  const [questionBanks, setQuestionBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [loadingExams, setLoadingExams] = useState(false);
  
  // Analysis data
  const [analysisData, setAnalysisData] = useState<QuestionWrongAnswerStats[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [updatingDifficulty, setUpdatingDifficulty] = useState<string | null>(null);
  
  // Student wrong answers
  const [studentWrongAnswers, setStudentWrongAnswers] = useState<Record<string, StudentWrongAnswer[]>>({});
  const [loadingWrongAnswers, setLoadingWrongAnswers] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Sorting states
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      setCurrentProfile(profile);

      if (profile?.school_id) {
        // Pass profile.id directly since state hasn't updated yet
        await loadQuestionBanks(profile.school_id, profile.id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load initial data',
        variant: 'destructive',
      });
    }
  };

  const loadQuestionBanks = async (schoolId: string, teacherId?: string) => {
    try {
      setLoadingBanks(true);
      // Filter question banks by teacher
      const banks = await analysisApi.getUniqueQuestionBanks(schoolId, teacherId);
      setQuestionBanks(banks);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load question banks',
        variant: 'destructive',
      });
    } finally {
      setLoadingBanks(false);
    }
  };

  const loadExams = async (schoolId: string, bankName: string, teacherId?: string) => {
    try {
      setLoadingExams(true);
      const examsList = await analysisApi.getExamsByQuestionBank(schoolId, bankName, teacherId);
      setExams(examsList);
      // Don't reset selected exam here - it's handled in handleBankChange
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exams',
        variant: 'destructive',
      });
    } finally {
      setLoadingExams(false);
    }
  };

  const handleBankChange = (bankName: string) => {
    setSelectedBank(bankName);
    setHasAnalyzed(false);
    setAnalysisData([]);
    setExams([]);
    setSelectedExam('all-exams'); // Default to all exams
    setStudentWrongAnswers({}); // Clear cached student answers
    setOpenPopover(null); // Close any open popovers
    
    // Load exams for the selected bank
    if (bankName && currentProfile?.school_id) {
      loadExams(currentProfile.school_id, bankName, currentProfile.id);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedBank) {
      toast({
        title: 'Selection Required',
        description: 'Please select a Question Bank to analyze',
        variant: 'destructive',
      });
      return;
    }

    if (!currentProfile?.school_id) {
      toast({
        title: 'Error',
        description: 'School information not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setStudentWrongAnswers({}); // Clear cached student answers when re-analyzing
      setOpenPopover(null); // Close any open popovers
      
      // Pass exam ID only if a specific exam is selected (not "all-exams")
      const examIdToAnalyze = selectedExam && selectedExam !== 'all-exams' ? selectedExam : undefined;
      const data = await analysisApi.getQuestionBankWrongAnswerAnalysis(
        currentProfile.school_id,
        selectedBank,
        examIdToAnalyze
      );
      setAnalysisData(data);
      setHasAnalyzed(true);

      if (data.length === 0) {
        toast({
          title: 'No Data',
          description: 'No exam attempts found for questions in this bank',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze question bank',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (analysisData.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    const headers = [
      'S.No',
      'Question Text',
      'Question Type',
      'Difficulty',
      'Wrong Attempts',
      'Total Attempts',
      'Wrong %'
    ];
    
    const rows = analysisData.map((item, index) => [
      index + 1,
      `"${item.question_text.replace(/"/g, '""')}"`, // Escape quotes in question text
      item.question_type,
      item.difficulty,
      item.wrong_attempts_count,
      item.total_attempts_count,
      item.wrong_percentage
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `question_bank_analysis_${selectedBank}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: 'Analysis data exported to CSV',
    });
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels: Record<QuestionType, string> = {
      mcq: 'MCQ',
      true_false: 'True/False',
      short_answer: 'Short Answer',
      match_following: 'Match Following',
      multiple_response: 'Multiple Response',
    };
    return labels[type] || type;
  };

  const getDifficultyBadge = (difficulty: DifficultyLevel) => {
    const variants: Record<DifficultyLevel, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      easy: { variant: 'secondary', label: 'Easy' },
      medium: { variant: 'default', label: 'Medium' },
      hard: { variant: 'destructive', label: 'Hard' },
    };
    const config = variants[difficulty] || variants.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getWrongPercentageBadge = (percentage: number) => {
    if (percentage >= 70) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />{percentage}%</Badge>;
    } else if (percentage >= 50) {
      return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">{percentage}%</Badge>;
    } else {
      return <Badge variant="secondary">{percentage}%</Badge>;
    }
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDifficultyChange = async (questionId: string, newDifficulty: DifficultyLevel) => {
    try {
      setUpdatingDifficulty(questionId);
      
      // Update the question in the database
      await questionApi.updateQuestion(questionId, { difficulty: newDifficulty });
      
      // Update the local state to reflect the change
      setAnalysisData(prevData =>
        prevData.map(item =>
          item.question_id === questionId
            ? { ...item, difficulty: newDifficulty }
            : item
        )
      );
      
      toast({
        title: 'Success',
        description: 'Question difficulty updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update difficulty',
        variant: 'destructive',
      });
    } finally {
      setUpdatingDifficulty(null);
    }
  };

  const handleWrongCountClick = async (questionId: string) => {
    // If already loaded, just toggle the popover
    if (studentWrongAnswers[questionId]) {
      setOpenPopover(openPopover === questionId ? null : questionId);
      return;
    }

    // Otherwise, fetch the data
    try {
      setLoadingWrongAnswers(questionId);
      setOpenPopover(questionId);
      
      if (!currentProfile?.school_id) {
        throw new Error('School ID not found');
      }

      const answers = await analysisApi.getStudentWrongAnswersForQuestion(
        questionId,
        currentProfile.school_id,
        selectedExam && selectedExam !== 'all-exams' ? selectedExam : undefined
      );
      
      setStudentWrongAnswers(prev => ({
        ...prev,
        [questionId]: answers,
      }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load student answers',
        variant: 'destructive',
      });
      setOpenPopover(null);
    } finally {
      setLoadingWrongAnswers(null);
    }
  };

  // Sorting functions
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null (original order)
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedData = () => {
    if (!sortColumn || !sortDirection) {
      return analysisData;
    }

    const sorted = [...analysisData].sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];

      // Handle different data types
      if (sortColumn === 'question_text') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (sortColumn === 'difficulty') {
        // Sort difficulty: easy < medium < hard
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        aValue = difficultyOrder[aValue as DifficultyLevel];
        bValue = difficultyOrder[bValue as DifficultyLevel];
      } else if (sortColumn === 'question_type') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const sortedAnalysisData = getSortedData();

  // Calculate statistics
  const totalQuestions = analysisData.length;
  const totalWrongAttempts = analysisData.reduce((sum, item) => sum + item.wrong_attempts_count, 0);
  const totalAttempts = analysisData.reduce((sum, item) => sum + item.total_attempts_count, 0);
  const averageWrongPercentage = totalAttempts > 0 
    ? Math.round((totalWrongAttempts / totalAttempts) * 100 * 100) / 100 
    : 0;
  const highErrorQuestions = analysisData.filter(item => item.wrong_percentage >= 50).length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/teacher/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Question Bank Analysis</h1>
          <p className="text-muted-foreground">
            Analyze wrong answer patterns across all exams
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Select Question Bank
          </CardTitle>
          <CardDescription>
            Choose a question bank to analyze student performance and identify problematic questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank-select">Question Bank</Label>
              <Select
                value={selectedBank}
                onValueChange={handleBankChange}
                disabled={loadingBanks}
              >
                <SelectTrigger id="bank-select">
                  <SelectValue placeholder={loadingBanks ? 'Loading banks...' : 'Select a question bank'} />
                </SelectTrigger>
                <SelectContent>
                  {questionBanks.length === 0 && !loadingBanks ? (
                    <SelectItem value="no-banks" disabled>
                      No question banks found
                    </SelectItem>
                  ) : (
                    questionBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-select">Exams</Label>
              <Select
                value={selectedExam}
                onValueChange={setSelectedExam}
                disabled={!selectedBank || loadingExams}
              >
                <SelectTrigger id="exam-select">
                  <SelectValue placeholder={
                    !selectedBank 
                      ? 'Select a question bank first' 
                      : loadingExams 
                      ? 'Loading exams...' 
                      : 'All exams (optional)'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-exams">All exams</SelectItem>
                  {exams.length === 0 && !loadingExams && selectedBank ? (
                    <SelectItem value="no-exams" disabled>
                      No exams found for this bank
                    </SelectItem>
                  ) : (
                    exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={loading || !selectedBank}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
            {hasAnalyzed && analysisData.length > 0 && (
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      {hasAnalyzed && analysisData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuestions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Questions attempted in exams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Wrong Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{totalWrongAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {totalAttempts} total attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageWrongPercentage}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all questions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                High Error Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{highErrorQuestions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Questions with ≥50% wrong rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {hasAnalyzed && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              {analysisData.length > 0
                ? `Showing ${analysisData.length} question${analysisData.length !== 1 ? 's' : ''} from "${selectedBank}"${
                    selectedExam && selectedExam !== 'all-exams'
                      ? ` for exam "${exams.find(e => e.id === selectedExam)?.title || 'Selected Exam'}"` 
                      : ' across all exams'
                  }`
                : 'No questions with exam attempts found in this bank'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisData.length > 0 ? (
              <div className="rounded-md border max-h-[600px] overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors">
                      <th className="sticky top-0 w-16 bg-card z-20 border-b-2 text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                        S.No
                      </th>
                      <th 
                        className="sticky top-0 min-w-[300px] bg-card z-20 border-b-2 text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('question_text')}
                      >
                        <div className="flex items-center">
                          Question Text
                          {getSortIcon('question_text')}
                        </div>
                      </th>
                      <th 
                        className="sticky top-0 bg-card z-20 border-b-2 text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('question_type')}
                      >
                        <div className="flex items-center">
                          Type
                          {getSortIcon('question_type')}
                        </div>
                      </th>
                      <th 
                        className="sticky top-0 bg-card z-20 border-b-2 text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('difficulty')}
                      >
                        <div className="flex items-center">
                          Difficulty
                          {getSortIcon('difficulty')}
                        </div>
                      </th>
                      <th 
                        className="sticky top-0 text-right bg-card z-20 border-b-2 text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('wrong_attempts_count')}
                      >
                        <div className="flex items-center justify-end">
                          Wrong
                          {getSortIcon('wrong_attempts_count')}
                        </div>
                      </th>
                      <th 
                        className="sticky top-0 text-right bg-card z-20 border-b-2 text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('total_attempts_count')}
                      >
                        <div className="flex items-center justify-end">
                          Total
                          {getSortIcon('total_attempts_count')}
                        </div>
                      </th>
                      <th 
                        className="sticky top-0 text-right bg-card z-20 border-b-2 text-foreground h-10 px-2 align-middle font-medium whitespace-nowrap cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('wrong_percentage')}
                      >
                        <div className="flex items-center justify-end">
                          Wrong %
                          {getSortIcon('wrong_percentage')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {sortedAnalysisData.map((item, index) => (
                      <tr 
                        key={item.question_id}
                        className={`hover:bg-muted/50 border-b transition-colors ${item.wrong_percentage >= 70 ? 'bg-destructive/5' : ''}`}
                      >
                        <td className="p-2 align-middle whitespace-nowrap font-medium">{index + 1}</td>
                        <td className="p-2 align-middle">
                          <div className="flex flex-col gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {truncateText(item.question_text)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md">
                                  <p className="whitespace-pre-wrap">{item.question_text}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Correct Answer:</span> {item.correct_answer}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <Badge variant="outline">
                            {getQuestionTypeLabel(item.question_type)}
                          </Badge>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <Select
                            value={item.difficulty}
                            onValueChange={(value) => handleDifficultyChange(item.question_id, value as DifficultyLevel)}
                            disabled={updatingDifficulty === item.question_id}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue>
                                {updatingDifficulty === item.question_id ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Updating...
                                  </span>
                                ) : (
                                  getDifficultyBadge(item.difficulty)
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">
                                <Badge variant="secondary">Easy</Badge>
                              </SelectItem>
                              <SelectItem value="medium">
                                <Badge variant="default">Medium</Badge>
                              </SelectItem>
                              <SelectItem value="hard">
                                <Badge variant="destructive">Hard</Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap text-right">
                          {item.wrong_attempts_count > 0 ? (
                            <Popover 
                              open={openPopover === item.question_id}
                              onOpenChange={(open) => {
                                if (open) {
                                  handleWrongCountClick(item.question_id);
                                } else {
                                  setOpenPopover(null);
                                }
                              }}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-1 font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  {item.wrong_attempts_count}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-96" align="end">
                                <div className="space-y-3">
                                  {loadingWrongAnswers === item.question_id ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                  ) : studentWrongAnswers[item.question_id]?.length > 0 ? (
                                    <>
                                      {/* Header with question text only */}
                                      <div className="space-y-2 pb-3 border-b">
                                        <h4 className="font-medium text-sm">
                                          {studentWrongAnswers[item.question_id][0].question_text}
                                        </h4>
                                        
                                        {/* Options with correct answer highlighted in green */}
                                        {studentWrongAnswers[item.question_id][0].options && 
                                         Array.isArray(studentWrongAnswers[item.question_id][0].options) && 
                                         (studentWrongAnswers[item.question_id][0].options as string[]).length > 0 && (
                                          <div className="text-xs">
                                            <span className="font-medium">Options:</span>{' '}
                                            {(studentWrongAnswers[item.question_id][0].options as string[]).map((option, idx) => {
                                              const isCorrect = option === studentWrongAnswers[item.question_id][0].correct_answer;
                                              return (
                                                <span key={idx}>
                                                  {idx > 0 && ', '}
                                                  <span className={isCorrect ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}>
                                                    {option}
                                                  </span>
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>

                                      {/* Student list */}
                                      <div className="max-h-[250px] overflow-y-auto space-y-1.5">
                                        {studentWrongAnswers[item.question_id].map((answer, idx) => (
                                          <div 
                                            key={`${answer.student_id}-${answer.attempt_id}-${idx}`}
                                            className="text-sm flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/50"
                                          >
                                            <span className="font-medium truncate">{answer.student_name}</span>
                                            <span className="text-muted-foreground">--</span>
                                            <span className="text-destructive font-medium truncate">
                                              {answer.student_answer || 'No answer'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                      No wrong answers found
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <span className="font-semibold text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap text-right">{item.total_attempts_count}</td>
                        <td className="p-2 align-middle whitespace-nowrap text-right">
                          {getWrongPercentageBadge(item.wrong_percentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Data Available</p>
                <p className="text-sm mt-2">
                  No exam attempts found for questions in this bank.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State - Before Analysis */}
      {!hasAnalyzed && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Ready to Analyze</p>
              <p className="text-sm mt-2">
                Select a question bank and click "Analyze" to view wrong answer statistics
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
