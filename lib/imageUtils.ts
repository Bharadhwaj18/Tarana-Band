// Image compression utility
export async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if image is too large (max 1920px width)
        const MAX_WIDTH = 1920;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Start with quality 0.8 and reduce if needed
        let quality = 0.8;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Image loading failed'));
      };
    };

    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };
  });
}

// Upload image to Supabase Storage
export async function uploadImageToSupabase(
  supabase: any,
  file: File,
  folder: string = 'gallery'
): Promise<{ url: string; path: string } | null> {
  try {
    // Compress the image first
    const compressedFile = await compressImage(file);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    return null;
  }
}

// Delete image from Supabase Storage
export async function deleteImageFromSupabase(
  supabase: any,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('photos')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImageFromSupabase:', error);
    return false;
  }
}
