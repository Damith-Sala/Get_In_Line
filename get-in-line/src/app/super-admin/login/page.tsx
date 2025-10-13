'use client';

import { FormEvent, useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/super-admin/login', {
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
        throw new Error(data.error || 'Super admin login failed');
      }

      // Redirect to super admin dashboard
      window.location.href = '/super-admin';
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Super Admin Access
          </CardTitle>
          <CardDescription>
            System Administration Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Super Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ketov50192@arqsis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Super Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter super admin password"
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
              {loading ? 'Authenticating...' : 'Access Super Admin'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm">
            <p>
              <Link href="/login" className="text-primary hover:underline">
                ← Back to Regular Login
              </Link>
            </p>
            
            <p>
              <Link href="/" className="text-muted-foreground hover:underline">
                Back home
              </Link>
            </p>
          </div>

          <Alert className="mt-4">
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">🔐 Hardcoded Credentials</div>
                <div className="text-sm">
                  <strong>Email:</strong> ketov50192@arqsis.com<br/>
                  <strong>Password:</strong> damith2000
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
