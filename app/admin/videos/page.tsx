'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface Video {
  id: string;
  title: string;
  description: string;
  video_file_url: string;
  thumbnail_url: string | null;
  video_type: string;
  is_featured: boolean;
  order_position: number;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Video>>({
    title: '',
    description: '',
    video_file_url: '',
    video_type: 'youtube',
    is_featured: false,
    order_position: 0,
  });
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        router.push('/admin/login');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/admin/login');
      else {
        setUser(user);
        fetchVideos();
      }
    };
    checkAuth();
  }, [router]);

  const fetchVideos = async () => {
    if (!supabase) return;

    try {
      const { data } = await supabase.from('videos').select('*').order('order_position');
      setVideos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'order_position' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.video_file_url) {
      alert('Please fill required fields');
      return;
    }

    try {
      if (editingId) {
        await supabase.from('videos').update(formData).eq('id', editingId);
      } else {
        await supabase.from('videos').insert([formData]);
      }
      setFormData({ title: '', description: '', video_file_url: '', video_type: 'youtube', is_featured: false, order_position: 0 });
      setEditingId(null);
      fetchVideos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingId(video.id);
    setFormData(video);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      await supabase.from('videos').delete().eq('id', id);
      fetchVideos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!user) return <div>Redirecting...</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gold">Videos</h1>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gold mb-4">{editingId ? 'Edit Video' : 'Add New Video'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="title" placeholder="Video Title" value={formData.title || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
            <textarea name="description" placeholder="Description" value={formData.description || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" rows={3} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select name="video_type" value={formData.video_type || 'youtube'} onChange={handleInputChange} className="px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none">
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="self_hosted">Self-Hosted</option>
              </select>
              <input type="text" name="video_file_url" placeholder="Video URL or ID" value={formData.video_file_url || ''} onChange={handleInputChange} required className="px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
            </div>
            <input type="text" name="thumbnail_url" placeholder="Thumbnail URL (optional)" value={formData.thumbnail_url || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_featured" checked={formData.is_featured || false} onChange={handleInputChange} className="w-4 h-4" />
                <span className="text-sm text-gray-300">Featured</span>
              </label>
              <input type="number" name="order_position" placeholder="Order" value={formData.order_position || 0} onChange={handleInputChange} className="px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2 rounded-lg">
                {editingId ? 'Update' : 'Add'} Video
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', description: '', video_file_url: '', video_type: 'youtube', is_featured: false, order_position: 0 }); }} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700"><h2 className="text-xl font-semibold text-gold">Videos ({videos.length})</h2></div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading...</div> : videos.length === 0 ? <div className="p-6 text-center text-gray-400">No videos yet</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Title</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Featured</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {videos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-gray-300">{video.title}</td>
                      <td className="px-4 py-3 text-gray-400">{video.video_type}</td>
                      <td className="px-4 py-3 text-gray-400">{video.is_featured ? '✓' : '-'}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(video)} className="text-gold hover:text-gold-light font-semibold">Edit</button>
                        <button onClick={() => handleDelete(video.id)} className="text-red-400 hover:text-red-300 font-semibold">Delete</button>
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
