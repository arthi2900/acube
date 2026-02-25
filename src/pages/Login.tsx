import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Box } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { profileApi } from '@/db/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await signIn(username, password);
      
      const userProfile = await profileApi.getCurrentProfile();
      
      toast({
        title: 'Success',
        description: 'Login successful',
      });

      if (userProfile) {
        if (userProfile.suspended) {
          await signOut();
          toast({
            title: 'Account Suspended',
            description: 'Your account has been suspended. Please contact the administrator.',
            variant: 'destructive',
          });
          return;
        }

        switch (userProfile.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'principal':
            navigate('/principal');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card elegant-shadow-lg border-primary/30 bg-background/10">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 gradient-purple-blue rounded-2xl flex items-center justify-center glow-primary">
              <Box className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-white">
            Welcome to A Cube
          </CardTitle>
          <CardDescription className="text-center text-base text-white">
            Student Performance &amp; Skill Analysis
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base text-white">User ID / Email</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
                className="h-11 bg-white text-black placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base text-white">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="h-11 bg-white text-black placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="keep-signed-in"
                checked={keepSignedIn}
                onCheckedChange={(checked) => setKeepSignedIn(checked as boolean)}
              />
              <label
                htmlFor="keep-signed-in"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
              >
                Keep me signed in
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full h-11 gradient-purple-blue text-white text-base hover:opacity-90 transition-opacity" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-white">
              Don't have an account?{' '}
              <Link to="/register" className="hover:underline font-medium text-white">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
