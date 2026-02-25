import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { academicApi } from '@/db/api';
import type { Class } from '@/types/types';

export default function ClassManagement() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    class_name: '',
    class_code: '',
    description: '',
  });

  useEffect(() => {
    loadClasses();
  }, [profile?.school_id]);

  const loadClasses = async () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    try {
      const data = await academicApi.getClassesBySchoolId(profile.school_id);
      setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.school_id) return;

    try {
      if (editingClass) {
        await academicApi.updateClass(editingClass.id, formData);
        toast({
          title: 'Success',
          description: 'Class updated successfully',
        });
      } else {
        await academicApi.createClass({
          school_id: profile.school_id,
          ...formData,
        });
        toast({
          title: 'Success',
          description: 'Class created successfully',
        });
      }
      setDialogOpen(false);
      resetForm();
      loadClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      toast({
        title: 'Error',
        description: 'Failed to save class',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      class_name: cls.class_name,
      class_code: cls.class_code,
      description: cls.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class? This will also delete all associated sections and subjects.')) {
      return;
    }

    try {
      await academicApi.deleteClass(id);
      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      class_code: '',
      description: '',
    });
    setEditingClass(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading classes...</p>
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
          onClick={() => navigate('/principal/academics')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage classes/grades in your school
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
                <DialogDescription>
                  {editingClass ? 'Update class information' : 'Create a new class/grade'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="class_name">Class Name *</Label>
                  <Input
                    id="class_name"
                    placeholder="e.g., Class 10, Grade 12"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_code">Class Code *</Label>
                  <Input
                    id="class_code"
                    placeholder="e.g., 10, 12"
                    value={formData.class_code}
                    onChange={(e) => setFormData({ ...formData, class_code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClass ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle>Classes ({classes.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No classes found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Click "Add Class" to create your first class
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Class Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls, index) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{cls.class_name}</TableCell>
                      <TableCell>{cls.class_code}</TableCell>
                      <TableCell>{cls.description || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cls)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cls.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
