import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadImage, fileToDataURL, validateImageFile, ImageUploadResult } from '@/lib/image-upload';
import { Alert, AlertDescription } from './alert';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onError,
  disabled = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(' ');
      setError(errorMessage);
      onError?.(errorMessage);
      return;
    }

    // Show preview
    try {
      const dataURL = await fileToDataURL(file);
      setPreview(dataURL);
    } catch (err) {
      console.error('Error creating preview:', err);
    }

    // Upload file
    setIsUploading(true);
    try {
      const result: ImageUploadResult = await uploadImage(file);
      
      if (result.success && result.url) {
        onChange(result.url);
        setError(null);
      } else {
        const errorMessage = result.error || 'Upload failed';
        setError(errorMessage);
        onError?.(errorMessage);
        setPreview(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onError?.(errorMessage);
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Image</Label>
      
      {/* Upload Area */}
      <div className="space-y-2">
        {preview ? (
          <div className="relative">
            <div className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={disabled ? undefined : handleButtonClick}
          >
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload an image
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, WebP up to 5MB
            </p>
          </div>
        )}

        {/* Upload Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : preview ? 'Change Image' : 'Select Image'}
        </Button>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* URL Input (fallback) */}
      <div className="space-y-1">
        <Label htmlFor="image-url" className="text-sm text-gray-600">
          Or enter image URL:
        </Label>
        <Input
          id="image-url"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          disabled={disabled || isUploading}
        />
      </div>
    </div>
  );
};
