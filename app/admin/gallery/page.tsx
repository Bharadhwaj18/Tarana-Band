'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@supabase/supabase-js';
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/imageUtils';

interface GalleryPhoto {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  storage_path: string;
  order_position: number;
}

const MAX_PHOTOS = 50;

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('order_position', { ascending: true });

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      setPhotos(data || []);
    }

    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= MAX_PHOTOS) {
      setMessage(`Maximum ${MAX_PHOTOS} photos allowed. Please delete some photos first.`);
      return;
    }

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (files.length > remainingSlots) {
      setMessage(`You can only upload ${remainingSlots} more photo(s). Current: ${photos.length}/${MAX_PHOTOS}`);
      return;
    }

    setUploading(true);
    setMessage('Compressing and uploading photos...');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setMessage('Supabase not configured');
      setUploading(false);
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload to Supabase Storage (with compression)
        const uploadResult = await uploadImageToSupabase(supabase, file, 'gallery');

        if (!uploadResult) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        // Save to database
        const { error } = await supabase
          .from('gallery_photos')
          .insert({
            title: file.name.split('.')[0],
            image_url: uploadResult.url,
            storage_path: uploadResult.path,
            order_position: photos.length
          });

        if (error) throw error;
      });

      await Promise.all(uploadPromises);

      setMessage(`Successfully uploaded ${files.length} photo(s)!`);
      fetchPhotos();

      // Clear file input
      e.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Error uploading photos. Please try again.');
    }

    setUploading(false);
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Delete from storage
    await deleteImageFromSupabase(supabase, photo.storage_path);

    // Delete from database
    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', photo.id);

    if (error) {
      console.error('Error deleting photo:', error);
      setMessage('Error deleting photo');
      return;
    }

    // Remove from homepage carousel if it was featured there
    try {
      const { data: configData } = await supabase
        .from('general_config')
        .select('content')
        .eq('section_name', 'featured_photos')
        .single();

      if (configData?.content?.photos) {
        const before = configData.content.photos as any[];
        const after = before.filter((p) => p.id !== photo.id);
        if (after.length !== before.length) {
          await supabase
            .from('general_config')
            .update({
              content: { ...configData.content, photos: after },
              updated_at: new Date().toISOString(),
            })
            .eq('section_name', 'featured_photos');
        }
      }
    } catch (err) {
      console.error('Error cleaning up carousel reference:', err);
    }

    setMessage('Photo deleted successfully');
    fetchPhotos();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gold mb-2">Photo Gallery</h1>
            <p className="text-gray-600">
              {photos.length} / {MAX_PHOTOS} photos used
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600"
          >
            Preview Homepage
          </a>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') || message.includes('Maximum') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
            {message}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gold mb-4">Upload Photos</h2>
          <p className="text-gray-400 mb-4">
            Select photos from your device. They will be automatically compressed before upload.
          </p>

          <label className="block">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading || photos.length >= MAX_PHOTOS}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-3 file:px-6
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-gold file:text-black
                hover:file:bg-gold-light
                file:cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {uploading && (
            <p className="text-gold mt-4">Uploading and compressing photos...</p>
          )}

          {photos.length >= MAX_PHOTOS && (
            <p className="text-red-400 mt-4 font-semibold">
              Maximum limit reached! Delete some photos to upload more.
            </p>
          )}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-gold/20 transition-shadow"
            >
              <div className="aspect-square relative bg-gray-900">
                <img
                  src={photo.image_url}
                  alt={photo.title || 'Gallery photo'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <button
                  onClick={() => handleDelete(photo)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
                >
                  Delete Photo
                </button>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-lg">No photos in gallery yet.</p>
            <p className="text-gray-500 text-sm mt-2">Upload photos to get started!</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
