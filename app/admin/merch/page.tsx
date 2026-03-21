'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
}

export default function AdminMerchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    external_link: '',
    is_active: true,
    order_position: 0,
  });
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      setFormData({ name: '', description: '', price: 0, external_link: '', is_active: true, order_position: 0 });
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
    if (!confirm('Delete this product?')) return;
    try {
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
        <h1 className="text-3xl font-bold">Merchandise</h1>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" name="name" placeholder="Product Name" value={formData.name || ''} onChange={handleInputChange} required className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="number" name="price" placeholder="Price" step="0.01" value={formData.price || 0} onChange={handleInputChange} className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <textarea name="description" placeholder="Description" value={formData.description || ''} onChange={handleInputChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" rows={4} />
            <input type="url" name="external_link" placeholder="Shop Link (https://...)" value={formData.external_link || ''} onChange={handleInputChange} required className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input type="text" name="image_url" placeholder="Image URL" value={formData.image_url || ''} onChange={handleInputChange} className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="number" name="order_position" placeholder="Order" value={formData.order_position || 0} onChange={handleInputChange} className="px-4 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" checked={formData.is_active || false} onChange={handleInputChange} className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg">
                {editingId ? 'Update' : 'Add'} Product
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: 0, external_link: '', is_active: true, order_position: 0 }); }} className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-6 py-2 rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b"><h2 className="text-xl font-semibold">Products ({products.length})</h2></div>
          {loading ? <div className="p-6 text-center">Loading...</div> : products.length === 0 ? <div className="p-6 text-center text-gray-600">No products yet</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600 mt-2">{product.description.slice(0, 100)}...</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
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
