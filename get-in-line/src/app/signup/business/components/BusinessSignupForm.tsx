'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';

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
        router.push('/business-admin');
        router.refresh();
      } else {
        // Email confirmation sent
        setError('Please check your email to confirm your account before logging in.');
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white/70 dark:bg-black/60 backdrop-blur rounded-lg shadow-md p-8">
      <h1 className="text-2xl font-semibold mb-2">Business Registration</h1>
      <p className="text-sm mb-6 text-gray-600">
        {step === 'userInfo' && 'Create your account to get started'}
        {step === 'registrationType' && 'Choose how you want to use Get In Line'}
        {step === 'businessDetails' && registrationType === 'owner' && 'Tell us about your business'}
        {step === 'businessDetails' && registrationType === 'staff' && 'Find and join your business'}
      </p>

      {error && (
        <div className="bg-red-50 text-red-500 px-4 py-2 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: User Information */}
      {step === 'userInfo' && (
        <form className="flex flex-col gap-3" onSubmit={handleUserInfoSubmit}>
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
          />
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Email" 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Password (minimum 8 characters)" 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            minLength={8}
          />
          <button 
            className="mt-2 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            type="submit"
          >
            Continue
          </button>
        </form>
      )}

      {/* Step 2: Registration Type Selection */}
      {step === 'registrationType' && (
        <div>
          <div className="space-y-3 mb-6">
            <label 
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                registrationType === 'owner' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input 
                type="radio" 
                value="owner" 
                checked={registrationType === 'owner'}
                onChange={(e) => setRegistrationType(e.target.value as 'owner')}
                className="mr-3 mt-1"
              />
              <div>
                <div className="font-medium text-lg">Create a Business</div>
                <div className="text-sm text-gray-600 mt-1">
                  Start managing queues for your clinic, restaurant, bank, or service business
                </div>
              </div>
            </label>
            
            <label 
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                registrationType === 'staff' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input 
                type="radio" 
                value="staff" 
                checked={registrationType === 'staff'}
                onChange={(e) => setRegistrationType(e.target.value as 'staff')}
                className="mr-3 mt-1"
              />
              <div>
                <div className="font-medium text-lg">Join Existing Business</div>
                <div className="text-sm text-gray-600 mt-1">
                  Work as staff or manager for an existing business on the platform
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button 
              className="flex-1 bg-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-400"
              onClick={() => setStep('userInfo')}
            >
              Back
            </button>
            <button 
              className="flex-1 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
              onClick={handleRegistrationTypeSubmit}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3a: Business Owner Details */}
      {step === 'businessDetails' && registrationType === 'owner' && (
        <form className="flex flex-col gap-3" onSubmit={handleFinalSubmit}>
          <input 
            className="border rounded px-3 py-2" 
            placeholder="Business name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required 
          />
          <textarea 
            className="border rounded px-3 py-2 min-h-[80px]" 
            placeholder="Business description (optional)"
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
          />
          <select 
            className="border rounded px-3 py-2"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            <option value="">Select business type (optional)</option>
            <option value="clinic">Medical Clinic</option>
            <option value="hospital">Hospital</option>
            <option value="restaurant">Restaurant</option>
            <option value="bank">Bank</option>
            <option value="government">Government Office</option>
            <option value="retail">Retail Store</option>
            <option value="salon">Salon/Spa</option>
            <option value="other">Other</option>
          </select>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
            <p className="text-sm text-blue-800">
              <strong>Free Plan includes:</strong> Unlimited queues, basic analytics, and up to 5 staff members
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              type="button"
              className="flex-1 bg-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-400"
              onClick={() => setStep('registrationType')}
            >
              Back
            </button>
            <button 
              type="submit"
              className="flex-1 bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Business Account'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3b: Staff Member - Business Selection */}
      {step === 'businessDetails' && registrationType === 'staff' && (
        <form className="flex flex-col gap-3" onSubmit={handleFinalSubmit}>
          <div>
            <label className="block text-sm font-medium mb-2">Search for your business</label>
            <input 
              className="border rounded px-3 py-2 w-full" 
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
                <div className="p-4 text-center text-gray-500">
                  Searching...
                </div>
              )}
              
              {!isSearching && searchResults.length === 0 && (
                <div className="p-4 text-center text-gray-500">
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
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedBusiness?.id === business.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium">{business.name}</div>
                  {business.businessType && (
                    <div className="text-xs text-gray-500 capitalize">{business.businessType}</div>
                  )}
                  {business.description && (
                    <div className="text-sm text-gray-600 mt-1">{business.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected Business */}
          {selectedBusiness && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800">
                <strong>Selected:</strong> {selectedBusiness.name}
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Make sure you have been authorized by the business owner before registering as staff.
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              type="button"
              className="flex-1 bg-gray-300 text-gray-700 rounded px-4 py-2 hover:bg-gray-400"
              onClick={() => setStep('registrationType')}
            >
              Back
            </button>
            <button 
              type="submit"
              className="flex-1 bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 disabled:opacity-50"
              disabled={loading || !selectedBusiness}
            >
              {loading ? 'Creating account...' : 'Join as Staff'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-4 border-t">
        <p className="text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>

        <p className="mt-2 text-sm">
          Want to join queues as a customer?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Customer signup
          </Link>
        </p>

        <p className="mt-2 text-xs">
          <Link href="/" className="text-gray-500 hover:underline">
            Back home
          </Link>
        </p>
      </div>
    </div>
  );
}

