import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, FileText, Eye, Save, ArrowLeft, ArrowRight, Layers, Filter, Shuffle, ChevronDown, ChevronUp } from 'lucide-react';
import { profileApi, academicApi, subjectApi, questionApi, lessonApi } from '@/db/api';
import { TemplateManagementDialog } from '@/components/teacher/TemplateManagementDialog';
import { VersionGenerationDialog } from '@/components/teacher/VersionGenerationDialog';
import { SmartSelectionPanel } from '@/components/teacher/SmartSelectionPanel';
import { MathRenderer } from '@/components/ui/math-renderer';
import type { Profile, Class, Subject, Question, QuestionPaper, QuestionPaperWithDetails, QuestionPaperTemplate, Lesson } from '@/types/types';

// Utility function to remove segment prefix from answer options
const normalizeAnswerOption = (answer: string): string => {
  // Remove patterns like "(i) ", "(ii) ", "(iii) ", etc. from the beginning
  return answer.replace(/^\([ivxIVX]+\)\s*/, '').trim();
};

// Utility function to strip HTML tags from text
const stripHtmlTags = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function QuestionPaperPreparation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftPaperId, setDraftPaperId] = useState<string | null>(null);

  // Step 1: Basic Details
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [paperTitle, setPaperTitle] = useState('');

  // Step 2: Question Selection
  const [viewMode, setViewMode] = useState<'all' | 'bank' | 'selected'>('all');
  const [questionBankNames, setQuestionBankNames] = useState<string[]>([]);
  const [selectedBankName, setSelectedBankName] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionUsageStats, setQuestionUsageStats] = useState<Record<string, { count: number; papers: { id: string; title: string }[] }>>({});

  // Preview
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  // New Enhancement Features
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterLesson, setFilterLesson] = useState<string>('all');
  const [filterQuestionText, setFilterQuestionText] = useState<string>('');
  const [filterQuestionType, setFilterQuestionType] = useState<string>('all');
  const [filterMarks, setFilterMarks] = useState<string>('all');

  // Random Selection Feature
  const [randomCount, setRandomCount] = useState<number>(5);
  const [randomMode, setRandomMode] = useState<'simple' | 'by-difficulty' | 'by-lesson'>('simple');
  const [selectionAction, setSelectionAction] = useState<'replace' | 'add'>('add');
  const [difficultyDistribution, setDifficultyDistribution] = useState({ easy: 3, medium: 5, hard: 2 });
  const [showRandomPanel, setShowRandomPanel] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      loadLessons();
      if (currentStep === 2) {
        loadQuestions();
      }
    }
  }, [selectedSubject, viewMode, selectedBankName, currentStep]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const profileData = await profileApi.getCurrentProfile();
      setProfile(profileData);

      if (profileData?.role === 'teacher' && profileData.id) {
        // For teachers, load only assigned classes
        const [classesData, bankNames] = await Promise.all([
          academicApi.getTeacherAssignedClasses(profileData.id),
          questionApi.getTeacherQuestionBankNames(),
        ]);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setQuestionBankNames(Array.isArray(bankNames) ? bankNames : []);

        // Check if we're editing a draft paper
        const draftPaper = (location.state as { draftPaper?: QuestionPaperWithDetails })?.draftPaper;
        if (draftPaper) {
          await loadDraftPaper(draftPaper);
        }
      } else {
        // For non-teachers (shouldn't happen, but fallback)
        const classesData = await academicApi.getAllClasses();
        setClasses(Array.isArray(classesData) ? classesData : []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDraftPaper = async (draftPaper: QuestionPaperWithDetails) => {
    try {
      // Set draft paper ID for updating instead of creating new
      setDraftPaperId(draftPaper.id);
      
      // Set basic details
      setPaperTitle(draftPaper.title);
      setSelectedClass(draftPaper.class_id);
      setSelectedSubject(draftPaper.subject_id);

      // Load subjects for the selected class
      if (profile?.id) {
        const subjectsData = await subjectApi.getTeacherAssignedSubjects(profile.id, draftPaper.class_id);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      }

      // Load questions for the selected subject
      let allQuestions: Question[] = [];
      if (draftPaper.subject_id) {
        const questions = await questionApi.getTeacherQuestionsBySubject(draftPaper.subject_id);
        allQuestions = Array.isArray(questions) ? questions : [];
        setAvailableQuestions(allQuestions);
      }

      // Load the questions for this paper (with shuffled data)
      const paperQuestions = await academicApi.getQuestionPaperQuestions(draftPaper.id);
      
      // Sort by display_order to maintain the shuffled order
      paperQuestions.sort((a, b) => a.display_order - b.display_order);
      
      const questionIds = paperQuestions.map(pq => pq.question_id);
      setSelectedQuestions(questionIds);

      // Generate preview with the selected questions in the correct order
      // and with shuffled options if available
      const selectedQuestionsForPreview = paperQuestions.map(pq => {
        const question = pq.question;
        if (!question) return null;
        
        // If this paper has shuffled options, use them for the preview
        if (pq.shuffled_options || pq.shuffled_answer_options) {
          return {
            ...question,
            options: pq.shuffled_options || question.options,
            answer_options: pq.shuffled_answer_options || question.answer_options,
          };
        }
        
        return question;
      }).filter((q): q is Question => q !== null);
      
      setPreviewQuestions(selectedQuestionsForPreview);

      // Move to step 3 (Preview)
      setCurrentStep(3);

      toast.success('Draft paper loaded successfully');
    } catch (error) {
      console.error('Error loading draft paper:', error);
      toast.error('Failed to load draft paper');
    }
  };

  const loadSubjects = async () => {
    try {
      if (!profile?.id || !selectedClass) return;

      if (profile.role === 'teacher') {
        // For teachers, load only assigned subjects for the selected class
        const subjectsData = await subjectApi.getTeacherAssignedSubjects(profile.id, selectedClass);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      } else {
        // For non-teachers (shouldn't happen, but fallback)
        const subjectsData = await subjectApi.getAllSubjects();
        const filteredSubjects = subjectsData.filter(s => s.class_id === selectedClass);
        setSubjects(Array.isArray(filteredSubjects) ? filteredSubjects : []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const loadLessons = async () => {
    try {
      if (!selectedSubject) return;
      const lessonsData = await lessonApi.getLessonsBySubject(selectedSubject);
      setLessons(Array.isArray(lessonsData) ? lessonsData : []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      let questions: Question[] = [];

      if (viewMode === 'all' || viewMode === 'selected') {
        // Load all questions for 'all' and 'selected' view modes
        questions = await questionApi.getTeacherQuestionsBySubject(selectedSubject);
      } else if (viewMode === 'bank' && selectedBankName) {
        questions = await questionApi.getQuestionsByBankName(selectedBankName);
      }

      setAvailableQuestions(Array.isArray(questions) ? questions : []);

      // Load usage statistics for all questions
      if (questions.length > 0) {
        const questionIds = questions.map(q => q.id);
        const usageStats = await questionApi.getQuestionUsageStats(questionIds);
        setQuestionUsageStats(usageStats);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionToggle = (questionId: string) => {
    const index = selectedQuestions.indexOf(questionId);
    if (index > -1) {
      // Remove question
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      // Add question to the end (maintains insertion order)
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === availableQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(availableQuestions.map(q => q.id));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedClass || !selectedSubject || !paperTitle.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 2) {
      if (selectedQuestions.length === 0) {
        toast.error('Please select at least one question');
        return;
      }
      // Generate preview when moving to step 3
      const questions = availableQuestions.filter(q => selectedQuestions.includes(q.id));
      // Sort questions by their selection order
      const orderedQuestions = selectedQuestions
        .map(id => questions.find(q => q.id === id))
        .filter((q): q is Question => q !== undefined);
      setPreviewQuestions(orderedQuestions);
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const generatePreview = () => {
    const questions = availableQuestions.filter(q => selectedQuestions.includes(q.id));
    // Sort questions by their selection order
    const orderedQuestions = selectedQuestions
      .map(id => questions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
    setPreviewQuestions(orderedQuestions);
  };

  const saveQuestionPaper = async (status: 'draft' | 'final') => {
    if (!profile?.school_id) {
      toast.error('School information not found');
      return null;
    }

    // Validation: Prevent finalizing papers with no questions
    if (status === 'final' && selectedQuestions.length === 0) {
      toast.error('Cannot finalize a question paper with no questions. Please add at least one question.');
      return null;
    }

    try {
      setSaving(true);

      let paperId: string;

      if (draftPaperId) {
        // Update existing draft
        const updateData = {
          title: paperTitle,
          status: status,
        };
        
        const updatedPaper = await academicApi.updateQuestionPaper(draftPaperId, updateData);
        
        if (!updatedPaper) {
          throw new Error('Failed to update question paper');
        }
        
        paperId = draftPaperId;

        // Get existing questions to check if selection has changed
        const existingQuestions = await academicApi.getQuestionPaperQuestions(draftPaperId);
        const existingQuestionIds = existingQuestions.map(pq => pq.question_id);
        
        // Check if the question selection has changed
        const selectionChanged = 
          existingQuestionIds.length !== selectedQuestions.length ||
          selectedQuestions.some(id => !existingQuestionIds.includes(id));

        // Only update questions if the selection has changed
        // This preserves shuffled_options and display_order when just changing status
        if (selectionChanged) {
          // Delete existing questions and re-add them
          for (const pq of existingQuestions) {
            await academicApi.removeQuestionFromPaper(pq.id);
          }

          // Add all selected questions to the paper in the order they were selected
          for (let i = 0; i < selectedQuestions.length; i++) {
            const questionId = selectedQuestions[i];
            await academicApi.addQuestionToPaper({
              question_paper_id: paperId,
              question_id: questionId,
              display_order: i + 1,
              shuffled_options: null,
              shuffled_answer_options: null,
            });
          }
        }
        // If selection hasn't changed, we don't touch question_paper_questions
        // This preserves shuffled_options, shuffled_answer_options, and display_order
      } else {
        // Create new question paper
        const paperData = {
          school_id: profile.school_id,
          class_id: selectedClass,
          subject_id: selectedSubject,
          title: paperTitle,
          status: status,
          shuffle_questions: false,
          shuffle_mcq_options: false,
          created_by: profile.id,
          template_id: null,
          difficulty_distribution: { easy: 0, medium: 0, hard: 0 },
          lesson_coverage: [],
          has_versions: false,
        };

        const createdPaper = await academicApi.createQuestionPaper(paperData);
        
        if (!createdPaper) {
          throw new Error('Failed to create question paper');
        }
        
        paperId = createdPaper.id;

        // Add all selected questions to the paper in the order they were selected
        for (let i = 0; i < selectedQuestions.length; i++) {
          const questionId = selectedQuestions[i];
          await academicApi.addQuestionToPaper({
            question_paper_id: paperId,
            question_id: questionId,
            display_order: i + 1,
            shuffled_options: null,
            shuffled_answer_options: null,
          });
        }
      }

      return { id: paperId };
    } catch (error) {
      console.error('Error saving question paper:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    if (!paperTitle.trim()) {
      toast.error('Please enter a paper title');
      return;
    }

    try {
      const paper = await saveQuestionPaper('draft');
      if (paper) {
        toast.success(draftPaperId ? 'Draft updated successfully' : 'Question paper saved as draft successfully');
        navigate('/teacher/question-papers');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    }
  };

  const handleGenerateFinal = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    if (!paperTitle.trim()) {
      toast.error('Please enter a paper title');
      return;
    }

    try {
      const paper = await saveQuestionPaper('final');
      if (paper) {
        toast.success(draftPaperId ? 'Question paper updated and finalized successfully' : 'Question paper generated successfully');
        navigate('/teacher/question-papers');
      }
    } catch (error) {
      console.error('Error generating paper:', error);
      toast.error('Failed to generate question paper');
    }
  };

  // New Enhancement Handlers
  const handleTemplateSelect = (template: QuestionPaperTemplate) => {
    setSelectedClass(template.class_id);
    setSelectedSubject(template.subject_id);
    setPaperTitle(template.name);
    toast.success('Template applied! Configure questions in Step 2');
  };

  const handleAutoSelectQuestions = (questionIds: string[]) => {
    setSelectedQuestions(questionIds);
    toast.success(`${questionIds.length} questions selected`);
  };

  const handleBulkSelectByDifficulty = (difficulty: string) => {
    const filtered = availableQuestions.filter(q => q.difficulty === difficulty);
    const ids = filtered.map(q => q.id);
    setSelectedQuestions(ids);
    toast.success(`Selected ${ids.length} ${difficulty} questions`);
  };

  const handleBulkSelectByLesson = (lessonId: string) => {
    const filtered = availableQuestions.filter(q => q.lesson_id === lessonId);
    const ids = filtered.map(q => q.id);
    setSelectedQuestions(ids);
    toast.success(`Selected ${ids.length} questions from lesson`);
  };

  const handleClearSelection = () => {
    setSelectedQuestions([]);
    toast.success('Selection cleared');
  };

  const resetFilters = () => {
    setFilterDifficulty('all');
    setFilterLesson('all');
    setFilterQuestionText('');
    setFilterQuestionType('all');
    setFilterMarks('all');
  };

  const getFilteredQuestions = () => {
    let filtered = availableQuestions;

    // If in 'selected' view mode, only show selected questions
    if (viewMode === 'selected') {
      filtered = filtered.filter(q => selectedQuestions.includes(q.id));
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }

    if (filterLesson !== 'all') {
      filtered = filtered.filter(q => q.lesson_id === filterLesson);
    }

    if (filterQuestionType !== 'all') {
      filtered = filtered.filter(q => q.question_type === filterQuestionType);
    }

    if (filterMarks !== 'all') {
      const marks = parseInt(filterMarks);
      filtered = filtered.filter(q => q.marks === marks);
    }

    if (filterQuestionText.trim() !== '') {
      const searchText = filterQuestionText.toLowerCase().trim();
      filtered = filtered.filter(q => {
        // Search in question text (strip HTML tags first)
        const questionText = stripHtmlTags(q.question_text).toLowerCase();
        return questionText.includes(searchText);
      });
    }

    return filtered;
  };

  // Random Selection Handler
  const handleRandomSelection = () => {
    const filteredQuestions = getFilteredQuestions();
    
    if (filteredQuestions.length === 0) {
      toast.error('No questions available to select from');
      return;
    }

    let selectedIds: string[] = [];

    if (randomMode === 'simple') {
      // Simple random selection
      if (randomCount > filteredQuestions.length) {
        toast.error(`Only ${filteredQuestions.length} questions available. Cannot select ${randomCount}.`);
        return;
      }

      // Shuffle and pick random questions
      const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
      selectedIds = shuffled.slice(0, randomCount).map(q => q.id);

    } else if (randomMode === 'by-difficulty') {
      // Random selection by difficulty distribution
      const easyQuestions = filteredQuestions.filter(q => q.difficulty === 'easy');
      const mediumQuestions = filteredQuestions.filter(q => q.difficulty === 'medium');
      const hardQuestions = filteredQuestions.filter(q => q.difficulty === 'hard');

      // Validate availability
      if (difficultyDistribution.easy > easyQuestions.length) {
        toast.error(`Only ${easyQuestions.length} easy questions available. Requested ${difficultyDistribution.easy}.`);
        return;
      }
      if (difficultyDistribution.medium > mediumQuestions.length) {
        toast.error(`Only ${mediumQuestions.length} medium questions available. Requested ${difficultyDistribution.medium}.`);
        return;
      }
      if (difficultyDistribution.hard > hardQuestions.length) {
        toast.error(`Only ${hardQuestions.length} hard questions available. Requested ${difficultyDistribution.hard}.`);
        return;
      }

      // Select random questions from each difficulty
      const selectedEasy = [...easyQuestions].sort(() => Math.random() - 0.5).slice(0, difficultyDistribution.easy);
      const selectedMedium = [...mediumQuestions].sort(() => Math.random() - 0.5).slice(0, difficultyDistribution.medium);
      const selectedHard = [...hardQuestions].sort(() => Math.random() - 0.5).slice(0, difficultyDistribution.hard);

      selectedIds = [
        ...selectedEasy.map(q => q.id),
        ...selectedMedium.map(q => q.id),
        ...selectedHard.map(q => q.id),
      ];

    } else if (randomMode === 'by-lesson') {
      // Random selection ensuring even distribution across lessons
      const lessonGroups = new Map<string, Question[]>();
      
      filteredQuestions.forEach(q => {
        const lessonId = q.lesson_id || 'unassigned';
        if (!lessonGroups.has(lessonId)) {
          lessonGroups.set(lessonId, []);
        }
        lessonGroups.get(lessonId)!.push(q);
      });

      const lessonsArray = Array.from(lessonGroups.entries());
      const questionsPerLesson = Math.floor(randomCount / lessonsArray.length);
      const remainder = randomCount % lessonsArray.length;

      lessonsArray.forEach(([lessonId, questions], index) => {
        const count = questionsPerLesson + (index < remainder ? 1 : 0);
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, questions.length));
        selectedIds.push(...selected.map(q => q.id));
      });

      // If we couldn't get enough questions (some lessons had fewer questions), fill up from remaining
      if (selectedIds.length < randomCount) {
        const remaining = filteredQuestions.filter(q => !selectedIds.includes(q.id));
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);
        const needed = randomCount - selectedIds.length;
        selectedIds.push(...shuffled.slice(0, needed).map(q => q.id));
      }
    }

    // Apply selection action
    if (selectionAction === 'replace') {
      setSelectedQuestions(selectedIds);
      toast.success(`${selectedIds.length} questions randomly selected`);
    } else {
      // Add mode: append new selections to existing ones (maintains order)
      const newSelection = [...selectedQuestions, ...selectedIds.filter(id => !selectedQuestions.includes(id))];
      setSelectedQuestions(newSelection);
      toast.success(`${selectedIds.length} questions added to selection (Total: ${newSelection.length})`);
    }
    
    // Auto-minimize the random selection panel after selection is complete
    setShowRandomPanel(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'MCQ (Single)';
      case 'multiple_response':
        return 'MCQ (Multiple)';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      case 'match_following':
        return 'Match Following';
      default:
        return type;
    }
  };

  const calculateTotalMarks = () => {
    // If we're in preview mode (step 3) and have preview questions, use those
    // This ensures correct calculation for shuffled papers loaded from drafts
    if (currentStep === 3 && previewQuestions.length > 0) {
      const total = previewQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
      return total;
    }
    
    // Otherwise, calculate from selected questions in their selection order
    const selectedQuestionsArray = selectedQuestions
      .map(id => availableQuestions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
    const total = selectedQuestionsArray.reduce((sum, q) => sum + (q.marks || 0), 0);
    return total;
  };

  if (loading && currentStep === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Question Paper Preparation</h1>
        <p className="text-muted-foreground">Create and manage question papers for exams</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Basic Details</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Select Questions</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex items-center ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Preview & Save</span>
          </div>
        </div>
      </div>

      {/* Step 1: Basic Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Select class, subject, and enter paper title</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paper-title">Paper Title *</Label>
              <Input
                id="paper-title"
                placeholder="e.g., Mid-Term Examination 2025"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                  disabled={!selectedClass}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <TemplateManagementDialog
                teacherId={profile?.id || ''}
                schoolId={profile?.school_id || ''}
                classes={classes}
                subjects={subjects}
                onTemplateSelect={handleTemplateSelect}
              />
              <Button
                onClick={handleNextStep}
                disabled={!selectedClass || !selectedSubject || !paperTitle.trim()}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Question Selection */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Selection */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Select Questions</CardTitle>
                <CardDescription>Choose questions from your question bank</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={viewMode} onValueChange={(v) => {
                  const newMode = v as 'all' | 'bank' | 'selected';
                  setViewMode(newMode);
                  // Reset filters when switching to "View Selected"
                  if (newMode === 'selected') {
                    resetFilters();
                  }
                }}>
                  <TabsList>
                    <TabsTrigger value="all">View All Questions</TabsTrigger>
                    <TabsTrigger value="bank">View by Question Bank</TabsTrigger>
                    <TabsTrigger value="selected">
                      View Selected ({selectedQuestions.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Difficulty</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Select value={filterLesson} onValueChange={setFilterLesson}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Lessons" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Lessons</SelectItem>
                          {lessons.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id}>
                              {lesson.lesson_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filterQuestionType} onValueChange={setFilterQuestionType}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Question Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="mcq">MCQ (Single)</SelectItem>
                          <SelectItem value="multiple_response">MCQ (Multiple)</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="match_following">Match Following</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterMarks} onValueChange={setFilterMarks}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Marks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Marks</SelectItem>
                          <SelectItem value="1">1 Mark</SelectItem>
                          <SelectItem value="2">2 Marks</SelectItem>
                          <SelectItem value="3">3 Marks</SelectItem>
                          <SelectItem value="4">4 Marks</SelectItem>
                          <SelectItem value="5">5 Marks</SelectItem>
                        </SelectContent>
                      </Select>


                      <Input
                        type="text"
                        placeholder="Question Text"
                        value={filterQuestionText}
                        onChange={(e) => setFilterQuestionText(e.target.value)}
                        className="w-[200px]"
                      />
                    </div>

                    {/* Random Selection Panel */}
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shuffle className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">Random Selection</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRandomPanel(!showRandomPanel)}
                          >
                            {showRandomPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          Randomly select questions from filtered results
                        </CardDescription>
                      </CardHeader>
                      {showRandomPanel && (
                        <CardContent className="space-y-4">
                          {/* Selection Mode */}
                          <div className="space-y-2">
                            <Label className="text-sm">Selection Mode</Label>
                            <Select value={randomMode} onValueChange={(v) => setRandomMode(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="simple">Simple Random</SelectItem>
                                <SelectItem value="by-difficulty">By Difficulty Distribution</SelectItem>
                                <SelectItem value="by-lesson">By Lesson Distribution</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Simple Mode */}
                          {randomMode === 'simple' && (
                            <div className="space-y-2">
                              <Label className="text-sm">Number of Questions</Label>
                              <Input
                                type="number"
                                min="1"
                                value={randomCount}
                                onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
                                placeholder="e.g., 5, 10, 15"
                              />
                            </div>
                          )}

                          {/* By Difficulty Mode */}
                          {randomMode === 'by-difficulty' && (
                            <div className="space-y-3">
                              <Label className="text-sm">Difficulty Distribution</Label>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Easy</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={difficultyDistribution.easy}
                                    onChange={(e) => setDifficultyDistribution({
                                      ...difficultyDistribution,
                                      easy: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Medium</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={difficultyDistribution.medium}
                                    onChange={(e) => setDifficultyDistribution({
                                      ...difficultyDistribution,
                                      medium: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Hard</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={difficultyDistribution.hard}
                                    onChange={(e) => setDifficultyDistribution({
                                      ...difficultyDistribution,
                                      hard: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Total: {difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard} questions
                              </p>
                            </div>
                          )}

                          {/* By Lesson Mode */}
                          {randomMode === 'by-lesson' && (
                            <div className="space-y-2">
                              <Label className="text-sm">Number of Questions</Label>
                              <Input
                                type="number"
                                min="1"
                                value={randomCount}
                                onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
                                placeholder="e.g., 10"
                              />
                              <p className="text-xs text-muted-foreground">
                                Questions will be distributed evenly across all lessons in filtered results
                              </p>
                            </div>
                          )}

                          {/* Selection Action */}
                          <div className="space-y-2">
                            <Label className="text-sm">Action</Label>
                            <Select value={selectionAction} onValueChange={(v) => setSelectionAction(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="replace">Replace Current Selection</SelectItem>
                                <SelectItem value="add">Add to Current Selection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Select Random Button */}
                          <Button
                            onClick={handleRandomSelection}
                            className="w-full"
                            variant="default"
                          >
                            <Shuffle className="mr-2 h-4 w-4" />
                            Select Random Questions
                          </Button>
                        </CardContent>
                      )}
                    </Card>

                    {/* Bulk Operations */}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {selectedQuestions.length === availableQuestions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleBulkSelectByDifficulty('easy')}>
                        Select Easy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleBulkSelectByDifficulty('medium')}>
                        Select Medium
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleBulkSelectByDifficulty('hard')}>
                        Select Hard
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearSelection}>
                        Clear
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {getFilteredQuestions().length} questions available
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="bank" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Question Bank Name</Label>
                      <Select value={selectedBankName} onValueChange={setSelectedBankName}>
                        <SelectTrigger id="bank-name">
                          <SelectValue placeholder="Select question bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {questionBankNames.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Difficulty</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Select value={filterLesson} onValueChange={setFilterLesson}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Lessons" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Lessons</SelectItem>
                          {lessons.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id}>
                              {lesson.lesson_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filterQuestionType} onValueChange={setFilterQuestionType}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Question Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="mcq">MCQ (Single)</SelectItem>
                          <SelectItem value="multiple_response">MCQ (Multiple)</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="match_following">Match Following</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterMarks} onValueChange={setFilterMarks}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Marks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Marks</SelectItem>
                          <SelectItem value="1">1 Mark</SelectItem>
                          <SelectItem value="2">2 Marks</SelectItem>
                          <SelectItem value="3">3 Marks</SelectItem>
                          <SelectItem value="4">4 Marks</SelectItem>
                          <SelectItem value="5">5 Marks</SelectItem>
                        </SelectContent>
                      </Select>


                      <Input
                        type="text"
                        placeholder="Question Text"
                        value={filterQuestionText}
                        onChange={(e) => setFilterQuestionText(e.target.value)}
                        className="w-[200px]"
                      />
                    </div>

                    {/* Random Selection Panel */}
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shuffle className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">Random Selection</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRandomPanel(!showRandomPanel)}
                          >
                            {showRandomPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          Randomly select questions from filtered results
                        </CardDescription>
                      </CardHeader>
                      {showRandomPanel && (
                        <CardContent className="space-y-4">
                          {/* Selection Mode */}
                          <div className="space-y-2">
                            <Label className="text-sm">Selection Mode</Label>
                            <Select value={randomMode} onValueChange={(v) => setRandomMode(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="simple">Simple Random</SelectItem>
                                <SelectItem value="by-difficulty">By Difficulty Distribution</SelectItem>
                                <SelectItem value="by-lesson">By Lesson Distribution</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Simple Mode */}
                          {randomMode === 'simple' && (
                            <div className="space-y-2">
                              <Label className="text-sm">Number of Questions</Label>
                              <Input
                                type="number"
                                min="1"
                                value={randomCount}
                                onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
                                placeholder="e.g., 5, 10, 15"
                              />
                            </div>
                          )}

                          {/* By Difficulty Mode */}
                          {randomMode === 'by-difficulty' && (
                            <div className="space-y-3">
                              <Label className="text-sm">Difficulty Distribution</Label>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Easy</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={difficultyDistribution.easy}
                                    onChange={(e) => setDifficultyDistribution({
                                      ...difficultyDistribution,
                                      easy: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Medium</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={difficultyDistribution.medium}
                                    onChange={(e) => setDifficultyDistribution({
                                      ...difficultyDistribution,
                                      medium: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Hard</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={difficultyDistribution.hard}
                                    onChange={(e) => setDifficultyDistribution({
                                      ...difficultyDistribution,
                                      hard: parseInt(e.target.value) || 0
                                    })}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Total: {difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard} questions
                              </p>
                            </div>
                          )}

                          {/* By Lesson Mode */}
                          {randomMode === 'by-lesson' && (
                            <div className="space-y-2">
                              <Label className="text-sm">Number of Questions</Label>
                              <Input
                                type="number"
                                min="1"
                                value={randomCount}
                                onChange={(e) => setRandomCount(parseInt(e.target.value) || 1)}
                                placeholder="e.g., 10"
                              />
                              <p className="text-xs text-muted-foreground">
                                Questions will be distributed evenly across all lessons in filtered results
                              </p>
                            </div>
                          )}

                          {/* Selection Action */}
                          <div className="space-y-2">
                            <Label className="text-sm">Action</Label>
                            <Select value={selectionAction} onValueChange={(v) => setSelectionAction(v as any)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="replace">Replace Current Selection</SelectItem>
                                <SelectItem value="add">Add to Current Selection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Select Random Button */}
                          <Button
                            onClick={handleRandomSelection}
                            className="w-full"
                            variant="default"
                          >
                            <Shuffle className="mr-2 h-4 w-4" />
                            Select Random Questions
                          </Button>
                        </CardContent>
                      )}
                    </Card>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {availableQuestions.length} questions available
                      </p>
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {selectedQuestions.length === availableQuestions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="selected" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Difficulty</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Select value={filterLesson} onValueChange={setFilterLesson}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="All Lessons" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Lessons</SelectItem>
                          {lessons.map((lesson) => (
                            <SelectItem key={lesson.id} value={lesson.id}>
                              {lesson.lesson_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={filterQuestionType} onValueChange={setFilterQuestionType}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Question Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="mcq">MCQ (Single)</SelectItem>
                          <SelectItem value="multiple_response">MCQ (Multiple)</SelectItem>
                          <SelectItem value="true_false">True/False</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="match_following">Match Following</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={filterMarks} onValueChange={setFilterMarks}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Marks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Marks</SelectItem>
                          <SelectItem value="1">1 Mark</SelectItem>
                          <SelectItem value="2">2 Marks</SelectItem>
                          <SelectItem value="3">3 Marks</SelectItem>
                          <SelectItem value="4">4 Marks</SelectItem>
                          <SelectItem value="5">5 Marks</SelectItem>
                        </SelectContent>
                      </Select>


                      <Input
                        type="text"
                        placeholder="Question Text"
                        value={filterQuestionText}
                        onChange={(e) => setFilterQuestionText(e.target.value)}
                        className="w-[200px]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {selectedQuestions.length} questions selected
                      </p>
                      <Button variant="outline" size="sm" onClick={handleClearSelection}>
                        Clear All
                      </Button>
                    </div>

                    {selectedQuestions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No questions selected yet.</p>
                        <p className="text-sm mt-2">Switch to "View All Questions" or "View by Question Bank" to select questions.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead className="min-w-[350px]">Question</TableHead>
                          <TableHead className="w-36">Type</TableHead>
                          <TableHead className="w-32">Difficulty</TableHead>
                          <TableHead className="w-24">Marks</TableHead>
                          <TableHead className="w-32">Usage Count</TableHead>
                          <TableHead className="min-w-[250px]">Used In Papers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredQuestions().length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              No questions available
                            </TableCell>
                          </TableRow>
                        ) : (
                          getFilteredQuestions().map((question, index) => {
                            const usage = questionUsageStats[question.id] || { count: 0, papers: [] };
                            // Use the persistent serial_number from the database
                            const serialNumber = question.serial_number || (index + 1).toString().padStart(3, '0');
                            return (
                            <TableRow key={question.id}>
                              <TableCell className="align-top w-12">
                                <Checkbox
                                  checked={selectedQuestions.includes(question.id)}
                                  onCheckedChange={() => handleQuestionToggle(question.id)}
                                />
                              </TableCell>
                              <TableCell className="align-top w-16">
                                <span className="font-medium text-muted-foreground">#{serialNumber}</span>
                              </TableCell>
                              <TableCell className="align-top min-w-[350px]">
                                <MathRenderer 
                                  content={question.question_text}
                                  className="question-content whitespace-normal"
                                />
                              </TableCell>
                              <TableCell className="align-top w-36">
                                <Badge variant="outline">{getQuestionTypeLabel(question.question_type)}</Badge>
                              </TableCell>
                              <TableCell className="align-top w-32">
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top w-24 text-center">{question.marks}</TableCell>
                              <TableCell className="align-top w-32">
                                <Badge variant={usage.count === 0 ? "secondary" : "default"}>
                                  {usage.count} {usage.count === 1 ? 'time' : 'times'}
                                </Badge>
                              </TableCell>
                              <TableCell className="align-top min-w-[250px]">
                                {usage.count === 0 ? (
                                  <span className="text-sm text-muted-foreground">Not used yet</span>
                                ) : (
                                  <div className="space-y-1">
                                    {usage.papers.map((paper) => (
                                      <div key={paper.id} className="text-sm text-muted-foreground">
                                        • {paper.title}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={handlePreviousStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {selectedQuestions.length} question(s) selected | Total Marks: {calculateTotalMarks()}
                  </div>
                  <Button onClick={handleNextStep} disabled={selectedQuestions.length === 0}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Smart Selection Panel */}
          <div className="lg:col-span-1">
            <SmartSelectionPanel
              availableQuestions={availableQuestions}
              selectedQuestions={selectedQuestions}
              lessons={lessons}
              onAutoSelect={handleAutoSelectQuestions}
            />
          </div>
        </div>
      )}

      {/* Step 3: Preview & Save */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card className="print-hide">
            <CardHeader>
              <CardTitle>Preview & Save</CardTitle>
              <CardDescription>Review your question paper and save it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{paperTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuestions.length} questions | Total Marks: {calculateTotalMarks()}
                  </p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>💡 <strong>Note:</strong> After saving the question paper, you can use it to schedule exams and create different versions with shuffled questions.</p>
              </div>
            </CardContent>
          </Card>

          {previewQuestions.length > 0 && (
            <Card className="print-content">
              <CardHeader className="print-hide">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Question Paper Preview</CardTitle>
                    <CardDescription>
                      {paperTitle} | Total Marks: {calculateTotalMarks()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAnswerKey}
                        onChange={(e) => setShowAnswerKey(e.target.checked)}
                        className="rounded"
                      />
                      Show Answer Key
                    </label>
                  </div>
                </div>
              </CardHeader>
              
              {/* Print Header - Only visible when printing */}
              <div className="print-header hidden print:block">
                <h1>Question Paper Preview</h1>
                <p className="font-medium">{paperTitle} | Total Marks: {calculateTotalMarks()}</p>
                {showAnswerKey && <p className="text-sm mt-2">(With Answer Key)</p>}
              </div>

              <CardContent className="space-y-6">
                {previewQuestions.map((question, index) => (
                  <div key={question.id} className="border-b pb-4 last:border-b-0 question-item">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="font-medium">Q{index + 1}. </span>
                        <MathRenderer 
                          content={question.question_text}
                          className="question-content font-medium inline"
                        />
                      </div>
                      {/* Print version - simple text badge */}
                      <span className="hidden print:inline-block marks-badge ml-4 flex-shrink-0">
                        {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                      </span>
                      {/* Screen version - colored badge */}
                      <Badge className={`${getDifficultyColor(question.difficulty)} print:hidden flex-shrink-0`}>
                        {question.marks} marks
                      </Badge>
                    </div>

                    {/* Question Image */}
                    {question.image_url && (
                      <div className="ml-4 mt-2 mb-3">
                        <img 
                          src={question.image_url} 
                          alt="Question illustration" 
                          className="max-w-md rounded border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {question.question_type === 'mcq' && Array.isArray(question.options) && (
                      <div className="ml-4 space-y-1 mt-2">
                        {(question.options as string[]).map((option, idx) => (
                          <div key={idx} className="text-sm">
                            {String.fromCharCode(65 + idx)}. <MathRenderer content={option} className="inline" />
                          </div>
                        ))}
                      </div>
                    )}

                    {question.question_type === 'multiple_response' && Array.isArray(question.options) && (
                      <div className="ml-4 mt-2 space-y-3">
                        {/* Segment 2: Options (A, B, C, D) */}
                        <div className="space-y-1">
                          {(question.options as string[]).map((option, idx) => (
                            <div key={idx} className="text-sm">
                              {String.fromCharCode(65 + idx)}. <span dangerouslySetInnerHTML={{ __html: option }} />
                            </div>
                          ))}
                        </div>

                        {/* Segment 3: Answer Options (i, ii, iii, iv) */}
                        {question.answer_options && Array.isArray(question.answer_options) && question.answer_options.length > 0 && (
                          <div className="space-y-1 pt-2 border-t">
                            {question.answer_options.map((answerOption, idx) => (
                              <div key={idx} className="text-sm">
                                ({['i', 'ii', 'iii', 'iv', 'v', 'vi'][idx] || idx + 1}) <span dangerouslySetInnerHTML={{ __html: answerOption }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {question.question_type === 'true_false' && (
                      <div className="ml-4 space-y-1 mt-2">
                        <div className="text-sm">A. True</div>
                        <div className="text-sm">B. False</div>
                      </div>
                    )}

                    {question.question_type === 'match_following' &&
                      Array.isArray(question.options) && (
                        <div className="ml-4 mt-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-semibold mb-2">Column A</p>
                              <div className="space-y-2">
                                {(question.options as any[]).map((pair: any, idx: number) => (
                                  <div key={idx} className="text-sm p-2 rounded border bg-muted">
                                    {idx + 1}. <span dangerouslySetInnerHTML={{ __html: pair.left }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold mb-2">Column B</p>
                              <div className="space-y-2">
                                {(question.options as any[]).map((pair: any, idx: number) => (
                                  <div key={idx} className="text-sm p-2 rounded border bg-muted">
                                    {String.fromCharCode(65 + idx)}. <span dangerouslySetInnerHTML={{ __html: pair.right }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {question.question_type === 'short_answer' && (
                      <div className="ml-4 mt-2">
                        <div className="text-sm text-muted-foreground italic">
                          [Answer space for student]
                        </div>
                      </div>
                    )}

                    {/* Answer Key Display */}
                    {showAnswerKey && (
                      <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20 answer-key-section">
                        <p className="text-sm font-medium text-primary print:text-black">
                          ✓ Answer: {' '}
                          {question.question_type === 'multiple_response'
                            ? question.correct_answer.includes(',')
                              ? question.correct_answer.split(',').map(a => stripHtmlTags(normalizeAnswerOption(a.trim()))).join(', ')
                              : stripHtmlTags(normalizeAnswerOption(question.correct_answer))
                            : question.question_type === 'match_following'
                            ? 'See correct pairs in question'
                            : stripHtmlTags(question.correct_answer || 'Subjective answer required')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between print-hide">
            <Button variant="outline" onClick={handlePreviousStep} disabled={saving}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <div className="flex gap-2">
              {draftPaperId && previewQuestions.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setVersionDialogOpen(true)}
                  disabled={saving}
                >
                  <Layers className="mr-2 h-4 w-4" /> Generate Versions
                </Button>
              )}
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save as Draft
                  </>
                )}
              </Button>
              <Button onClick={handleGenerateFinal} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" /> Generate Final Paper
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Version Generation Dialog */}
      {draftPaperId && (
        <VersionGenerationDialog
          open={versionDialogOpen}
          onOpenChange={setVersionDialogOpen}
          paperId={draftPaperId}
          questions={previewQuestions}
          paperTitle={paperTitle}
        />
      )}
    </div>
  );
}
