import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { apiClient, getAssetUrl } from '../../api/client';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  previewUrl?: string;
  onRemove?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  label = 'Upload Field Photograph',
  previewUrl,
  onRemove,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(previewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data.data.url;
      setCurrentUrl(uploadedUrl);
      onUploadSuccess(uploadedUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setCurrentUrl(null);
    setError(null);
    if (onRemove) onRemove();
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>

      {currentUrl ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center gap-3">
          <img
            src={getAssetUrl(currentUrl)}
            alt="Upload preview"
            className="w-16 h-16 object-cover rounded-lg border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{currentUrl.split('/').pop()}</p>
            <div className="flex items-center text-xs text-emerald-600 font-medium gap-1 mt-0.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Uploaded successfully
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 italic">
              Temporary demo file. Retained for evaluation session.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
            error ? 'border-red-300 bg-red-50/30' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-1" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
            )}
            <span className="text-xs font-medium text-slate-700">
              {isUploading ? 'Uploading image...' : 'Click to upload site photo (Max 5MB)'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or WebP • Temporary demo storage</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600 mt-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  );
};
