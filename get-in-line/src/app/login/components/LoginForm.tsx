'use client';

import { FormEvent, useState } from 'react';
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clear any existing session first to prevent conflicts
      console.log('Clearing any existing session...');
      await supabase.auth.signOut();
      
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Attempting login...');
      // Use our custom login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('Login successful, checking user role...');
      // Check user role and redirect accordingly
      const usersResponse = await fetch('/api/users/me');
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        console.log('User data received:', userData);
        
        if (userData.role === 'super_admin') {
          // Super admin - redirect to super admin dashboard
          console.log('Redirecting to super admin dashboard');
          router.push('/super-admin');
        } else if (userData.role === 'staff') {
          // Staff user - redirect to staff dashboard
          console.log('Redirecting to staff dashboard');
          router.push('/staff-dashboard');
        } else if (userData.role === 'business_admin') {
          // Business admin - redirect to business admin dashboard
          console.log('Redirecting to business admin dashboard');
          router.push('/business-admin');
        } else {
          // All other users (customers) - redirect to dashboard
          console.log('Redirecting to customer dashboard');
          router.push('/dashboard');
        }
      } else {
        console.log('Failed to get user data, redirecting to dashboard');
        // Fallback to dashboard if we can't check role
        router.push('/dashboard');
      }
      router.refresh();
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Sign in to view and manage your queues.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-sm">
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          
          <p>
            <Link href="/" className="text-muted-foreground hover:underline">
              Back home
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link 
            href="/super-admin/login" 
            className="text-sm font-medium text-purple-600 hover:text-purple-800"
          >
            🔧 Super Admin Access
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}