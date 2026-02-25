import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { analysisApi, academicApi, profileApi } from '@/db/api';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import type { Profile } from '@/types/types';

interface ExamAnalysisData {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  total_marks: number;
  class_name: string;
  subject_name: string;
  total_students: number;
  attended: number;
  average_score: number; // Changed from average_marks to average_score (percentage)
}

export default function ExamAnalysis() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  
  // Filter states
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  // Initialize filter states from URL parameters
  const [selectedClass, setSelectedClass] = useState<string>(searchParams.get('class') || '');
  const [selectedSection, setSelectedSection] = useState<string>(searchParams.get('section') || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(searchParams.get('subject') || '');
  
  // Analysis data
  const [analysisData, setAnalysisData] = useState<ExamAnalysisData[]>([]);
  const [filtered, setFiltered] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-load exams on initial page load or when returning from navigation
  useEffect(() => {
    if (initialLoadDone && currentProfile?.school_id && !filtered) {
      const hasFilters = searchParams.get('class') || searchParams.get('section') || searchParams.get('subject');
      if (hasFilters) {
        // Apply filters from URL if present
        applyFiltersFromUrl();
      } else {
        // Load all exams by default (no filters)
        loadAllExams();
      }
    }
  }, [initialLoadDone, currentProfile]);

  useEffect(() => {
    if (selectedClass) {
      loadSections(selectedClass);
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  const loadInitialData = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile) throw new Error('Profile not found');
      setCurrentProfile(profile);

      // Load classes
      const classesData = await academicApi.getClassesBySchoolId(profile.school_id!);
      setClasses(classesData);

      // Load subjects
      const subjectsData = await academicApi.getSubjectsBySchoolId(profile.school_id!);
      setSubjects(subjectsData);
      
      // Mark initial load as complete
      setInitialLoadDone(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load initial data',
        variant: 'destructive',
      });
    }
  };

  const loadSections = async (classId: string) => {
    try {
      const sectionsData = await academicApi.getSectionsByClassId(classId);
      setSections(sectionsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load sections',
        variant: 'destructive',
      });
    }
  };

  const loadAllExams = async () => {
    if (!currentProfile?.school_id) return;

    setLoading(true);
    try {
      // Load all exams without any filters
      const data = await analysisApi.getExamAnalysis(
        currentProfile.school_id,
        undefined,
        undefined,
        undefined
      );
      setAnalysisData(data);
      setFiltered(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exam analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersFromUrl = async () => {
    if (!currentProfile?.school_id) return;

    const classParam = searchParams.get('class');
    const sectionParam = searchParams.get('section');
    const subjectParam = searchParams.get('subject');

    setLoading(true);
    try {
      const data = await analysisApi.getExamAnalysis(
        currentProfile.school_id,
        classParam || undefined,
        sectionParam || undefined,
        subjectParam || undefined
      );
      setAnalysisData(data);
      setFiltered(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exam analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    if (!currentProfile?.school_id) {
      toast({
        title: 'Error',
        description: 'School information not found',
        variant: 'destructive',
      });
      return;
    }

    // Update URL parameters with current filter values
    const params = new URLSearchParams();
    if (selectedClass) params.set('class', selectedClass);
    if (selectedSection) params.set('section', selectedSection);
    if (selectedSubject) params.set('subject', selectedSubject);
    setSearchParams(params);

    setLoading(true);
    try {
      const data = await analysisApi.getExamAnalysis(
        currentProfile.school_id,
        selectedClass || undefined,
        selectedSection || undefined,
        selectedSubject || undefined
      );
      setAnalysisData(data);
      setFiltered(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exam analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedClass('');
    setSelectedSection('');
    setSelectedSubject('');
    // Clear URL parameters
    setSearchParams(new URLSearchParams());
    // Reload all exams (default view)
    loadAllExams();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const getAttendancePercentage = (attended: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((attended / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Exam Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze exam performance across classes and subjects
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
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

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={selectedSection}
                onValueChange={setSelectedSection}
                disabled={!selectedClass || selectedClass === 'all'}
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Select subject" />
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
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter} disabled={loading}>
              {loading ? 'Loading...' : 'Apply Filter'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading details...</p>
        </div>
      )}

      {/* Results Section */}
      {filtered && !loading && (
        <div className="space-y-4">
          {analysisData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No exams found</h3>
                <p className="text-muted-foreground text-center">
                  No exams match the selected filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Exam Results</h2>
                <span className="text-muted-foreground">
                  {analysisData.length} exam{analysisData.length !== 1 ? 's' : ''} found
                </span>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">S.No</TableHead>
                        <TableHead className="w-[140px]">Date & Time</TableHead>
                        <TableHead>Exam Name</TableHead>
                        <TableHead className="w-[120px]">Class</TableHead>
                        <TableHead className="w-[120px]">Subject</TableHead>
                        <TableHead className="w-[120px] text-center">Total Students</TableHead>
                        <TableHead className="w-[120px] text-center">Attended</TableHead>
                        <TableHead className="w-[140px] text-center">Average Score</TableHead>
                        <TableHead className="w-[140px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisData.map((exam, index) => {
                        const dateTime = formatDateTime(exam.start_time);
                        const attendancePercentage = getAttendancePercentage(
                          exam.attended,
                          exam.total_students
                        );

                        return (
                          <TableRow key={exam.id}>
                            <TableCell>
                              <div className="font-medium text-center">{index + 1}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{dateTime.date}</div>
                                <div className="text-muted-foreground">{dateTime.time}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{exam.title}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{exam.class_name}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{exam.subject_name}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="font-medium">{exam.total_students}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="font-medium">{exam.attended}</div>
                              <div className="text-xs text-muted-foreground">
                                ({attendancePercentage}%)
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="font-medium">
                                {exam.average_score.toFixed(2)}%
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/teacher/exams/${exam.id}/results?from=analysis`)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
