'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SortableCard from '@/components/SortableCard';
import OrderSaveStatus, { type OrderStatus } from '@/components/OrderSaveStatus';
import { saveOrder } from '@/lib/saveOrder';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import AdminDrawer, { DrawerFooter } from '@/components/AdminDrawer';
import { useFormDrawer } from '@/lib/useFormDrawer';
import { uploadImageToSupabase, deleteImageFromSupabase } from '@/lib/imageUtils';
import { useRiglyItems } from '@/lib/useRiglyItems';
import ImageCropper from '@/components/ImageCropper';

interface SizeStock {
  [size: string]: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  image_urls?: string[] | null;
  image_positions?: string[] | null;
  storage_path?: string | null;
  storage_paths?: string[] | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
  size_stock?: SizeStock | null;
  /** The Rigly item this product sells: sizes and stock come from there */
  rigly_item_id?: string | null;
}

const EMPTY_PRODUCT: Partial<Product> = {
  name: '',
  description: '',
  price: 0,
  external_link: '',
  is_active: true,
  order_position: 0,
  image_url: '',
  image_urls: [],
  image_positions: [],
  storage_path: '',
  storage_paths: [],
  size_stock: {},
  rigly_item_id: null,
};

export default function AdminMerchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { open, editingId, formData, setFormData, openNew, openEdit, close, requestClose } = useFormDrawer<Partial<Product>>(EMPTY_PRODUCT);
  const rigly = useRiglyItems();
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('');
  const sensors = useSensors(
    // A small movement first, so a plain click on the card still works
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
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
      const { data } = await supabase.from('merchandise').select('*').order('order_position').order('created_at');
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
    if (!formData.name || !formData.description) {
      alert('Please fill required fields');
      return;
    }

    try {
      // Prepare data - only use the new array columns, remove old singular columns
      const { image_url, storage_path, ...restFormData } = formData;

      // Stock isn't edited here any more: it comes from Rigly (size_stock is only the shop's fallback copy)
      const { size_stock: _stock, variant_ids: _variants, ...withoutStock } = restFormData as Partial<Product> & { variant_ids?: unknown };

      // New products go to the end; the order is changed by dragging in the list
      const lastPosition = products.reduce((max, p) => Math.max(max, p.order_position || 0), -1);

      const dataToSave = {
        ...withoutStock,
        order_position: editingId ? formData.order_position ?? 0 : lastPosition + 1,
        rigly_item_id: formData.rigly_item_id || null,
        image_urls: formData.image_urls?.filter(url => url) || null,
        image_positions: formData.image_positions?.length ? formData.image_positions : null,
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

      close();
      fetchProducts();
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving product. Check console for details.');
    }
  };

  const handleEdit = (product: Product) => openEdit(product.id, product);

  // Dropping a card in a new spot saves the new order straight away (it's what the shop and homepage use)
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!supabase) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = products.findIndex((p) => p.id === active.id);
    const to = products.findIndex((p) => p.id === over.id);
    if (from === -1 || to === -1) return;

    const previous = products;
    const reordered = arrayMove(products, from, to).map((p, index) => ({ ...p, order_position: index }));
    setProducts(reordered);
    setOrderStatus('saving');

    try {
      await saveOrder(supabase, 'merchandise', reordered, previous);
      setOrderStatus('saved');
      setTimeout(() => setOrderStatus(''), 2500);
    } catch (error) {
      console.error('Error saving order:', error);
      setProducts(previous);
      setOrderStatus('error');
    }
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
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gold">Merchandise</h1>
          <button type="button" onClick={() => openNew()} className="bg-gold hover:bg-gold-light text-black font-semibold px-5 py-2 rounded-lg whitespace-nowrap">
            + Add product
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-gold">Products ({products.length})</h2>
              <OrderSaveStatus status={orderStatus} />
            </div>
            {products.length > 1 && (
              <p className="text-sm text-gray-400 mt-1">
                Drag a card by its handle to change the order. This is the order customers see in the shop and on the homepage.
              </p>
            )}
          </div>
          {loading ? <div className="p-6 text-center text-gray-400">Loading...</div> : products.length === 0 ? <div className="p-6 text-center text-gray-400">No products yet</div> : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={products.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {products.map((product, index) => (
                <SortableCard key={product.id} id={product.id} position={index + 1} sortable={products.length > 1}>
                  <div className="flex items-start gap-3">
                    {product.image_urls?.[0] && (
                      <img src={product.image_urls[0]} alt="" className="w-14 h-14 rounded object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-300">{product.name}</h3>
                      {!product.is_active && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gray-600 text-gray-300">Inactive: hidden from the shop</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">₹{product.price.toFixed(2)}</p>
                  {(() => {
                    const linked = rigly.items.find((i) => i.id === product.rigly_item_id);
                    if (!product.rigly_item_id) {
                      return <p className="text-xs mt-2 text-yellow-400">Not linked to Rigly: hidden from the shop</p>;
                    }
                    if (!linked) {
                      return rigly.loading || rigly.error ? null : (
                        <p className="text-xs mt-2 text-red-400">Its Rigly item is archived or gone: hidden from the shop</p>
                      );
                    }
                    return (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {linked.variants.map((v) => (
                          <span key={v.id} className={`text-xs px-2 py-0.5 rounded ${stockTone(v.available)}`}>
                            {v.label}: {v.available}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  <p className="text-sm text-gray-400 mt-2">{product.description.slice(0, 100)}...</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleEdit(product)} className="text-gold hover:text-gold-light text-sm font-semibold">Edit</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
                  </div>
                </SortableCard>
              ))}
            </div>
            </SortableContext>
            </DndContext>
          )}
        </div>
        {(() => {
          const unlisted = rigly.items.filter((item) => !products.some((p) => p.rigly_item_id === item.id));
          if (unlisted.length === 0) return null;
          return (
            <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700 space-y-3">
              <h2 className="text-xl font-semibold text-gold">In Rigly, not in the shop yet ({unlisted.length})</h2>
              <p className="text-sm text-gray-400">
                These items are in Rigly but have no shop listing. List one to add its photos, description and online price.
              </p>
              <ul className="divide-y divide-gray-700">
                {unlisted.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-200">{item.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.variants.map((v) => `${v.label} ${v.available}`).join(' · ') || 'No sizes'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openNew({ name: item.name, rigly_item_id: item.id, is_active: false })}
                      className="bg-gold hover:bg-gold-light text-black font-semibold px-4 py-1.5 rounded-lg text-sm"
                    >
                      List it
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

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
                  accept="image/*,.heic,.heif"
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

      </div>

      <AdminDrawer wide open={open} title={editingId ? 'Edit Product' : 'Add New Product'} onClose={requestClose}>
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
              <label className="block text-sm font-semibold text-gray-300 mb-1">Product Images (up to 3)</label>
              <p className="text-xs text-gray-400 mb-3">
                Upload up to 3 photos. The shop shows each one as a square: <span className="text-gold font-medium">drag the bright box</span> over the part you want customers to see. The dark part gets cropped out.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const imgUrl = formData.image_urls?.[index];

                  const setPosition = (position: string) => {
                    setFormData((prev) => {
                      const positions = prev.image_positions ? [...prev.image_positions] : ['50% 50%', '50% 50%', '50% 50%'];
                      while (positions.length < 3) positions.push('50% 50%');
                      positions[index] = position;
                      return { ...prev, image_positions: positions };
                    });
                  };

                  return (
                    <div key={index} className="space-y-2">
                      <p className="text-xs text-gray-400">Image {index + 1}</p>
                      {imgUrl ? (
                        <div className="space-y-2">
                          <ImageCropper
                            src={imgUrl}
                            alt={`Product preview ${index + 1}`}
                            position={formData.image_positions?.[index] || '50% 50%'}
                            onChange={setPosition}
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
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gold transition">
                          <input
                            type="file"
                            accept="image/*,.heic,.heif"
                            onChange={(e) => handleMultiplePhotoUpload(e, index)}
                            disabled={uploading}
                            className="hidden"
                          />
                          <span className="text-xs text-gray-400">Click to upload</span>
                          {uploading && <p className="text-xs text-gold mt-1">Uploading...</p>}
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="rigly_item_id" className="block text-sm font-semibold text-gray-300 mb-2">Rigly item</label>
              <p className="text-xs text-gray-400 mb-3">
                Sizes and stock come from this item in Rigly. Change stock in Rigly; the shop only sells what isn&apos;t out in a show kit.
                A product shows in the shop only when it&apos;s Active and linked.
              </p>
              {rigly.error ? (
                <p className="text-sm text-red-400">{rigly.error}</p>
              ) : (
                <select
                  id="rigly_item_id"
                  value={formData.rigly_item_id || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rigly_item_id: e.target.value || null }))}
                  className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:border-gold focus:outline-none"
                >
                  <option value="">{rigly.loading ? 'Loading Rigly items…' : 'Not linked (hidden from the shop)'}</option>
                  {rigly.items.map((item) => {
                    const usedBy = products.find((p) => p.rigly_item_id === item.id && p.id !== editingId);
                    return (
                      <option key={item.id} value={item.id} disabled={!!usedBy}>
                        {item.name}{usedBy ? ` (already used by ${usedBy.name})` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
              {(() => {
                const linked = rigly.items.find((i) => i.id === formData.rigly_item_id);
                if (!linked) return null;
                return (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {linked.variants.map((v) => (
                      <span key={v.id} className={`text-xs px-2 py-0.5 rounded ${stockTone(v.available)}`}>
                        {v.label}: {v.available} to sell{v.inKits ? ` (${v.inKits} in kits)` : ''}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" checked={formData.is_active || false} onChange={handleInputChange} className="w-4 h-4" />
              <span className="text-sm text-gray-300">Active</span>
            </label>
            <DrawerFooter>
                <button type="submit" className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-2 rounded-lg">
                  {editingId ? 'Update' : 'Add'} Product
                </button>
                <button type="button" onClick={requestClose} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg">
                  Cancel
                </button>
              </DrawerFooter>
            </form>
      </AdminDrawer>
    </AdminLayout>
  );
}

function stockTone(qty: number) {
  return qty <= 0
    ? 'bg-red-900/50 text-red-400'
    : qty <= 5
    ? 'bg-yellow-900/50 text-yellow-400'
    : 'bg-green-900/50 text-green-400';
}
