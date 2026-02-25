import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { lessonApi, academicApi, subjectApi, profileApi } from '@/db/api';
import { ArrowLeft, Plus, BookOpen, Pencil, Trash2, LayoutGrid, List } from 'lucide-react';
import type { LessonWithDetails, Class, Subject, Profile, TeacherAssignmentWithDetails } from '@/types/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export default function ManageLessons() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<LessonWithDetails[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // Add Lesson Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Rename Lesson Dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [lessonToRename, setLessonToRename] = useState<LessonWithDetails | null>(null);
  const [renamedLessonName, setRenamedLessonName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete Lesson Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<LessonWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter states
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');

  // View mode state
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      if (!profile) throw new Error('Profile not found');
      setCurrentProfile(profile);

      if (!profile.school_id) throw new Error('School ID not found');

      if (profile.role === 'principal') {
        // Principals see all lessons, classes, and subjects in their school
        const [lessonsData, classesData, subjectsData] = await Promise.all([
          lessonApi.getLessonsBySchool(profile.school_id),
          academicApi.getClassesBySchoolId(profile.school_id),
          subjectApi.getAllSubjects(),
        ]);

        setLessons(lessonsData);
        setClasses(classesData);
        setSubjects(subjectsData);
      } else if (profile.role === 'teacher') {
        // Teachers only see lessons for their assigned class-section-subject combinations
        // Load teacher assignments first
        const assignments = await academicApi.getTeacherAssignments(profile.id, '2024-2025');
        setTeacherAssignments(assignments);

        // Extract unique class IDs and subject IDs from assignments
        const assignedClassIds = Array.from(new Set(assignments.map(a => a.class_id)));
        const assignedSubjectIds = Array.from(new Set(assignments.map(a => a.subject_id)));

        // Load all lessons from school
        const allLessons = await lessonApi.getLessonsBySchool(profile.school_id);

        // Filter lessons to only show those matching teacher's assignments
        // A lesson is visible if the teacher is assigned to that class AND subject combination
        const filteredLessons = allLessons.filter(lesson => {
          // Check if teacher has an assignment for this class-subject combination
          return assignments.some(assignment => 
            assignment.class_id === lesson.class_id && 
            assignment.subject_id === lesson.subject_id
          );
        });

        setLessons(filteredLessons);

        // Load only assigned classes and subjects
        const [classesData, subjectsData] = await Promise.all([
          academicApi.getClassesBySchoolId(profile.school_id),
          subjectApi.getTeacherAssignedSubjects(profile.id),
        ]);

        // Filter classes to only show assigned ones
        const assignedClasses = classesData.filter(c => assignedClassIds.includes(c.id));
        setClasses(assignedClasses);
        setSubjects(subjectsData);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a lesson name',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedClassId || !selectedSubjectId) {
      toast({
        title: 'Error',
        description: 'Please select both class and subject',
        variant: 'destructive',
      });
      return;
    }

    if (!currentProfile?.school_id || !currentProfile?.id) {
      toast({
        title: 'Error',
        description: 'User profile not found',
        variant: 'destructive',
      });
      return;
    }

    // For teachers, verify they have assignment for this class-subject combination
    if (currentProfile.role === 'teacher') {
      const hasAssignment = teacherAssignments.some(
        a => a.class_id === selectedClassId && a.subject_id === selectedSubjectId
      );

      if (!hasAssignment) {
        toast({
          title: 'Error',
          description: 'You are not assigned to this class-subject combination',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsAdding(true);
    try {
      await lessonApi.createLesson({
        lesson_name: newLessonName.trim(),
        class_id: selectedClassId,
        subject_id: selectedSubjectId,
        school_id: currentProfile.school_id,
        is_mandatory: false,
        created_by: currentProfile.id,
      });

      toast({
        title: 'Success',
        description: 'Lesson added successfully',
      });

      setAddDialogOpen(false);
      setNewLessonName('');
      setSelectedClassId('');
      setSelectedSubjectId('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lesson',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRenameClick = (lesson: LessonWithDetails) => {
    setLessonToRename(lesson);
    setRenamedLessonName(lesson.lesson_name);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!lessonToRename) return;

    if (!renamedLessonName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a lesson name',
        variant: 'destructive',
      });
      return;
    }

    setIsRenaming(true);
    try {
      await lessonApi.updateLesson(lessonToRename.id, {
        lesson_name: renamedLessonName.trim(),
      });

      toast({
        title: 'Success',
        description: 'Lesson renamed successfully',
      });

      setRenameDialogOpen(false);
      setLessonToRename(null);
      setRenamedLessonName('');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rename lesson',
        variant: 'destructive',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = (lesson: LessonWithDetails) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!lessonToDelete) return;

    setIsDeleting(true);
    try {
      await lessonApi.deleteLesson(lessonToDelete.id);

      toast({
        title: 'Success',
        description: 'Lesson deleted successfully',
      });

      setDeleteDialogOpen(false);
      setLessonToDelete(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter subjects based on selected class and teacher assignments
  const filteredSubjects = selectedClassId
    ? subjects.filter(s => {
        // Subject must belong to selected class
        if (s.class_id !== selectedClassId) return false;
        
        // For teachers, subject must be in their assignments for this class
        if (currentProfile?.role === 'teacher') {
          return teacherAssignments.some(
            a => a.class_id === selectedClassId && a.subject_id === s.id
          );
        }
        
        // Principals see all subjects for the class
        return true;
      })
    : [];

  // Apply filters to lessons
  const filteredLessons = lessons.filter(lesson => {
    if (filterClassId !== 'all' && lesson.class_id !== filterClassId) {
      return false;
    }
    if (filterSubjectId !== 'all' && lesson.subject_id !== filterSubjectId) {
      return false;
    }
    return true;
  });

  // Get available subjects for filter based on selected class
  const availableFilterSubjects = filterClassId !== 'all'
    ? subjects.filter(s => s.class_id === filterClassId)
    : subjects;

  // Group lessons by class and subject
  const groupedLessons = filteredLessons.reduce((acc, lesson) => {
    const classKey = lesson.class?.class_name || 'Unknown Class';
    const subjectKey = lesson.subject?.subject_name || 'Unknown Subject';
    const key = `${classKey} - ${subjectKey}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(lesson);
    return acc;
  }, {} as Record<string, LessonWithDetails[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-10 bg-background pb-6 space-y-6 border-b">
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(currentProfile?.role === 'principal' ? '/principal' : '/teacher')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Manage Lessons</h1>
              <p className="text-muted-foreground mt-1">
                {currentProfile?.role === 'teacher' 
                  ? 'Add and organize lessons for your assigned classes and subjects'
                  : 'Add and organize lessons by class and subject'
                }
              </p>
            </div>
          </div>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </div>

        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Class Filter */}
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={filterClassId} onValueChange={(value) => {
                  setFilterClassId(value);
                  // Reset subject filter when class changes
                  if (value === 'all') {
                    setFilterSubjectId('all');
                  }
                }}>
                  <SelectTrigger>
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

              {/* Subject Filter */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select 
                  value={filterSubjectId} 
                  onValueChange={setFilterSubjectId}
                  disabled={filterClassId === 'all'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filterClassId === 'all' ? 'Select class first' : 'All Subjects'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {availableFilterSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setFilterClassId('all');
                    setFilterSubjectId('all');
                  }}
                  disabled={filterClassId === 'all' && filterSubjectId === 'all'}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        {filteredLessons.length > 0 && (
          <div className="flex justify-end gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Card View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pt-6 space-y-6">

      {filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {lessons.length === 0 ? 'No lessons found' : 'No lessons match the selected filters'}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {lessons.length === 0 
                ? "You haven't created any lessons yet. Add your first lesson to get started."
                : 'Try adjusting your filters or clear them to see all lessons.'
              }
            </p>
            {lessons.length === 0 && (
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {viewMode === 'card' ? (
            // Card View
            Object.entries(groupedLessons).map(([groupKey, groupLessons]) => (
              <Card key={groupKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {groupKey}
                    <Badge variant="secondary">{groupLessons.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {groupLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{lesson.lesson_name}</span>
                          {lesson.is_mandatory && (
                            <Badge variant="outline" className="text-xs">Mandatory</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRenameClick(lesson)}
                            title="Rename lesson"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(lesson)}
                            title="Delete lesson"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // List View
            Object.entries(groupedLessons).map(([groupKey, groupLessons]) => (
              <Card key={groupKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {groupKey}
                    <Badge variant="secondary">{groupLessons.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {groupLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lesson.lesson_name}</span>
                              {lesson.is_mandatory && (
                                <Badge variant="outline" className="text-xs">Mandatory</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRenameClick(lesson)}
                            title="Rename lesson"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(lesson)}
                            title="Delete lesson"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Add Lesson Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
            <DialogDescription>
              Create a new lesson for a specific class and subject
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-select">Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Select a class" />
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
              <Label htmlFor="subject-select">Subject</Label>
              <Select 
                value={selectedSubjectId} 
                onValueChange={setSelectedSubjectId}
                disabled={!selectedClassId}
              >
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder={selectedClassId ? "Select a subject" : "Select a class first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-name">Lesson Name</Label>
              <Input
                id="lesson-name"
                placeholder="Enter lesson name"
                value={newLessonName}
                onChange={(e) => setNewLessonName(e.target.value)}
                disabled={isAdding}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setNewLessonName('');
                setSelectedClassId('');
                setSelectedSubjectId('');
              }}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button onClick={handleAddLesson} disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Lesson Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rename Lesson</DialogTitle>
            <DialogDescription>
              Update the name for '{lessonToRename?.lesson_name}'
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-lesson">New Lesson Name</Label>
              <Input
                id="rename-lesson"
                placeholder="Enter new lesson name"
                value={renamedLessonName}
                onChange={(e) => setRenamedLessonName(e.target.value)}
                disabled={isRenaming}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setLessonToRename(null);
                setRenamedLessonName('');
              }}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming}>
              {isRenaming ? 'Renaming...' : 'Rename Lesson'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Lesson Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete '{lessonToDelete?.lesson_name}'? This action cannot be undone.
                </p>
                {lessonToDelete && (
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <p className="font-semibold">Lesson Details:</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Class: {lessonToDelete.class?.class_name}</li>
                      <li>• Subject: {lessonToDelete.subject?.subject_name}</li>
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Lesson'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
