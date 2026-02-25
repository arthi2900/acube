import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Search, Users, GraduationCap, Pencil } from 'lucide-react';
import { profileApi, academicApi } from '@/db/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Class, Section } from '@/types/types';

interface StudentWithClassSection {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  school_name: string | null;
  school_id: string | null;
  role: string;
  approved: boolean;
  suspended: boolean;
  created_at: string;
  class_name: string | null;
  class_code: string | null;
  class_id: string | null;
  section_name: string | null;
  section_code: string | null;
  section_id: string | null;
}

export default function StudentsList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentWithClassSection[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [sortField, setSortField] = useState<'full_name' | 'phone'>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [schoolName, setSchoolName] = useState<string>('');
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  
  // Edit dialog state
  const [editDialog, setEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithClassSection | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    class_id: '',
    section_id: '',
  });
  const [editSections, setEditSections] = useState<Section[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchQuery, selectedClass, selectedSection, sortField, sortOrder]);

  useEffect(() => {
    // Load sections when class changes
    if (selectedClass && selectedClass !== 'all') {
      loadSections(selectedClass);
    } else {
      setSections([]);
      setSelectedSection('all');
    }
  }, [selectedClass]);

  const loadData = async () => {
    try {
      // Fetch fresh profile data
      const currentProfile = await profileApi.getCurrentProfile();
      
      if (!currentProfile?.school_id) {
        toast({
          title: 'Error',
          description: 'You are not assigned to any school',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Store school name for display
      setSchoolName(currentProfile.school_name || 'Your School');

      // Load students with class/section info and classes
      const [studentsData, classesData] = await Promise.all([
        profileApi.getStudentsWithClassSection(currentProfile.school_id),
        academicApi.getClassesBySchoolId(currentProfile.school_id),
      ]);

      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load students list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (classId: string) => {
    try {
      const sectionsData = await academicApi.getSectionsByClassId(classId);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.full_name?.toLowerCase().includes(query) ||
          student.username.toLowerCase().includes(query) ||
          student.phone?.toLowerCase().includes(query) ||
          student.email?.toLowerCase().includes(query)
      );
    }

    // Apply class filter
    if (selectedClass && selectedClass !== 'all') {
      filtered = filtered.filter((student) => student.class_id === selectedClass);
    }

    // Apply section filter
    if (selectedSection && selectedSection !== 'all') {
      filtered = filtered.filter((student) => student.section_id === selectedSection);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      if (sortField === 'full_name') {
        aValue = a.full_name || '';
        bValue = b.full_name || '';
      } else if (sortField === 'phone') {
        aValue = a.phone || '';
        bValue = b.phone || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredStudents(filtered);
  };

  const handleSort = (field: 'full_name' | 'phone') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'full_name' | 'phone') => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handleEditStudent = async (student: StudentWithClassSection) => {
    setEditingStudent(student);
    setEditForm({
      full_name: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      class_id: student.class_id || '',
      section_id: student.section_id || '',
    });
    
    // Load sections for the student's class
    if (student.class_id) {
      try {
        const sectionsData = await academicApi.getSectionsByClassId(student.class_id);
        setEditSections(sectionsData);
      } catch (error) {
        console.error('Error loading sections:', error);
      }
    }
    
    setEditDialog(true);
  };

  const handleEditClassChange = async (classId: string) => {
    setEditForm({ ...editForm, class_id: classId, section_id: '' });
    
    if (classId) {
      try {
        const sectionsData = await academicApi.getSectionsByClassId(classId);
        setEditSections(sectionsData);
      } catch (error) {
        console.error('Error loading sections:', error);
      }
    } else {
      setEditSections([]);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStudent) return;

    try {
      // Update profile information
      await profileApi.updateProfile(editingStudent.id, {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
      });

      // Update class/section assignment if changed
      if (editForm.class_id && editForm.section_id) {
        await academicApi.assignStudentToClassSection({
          student_id: editingStudent.id,
          class_id: editForm.class_id,
          section_id: editForm.section_id,
          academic_year: '2024-2025',
        });
      }

      toast({
        title: 'Success',
        description: 'Student information updated successfully',
      });

      setEditDialog(false);
      setEditingStudent(null);
      setEditForm({
        full_name: '',
        email: '',
        phone: '',
        class_id: '',
        section_id: '',
      });
      
      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student information',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/principal')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">All Students of This School</h1>
          <p className="text-muted-foreground mt-2">
            {schoolName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-secondary" />
                <CardTitle>
                  Students List ({filteredStudents.length} of {students.length})
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Class" />
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
              <Select 
                value={selectedSection} 
                onValueChange={setSelectedSection}
                disabled={selectedClass === 'all' || sections.length === 0}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Section" />
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
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No students found matching your search'
                  : 'No students found in this school'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('full_name')}
                    >
                      Student Name{getSortIcon('full_name')}
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('phone')}
                    >
                      Phone{getSortIcon('phone')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {student.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{student.username}</TableCell>
                      <TableCell>{student.class_name || 'Not Assigned'}</TableCell>
                      <TableCell>{student.section_name || 'Not Assigned'}</TableCell>
                      <TableCell>{student.email || 'N/A'}</TableCell>
                      <TableCell>{student.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.suspended
                              ? 'bg-red-100 text-red-800'
                              : student.approved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {student.suspended
                            ? 'Suspended'
                            : student.approved
                            ? 'Active'
                            : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter((s) => s.approved && !s.suspended).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Users className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter((s) => !s.approved && !s.suspended).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
            <DialogDescription>
              Update student details and class/section assignment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-full-name">Full Name</Label>
                <Input
                  id="edit-full-name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="Enter email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-class">Class</Label>
                <Select
                  value={editForm.class_id}
                  onValueChange={handleEditClassChange}
                >
                  <SelectTrigger id="edit-class">
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
                <Label htmlFor="edit-section">Section</Label>
                <Select
                  value={editForm.section_id}
                  onValueChange={(value) => setEditForm({ ...editForm, section_id: value })}
                  disabled={!editForm.class_id || editSections.length === 0}
                >
                  <SelectTrigger id="edit-section">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {editSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
