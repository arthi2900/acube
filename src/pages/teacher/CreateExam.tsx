import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { examApi, academicApi, profileApi, examStudentAllocationApi } from '@/db/api';
import { ArrowLeft, Calendar, Clock, FileText, Users } from 'lucide-react';
import type { QuestionPaper, Class, Subject, Section, ExamStatus, StudentClassSectionWithDetails } from '@/types/types';
import { convertISTInputToUTC } from '@/utils/timezone';
import { TimePicker } from '@/components/ui/time-picker';

export default function CreateExam() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherId, setTeacherId] = useState<string>('');
  const [students, setStudents] = useState<StudentClassSectionWithDetails[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignmentType, setAssignmentType] = useState<'class' | 'students'>('class');

  const [formData, setFormData] = useState({
    title: '',
    examType: 'practice' as 'practice' | 'school',
    questionPaperId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    durationMinutes: 60,
    passingMarks: 0,
    instructions: '',
  });
  
  const [totalMarks, setTotalMarks] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-calculate passing marks as 35% of total marks when question paper is selected
  useEffect(() => {
    if (formData.questionPaperId) {
      const selectedPaper = questionPapers.find(p => p.id === formData.questionPaperId);
      if (selectedPaper && selectedPaper.total_marks) {
        const calculatedPassingMarks = Math.ceil(selectedPaper.total_marks * 0.35);
        setTotalMarks(selectedPaper.total_marks);
        setFormData(prev => ({ ...prev, passingMarks: calculatedPassingMarks }));
      }
    }
  }, [formData.questionPaperId, questionPapers]);

  // Load sections when class is selected
  useEffect(() => {
    if (formData.classId) {
      loadSections(formData.classId);
    } else {
      setSections([]);
      setFormData(prev => ({ ...prev, sectionId: '' }));
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [formData.classId]);

  // Load students when section is selected (for "Specific Students" option)
  useEffect(() => {
    if (formData.classId && formData.sectionId && assignmentType === 'students') {
      loadStudents(formData.classId, formData.sectionId);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [formData.classId, formData.sectionId, assignmentType]);

  const loadSections = async (classId: string) => {
    try {
      const sectionsList = await academicApi.getSectionsByClassId(classId);
      setSections(sectionsList);
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
      const studentsList = await academicApi.getStudentsByClassSection(classId, sectionId, '2024-2025');
      setStudents(studentsList);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load students',
        variant: 'destructive',
      });
    }
  };

  const loadInitialData = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile) throw new Error('Profile not found');
      setTeacherId(profile.id);

      const papers = await academicApi.getQuestionPapers();
      const finalPapers = papers.filter(p => p.status === 'final');
      setQuestionPapers(finalPapers);

      const assignments = await academicApi.getTeacherAssignments(profile.id, '2024-2025');
      const uniqueClasses = Array.from(
        new Map(assignments.map(a => [a.class_id, a.class])).values()
      ).filter(Boolean) as Class[];
      setClasses(uniqueClasses);

      const uniqueSubjects = Array.from(
        new Map(assignments.map(a => [a.subject_id, a.subject])).values()
      ).filter(Boolean) as Subject[];
      setSubjects(uniqueSubjects);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage('Creating exam...');

    try {
      console.log('Form submission started');
      console.log('Assignment type:', assignmentType);
      console.log('Selected students:', selectedStudents);
      
      if (!formData.questionPaperId) {
        throw new Error('Please select a question paper');
      }

      // Validate student selection if assignment type is 'students'
      if (assignmentType === 'students' && selectedStudents.length === 0) {
        throw new Error('Please select at least one student');
      }

      const selectedPaper = questionPapers.find(p => p.id === formData.questionPaperId);
      if (!selectedPaper) throw new Error('Question paper not found');

      // Validation: Check if the selected question paper has questions
      if (selectedPaper.total_marks === 0) {
        throw new Error('The selected question paper has no questions. Please select a different paper or add questions to this paper first.');
      }

      // Convert IST input to UTC for storage
      const startTimeUTC = convertISTInputToUTC(formData.startDate, formData.startTime);
      const endTimeUTC = convertISTInputToUTC(formData.endDate, formData.endTime);
      
      const startDateTime = new Date(startTimeUTC);
      const endDateTime = new Date(endTimeUTC);

      if (endDateTime <= startDateTime) {
        throw new Error('End time must be after start time');
      }

      const examData = {
        question_paper_id: formData.questionPaperId,
        title: formData.title,
        class_id: formData.classId,
        subject_id: formData.subjectId,
        teacher_id: teacherId,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        duration_minutes: formData.durationMinutes,
        total_marks: selectedPaper.total_marks,
        passing_marks: formData.passingMarks,
        instructions: formData.instructions || null,
        status: (formData.examType === 'practice' ? 'published' : 'pending_approval') as ExamStatus,
        approved_by: null,
        approved_at: null,
      };

      const createdExam = await examApi.createExam(examData);
      console.log('Exam created:', createdExam);

      // If assignment type is 'students', create student allocations
      if (assignmentType === 'students' && selectedStudents.length > 0) {
        setLoadingMessage(`Assigning exam to ${selectedStudents.length} student(s)...`);
        console.log('Creating allocations for students:', selectedStudents);
        try {
          await examStudentAllocationApi.createAllocations(createdExam.id, selectedStudents);
          console.log('Allocations created successfully');
        } catch (allocError: any) {
          console.error('Failed to create allocations:', allocError);
          throw new Error(`Exam created but failed to assign to students: ${allocError.message}`);
        }
      }

      toast({
        title: 'Success',
        description: assignmentType === 'students' 
          ? `Exam created and assigned to ${selectedStudents.length} student(s) successfully`
          : formData.examType === 'practice' 
          ? 'Practice exam created and published successfully'
          : 'School exam created and sent for approval',
      });

      navigate('/teacher/exams');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create exam',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Exam</h1>
          <p className="text-muted-foreground mt-1">
            Create a new practice or school-level exam
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Exam Type</Label>
              <RadioGroup
                value={formData.examType}
                onValueChange={(value: 'practice' | 'school') =>
                  setFormData({ ...formData, examType: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="practice" id="practice" />
                  <Label htmlFor="practice" className="font-normal cursor-pointer">
                    Practice Exam (No approval required)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="school" id="school" />
                  <Label htmlFor="school" className="font-normal cursor-pointer">
                    School-Level Exam (Requires Principal approval)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Mathematics Mid-Term Exam"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, classId: value, sectionId: '' });
                    setSelectedStudents([]);
                  }}
                  required
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
                <Label htmlFor="section">Section *</Label>
                <Select
                  value={formData.sectionId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, sectionId: value });
                    setSelectedStudents([]);
                  }}
                  required
                  disabled={!formData.classId}
                >
                  <SelectTrigger>
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
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                  required
                >
                  <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="questionPaper">Question Paper *</Label>
              <Select
                value={formData.questionPaperId}
                onValueChange={(value) => {
                  const paper = questionPapers.find(p => p.id === value);
                  setFormData({ 
                    ...formData, 
                    questionPaperId: value,
                    classId: paper?.class_id || formData.classId,
                    subjectId: paper?.subject_id || formData.subjectId,
                  });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select question paper" />
                </SelectTrigger>
                <SelectContent>
                  {questionPapers.map((paper) => (
                    <SelectItem 
                      key={paper.id} 
                      value={paper.id}
                      disabled={paper.total_marks === 0}
                    >
                      {paper.title} {paper.total_marks === 0 ? '(No questions)' : `(${paper.total_marks} marks)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Type Selection */}
            <div className="space-y-2">
              <Label>Assign Exam To</Label>
              <RadioGroup
                value={assignmentType}
                onValueChange={(value: 'class' | 'students') => {
                  setAssignmentType(value);
                  if (value === 'class') {
                    setSelectedStudents([]);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="class" id="assign-class" />
                  <Label htmlFor="assign-class" className="font-normal cursor-pointer">
                    Entire Class
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="students" id="assign-students" />
                  <Label htmlFor="assign-students" className="font-normal cursor-pointer">
                    Specific Students
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Student Selection - Only show when assignment type is 'students' */}
            {assignmentType === 'students' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="students">
                    <Users className="inline w-4 h-4 mr-1" />
                    Select Students *
                  </Label>
                  {students.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedStudents.length === students.length) {
                          setSelectedStudents([]);
                        } else {
                          setSelectedStudents(students.map(s => s.student_id));
                        }
                      }}
                    >
                      {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </div>
                {!formData.classId ? (
                  <p className="text-sm text-muted-foreground">
                    Please select a class first to see available students
                  </p>
                ) : !formData.sectionId ? (
                  <p className="text-sm text-muted-foreground">
                    Please select a section to see available students
                  </p>
                ) : students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No students found in the selected section
                  </p>
                ) : (
                  <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-3">
                    {students.map((student) => (
                      <div key={student.student_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`student-${student.student_id}`}
                          checked={selectedStudents.includes(student.student_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.student_id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.student_id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`student-${student.student_id}`}
                          className="font-normal cursor-pointer flex-1"
                        >
                          {student.student?.full_name || student.student?.username || 'Unknown'}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedStudents.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date * (IST)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Indian Standard Time (IST)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time * (IST)</Label>
                <TimePicker
                  id="startTime"
                  value={formData.startTime}
                  onChange={(value) => setFormData({ ...formData, startTime: value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date * (IST)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Indian Standard Time (IST)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time * (IST)</Label>
                <TimePicker
                  id="endTime"
                  value={formData.endTime}
                  onChange={(value) => setFormData({ ...formData, endTime: value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks (Auto-calculated as 35% of Total Marks)</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  value={formData.passingMarks}
                  readOnly
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Total Marks: {totalMarks} | Passing Marks: {formData.passingMarks} (35%)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Enter exam instructions for students..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (loadingMessage || 'Creating...') : 'Create Exam'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/teacher')} disabled={loading}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
