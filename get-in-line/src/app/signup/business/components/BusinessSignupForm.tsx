'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Business {
  id: string;
  name: string;
  description: string | null;
  businessType: string | null;
}

export default function BusinessSignupForm() {
  const [step, setStep] = useState<'userInfo' | 'registrationType' | 'businessDetails'>('userInfo');
  const [registrationType, setRegistrationType] = useState<'owner' | 'staff'>('owner');
  
  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Business owner info
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessType, setBusinessType] = useState('');
  
  // Staff info
  const [businessSearchQuery, setBusinessSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Search for businesses (for staff registration)
  useEffect(() => {
    const searchBusinesses = async () => {
      if (businessSearchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/businesses/search?q=${encodeURIComponent(businessSearchQuery)}`);
        const data = await response.json();
        setSearchResults(data.businesses || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchBusinesses, 300);
    return () => clearTimeout(debounce);
  }, [businessSearchQuery]);

  const handleUserInfoSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setStep('registrationType');
  };

  const handleRegistrationTypeSubmit = () => {
    setStep('businessDetails');
  };

  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let requestBody: any = {
        name,
        email,
        password,
        registrationType,
      };

      if (registrationType === 'owner') {
        if (!businessName) {
          throw new Error('Business name is required');
        }
        requestBody.businessData = {
          name: businessName,
          description: businessDescription || undefined,
          businessType: businessType || undefined,
          subscriptionPlan: 'free',
        };
      } else if (registrationType === 'staff') {
        if (!selectedBusiness) {
          throw new Error('Please select a business');
        }
        requestBody.businessId = selectedBusiness.id;
      }

      const response = await fetch('/api/auth/signup/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Show success message and redirect
      if (data.user && data.session) {
        // User is immediately logged in, redirect to business admin
        router.push('/business-admin');
        router.refresh();
      } else {
        // Fallback - redirect to login
        router.push('/login');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Business Registration</CardTitle>
        <CardDescription>
          {step === 'userInfo' && 'Create your account to get started'}
          {step === 'registrationType' && 'Choose how you want to use Get In Line'}
          {step === 'businessDetails' && registrationType === 'owner' && 'Tell us about your business'}
          {step === 'businessDetails' && registrationType === 'staff' && 'Find and join your business'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

      {/* Step 1: User Information */}
      {step === 'userInfo' && (
        <form className="space-y-4" onSubmit={handleUserInfoSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
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
              placeholder="Create a password (minimum 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
          >
            Continue
          </Button>
        </form>
      )}

      {/* Step 2: Registration Type Selection */}
      {step === 'registrationType' && (
        <div className="space-y-6">
          <RadioGroup value={registrationType} onValueChange={(value) => setRegistrationType(value as 'owner' | 'staff')}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="owner" id="owner" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="owner" className="text-lg font-medium cursor-pointer">
                  Create a Business
                </Label>
                <p className="text-sm text-muted-foreground">
                  Start managing queues for your clinic, restaurant, bank, or service business
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="staff" id="staff" className="mt-1" />
              <div className="space-y-1">
                <Label htmlFor="staff" className="text-lg font-medium cursor-pointer">
                  Join Existing Business
                </Label>
                <p className="text-sm text-muted-foreground">
                  Work as staff or manager for an existing business on the platform
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep('userInfo')}
            >
              Back
            </Button>
            <Button 
              type="button"
              className="flex-1"
              onClick={handleRegistrationTypeSubmit}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3a: Business Owner Details */}
      {step === 'businessDetails' && registrationType === 'owner' && (
        <form className="space-y-4" onSubmit={handleFinalSubmit}>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              placeholder="Enter business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description (Optional)</Label>
            <Textarea
              id="businessDescription"
              placeholder="Describe your business..."
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type (Optional)</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinic">Medical Clinic</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="government">Government Office</SelectItem>
                <SelectItem value="retail">Retail Store</SelectItem>
                <SelectItem value="salon">Salon/Spa</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Free Plan includes:</strong> Unlimited queues, basic analytics, and up to 5 staff members
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep('registrationType')}
            >
              Back
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Business Account'}
            </Button>
          </div>
        </form>
      )}

      {/* Step 3b: Staff Member - Business Selection */}
      {step === 'businessDetails' && registrationType === 'staff' && (
        <form className="space-y-4" onSubmit={handleFinalSubmit}>
          <div className="space-y-2">
            <Label htmlFor="businessSearch">Search for your business</Label>
            <Input
              id="businessSearch"
              placeholder="Type business name..."
              value={businessSearchQuery}
              onChange={(e) => setBusinessSearchQuery(e.target.value)}
              type="text"
            />
          </div>

          {/* Search Results */}
          {businessSearchQuery.length >= 2 && (
            <div className="border rounded max-h-60 overflow-y-auto">
              {isSearching && (
                <div className="p-4 text-center text-muted-foreground">
                  Searching...
                </div>
              )}
              
              {!isSearching && searchResults.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No businesses found. Try a different search term.
                </div>
              )}

              {!isSearching && searchResults.map((business) => (
                <div
                  key={business.id}
                  onClick={() => {
                    setSelectedBusiness(business);
                    setBusinessSearchQuery(business.name);
                    setSearchResults([]);
                  }}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedBusiness?.id === business.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="font-medium">{business.name}</div>
                  {business.businessType && (
                    <div className="text-xs text-muted-foreground capitalize">{business.businessType}</div>
                  )}
                  {business.description && (
                    <div className="text-sm text-muted-foreground mt-1">{business.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected Business */}
          {selectedBusiness && (
            <Alert>
              <AlertDescription>
                <strong>Selected:</strong> {selectedBusiness.name}
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="default">
            <AlertDescription>
              <strong>Note:</strong> Make sure you have been authorized by the business owner before registering as staff.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep('registrationType')}
            >
              Back
            </Button>
            <Button 
              type="submit"
              className="flex-1"
              disabled={loading || !selectedBusiness}
            >
              {loading ? 'Creating account...' : 'Join as Staff'}
            </Button>
          </div>
        </form>
      )}

        <div className="mt-6 pt-4 border-t space-y-2 text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>

          <p>
            Want to join queues as a customer?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Customer signup
            </Link>
          </p>

          <p>
            <Link href="/" className="text-muted-foreground hover:underline">
              Back home
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

