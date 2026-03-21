'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface Tour {
  id: string;
  date: string;
  venue_name: string;
  city: string;
  ticket_link: string;
  status: string;
  description: string | null;
}

export default function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Tour>>({
    date: '',
    venue_name: '',
    city: '',
    ticket_link: '',
    status: 'upcoming',
    description: '',
  });
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/admin/login');
      else {
        setUser(user);
        fetchTours();
      }
    };
    checkAuth();
  }, [router]);

  const fetchTours = async () => {
    try {
      const { data } = await supabase
        .from('tours')
        .select('*')
        .order('date', { ascending: true });
      setTours(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.venue_name || !formData.city || !formData.ticket_link) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await supabase.from('tours').update(formData).eq('id', editingId);
      } else {
        await supabase.from('tours').insert([formData]);
      }
      setFormData({
        date: '',
        venue_name: '',
        city: '',
        ticket_link: '',
        status: 'upcoming',
        description: '',
      });
      setEditingId(null);
      fetchTours();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (tour: Tour) => {
    setEditingId(tour.id);
    setFormData(tour);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tour?')) return;
    try {
      await supabase.from('tours').delete().eq('id', id);
      fetchTours();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!user) return <div>Redirecting...</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Tours & Events</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Tour' : 'Add New Tour'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="date" name="date" value={formData.date || ''} onChange={handleInputChange} required className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="text" name="venue_name" placeholder="Venue Name" value={formData.venue_name || ''} onChange={handleInputChange} required className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="text" name="city" placeholder="City" value={formData.city || ''} onChange={handleInputChange} required className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="url" name="ticket_link" placeholder="Ticket Link" value={formData.ticket_link || ''} onChange={handleInputChange} required className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select name="status" value={formData.status || 'upcoming'} onChange={handleInputChange} className="px-4 py-2 border-2 border-gray-300 rounded-lg">
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <textarea name="description" placeholder="Description (optional)" value={formData.description || ''} onChange={handleInputChange} className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg">
                {editingId ? 'Update' : 'Add'} Tour
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ date: '', venue_name: '', city: '', ticket_link: '', status: 'upcoming', description: '' }); }} className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Tours ({tours.length})</h2>
          </div>
          {loading ? <div className="p-6 text-center">Loading...</div> : tours.length === 0 ? <div className="p-6 text-center text-gray-600">No tours yet</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Venue</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">City</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm">{new Date(tour.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-sm">{tour.venue_name}</td>
                      <td className="px-6 py-3 text-sm">{tour.city}</td>
                      <td className="px-6 py-3 text-sm"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${tour.status === 'upcoming' ? 'bg-green-100 text-green-800' : tour.status === 'past' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>{tour.status}</span></td>
                      <td className="px-6 py-3 text-sm space-x-2">
                        <button onClick={() => handleEdit(tour)} className="text-blue-600 hover:text-blue-800">Edit</button>
                        <button onClick={() => handleDelete(tour.id)} className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
