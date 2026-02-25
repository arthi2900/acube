import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Users, GraduationCap, UserCheck, Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { academicApi, profileApi } from '@/db/api';
import type { Class, Section, AcademicSubject, Profile, TeacherAssignmentWithDetails } from '@/types/types';

const CURRENT_ACADEMIC_YEAR = '2024-2025';

export default function AcademicsManagement() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentWithDetails[]>([]);
  
  // Dialog states
  const [classDialog, setClassDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [studentDialog, setStudentDialog] = useState(false);
  const [teacherDialog, setTeacherDialog] = useState(false);
  
  // Form states
  const [classForm, setClassForm] = useState({ class_name: '', class_code: '', description: '' });
  const [sectionForm, setSectionForm] = useState({ class_id: '', section_name: '', section_code: '' });
  const [subjectForm, setSubjectForm] = useState({ class_id: '', subject_name: '', subject_code: '', description: '' });
  const [studentForm, setStudentForm] = useState({ student_id: '', class_id: '', section_id: '' });
  const [teacherForm, setTeacherForm] = useState({ teacher_id: '', subject_id: '', class_id: '', section_id: '' });
  
  // Edit states
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingSubject, setEditingSubject] = useState<AcademicSubject | null>(null);

  useEffect(() => {
    loadData();
  }, [profile?.school_id]);

  const loadData = async () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      const [classesData, subjectsData, studentsData, teachersData] = await Promise.all([
        academicApi.getClassesBySchoolId(profile.school_id),
        academicApi.getSubjectsBySchoolId(profile.school_id),
        profileApi.getStudentsBySchoolId(profile.school_id),
        profileApi.getTeachersBySchoolId(profile.school_id),
      ]);
      
      setClasses(classesData);
      setSubjects(subjectsData);
      setStudents(studentsData);
      setTeachers(teachersData);
      
      // Load all sections for all classes
      const allSections: Section[] = [];
      for (const cls of classesData) {
        const classSections = await academicApi.getSectionsByClassId(cls.id);
        allSections.push(...classSections);
      }
      setSections(allSections);
      
      // Load all teacher assignments
      const allAssignments: TeacherAssignmentWithDetails[] = [];
      for (const cls of classesData) {
        for (const section of allSections.filter(s => s.class_id === cls.id)) {
          const assignments = await academicApi.getAssignmentsByClassSection(cls.id, section.id, CURRENT_ACADEMIC_YEAR);
          allAssignments.push(...assignments);
        }
      }
      setTeacherAssignments(allAssignments);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Class Management
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return;

    try {
      if (editingClass) {
        await academicApi.updateClass(editingClass.id, classForm);
        toast({ title: 'Success', description: 'Class updated successfully' });
      } else {
        await academicApi.createClass({ school_id: profile.school_id, ...classForm });
        toast({ title: 'Success', description: 'Class created successfully' });
      }
      setClassDialog(false);
      setClassForm({ class_name: '', class_code: '', description: '' });
      setEditingClass(null);
      loadData();
    } catch (error) {
      console.error('Error saving class:', error);
      toast({ title: 'Error', description: 'Failed to save class', variant: 'destructive' });
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Delete this class? This will also delete all sections and subjects.')) return;
    
    try {
      await academicApi.deleteClass(id);
      toast({ title: 'Success', description: 'Class deleted successfully' });
      loadData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({ title: 'Error', description: 'Failed to delete class', variant: 'destructive' });
    }
  };

  // Section Management
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSection) {
        await academicApi.updateSection(editingSection.id, {
          section_name: sectionForm.section_name,
          section_code: sectionForm.section_code,
        });
        toast({ title: 'Success', description: 'Section updated successfully' });
      } else {
        await academicApi.createSection(sectionForm);
        toast({ title: 'Success', description: 'Section created successfully' });
      }
      setSectionDialog(false);
      setSectionForm({ class_id: '', section_name: '', section_code: '' });
      setEditingSection(null);
      loadData();
    } catch (error) {
      console.error('Error saving section:', error);
      toast({ title: 'Error', description: 'Failed to save section', variant: 'destructive' });
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    
    try {
      await academicApi.deleteSection(id);
      toast({ title: 'Success', description: 'Section deleted successfully' });
      loadData();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
    }
  };

  // Subject Management
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return;

    try {
      if (editingSubject) {
        await academicApi.updateSubject(editingSubject.id, {
          subject_name: subjectForm.subject_name,
          subject_code: subjectForm.subject_code,
          description: subjectForm.description,
        });
        toast({ title: 'Success', description: 'Subject updated successfully' });
      } else {
        await academicApi.createSubject({ school_id: profile.school_id, ...subjectForm });
        toast({ title: 'Success', description: 'Subject created successfully' });
      }
      setSubjectDialog(false);
      setSubjectForm({ class_id: '', subject_name: '', subject_code: '', description: '' });
      setEditingSubject(null);
      loadData();
    } catch (error) {
      console.error('Error saving subject:', error);
      toast({ title: 'Error', description: 'Failed to save subject', variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    
    try {
      await academicApi.deleteSubject(id);
      toast({ title: 'Success', description: 'Subject deleted successfully' });
      loadData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' });
    }
  };

  // Student Assignment
  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await academicApi.assignStudentToClassSection({
        student_id: studentForm.student_id,
        class_id: studentForm.class_id,
        section_id: studentForm.section_id,
        academic_year: CURRENT_ACADEMIC_YEAR,
      });
      toast({ title: 'Success', description: 'Student assigned successfully' });
      setStudentDialog(false);
      setStudentForm({ student_id: '', class_id: '', section_id: '' });
    } catch (error) {
      console.error('Error assigning student:', error);
      toast({ title: 'Error', description: 'Failed to assign student', variant: 'destructive' });
    }
  };

  // Teacher Assignment (HEART OF THE SYSTEM)
  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await academicApi.createTeacherAssignment({
        teacher_id: teacherForm.teacher_id,
        subject_id: teacherForm.subject_id,
        class_id: teacherForm.class_id,
        section_id: teacherForm.section_id,
        academic_year: CURRENT_ACADEMIC_YEAR,
      });
      toast({ title: 'Success', description: 'Teacher assigned successfully' });
      setTeacherDialog(false);
      setTeacherForm({ teacher_id: '', subject_id: '', class_id: '', section_id: '' });
      loadData(); // Reload to show new assignment
    } catch (error) {
      console.error('Error assigning teacher:', error);
      toast({ title: 'Error', description: 'Failed to assign teacher', variant: 'destructive' });
    }
  };

  const handleDeleteTeacherAssignment = async (id: string) => {
    if (!confirm('Remove this teacher assignment?')) return;
    
    try {
      await academicApi.deleteTeacherAssignment(id);
      toast({ title: 'Success', description: 'Teacher assignment removed successfully' });
      loadData();
    } catch (error) {
      console.error('Error removing teacher assignment:', error);
      toast({ title: 'Error', description: 'Failed to remove teacher assignment', variant: 'destructive' });
    }
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.class_name || 'Unknown';
  };

  const getSectionName = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.section_name || 'Unknown';
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.subject_name || 'Unknown';
  };

  const getSectionsByClass = (classId: string) => {
    return sections.filter(s => s.class_id === classId);
  };

  const getSubjectsByClass = (classId: string) => {
    return subjects.filter(s => s.class_id === classId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading academic data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/principal')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Academic Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage classes, sections, subjects, and student assignments
          </p>
        </div>
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="classes">
            <BookOpen className="w-4 h-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="sections">
            <Users className="w-4 h-4 mr-2" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <GraduationCap className="w-4 h-4 mr-2" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="students">
            <UserCheck className="w-4 h-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <UserCog className="w-4 h-4 mr-2" />
            Teachers
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Classes ({classes.length})</CardTitle>
                  <CardDescription>Manage classes/grades in your school</CardDescription>
                </div>
                <Dialog open={classDialog} onOpenChange={setClassDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingClass(null); setClassForm({ class_name: '', class_code: '', description: '' }); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Class
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateClass}>
                      <DialogHeader>
                        <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                        <DialogDescription>Create a new class/grade</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="class_name">Class Name *</Label>
                          <Input
                            id="class_name"
                            placeholder="e.g., Class 10"
                            value={classForm.class_name}
                            onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="class_code">Class Code *</Label>
                          <Input
                            id="class_code"
                            placeholder="e.g., 10"
                            value={classForm.class_code}
                            onChange={(e) => setClassForm({ ...classForm, class_code: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Optional"
                            value={classForm.description}
                            onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setClassDialog(false)}>Cancel</Button>
                        <Button type="submit">{editingClass ? 'Update' : 'Create'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No classes found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.class_name}</TableCell>
                        <TableCell>{cls.class_code}</TableCell>
                        <TableCell>{cls.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingClass(cls);
                                setClassForm({
                                  class_name: cls.class_name,
                                  class_code: cls.class_code,
                                  description: cls.description || '',
                                });
                                setClassDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(cls.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sections ({sections.length})</CardTitle>
                  <CardDescription>Manage sections for each class</CardDescription>
                </div>
                <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingSection(null); setSectionForm({ class_id: '', section_name: '', section_code: '' }); }} disabled={classes.length === 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateSection}>
                      <DialogHeader>
                        <DialogTitle>{editingSection ? 'Edit Section' : 'Add New Section'}</DialogTitle>
                        <DialogDescription>Create a section for a class</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="section_class">Class *</Label>
                          <Select
                            value={sectionForm.class_id}
                            onValueChange={(value) => setSectionForm({ ...sectionForm, class_id: value })}
                            required
                            disabled={!!editingSection}
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
                          <Label htmlFor="section_name">Section Name *</Label>
                          <Input
                            id="section_name"
                            placeholder="e.g., Section A"
                            value={sectionForm.section_name}
                            onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="section_code">Section Code *</Label>
                          <Input
                            id="section_code"
                            placeholder="e.g., A"
                            value={sectionForm.section_code}
                            onChange={(e) => setSectionForm({ ...sectionForm, section_code: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setSectionDialog(false)}>Cancel</Button>
                        <Button type="submit">{editingSection ? 'Update' : 'Create'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sections found</p>
                  {classes.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">Create classes first</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Section Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sections.map((section) => (
                      <TableRow key={section.id}>
                        <TableCell>{getClassName(section.class_id)}</TableCell>
                        <TableCell className="font-medium">{section.section_name}</TableCell>
                        <TableCell>{section.section_code}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingSection(section);
                                setSectionForm({
                                  class_id: section.class_id,
                                  section_name: section.section_name,
                                  section_code: section.section_code,
                                });
                                setSectionDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSection(section.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subjects ({subjects.length})</CardTitle>
                  <CardDescription>Manage subjects for each class</CardDescription>
                </div>
                <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingSubject(null); setSubjectForm({ class_id: '', subject_name: '', subject_code: '', description: '' }); }} disabled={classes.length === 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateSubject}>
                      <DialogHeader>
                        <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                        <DialogDescription>Create a subject for a class</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="subject_class">Class *</Label>
                          <Select
                            value={subjectForm.class_id}
                            onValueChange={(value) => setSubjectForm({ ...subjectForm, class_id: value })}
                            required
                            disabled={!!editingSubject}
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
                          <Label htmlFor="subject_name">Subject Name *</Label>
                          <Input
                            id="subject_name"
                            placeholder="e.g., Mathematics"
                            value={subjectForm.subject_name}
                            onChange={(e) => setSubjectForm({ ...subjectForm, subject_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject_code">Subject Code *</Label>
                          <Input
                            id="subject_code"
                            placeholder="e.g., MATH"
                            value={subjectForm.subject_code}
                            onChange={(e) => setSubjectForm({ ...subjectForm, subject_code: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject_description">Description</Label>
                          <Textarea
                            id="subject_description"
                            placeholder="Optional"
                            value={subjectForm.description}
                            onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setSubjectDialog(false)}>Cancel</Button>
                        <Button type="submit">{editingSubject ? 'Update' : 'Create'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No subjects found</p>
                  {classes.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">Create classes first</p>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell>{getClassName(subject.class_id)}</TableCell>
                        <TableCell className="font-medium">{subject.subject_name}</TableCell>
                        <TableCell>{subject.subject_code}</TableCell>
                        <TableCell>{subject.description || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingSubject(subject);
                                setSubjectForm({
                                  class_id: subject.class_id,
                                  subject_name: subject.subject_name,
                                  subject_code: subject.subject_code,
                                  description: subject.description || '',
                                });
                                setSubjectDialog(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Assignment Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Assignment</CardTitle>
                  <CardDescription>Assign students to class and section</CardDescription>
                </div>
                <Dialog open={studentDialog} onOpenChange={setStudentDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setStudentForm({ student_id: '', class_id: '', section_id: '' })} disabled={classes.length === 0 || sections.length === 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAssignStudent}>
                      <DialogHeader>
                        <DialogTitle>Assign Student</DialogTitle>
                        <DialogDescription>Assign a student to class and section</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="student">Student *</Label>
                          <Select
                            value={studentForm.student_id}
                            onValueChange={(value) => setStudentForm({ ...studentForm, student_id: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.full_name || student.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assign_class">Class *</Label>
                          <Select
                            value={studentForm.class_id}
                            onValueChange={(value) => setStudentForm({ ...studentForm, class_id: value, section_id: '' })}
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
                          <Label htmlFor="assign_section">Section *</Label>
                          <Select
                            value={studentForm.section_id}
                            onValueChange={(value) => setStudentForm({ ...studentForm, section_id: value })}
                            required
                            disabled={!studentForm.class_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSectionsByClass(studentForm.class_id).map((section) => (
                                <SelectItem key={section.id} value={section.id}>
                                  {section.section_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setStudentDialog(false)}>Cancel</Button>
                        <Button type="submit">Assign</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Student assignment interface</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Assign Student" to assign students to classes and sections
                </p>
                {(classes.length === 0 || sections.length === 0) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Create classes and sections first
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teacher Assignment Tab - HEART OF THE SYSTEM */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Teacher Assignment</CardTitle>
                  <CardDescription>
                    Assign teachers to subjects for specific class-section combinations
                  </CardDescription>
                </div>
                <Dialog open={teacherDialog} onOpenChange={setTeacherDialog}>
                  <DialogTrigger asChild>
                    <Button disabled={classes.length === 0 || sections.length === 0 || subjects.length === 0 || teachers.length === 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Teacher
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Teacher to Subject-Class-Section</DialogTitle>
                      <DialogDescription>
                        Map a teacher to teach a specific subject for a class-section combination
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAssignTeacher}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="teacher">Teacher *</Label>
                          <Select
                            value={teacherForm.teacher_id}
                            onValueChange={(value) => setTeacherForm({ ...teacherForm, teacher_id: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.full_name} ({teacher.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="class">Class *</Label>
                          <Select
                            value={teacherForm.class_id}
                            onValueChange={(value) => {
                              setTeacherForm({ ...teacherForm, class_id: value, section_id: '', subject_id: '' });
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
                            value={teacherForm.section_id}
                            onValueChange={(value) => setTeacherForm({ ...teacherForm, section_id: value })}
                            disabled={!teacherForm.class_id}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSectionsByClass(teacherForm.class_id).map((section) => (
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
                            value={teacherForm.subject_id}
                            onValueChange={(value) => setTeacherForm({ ...teacherForm, subject_id: value })}
                            disabled={!teacherForm.class_id}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSubjectsByClass(teacherForm.class_id).map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.subject_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Assign Teacher</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teacherAssignments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.teacher?.full_name || 'Unknown Teacher'}
                          </TableCell>
                          <TableCell>{getSubjectName(assignment.subject_id)}</TableCell>
                          <TableCell>{getClassName(assignment.class_id)}</TableCell>
                          <TableCell>{getSectionName(assignment.section_id)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTeacherAssignment(assignment.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No teacher assignments yet. Create classes, sections, subjects, and add teachers first.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
