import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Users, Edit, Ban, CheckCircle, UserCheck, UserX, Clock, Key, Search, X } from 'lucide-react';
import { profileApi, schoolApi } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import type { Profile, UserRole, School } from '@/types/types';
import { supabase } from '@/db/supabase';

interface EditingUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  school_id: string;
  role: UserRole;
}

export default function UserManagement() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentUser();
    loadProfiles();
    loadSchools();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const profile = await profileApi.getCurrentProfile();
      setCurrentUser(profile);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await profileApi.getAllProfiles();
      setProfiles(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSchools = async () => {
    try {
      const data = await schoolApi.getAllSchools();
      setSchools(data);
    } catch (error) {
      console.error('Failed to load schools:', error);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingUser({
      id: profile.id,
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      school_id: profile.school_id || '',
      role: profile.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsEditDialogOpen(false);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      await profileApi.updateProfile(editingUser.id, {
        full_name: editingUser.full_name || null,
        email: editingUser.email || null,
        phone: editingUser.phone || null,
        school_id: editingUser.school_id || null,
        role: editingUser.role,
      });

      await loadProfiles();

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      setEditingUser(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      await profileApi.toggleSuspend(userId, !currentStatus);

      setProfiles(profiles.map(p =>
        p.id === userId ? { ...p, suspended: !currentStatus } : p
      ));

      toast({
        title: 'Success',
        description: currentStatus ? 'User unsuspended successfully' : 'User suspended successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await profileApi.approveUser(userId);

      setProfiles(profiles.map(p =>
        p.id === userId ? { ...p, approved: true } : p
      ));

      toast({
        title: 'Success',
        description: 'User approved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve user',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This will permanently delete their account.')) {
      return;
    }

    try {
      await profileApi.rejectUser(userId);

      setProfiles(profiles.filter(p => p.id !== userId));

      toast({
        title: 'Success',
        description: 'User rejected and removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject user',
        variant: 'destructive',
      });
    }
  };

  const generateRandomPassword = () => {
    const length = 10;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleOpenResetPassword = (profile: Profile) => {
    setResetPasswordUser(profile);
    const randomPassword = generateRandomPassword();
    setNewPassword(randomPassword);
    setGeneratedPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a new password',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: JSON.stringify({
          userId: resetPasswordUser.id,
          newPassword: newPassword,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        const errorMsg = await error?.context?.text();
        throw new Error(errorMsg || 'Failed to reset password');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      // Save the password to the profiles table
      await profileApi.updateUserPassword(resetPasswordUser.id, newPassword);

      // Update the local state to show the new password
      setProfiles(profiles.map(p =>
        p.id === resetPasswordUser.id ? { ...p, password: newPassword } : p
      ));

      setGeneratedPassword(newPassword);

      toast({
        title: 'Success',
        description: 'Password reset successfully and saved to database',
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    }
  };

  const handleCloseResetPasswordDialog = () => {
    setIsResetPasswordDialogOpen(false);
    setResetPasswordUser(null);
    setNewPassword('');
    setGeneratedPassword('');
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Admin',
      principal: 'Principal',
      teacher: 'Teacher',
      student: 'Student',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      admin: 'destructive',
      principal: 'default',
      teacher: 'secondary',
      student: 'outline',
    };
    return variantMap[role] || 'outline';
  };

  const filterProfiles = (profilesList: Profile[]) => {
    return profilesList.filter(profile => {
      const matchesSearch = 
        searchQuery === '' ||
        profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.school_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
      const matchesSchool = schoolFilter === 'all' || profile.school_id === schoolFilter;
      
      return matchesSearch && matchesRole && matchesSchool;
    });
  };

  const pendingProfiles = filterProfiles(profiles.filter(p => !p.approved));
  const activeProfiles = filterProfiles(profiles.filter(p => p.approved && !p.suspended));
  const suspendedProfiles = filterProfiles(profiles.filter(p => p.suspended));

  const renderPendingUserRow = (profile: Profile) => {
    return (
      <TableRow key={profile.id}>
        <TableCell className="font-medium">{profile.username}</TableCell>
        <TableCell>{profile.full_name || '-'}</TableCell>
        <TableCell>
          <Badge variant={getRoleBadgeVariant(profile.role)}>
            {getRoleLabel(profile.role)}
          </Badge>
        </TableCell>
        <TableCell>{profile.school_name || '-'}</TableCell>
        <TableCell>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleApprove(profile.id)} className="h-8">
              <UserCheck className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(profile.id)}
              className="h-8"
            >
              <UserX className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderUserRow = (profile: Profile) => {
    return (
      <TableRow key={profile.id} className={profile.suspended ? 'opacity-60' : ''}>
        <TableCell className="font-medium">{profile.username}</TableCell>
        <TableCell>{profile.full_name || '-'}</TableCell>
        <TableCell>
          <Badge variant={getRoleBadgeVariant(profile.role)}>
            {getRoleLabel(profile.role)}
          </Badge>
        </TableCell>
        <TableCell>{profile.school_name || '-'}</TableCell>
        <TableCell>
          <Badge variant={profile.suspended ? 'destructive' : 'secondary'}>
            {profile.suspended ? 'Suspended' : 'Active'}
          </Badge>
        </TableCell>
        <TableCell className="font-mono text-sm">
          {profile.password || '-'}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(profile)} className="h-8">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleOpenResetPassword(profile)}
              className="h-8"
            >
              <Key className="w-4 h-4 mr-1" />
              Reset Password
            </Button>
            <Button
              size="sm"
              variant={profile.suspended ? 'default' : 'destructive'}
              onClick={() => handleToggleSuspend(profile.id, profile.suspended)}
              className="h-8"
            >
              {profile.suspended ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Unsuspend
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-1" />
                  Suspend
                </>
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, assign roles, and control account access
          </p>
        </div>
        <div className="flex gap-4">
          <Badge 
            variant="outline" 
            className="text-lg px-4 py-2 bg-yellow-50 text-yellow-700 border-yellow-300 cursor-pointer hover:bg-yellow-100 transition-colors"
            onClick={() => setActiveTab('pending')}
          >
            Pending: {pendingProfiles.length}
          </Badge>
          <Badge 
            variant="secondary" 
            className="text-lg px-4 py-2 cursor-pointer hover:bg-secondary/80 transition-colors"
            onClick={() => setActiveTab('active')}
          >
            Active: {activeProfiles.length}
          </Badge>
          <Badge 
            variant="destructive" 
            className="text-lg px-4 py-2 cursor-pointer hover:bg-destructive/80 transition-colors"
            onClick={() => setActiveTab('suspended')}
          >
            Suspended: {suspendedProfiles.length}
          </Badge>
        </div>
      </div>

      {/* School Isolation Context Banner */}
      {currentUser && currentUser.role !== 'admin' && currentUser.school_name && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  School Context: {currentUser.school_name}
                </p>
                <p className="text-sm text-blue-700">
                  {currentUser.role === 'principal' && 'As a Principal, you can view and manage all teachers and students in your school.'}
                  {currentUser.role === 'teacher' && 'As a Teacher, you can view students from your school. You cannot view other teachers or the principal.'}
                  {currentUser.role === 'student' && 'As a Student, you can only view your own profile. Other students and teachers are not visible to you.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentUser && currentUser.role === 'admin' && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-purple-900">
                  Administrator Access
                </p>
                <p className="text-sm text-purple-700">
                  You have full access to manage users across all schools in the system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by username, name, email, or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Role Filter */}
            <div className="w-full xl:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* School Filter */}
            <div className="w-full xl:w-64">
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.school_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || roleFilter !== 'all' || schoolFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setSchoolFilter('all');
                }}
                className="xl:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filtered Records Count */}
          {(searchQuery || roleFilter !== 'all' || schoolFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="px-3 py-1">
                {activeTab === 'pending' && `${pendingProfiles.length} ${pendingProfiles.length === 1 ? 'record' : 'records'} found`}
                {activeTab === 'active' && `${activeProfiles.length} ${activeProfiles.length === 1 ? 'record' : 'records'} found`}
                {activeTab === 'suspended' && `${suspendedProfiles.length} ${suspendedProfiles.length === 1 ? 'record' : 'records'} found`}
              </Badge>
              <span className="text-muted-foreground">
                {searchQuery && `Searching for "${searchQuery}"`}
                {searchQuery && (roleFilter !== 'all' || schoolFilter !== 'all') && ' • '}
                {roleFilter !== 'all' && `Role: ${getRoleLabel(roleFilter)}`}
                {roleFilter !== 'all' && schoolFilter !== 'all' && ' • '}
                {schoolFilter !== 'all' && `School: ${schools.find(s => s.id === schoolFilter)?.school_name || 'Unknown'}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'active' | 'suspended')}>
        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Users</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No pending users</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    New user registrations will appear here for approval
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProfiles.map(renderPendingUserRow)}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              {activeProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No active users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeProfiles.map(renderUserRow)}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspended" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Suspended Users</CardTitle>
            </CardHeader>
            <CardContent>
              {suspendedProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Ban className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No suspended users</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspendedProfiles.map(renderUserRow)}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={profiles.find(p => p.id === editingUser.id)?.username || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-full-name">Full Name</Label>
                <Input
                  id="edit-full-name"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Contact Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-school">School</Label>
                <Select
                  value={editingUser.school_id || 'none'}
                  onValueChange={(value) => setEditingUser({ ...editingUser, school_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger id="edit-school">
                    <SelectValue placeholder="Select a school (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.school_name} ({school.school_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value as UserRole })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetPasswordDialogOpen} onOpenChange={handleCloseResetPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for user: <strong>{resetPasswordUser?.username}</strong>
            </DialogDescription>
          </DialogHeader>
          
          {!generatedPassword ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-muted-foreground">
                  A random password has been generated. You can modify it or use as is.
                </p>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Important:</p>
                <p className="text-sm text-muted-foreground">
                  Make sure to copy and share this password with the user securely. 
                  They can change it later from their account settings.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-md">
                <p className="text-sm font-medium mb-2">Password Reset Successful!</p>
                <p className="text-sm text-muted-foreground mb-3">
                  The new password for <strong>{resetPasswordUser?.username}</strong> is:
                </p>
                <div className="bg-background p-3 rounded border font-mono text-sm break-all">
                  {generatedPassword}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Please copy this password and share it with the user securely.
                </p>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  toast({
                    title: 'Copied',
                    description: 'Password copied to clipboard',
                  });
                }}
              >
                Copy Password
              </Button>
            </div>
          )}
          
          <DialogFooter>
            {!generatedPassword ? (
              <>
                <Button variant="outline" onClick={handleCloseResetPasswordDialog}>
                  Cancel
                </Button>
                <Button onClick={handleResetPassword}>
                  Reset Password
                </Button>
              </>
            ) : (
              <Button onClick={handleCloseResetPasswordDialog} className="w-full">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
