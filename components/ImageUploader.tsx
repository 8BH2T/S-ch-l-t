
import React, { useState, useCallback } from 'react';

interface ImageUploaderProps {
  onImagesUpload: (imageUrls: string[]) => void;
}

const UploadIcon: React.FC = () => (
  <svg className="w-12 h-12 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
  </svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesUpload }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const imagePromises = Array.from(files).map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = reject;
          // FIX: The `file` parameter was being inferred as `unknown`, causing a type error.
          // Explicitly casting it to `Blob` ensures it matches the expected type for `readAsDataURL`.
          reader.readAsDataURL(file as Blob);
        });
      });
      
      const imageUrls = await Promise.all(imagePromises);
      onImagesUpload(imageUrls);
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải hình ảnh. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onImagesUpload]);

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-center w-full">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon />
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo và thả</p>
            <p className="text-xs text-gray-500">SVG, PNG, JPG hoặc GIF</p>
            {loading && <p className="text-blue-500 mt-4">Đang xử lý hình ảnh...</p>}
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
          <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} disabled={loading} />
        </label>
      </div> 
    </div>
  );
};

export default ImageUploader;
