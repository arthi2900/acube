import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Search, Users, Pencil } from 'lucide-react';
import { profileApi } from '@/db/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Profile } from '@/types/types';

export default function TeachersList() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'full_name' | 'phone'>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [schoolName, setSchoolName] = useState<string>('');
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Profile | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    filterAndSortTeachers();
  }, [teachers, searchQuery, sortField, sortOrder]);

  const loadTeachers = async () => {
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

      const data = await profileApi.getTeachersBySchoolId(currentProfile.school_id);
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teachers list',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTeachers = () => {
    let filtered = [...teachers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (teacher) =>
          teacher.full_name?.toLowerCase().includes(query) ||
          teacher.username.toLowerCase().includes(query) ||
          teacher.phone?.toLowerCase().includes(query) ||
          teacher.email?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      if (sortField === 'full_name') {
        aValue = a.full_name || a.username;
        bValue = b.full_name || b.username;
      } else if (sortField === 'phone') {
        aValue = a.phone || '';
        bValue = b.phone || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTeachers(filtered);
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

  const handleEditClick = (teacher: Profile) => {
    setEditingTeacher(teacher);
    setEditFormData({
      full_name: teacher.full_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingTeacher) return;

    if (!editFormData.full_name.trim()) {
      toast({
        title: 'Error',
        description: 'Full name is required',
        variant: 'destructive',
      });
      return;
    }

    if (editFormData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await profileApi.updateProfile(editingTeacher.id, {
        full_name: editFormData.full_name.trim(),
        email: editFormData.email.trim() || null,
        phone: editFormData.phone.trim() || null,
      });

      toast({
        title: 'Success',
        description: 'Teacher information updated successfully',
      });

      setEditDialogOpen(false);
      setEditingTeacher(null);
      loadTeachers(); // Reload the list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update teacher information',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teachers...</p>
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
          <h1 className="text-3xl font-bold">All Teachers of This School</h1>
          <p className="text-muted-foreground mt-2">
            {schoolName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>
                Teachers List ({filteredTeachers.length} of {teachers.length})
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No teachers found matching your search'
                  : 'No teachers found in this school'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('full_name')}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        Teacher Name{getSortIcon('full_name')}
                      </button>
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('phone')}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        Phone Number{getSortIcon('phone')}
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher, index) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {teacher.full_name || teacher.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {teacher.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {teacher.email || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {teacher.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {teacher.suspended ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                              Suspended
                            </span>
                          ) : teacher.approved ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Pending
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(teacher)}
                          className="h-8 w-8 p-0"
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

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Teachers</p>
                <p className="text-2xl font-bold">{teachers.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {teachers.filter((t) => t.approved && !t.suspended).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {teachers.filter((t) => !t.approved).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update teacher information. Username cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-full-name">Full Name *</Label>
              <Input
                id="edit-full-name"
                value={editFormData.full_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, full_name: e.target.value })
                }
                placeholder="Enter full name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                placeholder="Enter email address"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
                placeholder="Enter phone number"
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
