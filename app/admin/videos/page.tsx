'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/imageUtils';

interface VideoCategory {
  id: string;
  name: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_file_url: string;
  thumbnail_url: string | null;
  video_type: string;
  is_featured: boolean;
  order_position: number;
  category_id: string | null;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailStoragePath, setThumbnailStoragePath] = useState('');
  const [formData, setFormData] = useState<Partial<Video & { thumbnail_storage_path: string }>>({
    title: '',
    description: '',
    video_file_url: '',
    video_type: 'youtube',
    is_featured: false,
    order_position: 0,
    category_id: null,
    thumbnail_url: null,
    thumbnail_storage_path: '',
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
        fetchCategories();
        fetchVideos();
      }
    };
    checkAuth();
  }, [router]);

  const fetchCategories = async () => {
    if (!supabase) return;

    try {
      const { data } = await supabase.from('video_categories').select('*').order('name');
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      await supabase.from('video_categories').insert([{ name: newCategoryName }]);
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category');
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Videos in this category will lose their category association.`)) return;

    try {
      await supabase.from('video_categories').delete().eq('id', id);
      fetchCategories();
      fetchVideos();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailUploading(true);

    try {
      const result = await uploadImageToSupabase(supabase, file, 'video-thumbnails');
      if (result) {
        setFormData((prev) => ({
          ...prev,
          thumbnail_url: result.url,
          thumbnail_storage_path: result.path,
        }));
        setThumbnailStoragePath(result.path);
      } else {
        alert('Failed to upload thumbnail');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Error uploading thumbnail');
    } finally {
      setThumbnailUploading(false);
    }
  };

  const removeThumbnail = async () => {
    if (!thumbnailStoragePath) return;

    try {
      // Delete from storage
      await deleteImageFromSupabase(supabase, thumbnailStoragePath);

      // Clear from form
      setFormData((prev) => ({
        ...prev,
        thumbnail_url: null,
        thumbnail_storage_path: '',
      }));
      setThumbnailStoragePath('');
    } catch (error) {
      console.error('Error removing thumbnail:', error);
      alert('Error removing thumbnail');
    }
  };

  const getVideoTypePlaceholder = () => {
    const type = formData.video_type;
    if (type === 'youtube') return 'https://youtube.com/watch?v=... or just video ID';
    if (type === 'vimeo') return 'https://vimeo.com/123456 or just 123456';
    if (type === 'drive') return 'https://drive.google.com/file/d/FILE_ID/view or just FILE_ID';
    if (type === 'self_hosted') return 'URL to your video file';
    return 'Enter video URL or ID';
  };

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
    if (!formData.title || !formData.video_file_url || !formData.category_id) {
      alert('Please fill all required fields including category');
      return;
    }

    try {
      // Prepare data without thumbnail_storage_path (it's not a database column)
      const submitData = {
        title: formData.title,
        description: formData.description,
        video_file_url: formData.video_file_url,
        video_type: formData.video_type,
        is_featured: formData.is_featured,
        order_position: formData.order_position,
        category_id: formData.category_id,
        thumbnail_url: formData.thumbnail_url,
      };

      if (editingId) {
        await supabase.from('videos').update(submitData).eq('id', editingId);
      } else {
        await supabase.from('videos').insert([submitData]);
      }
      setFormData({ title: '', description: '', video_file_url: '', video_type: 'youtube', is_featured: false, order_position: 0, category_id: null, thumbnail_url: null, thumbnail_storage_path: '' });
      setEditingId(null);
      setThumbnailStoragePath('');
      fetchVideos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingId(video.id);
    setFormData(video);
    setThumbnailStoragePath((video as any).thumbnail_storage_path || '');
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

        {/* Category Management Section */}
        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gold mb-4">Manage Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="flex-1 px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && createCategory()}
              />
              <button
                onClick={createCategory}
                className="bg-gold hover:bg-gold-light text-black font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
              >
                Add Category
              </button>
            </div>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between bg-gray-700 px-4 py-2 rounded-lg">
                  <span className="text-white">{cat.name}</span>
                  <button
                    onClick={() => deleteCategory(cat.id, cat.name)}
                    className="text-red-400 hover:text-red-300 font-semibold text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No categories yet. Create one to add videos.</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gold mb-4">{editingId ? 'Edit Video' : 'Add New Video'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Video Title</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Category *</label>
              <select name="category_id" value={formData.category_id || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none">
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Video Type</label>
                <select name="video_type" value={formData.video_type || 'youtube'} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none">
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="drive">Google Drive</option>
                  <option value="self_hosted">Self-Hosted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Video URL or ID</label>
                <input type="text" name="video_file_url" value={formData.video_file_url || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" placeholder={getVideoTypePlaceholder()} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Thumbnail Image</label>
              {formData.thumbnail_url ? (
                <div className="space-y-2">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <img src={formData.thumbnail_url} alt="Thumbnail preview" className="w-full h-32 object-cover rounded" />
                  </div>
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Remove Thumbnail
                  </button>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    disabled={thumbnailUploading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-gold file:text-black
                      hover:file:bg-gold-light
                      file:cursor-pointer
                      disabled:opacity-50"
                  />
                  {thumbnailUploading && (
                    <p className="text-sm text-gold mt-2">Uploading thumbnail...</p>
                  )}
                </label>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_featured" checked={formData.is_featured || false} onChange={handleInputChange} className="w-4 h-4" />
                <span className="text-sm text-gray-300">Featured</span>
              </label>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Display Order</label>
                <input type="number" name="order_position" value={formData.order_position || 0} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2 rounded-lg">
                {editingId ? 'Update' : 'Add'} Video
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ title: '', description: '', video_file_url: '', video_type: 'youtube', is_featured: false, order_position: 0, category_id: null, thumbnail_url: null, thumbnail_storage_path: '' }); setThumbnailStoragePath(''); }} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">
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
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Featured</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {videos.map((video) => {
                    const category = categories.find(c => c.id === video.category_id);
                    return (
                      <tr key={video.id} className="hover:bg-gray-750">
                        <td className="px-4 py-3 text-gray-300">{video.title}</td>
                        <td className="px-4 py-3 text-gray-400">{category?.name || 'Uncategorized'}</td>
                        <td className="px-4 py-3 text-gray-400">{video.video_type}</td>
                        <td className="px-4 py-3 text-gray-400">{video.is_featured ? '✓' : '-'}</td>
                        <td className="px-4 py-3 space-x-2">
                          <button onClick={() => handleEdit(video)} className="text-gold hover:text-gold-light font-semibold">Edit</button>
                          <button onClick={() => handleDelete(video.id)} className="text-red-400 hover:text-red-300 font-semibold">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
