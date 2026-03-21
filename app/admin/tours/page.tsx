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
      if (!supabase) return;
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
    if (!supabase) return;
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
    let updatedData = { ...formData, [name]: value };

    // Auto-adjust status based on date if needed
    if (name === 'date') {
      const tourDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If setting date to past, auto-set status to "past"
      if (tourDate < today && formData.status === 'upcoming') {
        updatedData.status = 'past';
      }
      // If setting date to future, auto-set status to "upcoming" (unless it's already set)
      else if (tourDate >= today && !formData.status) {
        updatedData.status = 'upcoming';
      }
    }

    setFormData((prev) => ({ ...prev, ...updatedData }));
  };

  const getValidStatusOptions = () => {
    if (!formData.date) return ['upcoming', 'past', 'cancelled'];

    const tourDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If date is in the past, only allow "past" or "cancelled"
    if (tourDate < today) {
      return ['past', 'cancelled'];
    }
    // If date is in the future, only allow "upcoming"
    return ['upcoming'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!supabase) return;
    e.preventDefault();
    if (!formData.date || !formData.venue_name || !formData.city || !formData.ticket_link) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate that past dates cannot have "upcoming" status
    const tourDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (tourDate < today && formData.status === 'upcoming') {
      alert('Tour date is in the past. Please set status to "Past" or "Cancelled".');
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
    if (!supabase) return;
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
        <h1 className="text-3xl font-bold text-gold">Tours & Events</h1>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gold mb-4">
            {editingId ? 'Edit Tour' : 'Add New Tour'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Tour Date</label>
                <input type="date" name="date" value={formData.date || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
                {formData.date && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(formData.date) < new Date(new Date().setHours(0, 0, 0, 0))
                      ? '⚠️ Past date - Status must be "Past" or "Cancelled"'
                      : '✓ Future date - Status should be "Upcoming"'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Venue Name</label>
                <input type="text" name="venue_name" value={formData.venue_name || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">City</label>
                <input type="text" name="city" value={formData.city || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Ticket Link</label>
                <input type="url" name="ticket_link" value={formData.ticket_link || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                <select name="status" value={formData.status || 'upcoming'} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none">
                  {getValidStatusOptions().includes('upcoming') && <option value="upcoming">Upcoming</option>}
                  {getValidStatusOptions().includes('past') && <option value="past">Past</option>}
                  {getValidStatusOptions().includes('cancelled') && <option value="cancelled">Cancelled</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description (optional)</label>
                <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2 rounded-lg">
                {editingId ? 'Update' : 'Add'} Tour
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ date: '', venue_name: '', city: '', ticket_link: '', status: 'upcoming', description: '' }); }} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-gold">Tours ({tours.length})</h2>
          </div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading...</div> : tours.length === 0 ? <div className="p-6 text-center text-gray-400">No tours yet</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Venue</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">City</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-gray-300">{new Date(tour.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-300">{tour.venue_name}</td>
                      <td className="px-4 py-3 text-gray-300">{tour.city}</td>
                      <td className="px-4 py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${tour.status === 'upcoming' ? 'bg-green-900/50 text-green-300' : tour.status === 'past' ? 'bg-gray-700 text-gray-400' : 'bg-red-900/50 text-red-300'}`}>{tour.status}</span></td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(tour)} className="text-gold hover:text-gold-light">Edit</button>
                        <button onClick={() => handleDelete(tour.id)} className="text-red-400 hover:text-red-300">Delete</button>
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
