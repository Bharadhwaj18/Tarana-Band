'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface BandMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  order_position: number;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BandMember>>({
    name: '',
    role: '',
    bio: '',
    image_url: '',
    order_position: 0,
  });
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/admin/login');
        return;
      }
      setUser(user);
      fetchMembers();
    };
    checkAuth();
  }, [router]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('band_members')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order_position' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.role || !formData.bio) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        // Update existing member
        const { error } = await supabase
          .from('band_members')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new member
        const { error } = await supabase.from('band_members').insert([formData]);
        if (error) throw error;
      }

      setFormData({
        name: '',
        role: '',
        bio: '',
        image_url: '',
        order_position: 0,
      });
      setEditingId(null);
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Error saving member');
    }
  };

  const handleEdit = (member: BandMember) => {
    setEditingId(member.id);
    setFormData(member);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const { error } = await supabase.from('band_members').delete().eq('id', id);
      if (error) throw error;
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Error deleting member');
    }
  };

  if (!user) return <div>Redirecting...</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Band Members</h1>
          <p className="text-gray-600 mt-2">Manage the 7 band members</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Member' : 'Add New Member'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
              <input
                type="text"
                name="role"
                placeholder="Role (e.g., Lead Vocals)"
                value={formData.role || ''}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>

            <textarea
              name="bio"
              placeholder="Biography"
              value={formData.bio || ''}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="image_url"
                placeholder="Image URL (or leave empty)"
                value={formData.image_url || ''}
                onChange={handleInputChange}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
              <input
                type="number"
                name="order_position"
                placeholder="Order"
                value={formData.order_position || 0}
                onChange={handleInputChange}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                {editingId ? 'Update Member' : 'Add Member'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      name: '',
                      role: '',
                      bio: '',
                      image_url: '',
                      order_position: 0,
                    });
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Members List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Members ({members.length})</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No members yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{member.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{member.role}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{member.order_position}</td>
                      <td className="px-6 py-3 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Delete
                        </button>
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
