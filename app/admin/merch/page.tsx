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
  image_urls?: string[] | null;
  storage_path?: string | null;
  storage_paths?: string[] | null;
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
    image_urls: [],
    storage_path: '',
    storage_paths: [],
  });
  const [user, setUser] = useState<any>(null);
  const [checkoutQrUrl, setCheckoutQrUrl] = useState('');
  const [checkoutQrPath, setCheckoutQrPath] = useState('');
  const [checkoutDisclaimer, setCheckoutDisclaimer] = useState(
    'Disclaimer: All merchandise orders are shipped via India Post.'
  );
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/admin/login');
      else {
        setUser(user);
        fetchProducts();
        fetchCheckoutSettings();
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

  const fetchCheckoutSettings = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('general_config')
        .select('content')
        .eq('section_name', 'merch_checkout')
        .eq('is_active', true)
        .single();

      if (data?.content) {
        setCheckoutQrUrl(data.content.qr_code_url || '');
        setCheckoutQrPath(data.content.qr_code_path || '');
        setCheckoutDisclaimer(
          data.content.disclaimer || 'Disclaimer: All merchandise orders are shipped via India Post.'
        );
      }
    } catch (error) {
      console.error('Error fetching merch checkout settings:', error);
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

  const handleMultiplePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const uploadResult = await uploadImageToSupabase(supabase, file, 'merchandise');

      if (uploadResult) {
        setFormData((prev) => {
          const imageUrls = prev.image_urls ? [...prev.image_urls] : ['', '', ''];
          const storagePaths = prev.storage_paths ? [...prev.storage_paths] : ['', '', ''];
          imageUrls[index] = uploadResult.url;
          storagePaths[index] = uploadResult.path;
          return {
            ...prev,
            image_urls: imageUrls,
            storage_paths: storagePaths,
          };
        });
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

  const removeImage = (index: number) => {
    setFormData((prev) => {
      const imageUrls = prev.image_urls ? [...prev.image_urls] : ['', '', ''];
      const storagePaths = prev.storage_paths ? [...prev.storage_paths] : ['', '', ''];
      imageUrls[index] = '';
      storagePaths[index] = '';
      return {
        ...prev,
        image_urls: imageUrls,
        storage_paths: storagePaths,
      };
    });
  };

  const handleCheckoutQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResult = await uploadImageToSupabase(supabase, file, 'merch-checkout');
      if (!uploadResult) {
        alert('Error uploading QR code');
        return;
      }

      if (checkoutQrPath) {
        await deleteImageFromSupabase(supabase, checkoutQrPath);
      }

      setCheckoutQrUrl(uploadResult.url);
      setCheckoutQrPath(uploadResult.path);
      alert('QR code uploaded successfully!');
    } catch (error) {
      console.error('QR upload error:', error);
      alert('Error uploading QR code');
    } finally {
      setUploading(false);
    }
  };

  const saveCheckoutSettings = async () => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('general_config').upsert(
        {
          section_name: 'merch_checkout',
          is_active: true,
          updated_at: new Date().toISOString(),
          content: {
            qr_code_url: checkoutQrUrl,
            qr_code_path: checkoutQrPath,
            disclaimer: checkoutDisclaimer,
          },
        },
        { onConflict: 'section_name' }
      );

      if (error) {
        alert(`Failed to save checkout settings: ${error.message}`);
        return;
      }

      alert('Checkout settings saved successfully!');
    } catch (error) {
      console.error('Error saving checkout settings:', error);
      alert('Error saving checkout settings');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!supabase) return;
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.external_link) {
      alert('Please fill required fields');
      return;
    }

    try {
      // Prepare data - only use the new array columns, remove old singular columns
      const { image_url, storage_path, ...restFormData } = formData;

      const dataToSave = {
        ...restFormData,
        image_urls: formData.image_urls?.filter(url => url) || null,
        storage_paths: formData.storage_paths?.filter(path => path) || null,
      };

      let result;
      if (editingId) {
        result = await supabase.from('merchandise').update(dataToSave).eq('id', editingId);
      } else {
        result = await supabase.from('merchandise').insert([dataToSave]);
      }

      if (result.error) {
        console.error('Database error:', result.error);
        alert(`Error saving product: ${result.error.message}`);
        return;
      }

      alert('Product saved successfully!');
      setFormData({ name: '', description: '', price: 0, external_link: '', is_active: true, order_position: 0, image_url: '', image_urls: [], storage_path: '', storage_paths: [] });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving product. Check console for details.');
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
      // First, find the product to get its photo storage paths
      const productToDelete = products.find(p => p.id === id);

      // Delete photo from storage if it exists
      if (productToDelete?.storage_path) {
        await deleteImageFromSupabase(supabase, productToDelete.storage_path);
      }

      // Delete all images from storage_paths if they exist
      if (productToDelete?.storage_paths && Array.isArray(productToDelete.storage_paths)) {
        for (const path of productToDelete.storage_paths) {
          if (path) {
            await deleteImageFromSupabase(supabase, path);
          }
        }
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
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Product Images (up to 3)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <p className="text-xs text-gray-400">Image {index + 1}</p>
                    {formData.image_urls?.[index] ? (
                      <div className="space-y-2">
                        <img
                          src={formData.image_urls[index]}
                          alt={`Product preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="w-full bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="block border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gold transition">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleMultiplePhotoUpload(e, index)}
                          disabled={uploading}
                          className="hidden"
                        />
                        <span className="text-xs text-gray-400">Click to upload</span>
                        {uploading && <p className="text-xs text-gold mt-1">Uploading...</p>}
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Display Order</label>
              <input type="number" name="order_position" value={formData.order_position || 0} onChange={handleInputChange} className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none" />
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
                <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: 0, external_link: '', is_active: true, order_position: 0, image_url: '', image_urls: [], storage_path: '', storage_paths: [] }); }} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700 space-y-4">
          <h2 className="text-xl font-semibold text-gold">Checkout Configuration</h2>
          <p className="text-sm text-gray-400">
            Configure the QR code and shipping disclaimer shown on the merch checkout page.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Shipping Disclaimer</label>
            <textarea
              value={checkoutDisclaimer}
              onChange={(e) => setCheckoutDisclaimer(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Payment QR Code</label>
            {checkoutQrUrl ? (
              <div className="space-y-2">
                <img
                  src={checkoutQrUrl}
                  alt="Checkout QR preview"
                  className="w-40 h-40 object-contain bg-white rounded-lg p-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutQrUrl('');
                    setCheckoutQrPath('');
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Remove QR
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gold transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCheckoutQrUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <span className="text-sm text-gray-400">Upload QR code image</span>
                {uploading && <p className="text-xs text-gold mt-1">Uploading...</p>}
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={saveCheckoutSettings}
            className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2 rounded-lg"
          >
            Save Checkout Settings
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700"><h2 className="text-xl font-semibold text-gold">Products ({products.length})</h2></div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading...</div> : products.length === 0 ? <div className="p-6 text-center text-gray-400">No products yet</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-700">
                  <h3 className="font-semibold text-gray-300">{product.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">₹{product.price.toFixed(2)}</p>
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
