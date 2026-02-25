import { useEffect, useState } from 'react';
import { School, Profile } from '@/types/types';
import { schoolApi, profileApi } from '@/db/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Edit, Trash2, Plus, School as SchoolIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const AFFILIATION_BOARDS = [
  'State Board',
  'TN State Board',
  'Metric',
  'CBSE',
  'ICSE',
  'IB',
  'IGCSE',
  'Other',
];

const COMMON_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Tamil',
  'Social Studies',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Geography',
  'Economics',
  'Commerce',
  'Accountancy',
  'Business Studies',
  'Physical Education',
  'Art',
  'Music',
];

export default function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [principals, setPrincipals] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    school_name: '',
    school_address: '',
    contact_number: '',
    email: '',
    affiliation_board: '',
    class_range_from: 1,
    class_range_to: 12,
    subjects_offered: [] as string[],
    principal_id: null as string | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schoolsData, profilesData] = await Promise.all([
        schoolApi.getAllSchools(),
        profileApi.getAllProfiles(),
      ]);
      setSchools(schoolsData);
      setPrincipals(profilesData.filter(p => p.role === 'principal'));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (school?: School) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        school_name: school.school_name,
        school_address: school.school_address,
        contact_number: school.contact_number,
        email: school.email,
        affiliation_board: school.affiliation_board,
        class_range_from: school.class_range_from,
        class_range_to: school.class_range_to,
        subjects_offered: school.subjects_offered,
        principal_id: school.principal_id,
      });
    } else {
      setEditingSchool(null);
      setFormData({
        school_name: '',
        school_address: '',
        contact_number: '',
        email: '',
        affiliation_board: '',
        class_range_from: 1,
        class_range_to: 12,
        subjects_offered: [],
        principal_id: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.school_name || !formData.school_address || !formData.contact_number || !formData.email || !formData.affiliation_board) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.class_range_from > formData.class_range_to) {
      toast({
        title: 'Validation Error',
        description: 'Class range "from" cannot be greater than "to"',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingSchool) {
        const updated = await schoolApi.updateSchool(editingSchool.id, formData);
        if (updated) {
          setSchools(schools.map(s => s.id === updated.id ? updated : s));
          toast({
            title: 'Success',
            description: 'School updated successfully',
          });
        }
      } else {
        const created = await schoolApi.createSchool(formData);
        if (created) {
          setSchools([...schools, created]);
          toast({
            title: 'Success',
            description: 'School created successfully',
          });
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: editingSchool ? 'Failed to update school' : 'Failed to create school',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return;
    }

    try {
      await schoolApi.deleteSchool(id);
      setSchools(schools.filter(s => s.id !== id));
      toast({
        title: 'Success',
        description: 'School deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete school',
        variant: 'destructive',
      });
    }
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects_offered: prev.subjects_offered.includes(subject)
        ? prev.subjects_offered.filter(s => s !== subject)
        : [...prev.subjects_offered, subject],
    }));
  };

  const getPrincipalName = (principalId: string | null) => {
    if (!principalId) return '-';
    const principal = principals.find(p => p.id === principalId);
    return principal ? principal.full_name || principal.username : '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">School Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage school profiles and information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="school_name">School Name *</Label>
                  <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="school_address">School Address *</Label>
                  <Textarea
                    id="school_address"
                    value={formData.school_address}
                    onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="contact_number">Contact Number *</Label>
                  <Input
                    id="contact_number"
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="affiliation_board">Affiliation/Board *</Label>
                  <Select
                    value={formData.affiliation_board}
                    onValueChange={(value) => setFormData({ ...formData, affiliation_board: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFFILIATION_BOARDS.map(board => (
                        <SelectItem key={board} value={board}>{board}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="principal_id">Principal</Label>
                  <Select
                    value={formData.principal_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, principal_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select principal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Principal Assigned</SelectItem>
                      {principals.map(principal => (
                        <SelectItem key={principal.id} value={principal.id}>
                          {principal.full_name || principal.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="class_range_from">Class Range From *</Label>
                  <Input
                    id="class_range_from"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.class_range_from}
                    onChange={(e) => setFormData({ ...formData, class_range_from: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="class_range_to">Class Range To *</Label>
                  <Input
                    id="class_range_to"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.class_range_to}
                    onChange={(e) => setFormData({ ...formData, class_range_to: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label>Subjects Offered *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {COMMON_SUBJECTS.map(subject => (
                      <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.subjects_offered.includes(subject)}
                          onChange={() => toggleSubject(subject)}
                          className="rounded"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {formData.subjects_offered.length} subjects
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSchool ? 'Update School' : 'Create School'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            All Schools ({schools.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SchoolIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No schools found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first school to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>School Code</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Class Range</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map(school => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.school_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{school.school_code}</Badge>
                    </TableCell>
                    <TableCell>{school.affiliation_board}</TableCell>
                    <TableCell>
                      Class {school.class_range_from} - {school.class_range_to}
                    </TableCell>
                    <TableCell>{getPrincipalName(school.principal_id)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{school.contact_number}</div>
                        <div className="text-muted-foreground">{school.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(school)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(school.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
