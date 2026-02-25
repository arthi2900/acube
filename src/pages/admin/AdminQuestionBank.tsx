import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Globe, Users, Copy, Search, BookOpen, User, Filter, Plus, Trash2, Upload, Edit, MoreVertical, ArrowLeft, ChevronRight, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { questionApi, subjectApi, academicApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { Question, Subject, Class } from '@/types/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { MathRenderer } from '@/components/ui/math-renderer';
import { supabase } from '@/db/supabase';

interface QuestionWithCreator extends Question {
  creator?: {
    id: string;
    full_name: string;
    username: string;
    role?: string;
  };
  subjects?: {
    id: string;
    subject_name: string;
    subject_code: string;
    class_id?: string;
  };
}

interface UserQuestionBank {
  userId: string;
  userName: string;
  userRole: string;
  bankNames: string[];
}

export default function AdminQuestionBank() {
  const [globalQuestions, setGlobalQuestions] = useState<QuestionWithCreator[]>([]);
  const [userQuestions, setUserQuestions] = useState<QuestionWithCreator[]>([]);
  const [userBanks, setUserBanks] = useState<UserQuestionBank[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedGlobalBank, setSelectedGlobalBank] = useState<string | null>(null);
  const [viewQuestionDialog, setViewQuestionDialog] = useState(false);
  const [createQuestionDialog, setCreateQuestionDialog] = useState(false);
  const [editQuestionDialog, setEditQuestionDialog] = useState(false);
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithCreator | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [questionsInGlobal, setQuestionsInGlobal] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [bulkCopyDialog, setBulkCopyDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    question_text: '',
    class_id: '',
    subject_id: '',
    question_type: 'mcq' as 'mcq' | 'true_false' | 'short_answer',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    marks: 1,
    negative_marks: 0,
    options: ['', '', '', ''],
    correct_answer: '',
    image_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [global, users, banks, allSubjects, allClasses] = await Promise.all([
        questionApi.getGlobalQuestions(),
        questionApi.getAllQuestionsWithUsers(),
        questionApi.getUserQuestionBanks(),
        subjectApi.getAllSubjects(),
        academicApi.getAllClasses(),
      ]);
      setGlobalQuestions(global as QuestionWithCreator[]);
      setUserQuestions(users as QuestionWithCreator[]);
      setUserBanks(banks);
      setSubjects(allSubjects);
      setClasses(allClasses);

      // Load questions that are already in global bank
      await loadQuestionsInGlobal();
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsInGlobal = async () => {
    try {
      // Check the new global_questions table for source_question_id
      const { data, error } = await supabase
        .from('global_questions')
        .select('source_question_id')
        .not('source_question_id', 'is', null);

      if (error) throw error;

      const questionIds = new Set(
        data
          .map((q) => q.source_question_id)
          .filter((id): id is string => id !== null)
      );

      setQuestionsInGlobal(questionIds);
    } catch (error) {
      console.error('Error loading global question IDs:', error);
    }
  };

  const handleCopyToGlobal = async (questionId: string) => {
    try {
      // Check if question already exists in global bank
      if (questionsInGlobal.has(questionId)) {
        toast({
          title: 'Already Exists',
          description: 'This question is already in the global question bank',
          variant: 'destructive',
        });
        return;
      }

      await questionApi.copyQuestionToGlobal(questionId);
      toast({
        title: 'Success',
        description: 'Question copied to global bank',
      });
      loadData();
    } catch (error: any) {
      console.error('Error copying question:', error);
      
      // Provide more specific error message
      let errorMessage = 'Failed to copy question to global bank';
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
        errorMessage = 'This question already exists in the global bank';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleBulkCopyToGlobal = async () => {
    try {
      const questionsToProcess = Array.from(selectedQuestions);
      const questionsNotInGlobal = questionsToProcess.filter(id => !questionsInGlobal.has(id));

      if (questionsNotInGlobal.length === 0) {
        toast({
          title: 'Already Exists',
          description: 'All selected questions are already in the global question bank',
          variant: 'destructive',
        });
        setBulkCopyDialog(false);
        return;
      }

      // Copy questions sequentially to handle duplicates gracefully
      let successCount = 0;
      let skipCount = 0;
      const errors: string[] = [];

      for (const questionId of questionsNotInGlobal) {
        try {
          await questionApi.copyQuestionToGlobal(questionId);
          successCount++;
        } catch (error: any) {
          // Check if it's a duplicate error (question already exists in global bank)
          if (error?.message?.includes('already exists') || error?.message?.includes('duplicate')) {
            skipCount++;
          } else {
            errors.push(error?.message || 'Unknown error');
          }
        }
      }

      // Show appropriate message based on results
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} question(s) copied to global bank${skipCount > 0 ? `, ${skipCount} skipped (already exist)` : ''}`,
        });
      } else if (skipCount > 0) {
        toast({
          title: 'Already Exists',
          description: `All ${skipCount} question(s) already exist in the global bank`,
        });
      } else if (errors.length > 0) {
        toast({
          title: 'Error',
          description: `Failed to copy questions: ${errors[0]}`,
          variant: 'destructive',
        });
      }

      setSelectedQuestions(new Set());
      setBulkCopyDialog(false);
      loadData();
    } catch (error) {
      console.error('Error copying questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy questions to global bank',
        variant: 'destructive',
      });
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = (questions: QuestionWithCreator[]) => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    }
  };

  const isAllSelected = (questions: QuestionWithCreator[]) => {
    return questions.length > 0 && selectedQuestions.size === questions.length;
  };

  const isSomeSelected = (questions: QuestionWithCreator[]) => {
    return selectedQuestions.size > 0 && selectedQuestions.size < questions.length;
  };

  const handleViewQuestion = (question: QuestionWithCreator) => {
    setSelectedQuestion(question);
    setViewQuestionDialog(true);
  };

  const handleEditQuestion = (question: QuestionWithCreator) => {
    setSelectedQuestion(question);
    setFormData({
      question_text: question.question_text,
      class_id: question.subjects?.class_id || '',
      subject_id: question.subject_id,
      question_type: question.question_type as 'mcq' | 'true_false' | 'short_answer',
      difficulty: question.difficulty as 'easy' | 'medium' | 'hard',
      marks: question.marks,
      negative_marks: question.negative_marks || 0,
      options: Array.isArray(question.options) && question.options.every(o => typeof o === 'string') 
        ? (question.options as string[]) 
        : ['', '', '', ''],
      correct_answer: question.correct_answer || '',
      image_url: question.image_url || '',
    });
    setEditQuestionDialog(true);
  };

  const handleDeleteClick = (questionId: string) => {
    setQuestionToDelete(questionId);
    setDeleteQuestionDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;

    try {
      await questionApi.deleteQuestion(questionToDelete);
      toast({
        title: 'Success',
        description: 'Question deleted successfully',
      });
      setDeleteQuestionDialog(false);
      setQuestionToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select questions to delete',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedQuestions.size} question(s)?`)) return;

    try {
      // Delete questions one by one
      const deletePromises = Array.from(selectedQuestions).map(id => 
        questionApi.deleteQuestion(id)
      );
      await Promise.all(deletePromises);

      toast({
        title: 'Success',
        description: `${selectedQuestions.size} question(s) deleted successfully`,
      });
      
      setSelectedQuestions(new Set());
      loadData();
    } catch (error: any) {
      toast({
        title: 'Failed to delete questions',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      class_id: '',
      subject_id: '',
      question_type: 'mcq',
      difficulty: 'medium',
      marks: 1,
      negative_marks: 0,
      options: ['', '', '', ''],
      correct_answer: '',
      image_url: '',
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (JPEG, PNG, GIF, or WebP)',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    // Validate file size (max 1MB)
    const maxSize = 1 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Image must be smaller than 1MB',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    setUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('app-85wc5xzx8yyp_question_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('app-85wc5xzx8yyp_question_images')
        .getPublicUrl(data.path);

      setFormData({ ...formData, image_url: urlData.publicUrl });

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });

      event.target.value = '';
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
      event.target.value = '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question_text || !formData.subject_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    let options: any = null;
    let correctAnswer = '';

    if (formData.question_type === 'mcq') {
      options = formData.options.filter(o => o.trim());
      correctAnswer = formData.correct_answer;
      if (!correctAnswer || options.length < 2) {
        toast({
          title: 'Error',
          description: 'MCQ requires at least 2 options and a correct answer',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.question_type === 'true_false') {
      correctAnswer = formData.correct_answer;
      if (!correctAnswer) {
        toast({
          title: 'Error',
          description: 'Please select the correct answer',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.question_type === 'short_answer') {
      correctAnswer = formData.correct_answer;
      if (!correctAnswer) {
        toast({
          title: 'Error',
          description: 'Please provide the correct answer',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await questionApi.createGlobalQuestion({
        question_text: formData.question_text,
        subject_id: formData.subject_id,
        lesson_id: null,
        question_type: formData.question_type,
        difficulty: formData.difficulty,
        marks: formData.marks,
        negative_marks: formData.negative_marks,
        options: options,
        answer_options: null,
        correct_answer: correctAnswer,
        image_url: formData.image_url.trim() || null,
        bank_name: null,
      });

      toast({
        title: 'Success',
        description: 'Global question created successfully',
      });

      resetForm();
      setCreateQuestionDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Failed to create question',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedQuestion || !formData.question_text || !formData.subject_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    let options: any = null;
    let correctAnswer = '';

    if (formData.question_type === 'mcq') {
      options = formData.options.filter(o => o.trim());
      correctAnswer = formData.correct_answer;
      if (!correctAnswer || options.length < 2) {
        toast({
          title: 'Error',
          description: 'MCQ requires at least 2 options and a correct answer',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.question_type === 'true_false') {
      correctAnswer = formData.correct_answer;
      if (!correctAnswer) {
        toast({
          title: 'Error',
          description: 'Please select the correct answer',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.question_type === 'short_answer') {
      correctAnswer = formData.correct_answer;
      if (!correctAnswer) {
        toast({
          title: 'Error',
          description: 'Please provide the correct answer',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await questionApi.updateQuestion(selectedQuestion.id, {
        question_text: formData.question_text,
        subject_id: formData.subject_id,
        question_type: formData.question_type,
        difficulty: formData.difficulty,
        marks: formData.marks,
        negative_marks: formData.negative_marks,
        options: options,
        correct_answer: correctAnswer,
        image_url: formData.image_url.trim() || null,
      });

      toast({
        title: 'Success',
        description: 'Question updated successfully',
      });

      resetForm();
      setEditQuestionDialog(false);
      setSelectedQuestion(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Failed to update question',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast({
        title: 'Error',
        description: 'MCQ must have at least 2 options',
        variant: 'destructive',
      });
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      mcq: 'Multiple Choice',
      true_false: 'True/False',
      short_answer: 'Short Answer',
      match_following: 'Match Following',
      multiple_response: 'Multiple Response',
    };
    return types[type] || type;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-success text-success-foreground',
      medium: 'bg-warning text-warning-foreground',
      hard: 'bg-destructive text-destructive-foreground',
    };
    return colors[difficulty] || 'bg-secondary text-secondary-foreground';
  };

  const filteredGlobalQuestions = globalQuestions.filter((q) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      q.question_text.toLowerCase().includes(searchLower) ||
      q.subjects?.subject_name.toLowerCase().includes(searchLower) ||
      q.creator?.full_name.toLowerCase().includes(searchLower);
    
    // If a bank is selected, only show questions from that bank
    const matchesBank = !selectedGlobalBank || q.bank_name === selectedGlobalBank;
    
    return matchesSearch && matchesBank;
  });

  const filteredUserQuestions = userQuestions.filter((q) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      q.question_text.toLowerCase().includes(searchLower) ||
      q.subjects?.subject_name.toLowerCase().includes(searchLower) ||
      q.creator?.full_name.toLowerCase().includes(searchLower) ||
      q.bank_name?.toLowerCase().includes(searchLower);

    const matchesUser = selectedUser === 'all' || q.created_by === selectedUser;
    const matchesBank = selectedBank === 'all' || q.bank_name === selectedBank;

    return matchesSearch && matchesUser && matchesBank;
  });

  const uniqueUsers = Array.from(
    new Map(
      userQuestions
        .filter((q) => q.creator)
        .map((q) => [q.creator!.id, { id: q.creator!.id, name: q.creator!.full_name }])
    ).values()
  );

  const uniqueBanks = Array.from(
    new Set(userQuestions.filter((q) => q.bank_name).map((q) => q.bank_name!))
  );

  // Get unique global bank names
  const globalBankNames = Array.from(
    new Set(globalQuestions.filter((q) => q.bank_name).map((q) => q.bank_name!))
  ).sort();

  // Filter pending questions (not yet in global bank)
  const pendingQuestions = userQuestions.filter((q) => !questionsInGlobal.has(q.id));

  const filteredPendingQuestions = pendingQuestions.filter((q) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      q.question_text.toLowerCase().includes(searchLower) ||
      q.subjects?.subject_name.toLowerCase().includes(searchLower) ||
      q.creator?.full_name.toLowerCase().includes(searchLower) ||
      q.bank_name?.toLowerCase().includes(searchLower);

    const matchesUser = selectedUser === 'all' || q.created_by === selectedUser;
    const matchesBank = selectedBank === 'all' || q.bank_name === selectedBank;

    return matchesSearch && matchesUser && matchesBank;
  });

  // Group global questions by bank name for the bank list view
  const globalBankGroups = globalBankNames.map(bankName => {
    const questions = globalQuestions.filter(q => q.bank_name === bankName);
    return {
      bankName,
      questionCount: questions.length,
      subjects: Array.from(new Set(questions.map(q => q.subjects?.subject_name).filter(Boolean))),
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Bank Management</h1>
          <p className="text-muted-foreground">Manage global and user question banks</p>
        </div>
        <Dialog open={createQuestionDialog} onOpenChange={setCreateQuestionDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Global Question</DialogTitle>
              <DialogDescription>
                Create a new question for the global question bank
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_id">Class *</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, class_id: value, subject_id: '' });
                    }}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="subject_id">Subject *</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    disabled={!formData.class_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects
                        .filter((s) => s.class_id === formData.class_id)
                        .map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.subject_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question_text">Question Text *</Label>
                <RichTextEditor
                  value={formData.question_text}
                  onChange={(value) => setFormData({ ...formData, question_text: value })}
                  placeholder="Enter question text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="question_type">Question Type</Label>
                  <Select
                    value={formData.question_type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, question_type: value, correct_answer: '' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    min="0"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="negative_marks">Negative Marks</Label>
                  <Input
                    id="negative_marks"
                    type="number"
                    min="0"
                    step="0.25"
                    value={formData.negative_marks}
                    onChange={(e) =>
                      setFormData({ ...formData, negative_marks: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              {formData.question_type === 'mcq' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Options *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      {formData.options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="space-y-2 mt-2">
                    <Label>Correct Answer *</Label>
                    <Select
                      value={formData.correct_answer}
                      onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.options
                          .filter((o) => o.trim())
                          .map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.question_type === 'true_false' && (
                <div className="space-y-2">
                  <Label>Correct Answer *</Label>
                  <Select
                    value={formData.correct_answer}
                    onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="True">True</SelectItem>
                      <SelectItem value="False">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.question_type === 'short_answer' && (
                <div className="space-y-2">
                  <Label htmlFor="correct_answer">Correct Answer *</Label>
                  <Textarea
                    id="correct_answer"
                    placeholder="Enter the correct answer"
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="image">Question Image (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <span className="text-sm text-muted-foreground">Uploading...</span>}
                </div>
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={formData.image_url}
                      alt="Question"
                      className="max-w-xs rounded border"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateQuestionDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Question</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Question Dialog */}
      <Dialog open={editQuestionDialog} onOpenChange={(open) => {
        setEditQuestionDialog(open);
        if (!open) {
          resetForm();
          setSelectedQuestion(null);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Global Question</DialogTitle>
            <DialogDescription>
              Update the question in the global question bank
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateQuestion} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_class_id">Class *</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, class_id: value, subject_id: '' });
                  }}
                >
                  <SelectTrigger>
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
                <Label htmlFor="edit_subject_id">Subject *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  disabled={!formData.class_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects
                      .filter((s) => s.class_id === formData.class_id)
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_question_text">Question Text *</Label>
              <RichTextEditor
                value={formData.question_text}
                onChange={(value) => setFormData({ ...formData, question_text: value })}
                placeholder="Enter question text..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_question_type">Question Type</Label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, question_type: value, correct_answer: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_marks">Marks</Label>
                <Input
                  id="edit_marks"
                  type="number"
                  min="0"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_negative_marks">Negative Marks</Label>
                <Input
                  id="edit_negative_marks"
                  type="number"
                  min="0"
                  step="0.25"
                  value={formData.negative_marks}
                  onChange={(e) =>
                    setFormData({ ...formData, negative_marks: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            {formData.question_type === 'mcq' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="space-y-2 mt-2">
                  <Label>Correct Answer *</Label>
                  <Select
                    value={formData.correct_answer}
                    onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.options
                        .filter((o) => o.trim())
                        .map((option, index) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {formData.question_type === 'true_false' && (
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                <Select
                  value={formData.correct_answer}
                  onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">True</SelectItem>
                    <SelectItem value="False">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.question_type === 'short_answer' && (
              <div className="space-y-2">
                <Label htmlFor="edit_correct_answer">Correct Answer *</Label>
                <Textarea
                  id="edit_correct_answer"
                  placeholder="Enter the correct answer"
                  value={formData.correct_answer}
                  onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit_image_url">Question Image (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="edit_image_url"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <Button type="button" variant="outline" disabled>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </Button>
                )}
              </div>
              {formData.image_url && (
                <div className="mt-2">
                  <img
                    src={formData.image_url}
                    alt="Question"
                    className="max-w-xs rounded border"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditQuestionDialog(false);
                  resetForm();
                  setSelectedQuestion(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Question</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteQuestionDialog} onOpenChange={setDeleteQuestionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question from the global question bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteQuestionDialog(false);
              setQuestionToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Copy Confirmation Dialog */}
      <AlertDialog open={bulkCopyDialog} onOpenChange={setBulkCopyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Questions to Global Bank?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to copy {selectedQuestions.size} question{selectedQuestions.size > 1 ? 's' : ''} to the global question bank. 
              These questions will be available to all teachers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setBulkCopyDialog(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkCopyToGlobal} 
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              Copy ({selectedQuestions.size})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="global" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global Questions
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Questions
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending to Add
            {pendingQuestions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingQuestions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedGlobalBank && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGlobalBank(null)}
                      className="mr-2"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Banks
                    </Button>
                  )}
                  <Globe className="h-5 w-5" />
                  <CardTitle>
                    {selectedGlobalBank ? `${selectedGlobalBank} - Questions` : 'Global Question Banks'}
                  </CardTitle>
                </div>
              </div>
              {selectedGlobalBank && (
                <div className="flex items-center gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : !selectedGlobalBank ? (
                // Bank List View
                globalBankGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No global question banks found. Copy questions from user banks to add them here.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bank Name</TableHead>
                          <TableHead>Questions</TableHead>
                          <TableHead>Subjects</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {globalBankGroups.map((bank) => (
                          <TableRow 
                            key={bank.bankName}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedGlobalBank(bank.bankName)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2 font-medium">
                                <BookOpen className="h-4 w-4 text-primary" />
                                {bank.bankName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{bank.questionCount}</Badge>
                            </TableCell>
                            <TableCell>
                              {bank.subjects.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {bank.subjects.slice(0, 3).map((subject, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {subject}
                                    </Badge>
                                  ))}
                                  {bank.subjects.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{bank.subjects.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No subjects</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGlobalBank(bank.bankName);
                                }}
                              >
                                View Questions
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                // Questions List View for Selected Bank
                filteredGlobalQuestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No questions found in this bank.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGlobalQuestions.map((question) => (
                          <TableRow key={question.id}>
                            <TableCell className="max-w-md">
                              <MathRenderer
                                content={question.question_text}
                                className="truncate cursor-pointer hover:text-primary"
                                onClick={() => handleViewQuestion(question)}
                              />
                            </TableCell>
                            <TableCell>{question.subjects?.subject_name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getQuestionTypeLabel(question.question_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell>{question.marks}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {question.creator?.full_name || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewQuestion(question)}>
                                    <Search className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditQuestion(question)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(question.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Question Banks
              </CardTitle>
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant={selectedQuestions.size > 0 ? "default" : "outline"}
                  size="default"
                  onClick={() => {
                    if (selectedQuestions.size > 0) {
                      setBulkCopyDialog(true);
                    }
                  }}
                  disabled={selectedQuestions.size === 0}
                  className={selectedQuestions.size > 0 
                    ? "bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground shadow-md shrink-0" 
                    : "shrink-0"}
                  title={selectedQuestions.size === 0 ? "Select questions to copy" : `Copy ${selectedQuestions.size} question(s) to global bank`}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Global
                  {selectedQuestions.size > 0 && ` (${selectedQuestions.size})`}
                </Button>
                {selectedQuestions.size > 0 && (
                  <Button
                    variant="destructive"
                    size="default"
                    onClick={handleBulkDelete}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedQuestions.size})
                  </Button>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Banks</SelectItem>
                    {uniqueBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredUserQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No user questions found.
                </div>
              ) : (
                <>
                  {selectedQuestions.size > 0 && (
                    <div className="mb-4 flex items-center justify-between p-3 bg-primary/10 rounded-md">
                      <span className="text-sm font-medium">
                        {selectedQuestions.size} question{selectedQuestions.size > 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuestions(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question</TableHead>
                          <TableHead>Bank Name</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUserQuestions.map((question) => {
                          const isInGlobal = questionsInGlobal.has(question.id);
                          const isSelected = selectedQuestions.has(question.id);
                          return (
                            <TableRow 
                              key={question.id}
                              className={isInGlobal ? 'bg-success/20 hover:bg-success/30 border-success/50' : isSelected ? 'bg-primary/5' : ''}
                            >
                              <TableCell className="max-w-md">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => handleSelectQuestion(question.id)}
                                    disabled={isInGlobal}
                                    aria-label={`Select question ${question.id}`}
                                    title={isInGlobal ? "Already in global question bank" : "Select question"}
                                    className="shrink-0"
                                  />
                                  <MathRenderer
                                    content={question.question_text}
                                    className="truncate cursor-pointer hover:text-primary flex-1"
                                    onClick={() => handleViewQuestion(question)}
                                  />
                                  {isInGlobal && (
                                    <Badge variant="default" className="bg-success text-success-foreground shrink-0 font-semibold">
                                      <Globe className="h-3 w-3 mr-1" />
                                      avl Global
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {question.bank_name || 'No Bank'}
                                </Badge>
                              </TableCell>
                              <TableCell>{question.subjects?.subject_name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getQuestionTypeLabel(question.question_type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {question.difficulty}
                                </Badge>
                              </TableCell>
                              <TableCell>{question.marks}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {question.creator?.full_name || 'Unknown'}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* User Banks Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Question Banks by User</CardTitle>
            </CardHeader>
            <CardContent>
              {userBanks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No user question banks found.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userBanks.map((userBank) => (
                    <Card key={userBank.userId}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {userBank.userName}
                        </CardTitle>
                        <Badge variant="outline" className="w-fit">
                          {userBank.userRole}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Question Banks:</p>
                          <div className="flex flex-wrap gap-2">
                            {userBank.bankNames.map((bankName) => (
                              <Badge key={bankName} variant="secondary">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {bankName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Questions to Add
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Questions created by users that are not yet in the Global Question Bank
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Button
                  variant={selectedQuestions.size > 0 ? "default" : "outline"}
                  size="default"
                  onClick={() => {
                    if (selectedQuestions.size > 0) {
                      setBulkCopyDialog(true);
                    }
                  }}
                  disabled={selectedQuestions.size === 0}
                  className={selectedQuestions.size > 0 
                    ? "bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground shadow-md shrink-0" 
                    : "shrink-0"}
                  title={selectedQuestions.size === 0 ? "Select questions to add" : `Add ${selectedQuestions.size} question(s) to global bank`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Global Bank
                  {selectedQuestions.size > 0 && ` (${selectedQuestions.size})`}
                </Button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Banks</SelectItem>
                    {uniqueBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredPendingQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {pendingQuestions.length === 0 
                      ? "No pending questions found"
                      : "No questions match your filters"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {pendingQuestions.length === 0 
                      ? "All user questions have been added to the global bank"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
              ) : (
                <>
                  {selectedQuestions.size > 0 && (
                    <div className="mb-4 flex items-center justify-between p-3 bg-primary/10 rounded-md">
                      <span className="text-sm font-medium">
                        {selectedQuestions.size} question{selectedQuestions.size > 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuestions(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllSelected(filteredPendingQuestions)}
                              onCheckedChange={() => handleSelectAll(filteredPendingQuestions)}
                              aria-label="Select all questions"
                            />
                          </TableHead>
                          <TableHead>Question</TableHead>
                          <TableHead>Bank Name</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Created By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPendingQuestions.map((question) => {
                          const isSelected = selectedQuestions.has(question.id);
                          return (
                            <TableRow 
                              key={question.id}
                              className={isSelected ? 'bg-primary/5' : ''}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleSelectQuestion(question.id)}
                                  aria-label={`Select question ${question.id}`}
                                />
                              </TableCell>
                              <TableCell className="max-w-md">
                                <MathRenderer
                                  content={question.question_text}
                                  className="truncate cursor-pointer hover:text-primary"
                                  onClick={() => handleViewQuestion(question)}
                                />
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {question.bank_name || 'No Bank'}
                                </Badge>
                              </TableCell>
                              <TableCell>{question.subjects?.subject_name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {getQuestionTypeLabel(question.question_type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {question.difficulty}
                                </Badge>
                              </TableCell>
                              <TableCell>{question.marks}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {question.creator?.full_name || 'Unknown'}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Question Dialog */}
      <Dialog open={viewQuestionDialog} onOpenChange={setViewQuestionDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
            <DialogDescription>View complete question information</DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Question:</h3>
                <MathRenderer
                  content={selectedQuestion.question_text}
                  className="p-4 bg-muted rounded-md"
                />
              </div>

              {selectedQuestion.image_url && (
                <div>
                  <h3 className="font-semibold mb-2">Image:</h3>
                  <img
                    src={selectedQuestion.image_url}
                    alt="Question"
                    className="max-w-full rounded-md border"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Type:</h3>
                  <Badge variant="outline">
                    {getQuestionTypeLabel(selectedQuestion.question_type)}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Difficulty:</h3>
                  <Badge className={getDifficultyColor(selectedQuestion.difficulty)}>
                    {selectedQuestion.difficulty}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Marks:</h3>
                  <p>{selectedQuestion.marks}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Negative Marks:</h3>
                  <p>{selectedQuestion.negative_marks || 0}</p>
                </div>
              </div>

              {selectedQuestion.question_type === 'mcq' && selectedQuestion.options && (
                <div>
                  <h3 className="font-semibold mb-2">Options:</h3>
                  <div className="space-y-2">
                    {selectedQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border ${
                          option === selectedQuestion.correct_answer
                            ? 'bg-success/10 border-success'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{String.fromCharCode(65 + index)}.</span>
                          <span dangerouslySetInnerHTML={{ __html: option }} />
                          {option === selectedQuestion.correct_answer && (
                            <Badge className="ml-auto">Correct</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedQuestion.question_type === 'true_false' && (
                <div>
                  <h3 className="font-semibold mb-2">Correct Answer:</h3>
                  <Badge>{selectedQuestion.correct_answer}</Badge>
                </div>
              )}

              {selectedQuestion.question_type === 'match_following' &&
                selectedQuestion.match_pairs && (
                  <div>
                    <h3 className="font-semibold mb-2">Match Pairs:</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Left Column:</h4>
                        <div className="space-y-2">
                          {selectedQuestion.match_pairs.map((pair, index) => (
                            <div key={index} className="p-2 bg-muted rounded">
                              {pair.left}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Right Column:</h4>
                        <div className="space-y-2">
                          {selectedQuestion.match_pairs.map((pair, index) => (
                            <div key={index} className="p-2 bg-muted rounded">
                              {pair.right}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <div>
                <h3 className="font-semibold mb-2">Created By:</h3>
                <p>{selectedQuestion.creator?.full_name || 'Unknown'}</p>
              </div>

              {selectedQuestion.bank_name && (
                <div>
                  <h3 className="font-semibold mb-2">Bank Name:</h3>
                  <Badge variant="secondary">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {selectedQuestion.bank_name}
                  </Badge>
                </div>
              )}

              {selectedQuestion.is_global && (
                <div>
                  <Badge variant="default">
                    <Globe className="h-3 w-3 mr-1" />
                    Global Question
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
