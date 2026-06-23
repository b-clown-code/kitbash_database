/**
 * Cloudflare R2 Utilities
 * Handles image upload and URL generation
 */

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

interface ImageUploadOptions {
  file: File;
  prefix?: string;
  type?: 'image' | 'thumbnail';
}

/**
 * Upload image to Cloudflare R2 via API route
 * @param options Upload configuration
 * @returns URL of uploaded image or error
 */
export async function uploadToR2(options: ImageUploadOptions): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', options.file);
    formData.append('prefix', options.prefix || 'uploads');
    formData.append('type', options.type || 'image');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate CDN URL for an image
 * @param key R2 object key
 * @returns Full CDN URL
 */
export function generateCdnUrl(key: string): string {
  const cdnUrl = process.env.NEXT_PUBLIC_R2_CDN_URL || '';
  return `${cdnUrl}/${key}`;
}

/**
 * Validate image file
 * @param file File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not supported. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
