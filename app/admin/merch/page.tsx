'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/imageUtils';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  storage_path?: string | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
}

export default function AdminMerchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    external_link: '',
    is_active: true,
    order_position: 0,
    image_url: '',
    storage_path: '',
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
        fetchProducts();
      }
    };
    checkAuth();
  }, [router]);

  const fetchProducts = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase.from('merchandise').select('*').order('order_position');
      setProducts(data || []);
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
      [name]: type === 'checkbox' ? checked : name === 'price' ? parseFloat(value) : value,
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const uploadResult = await uploadImageToSupabase(supabase, file, 'merchandise');

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
    if (!formData.name || !formData.description || !formData.external_link) {
      alert('Please fill required fields');
      return;
    }

    try {
      if (editingId) {
        await supabase.from('merchandise').update(formData).eq('id', editingId);
      } else {
        await supabase.from('merchandise').insert([formData]);
      }
      setFormData({ name: '', description: '', price: 0, external_link: '', is_active: true, order_position: 0, image_url: '', storage_path: '' });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
  };

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    if (!confirm('Delete this product?')) return;
    try {
      // First, find the product to get its photo storage path
      const productToDelete = products.find(p => p.id === id);

      // Delete photo from storage if it exists
      if (productToDelete?.storage_path) {
        await deleteImageFromSupabase(supabase, productToDelete.storage_path);
      }

      await supabase.from('merchandise').delete().eq('id', id);
      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!user) return <div>Redirecting...</div>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gold">Merchandise</h1>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Product Name</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Price (₹)</label>
                <input type="number" name="price" step="0.01" value={formData.price || 0} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" rows={4} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Shop Link</label>
              <input type="url" name="external_link" value={formData.external_link || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Product Image
                </label>
                {formData.image_url ? (
                  <div className="space-y-2">
                    <img
                      src={formData.image_url}
                      alt="Product preview"
                      className="w-full h-40 object-cover rounded-lg"
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
                <input type="number" name="order_position" value={formData.order_position || 0} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" checked={formData.is_active || false} onChange={handleInputChange} className="w-4 h-4" />
              <span className="text-sm text-gray-300">Active</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2 rounded-lg">
                {editingId ? 'Update' : 'Add'} Product
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: 0, external_link: '', is_active: true, order_position: 0, image_url: '', storage_path: '' }); }} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700"><h2 className="text-xl font-semibold text-gold">Products ({products.length})</h2></div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading...</div> : products.length === 0 ? <div className="p-6 text-center text-gray-400">No products yet</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-700">
                  <h3 className="font-semibold text-gray-300">{product.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-400 mt-2">{product.description.slice(0, 100)}...</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(product)} className="text-gold hover:text-gold-light text-sm font-semibold">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
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
