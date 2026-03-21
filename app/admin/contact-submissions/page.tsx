'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  submitted_at: string;
}

export default function AdminContactPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/admin/login');
      else {
        setUser(user);
        fetchSubmissions();
      }
    };
    checkAuth();
  }, [router]);

  const fetchSubmissions = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('contact_submissions').select('*').order('submitted_at', { ascending: false });
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Delete this submission?')) return;
    try {
      await supabase.from('contact_submissions').delete().eq('id', id);
      fetchSubmissions();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!user) return <div>Redirecting...</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gold">Contact Form Submissions</h1>

        <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
          {loading ? (
            <div className="p-6 text-center text-gray-400">Loading...</div>
          ) : submissions.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No submissions yet</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-6 hover:bg-gray-750">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-300">{submission.name}</h3>
                      <p className="text-sm text-gray-400">{submission.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(submission.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="bg-gray-700 rounded p-4 mt-3">
                    <p className="text-gray-300 whitespace-pre-wrap">{submission.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
