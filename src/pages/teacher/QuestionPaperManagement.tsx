import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, FileText, Eye, Trash2, Plus, Search, Filter, Calendar, BarChart3, Printer, Pencil } from 'lucide-react';
import { academicApi, subjectApi } from '@/db/api';
import { ShuffleAndSaveDialog } from '@/components/teacher/ShuffleAndSaveDialog';
import type { QuestionPaperWithDetails, Question, QuestionPaperQuestionWithDetails, Class, Subject } from '@/types/types';

export default function QuestionPaperManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaperWithDetails[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<QuestionPaperWithDetails[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaperWithDetails | null>(null);
  const [paperQuestions, setPaperQuestions] = useState<QuestionPaperQuestionWithDetails[]>([]);
  const [paperQuestionsMap, setPaperQuestionsMap] = useState<Record<string, QuestionPaperQuestionWithDetails[]>>({});
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Rename dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingPaper, setRenamingPaper] = useState<QuestionPaperWithDetails | null>(null);
  const [newPaperTitle, setNewPaperTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  
  // Bulk selection states
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'marks'>('date');

  useEffect(() => {
    loadQuestionPapers();
    loadClassesAndSubjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questionPapers, searchQuery, filterClass, filterSubject, filterStatus, sortBy]);

  const loadClassesAndSubjects = async () => {
    try {
      const [classesData, subjectsData] = await Promise.all([
        academicApi.getAllClasses(),
        subjectApi.getAllSubjects()
      ]);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.error('Error loading classes and subjects:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...questionPapers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paper =>
        paper.title.toLowerCase().includes(query) ||
        paper.class?.class_name.toLowerCase().includes(query) ||
        paper.subject?.subject_name.toLowerCase().includes(query)
      );
    }

    // Class filter
    if (filterClass !== 'all') {
      filtered = filtered.filter(paper => paper.class_id === filterClass);
    }

    // Subject filter
    if (filterSubject !== 'all') {
      filtered = filtered.filter(paper => paper.subject_id === filterSubject);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(paper => paper.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'marks':
          return b.total_marks - a.total_marks;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredPapers(filtered);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterClass('all');
    setFilterSubject('all');
    setFilterStatus('all');
    setSortBy('date');
  };

  const loadQuestionPapers = async () => {
    try {
      setLoading(true);
      const papers = await academicApi.getQuestionPapers();
      setQuestionPapers(Array.isArray(papers) ? papers : []);
    } catch (error) {
      console.error('Error loading question papers:', error);
      toast.error('Failed to load question papers');
    } finally {
      setLoading(false);
    }
  };

  const loadPaperQuestions = async (paperId: string) => {
    try {
      const questions = await academicApi.getQuestionPaperQuestions(paperId);
      setPaperQuestions(questions);
      setPaperQuestionsMap(prev => ({ ...prev, [paperId]: questions }));
      return questions;
    } catch (error) {
      console.error('Error loading paper questions:', error);
      toast.error('Failed to load questions');
      return [];
    }
  };

  const getQuestionsForPaper = async (paperId: string): Promise<QuestionPaperQuestionWithDetails[]> => {
    if (paperQuestionsMap[paperId]) {
      return paperQuestionsMap[paperId];
    }
    return await loadPaperQuestions(paperId);
  };

  const handlePreviewPaper = async (paper: QuestionPaperWithDetails) => {
    setSelectedPaper(paper);
    const questions = await loadPaperQuestions(paper.id);
    setPaperQuestions(questions);
  };

  const handlePrintPaper = async (paper: QuestionPaperWithDetails) => {
    // Load questions for this paper
    const questions = await loadPaperQuestions(paper.id);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the question paper');
      return;
    }

    // Generate HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${paper.title} - Question Paper</title>
          <style>
            @page {
              margin: 2cm;
              size: A4;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #000;
              background: #fff;
              padding: 20px;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            
            .header h1 {
              font-size: 24px;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            
            .header-info {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 14px;
            }
            
            .question-container {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            
            .question-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
            }
            
            .question-text {
              font-size: 15px;
              font-weight: 500;
              flex: 1;
              margin-right: 15px;
            }
            
            .question-marks {
              font-size: 13px;
              white-space: nowrap;
              font-weight: 600;
              border: 1px solid #000;
              padding: 2px 8px;
              border-radius: 4px;
            }
            
            .question-image {
              margin: 10px 0 10px 20px;
              max-width: 400px;
            }
            
            .question-image img {
              max-width: 100%;
              border: 1px solid #ddd;
              border-radius: 4px;
            }
            
            .options {
              margin-left: 20px;
              margin-top: 10px;
            }
            
            .option {
              margin-bottom: 8px;
              font-size: 14px;
              display: flex;
              align-items: flex-start;
            }
            
            .option-label {
              font-weight: 600;
              margin-right: 8px;
              min-width: 25px;
            }
            
            .answer-space {
              margin: 15px 0 15px 20px;
              border-bottom: 1px solid #ccc;
              min-height: 60px;
            }
            
            @media print {
              body {
                padding: 0;
              }
              
              .question-container {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${paper.title}</h1>
            <div class="header-info">
              <div><strong>Class:</strong> ${paper.class?.class_name || 'N/A'}</div>
              <div><strong>Subject:</strong> ${paper.subject?.subject_name || 'N/A'}</div>
              <div><strong>Total Marks:</strong> ${paper.total_marks}</div>
            </div>
          </div>
          
          <div class="questions">
            ${questions.map((pq, index) => {
              const question = pq.question;
              if (!question) return '';
              
              const displayOptions = pq.shuffled_options || question.options;
              const displayAnswerOptions = pq.shuffled_answer_options || question.answer_options;
              
              return `
                <div class="question-container">
                  <div class="question-header">
                    <div class="question-text">
                      <strong>Q${index + 1}.</strong> ${question.question_text}
                    </div>
                    <div class="question-marks">${question.marks} ${question.marks === 1 ? 'mark' : 'marks'}</div>
                  </div>
                  
                  ${question.image_url ? `
                    <div class="question-image">
                      <img src="${question.image_url}" alt="Question illustration" />
                    </div>
                  ` : ''}
                  
                  ${question.question_type === 'mcq' && displayOptions ? `
                    <div class="options">
                      ${Array.isArray(displayOptions) ? displayOptions.map((option, idx) => {
                        const optionText = typeof option === 'string' ? option : option.option;
                        return `
                          <div class="option">
                            <span class="option-label">${String.fromCharCode(65 + idx)})</span>
                            <span>${optionText}</span>
                          </div>
                        `;
                      }).join('') : ''}
                    </div>
                  ` : question.question_type === 'true_false' ? `
                    <div class="options">
                      <div class="option">
                        <span class="option-label">A)</span>
                        <span>True</span>
                      </div>
                      <div class="option">
                        <span class="option-label">B)</span>
                        <span>False</span>
                      </div>
                    </div>
                  ` : `
                    <div class="answer-space"></div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleEditDraft = (paper: QuestionPaperWithDetails) => {
    // Navigate to question paper preparation page with the draft paper data
    navigate('/teacher/question-paper', { state: { draftPaper: paper } });
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) {
      return;
    }

    try {
      await academicApi.deleteQuestionPaper(paperId);
      toast.success('Question paper deleted successfully');
      loadQuestionPapers();
    } catch (error) {
      console.error('Error deleting paper:', error);
      toast.error('Failed to delete question paper');
    }
  };

  const handleOpenRenameDialog = (paper: QuestionPaperWithDetails) => {
    setRenamingPaper(paper);
    setNewPaperTitle(paper.title);
    setRenameDialogOpen(true);
  };

  const handleRenamePaper = async () => {
    if (!renamingPaper || !newPaperTitle.trim()) {
      toast.error('Please enter a valid title');
      return;
    }

    console.log('Renaming paper:', renamingPaper.id, 'to:', newPaperTitle.trim());
    setRenaming(true);
    try {
      const result = await academicApi.updateQuestionPaper(renamingPaper.id, {
        title: newPaperTitle.trim()
      });
      console.log('Rename result:', result);
      toast.success('Question paper renamed successfully');
      setRenameDialogOpen(false);
      setRenamingPaper(null);
      setNewPaperTitle('');
      await loadQuestionPapers();
    } catch (error) {
      console.error('Error renaming paper:', error);
      toast.error('Failed to rename question paper');
    } finally {
      setRenaming(false);
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredPapers.map(p => p.id));
      setSelectedPaperIds(allIds);
    } else {
      setSelectedPaperIds(new Set());
    }
  };

  const handleSelectPaper = (paperId: string, checked: boolean) => {
    const newSelected = new Set(selectedPaperIds);
    if (checked) {
      newSelected.add(paperId);
    } else {
      newSelected.delete(paperId);
    }
    setSelectedPaperIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedPaperIds.size === 0) {
      toast.error('Please select papers to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedPaperIds.size} question paper(s)?`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedPaperIds).map(id => academicApi.deleteQuestionPaper(id))
      );
      toast.success(`Successfully deleted ${selectedPaperIds.size} question paper(s)`);
      setSelectedPaperIds(new Set());
      await loadQuestionPapers();
    } catch (error) {
      console.error('Error deleting papers:', error);
      toast.error('Failed to delete some question papers');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkPrint = () => {
    if (selectedPaperIds.size === 0) {
      toast.error('Please select papers to print');
      return;
    }

    // Get selected papers
    const selectedPapers = filteredPapers.filter(p => selectedPaperIds.has(p.id));
    
    // Print each selected paper
    selectedPapers.forEach((paper, index) => {
      setTimeout(() => {
        handlePrintPaper(paper);
      }, index * 500); // Delay each print by 500ms to avoid conflicts
    });

    toast.success(`Printing ${selectedPaperIds.size} question paper(s)`);
  };

  const calculateStats = () => {
    const totalPapers = questionPapers.length;
    const draftPapers = questionPapers.filter(p => p.status === 'draft').length;
    const finalPapers = questionPapers.filter(p => p.status === 'final').length;
    const totalMarks = questionPapers.reduce((sum, p) => sum + p.total_marks, 0);
    const avgMarks = totalPapers > 0 ? Math.round(totalMarks / totalPapers) : 0;

    // Group by class
    const byClass = questionPapers.reduce((acc, paper) => {
      const className = paper.class?.class_name || 'Unknown';
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by subject
    const bySubject = questionPapers.reduce((acc, paper) => {
      const subjectName = paper.subject?.subject_name || 'Unknown';
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPapers,
      draftPapers,
      finalPapers,
      avgMarks,
      byClass,
      bySubject
    };
  };

  const getStatusBadge = (status: string) => {
    if (status === 'draft') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Draft</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Final</Badge>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Question Paper History</h1>
          <p className="text-muted-foreground">View, manage, and track all your question papers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowStats(!showStats)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            {showStats ? 'Hide' : 'Show'} Statistics
          </Button>
          <Button onClick={() => navigate('/teacher/question-paper')}>
            <Plus className="mr-2 h-4 w-4" /> Create New Paper
          </Button>
        </div>
      </div>

      {/* Statistics Card */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics Overview</CardTitle>
            <CardDescription>Summary of your question paper history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{stats.totalPapers}</div>
                <div className="text-sm text-muted-foreground">Total Papers</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.draftPapers}</div>
                <div className="text-sm text-muted-foreground">Draft Papers</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.finalPapers}</div>
                <div className="text-sm text-muted-foreground">Final Papers</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.avgMarks}</div>
                <div className="text-sm text-muted-foreground">Avg. Marks</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Papers by Class</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byClass).map(([className, count]) => (
                    <div key={className} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{className}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Papers by Subject</h4>
                <div className="space-y-2">
                  {Object.entries(stats.bySubject).map(([subjectName, count]) => (
                    <div key={subjectName} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{subjectName}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters - Sticky Card */}
      <Card className="sticky top-0 z-10 bg-background shadow-md">
        <CardHeader className="py-1.5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Search & Filter</CardTitle>
              <CardDescription className="text-xs">Find specific question papers quickly</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-7">
              <Filter className="mr-1 h-3 w-3" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 py-1.5">
          {/* Search Bar with Bulk Action Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="relative w-1/2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search by title, class, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-7 text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPrint}
                disabled={selectedPaperIds.size === 0}
                title="Print selected papers"
                className="h-7"
              >
                <Printer className="mr-1 h-3 w-3" />
                Print
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting || selectedPaperIds.size === 0}
                className="h-7"
              >
                {bulkDeleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 pt-1.5 border-t">
              <div className="space-y-0.5">
                <Label className="text-xs">Class</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0.5">
                <Label className="text-xs">Subject</Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0.5">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0.5">
                <Label className="text-xs">Sort By</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="h-7 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest First)</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                    <SelectItem value="marks">Total Marks (High-Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={resetFilters} className="h-6 text-xs">
                  Reset Filters
                </Button>
              </div>
            </div>
          )}

          {/* Results Count and Selection Status */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="text-xs text-muted-foreground">
              Showing {filteredPapers.length} of {questionPapers.length} papers
            </div>
            <div className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">
                  {selectedPaperIds.size > 0 
                    ? `${selectedPaperIds.size} paper(s) selected` 
                    : 'No papers selected'}
                </span>
                {selectedPaperIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPaperIds(new Set())}
                    className="h-5 text-xs px-1.5"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table Headers - Relocated for Sticky Header */}
          {filteredPapers.length > 0 && (
            <div className="pt-1">
              <Table>
                <TableHeader>
                  <TableRow className="h-7">
                    <TableHead className="w-12 py-1">
                      <Checkbox
                        checked={selectedPaperIds.size === filteredPapers.length && filteredPapers.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all papers"
                      />
                    </TableHead>
                    <TableHead className="py-1 text-xs w-[35%]">Title</TableHead>
                    <TableHead className="py-1 text-xs w-[10%]">Class</TableHead>
                    <TableHead className="py-1 text-xs w-[12%]">Subject</TableHead>
                    <TableHead className="py-1 text-xs w-[10%]">Status</TableHead>
                    <TableHead className="py-1 text-xs w-[10%]">Total Marks</TableHead>
                    <TableHead className="py-1 text-xs w-[10%]">Created</TableHead>
                    <TableHead className="text-right py-1 text-xs w-[13%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {questionPapers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Question Papers Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first question paper to get started</p>
            <Button onClick={() => navigate('/teacher/question-paper')}>
              <Plus className="mr-2 h-4 w-4" /> Create Question Paper
            </Button>
          </CardContent>
        </Card>
      ) : filteredPapers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Papers Found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Question Papers</CardTitle>
            <CardDescription>
              View, shuffle, duplicate, and manage your question papers. Click on any draft to continue editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {filteredPapers.map((paper) => (
                  <TableRow 
                    key={paper.id}
                    className={paper.status === 'draft' ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => paper.status === 'draft' && handleEditDraft(paper)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()} className="w-12">
                      <Checkbox
                        checked={selectedPaperIds.has(paper.id)}
                        onCheckedChange={(checked) => handleSelectPaper(paper.id, checked as boolean)}
                        aria-label={`Select ${paper.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium w-[35%]">{paper.title}</TableCell>
                    <TableCell className="w-[10%]">{paper.class?.class_name || 'N/A'}</TableCell>
                    <TableCell className="w-[12%]">{paper.subject?.subject_name || 'N/A'}</TableCell>
                    <TableCell className="w-[10%]">{getStatusBadge(paper.status)}</TableCell>
                    <TableCell className="w-[10%]">
                      {paper.total_marks === 0 ? (
                        <span className="text-muted-foreground text-sm">No questions</span>
                      ) : (
                        <span className="font-medium">{paper.total_marks}</span>
                      )}
                    </TableCell>
                    <TableCell className="w-[10%]">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(paper.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="w-[13%]">
                      <div className="flex gap-2 justify-end">
                        {/* Preview Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewPaper(paper)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print-content">
                            <DialogHeader className="print-hide">
                              <DialogTitle>Question Paper Preview</DialogTitle>
                              <DialogDescription>
                                Preview of "{paper.title}"
                              </DialogDescription>
                            </DialogHeader>

                            {/* Print Header - Only visible when printing */}
                            <div className="print-header" style={{ display: 'none' }}>
                              <h1>Question Paper Preview</h1>
                              <p className="font-medium">{paper.title} | Total Marks: {paper.total_marks}</p>
                            </div>

                            <div className="space-y-4 print-questions-container">
                              <Card>
                                <CardHeader className="print-hide">
                                  <CardTitle className="text-lg">{paper.title}</CardTitle>
                                  <CardDescription>
                                    Class: {paper.class?.class_name || 'N/A'} | Subject: {paper.subject?.subject_name || 'N/A'} | Total Marks: {paper.total_marks}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 print-card-content">
                                  {paperQuestions.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No questions found</p>
                                  ) : (
                                    paperQuestions.map((pq, index) => {
                                      const question = pq.question;
                                      if (!question) return null;
                                      
                                      // Use shuffled_options if available, otherwise use original options
                                      const displayOptions = pq.shuffled_options || question.options;
                                      const displayAnswerOptions = pq.shuffled_answer_options || question.answer_options;
                                      
                                      return (
                                        <div key={pq.id} className="border-b pb-4 last:border-b-0 question-item">
                                          <div className="flex items-start justify-between mb-2 question-header">
                                            <div className="flex-1 question-text-wrapper">
                                              <span className="font-medium question-number">Q{index + 1}. </span>
                                              <span 
                                                className="font-medium question-content"
                                                dangerouslySetInnerHTML={{ __html: question.question_text }}
                                              />
                                            </div>
                                            {/* Print version - simple text badge */}
                                            <span className="marks-badge" style={{ display: 'none' }}>
                                              {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                            </span>
                                            {/* Screen version - colored badge */}
                                            <Badge className={`${getDifficultyColor(question.difficulty)} screen-only flex-shrink-0`}>
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

                                          {question.question_type === 'mcq' && Array.isArray(displayOptions) && (
                                            <div className="ml-4 space-y-1 mt-2">
                                              {(displayOptions as string[]).map((option, idx) => (
                                                <div key={idx} className="text-sm">
                                                  {String.fromCharCode(65 + idx)}. {option}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {question.question_type === 'multiple_response' && Array.isArray(displayOptions) && (
                                            <div className="ml-4 mt-2 space-y-3">
                                              {/* Segment 2: Options (A, B, C, D) */}
                                              <div className="space-y-1">
                                                {(displayOptions as string[]).map((option, idx) => (
                                                  <div key={idx} className="text-sm">
                                                    {String.fromCharCode(65 + idx)}. {option}
                                                  </div>
                                                ))}
                                              </div>

                                              {/* Segment 3: Answer Options (I, II, III, IV) */}
                                              {Array.isArray(displayAnswerOptions) && displayAnswerOptions.length > 0 && (
                                                <div className="space-y-1 pl-4 border-l-2">
                                                  {(displayAnswerOptions as string[]).map((ansOption, idx) => (
                                                    <div key={idx} className="text-sm">
                                                      {['I', 'II', 'III', 'IV'][idx]}. {ansOption}
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

                                          {question.question_type === 'short_answer' && (
                                            <div className="ml-4 mt-2 text-sm text-muted-foreground">
                                              [Short answer expected]
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Shuffle & Save Button */}
                        <ShuffleAndSaveDialog 
                          paper={paper}
                          onSuccess={loadQuestionPapers}
                        />

                        {/* Rename Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRenameDialog(paper)}
                          title="Rename this paper"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Question Paper</DialogTitle>
            <DialogDescription>
              Enter a new title for the question paper
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paper-title">Paper Title</Label>
              <Input
                id="paper-title"
                value={newPaperTitle}
                onChange={(e) => setNewPaperTitle(e.target.value)}
                placeholder="Enter new paper title"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !renaming) {
                    handleRenamePaper();
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setRenamingPaper(null);
                setNewPaperTitle('');
              }}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenamePaper}
              disabled={renaming || !newPaperTitle.trim()}
            >
              {renaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
