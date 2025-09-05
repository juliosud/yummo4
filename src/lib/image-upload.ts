import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param folder - The folder to store the image in (default: 'menu-items')
 * @returns Promise<ImageUploadResult>
 */
export const uploadImage = async (
  file: File,
  folder: string = 'menu-items'
): Promise<ImageUploadResult> => {
  try {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return {
        success: false,
        error: 'Supabase not configured. Please set up your environment variables.'
      };
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Please select a valid image file.'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Image size must be less than 5MB.'
      };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('restaurant-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The URL of the image to delete
 * @returns Promise<boolean>
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Check if Supabase is configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, cannot delete image');
      return false;
    }

    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'restaurant-images');
    
    if (bucketIndex === -1) {
      console.warn('Invalid image URL format');
      return false;
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from('restaurant-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Image delete error:', error);
    return false;
  }
};

/**
 * Convert file to base64 data URL (for preview)
 * @param file - The file to convert
 * @returns Promise<string>
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param file - The file to validate
 * @returns Object with validation result
 */
export const validateImageFile = (file: File) => {
  const errors: string[] = [];
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    errors.push('Please select a valid image file.');
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('Image size must be less than 5MB.');
  }

  // Check file dimensions (optional - can be added if needed)
  // This would require creating an Image object and checking dimensions

  return {
    isValid: errors.length === 0,
    errors
  };
};
