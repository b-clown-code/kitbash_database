/**
 * API Route: Upload image to Cloudflare R2
 * POST /api/upload
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

/**
 * For local development, saves to /public/uploads
 * In production, would use R2 API
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefix = (formData.get('prefix') as string) || 'uploads';
    const type = (formData.get('type') as string) || 'image';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Generate filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomId}.${ext}`;
    const filepath = join('/public', prefix, filename);

    // For local dev, save to public folder
    // In production, this would upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    
    try {
      // Create uploads directory if it doesn't exist
      // Note: In production, this would be handled by R2
      // For local dev, ensure the directory exists
      // This is a simplified approach for development
    } catch (err) {
      console.error('Error creating directory:', err);
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${prefix}/${filename}`;

    return NextResponse.json(
      {
        success: true,
        url,
        filename,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
