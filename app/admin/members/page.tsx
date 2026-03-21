'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/imageUtils';

interface BandMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  storage_path?: string | null;
  order_position: number;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<BandMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BandMember>>({
    name: '',
    role: '',
    bio: '',
    image_url: '',
    storage_path: '',
    order_position: 0,
  });
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
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
    if (!supabase) return;
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const uploadResult = await uploadImageToSupabase(supabase, file, 'band-members');

      if (uploadResult) {
        setFormData((prev) => ({
          ...prev,
          image_url: uploadResult.url,
          storage_path: uploadResult.path,
        }));
        alert('Photo uploaded successfully!');
      } else {
        alert('Error uploading photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading photo');
    }

    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!supabase) return;
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
        storage_path: '',
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
    if (!supabase) return;
    if (!confirm('Are you sure?')) return;

    try {
      // First, find the member to get their photo storage path
      const memberToDelete = members.find(m => m.id === id);

      // Delete photo from storage if it exists
      if (memberToDelete?.storage_path) {
        await deleteImageFromSupabase(supabase, memberToDelete.storage_path);
      }

      // Delete member from database
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
          <h1 className="text-3xl font-bold text-gold">Band Members</h1>
          <p className="text-gray-400 mt-2">Manage the 7 band members</p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gold mb-4">
            {editingId ? 'Edit Member' : 'Add New Member'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Member Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Biography</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Member Photo
                </label>
                {formData.image_url ? (
                  <div className="space-y-2">
                    <img
                      src={formData.image_url}
                      alt="Member preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '', storage_path: '' })}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gold file:text-black
                        hover:file:bg-gold-light
                        file:cursor-pointer
                        disabled:opacity-50"
                    />
                    {uploading && (
                      <p className="text-sm text-gold mt-2">Uploading...</p>
                    )}
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Display Order</label>
                <input
                  type="number"
                  name="order_position"
                  value={formData.order_position || 0}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2 rounded-lg transition-colors"
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
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Members List */}
        <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-gold">Members ({members.length})</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400">Loading...</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No members yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Order</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-gray-300">{member.name}</td>
                      <td className="px-4 py-3 text-gray-400">{member.role}</td>
                      <td className="px-4 py-3 text-gray-400">{member.order_position}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-gold hover:text-gold-light font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-400 hover:text-red-300 font-semibold"
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
