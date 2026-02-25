import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import { analysisApi, academicApi, profileApi } from '@/db/api';
import { ArrowLeft, User, TrendingUp, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Profile } from '@/types/types';
import { Badge } from '@/components/ui/badge';

interface StudentAnalysisData {
  id: string;
  student_name: string;
  username: string;
  completed: number;
  missed: number;
  recovered: number;
  total_exams: number;
  average_score: number;
  pass_rate: number;
}

interface StudentExamDetail {
  id: string;
  status: string;
  total_marks_obtained: number | null;
  percentage: number | null;
  result: string | null;
  started_at: string | null;
  submitted_at: string | null;
  exam: {
    id: string;
    title: string;
    total_marks: number;
    passing_marks: number;
    start_time: string;
    end_time: string;
    class: { class_name: string };
    subject: { subject_name: string };
  };
}

export default function StudentAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  
  // Filter states
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
  // Analysis data
  const [analysisData, setAnalysisData] = useState<StudentAnalysisData[]>([]);
  const [filtered, setFiltered] = useState(false);

  // Detail inline display
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [studentDetailsMap, setStudentDetailsMap] = useState<Record<string, StudentExamDetail[]>>({});
  const [loadingDetailsMap, setLoadingDetailsMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle return from detail page
  useEffect(() => {
    if (location.state?.returnFromDetail && location.state?.expandedStudentId) {
      const studentId = location.state.expandedStudentId;
      setExpandedStudentId(studentId);
      
      // If we don't have the data yet, fetch it
      if (!studentDetailsMap[studentId]) {
        handleViewDetails(studentId, '');
      }
      
      // Clear the state to prevent re-expansion on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedClass) {
      loadSections(selectedClass);
    } else {
      setSections([]);
      setSelectedSection('');
      setStudents([]);
      setSelectedStudent('');
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadStudents(selectedClass, selectedSection);
    } else {
      setStudents([]);
      setSelectedStudent('');
    }
  }, [selectedSection]);

  const loadInitialData = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile) throw new Error('Profile not found');
      setCurrentProfile(profile);

      // Load classes
      const classesData = await academicApi.getClassesBySchoolId(profile.school_id!);
      setClasses(classesData);
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

  const loadStudents = async (classId: string, sectionId: string) => {
    try {
      const studentsData = await academicApi.getStudentsByClassSection(classId, sectionId, '2024-2025');
      setStudents(studentsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load students',
        variant: 'destructive',
      });
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

    setLoading(true);
    try {
      const data = await analysisApi.getStudentAnalysis(
        currentProfile.school_id,
        selectedClass || undefined,
        selectedSection || undefined,
        selectedStudent && selectedStudent !== 'all' ? selectedStudent : undefined
      );
      setAnalysisData(data);
      setFiltered(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load student analysis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedClass('');
    setSelectedSection('');
    setSelectedStudent('');
    setAnalysisData([]);
    setFiltered(false);
  };

  const handleViewDetails = async (studentId: string, studentName: string) => {
    // If already expanded, collapse it
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null);
      return;
    }

    // Expand this student
    setExpandedStudentId(studentId);

    // If we already have the data, don't fetch again
    if (studentDetailsMap[studentId]) {
      return;
    }

    // Fetch the details
    setLoadingDetailsMap(prev => ({ ...prev, [studentId]: true }));
    
    try {
      const details = await analysisApi.getStudentExamDetails(studentId);
      setStudentDetailsMap(prev => ({ ...prev, [studentId]: details as any }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load student exam details',
        variant: 'destructive',
      });
      setExpandedStudentId(null);
    } finally {
      setLoadingDetailsMap(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      not_started: { variant: 'secondary', label: 'Not Started' },
      in_progress: { variant: 'outline', label: 'In Progress' },
      submitted: { variant: 'default', label: 'Submitted' },
      evaluated: { variant: 'default', label: 'Evaluated' },
    };
    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return <Badge variant="secondary">Pending</Badge>;
    if (result === 'pass') return <Badge className="bg-green-500 hover:bg-green-600">Pass</Badge>;
    return <Badge variant="destructive">Fail</Badge>;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Student Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyze individual student performance across exams
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
                disabled={!selectedClass}
              >
                <SelectTrigger id="section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student">Student (Optional)</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
                disabled={!selectedSection}
              >
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((item) => (
                    <SelectItem key={item.student_id} value={item.student_id}>
                      {item.student?.full_name || item.student?.username || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter} disabled={loading || !selectedClass || !selectedSection}>
              {loading ? 'Loading...' : 'Apply Filter'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {filtered && (
        <div className="space-y-4">
          {analysisData.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No students found</h3>
                <p className="text-muted-foreground text-center">
                  No students match the selected filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Student Performance</h2>
                <span className="text-muted-foreground">
                  {analysisData.length} student{analysisData.length !== 1 ? 's' : ''} found
                </span>
              </div>

              <div className="grid gap-4">
                {analysisData.map((student) => {
                  const isExpanded = expandedStudentId === student.id;
                  const studentDetails = studentDetailsMap[student.id] || [];
                  const isLoadingDetails = loadingDetailsMap[student.id] || false;

                  return (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="grid gap-6 md:grid-cols-7">
                          {/* Student Name */}
                          <div className="md:col-span-2 flex items-start gap-3">
                            <User className="h-5 w-5 text-primary mt-1" />
                            <div>
                              <p className="font-semibold text-lg">{student.student_name}</p>
                              <p className="text-sm text-muted-foreground">{student.username}</p>
                            </div>
                          </div>

                          {/* Completed */}
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                            <div>
                              <p className="text-sm text-muted-foreground">Completed</p>
                              <p className="font-semibold text-lg">{student.completed}</p>
                            </div>
                          </div>

                          {/* Missed */}
                          <div className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-500 mt-1" />
                            <div>
                              <p className="text-sm text-muted-foreground">Missed</p>
                              <p className="font-semibold text-lg">{student.missed}</p>
                            </div>
                          </div>

                          {/* Total Exams */}
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-secondary mt-1" />
                            <div>
                              <p className="text-sm text-muted-foreground">Total Exams</p>
                              <p className="font-semibold text-lg">{student.total_exams}</p>
                            </div>
                          </div>

                          {/* Average Score */}
                          <div className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 text-accent mt-1" />
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Score</p>
                              <p className="font-semibold text-lg">{student.average_score.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Pass Rate */}
                          <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-primary mt-1" />
                            <div>
                              <p className="text-sm text-muted-foreground">Pass Rate</p>
                              <p className="font-semibold text-lg">{student.pass_rate.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(student.id, student.student_name)}
                          >
                            {isExpanded ? 'Hide Detailed Results' : 'View Detailed Results'}
                          </Button>
                        </div>

                        {/* Inline Exam Results Table */}
                        {isExpanded && (
                          <div className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-semibold mb-4">Exam Results - {student.student_name}</h3>
                            
                            {isLoadingDetails ? (
                              <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                  <p className="text-muted-foreground">Loading exam details...</p>
                                </div>
                              </div>
                            ) : studentDetails.length === 0 ? (
                              <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No exam attempts found for this student.</p>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-muted/50">
                                      <tr className="border-b">
                                        <th className="text-left p-3 font-medium text-sm">S.No</th>
                                        <th className="text-left p-3 font-medium text-sm">Date / Time</th>
                                        <th className="text-left p-3 font-medium text-sm">Exam</th>
                                        <th className="text-left p-3 font-medium text-sm">Subject</th>
                                        <th className="text-left p-3 font-medium text-sm">Time Taken</th>
                                        <th className="text-left p-3 font-medium text-sm">Marks Obtained</th>
                                        <th className="text-left p-3 font-medium text-sm">Percentage</th>
                                        <th className="text-left p-3 font-medium text-sm">Result</th>
                                        <th className="text-left p-3 font-medium text-sm">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {studentDetails.map((detail, index) => {
                                        const timeTaken = detail.started_at && detail.submitted_at
                                          ? Math.round((new Date(detail.submitted_at).getTime() - new Date(detail.started_at).getTime()) / 60000)
                                          : null;
                                        
                                        return (
                                          <tr key={detail.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3 text-sm">{index + 1}</td>
                                            <td className="p-3 text-sm">
                                              {detail.submitted_at ? (
                                                <>
                                                  <div>{new Date(detail.submitted_at).toLocaleDateString('en-GB')}</div>
                                                  <div className="text-xs text-muted-foreground">
                                                    at {new Date(detail.submitted_at).toLocaleTimeString('en-US', { 
                                                      hour: '2-digit', 
                                                      minute: '2-digit',
                                                      hour12: true 
                                                    })}
                                                  </div>
                                                </>
                                              ) : (
                                                <span className="text-muted-foreground">-</span>
                                              )}
                                            </td>
                                            <td className="p-3 text-sm font-medium">{detail.exam.title}</td>
                                            <td className="p-3 text-sm">{detail.exam.subject.subject_name}</td>
                                            <td className="p-3 text-sm">
                                              {timeTaken !== null ? `${timeTaken} min` : '-'}
                                            </td>
                                            <td className="p-3 text-sm font-medium">
                                              {detail.total_marks_obtained !== null 
                                                ? `${detail.total_marks_obtained} / ${detail.exam.total_marks}` 
                                                : '-'}
                                            </td>
                                            <td className="p-3 text-sm font-medium">
                                              {detail.percentage !== null ? `${detail.percentage.toFixed(2)}%` : '-'}
                                            </td>
                                            <td className="p-3">
                                              {detail.status === 'not_started' || detail.status === 'in_progress' ? (
                                                <Badge variant="destructive" className="text-xs">
                                                  <XCircle className="h-3 w-3 mr-1" />
                                                  Missed
                                                </Badge>
                                              ) : detail.result === 'pass' ? (
                                                <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Pass
                                                </Badge>
                                              ) : detail.result === 'fail' ? (
                                                <Badge variant="destructive" className="text-xs">
                                                  <XCircle className="h-3 w-3 mr-1" />
                                                  Fail
                                                </Badge>
                                              ) : (
                                                <Badge variant="secondary" className="text-xs">Pending</Badge>
                                              )}
                                            </td>
                                            <td className="p-3">
                                              {detail.status === 'evaluated' && detail.result ? (
                                                <Button 
                                                  variant="default" 
                                                  size="sm"
                                                  className="text-xs h-8"
                                                  onClick={() => {
                                                    navigate(`/teacher/exam-attempt/${detail.id}`, {
                                                      state: {
                                                        studentId: student.id,
                                                        studentName: student.student_name
                                                      }
                                                    });
                                                  }}
                                                >
                                                  View Details
                                                </Button>
                                              ) : (
                                                <span className="text-xs text-muted-foreground">No details</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
