'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export default function TestConnection() {
  const [status, setStatus] = useState('Testing connection...');
  const supabase = createClient();

  useEffect(() => {
    async function testConnection() {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        setStatus('✅ Successfully connected to Supabase!');
      } catch (error: any) {
        setStatus(`❌ Connection Error: ${error.message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4 m-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Supabase Connection Test</h2>
      <p className={status.includes('✅') ? 'text-green-600' : 'text-red-600'}>
        {status}
      </p>
    </div>
  );
}