'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TestPage() {
  const [status, setStatus] = useState('Testing connection...');
  const [members, setMembers] = useState<any[]>([]);
  const [homepage, setHomepage] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        setStatus('✅ Supabase client created');

        // Test band_members table
        const { data: membersData, error: membersError } = await supabase
          .from('band_members')
          .select('*');

        if (membersError) {
          setErrors(prev => [...prev, `Band Members Error: ${membersError.message}`]);
        } else {
          setMembers(membersData || []);
          setStatus(prev => prev + '\n✅ Band members table connected');
        }

        // Test general_config table
        const { data: homepageData, error: homepageError } = await supabase
          .from('general_config')
          .select('*');

        if (homepageError) {
          setErrors(prev => [...prev, `General Config Error: ${homepageError.message}`]);
        } else {
          setHomepage(homepageData || []);
          setStatus(prev => prev + '\n✅ General config table connected');
        }

      } catch (error: any) {
        setErrors(prev => [...prev, `Connection Error: ${error.message}`]);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Supabase Connection Test</h1>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
            {status}
          </pre>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-600 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Errors Found</h2>
            {errors.map((error, index) => (
              <div key={index} className="text-red-700 mb-2 font-mono text-sm">
                {error}
              </div>
            ))}
            <div className="mt-4 p-4 bg-red-100 rounded">
              <p className="font-semibold">Solution:</p>
              <p className="text-sm mt-2">
                If you see "relation does not exist" or "table not found", you need to run the SQL scripts:
              </p>
              <ol className="text-sm mt-2 ml-4 list-decimal">
                <li>Go to Supabase Dashboard → SQL Editor</li>
                <li>Copy the SQL from SETUP.md (for band_members)</li>
                <li>Copy the SQL from supabase-homepage-setup.sql (for homepage)</li>
                <li>Run each script</li>
              </ol>
            </div>
          </div>
        )}

        {/* Band Members Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            👥 Band Members ({members.length})
          </h2>
          {members.length === 0 ? (
            <p className="text-gray-600">No band members found. Add them in Admin → Band Members</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="p-3 bg-gray-50 rounded">
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Homepage Config Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            🏠 Homepage Config ({homepage.length})
          </h2>
          {homepage.length === 0 ? (
            <p className="text-gray-600">No homepage config found. Add it in Admin → Homepage</p>
          ) : (
            <div className="space-y-2">
              {homepage.map((config) => (
                <div key={config.id} className="p-3 bg-gray-50 rounded">
                  <p className="font-semibold">{config.section_name}</p>
                  <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                    {JSON.stringify(config.content, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:underline mr-4">← Back to Homepage</a>
          <a href="/admin" className="text-blue-600 hover:underline">Go to Admin →</a>
        </div>
      </div>
    </div>
  );
}
