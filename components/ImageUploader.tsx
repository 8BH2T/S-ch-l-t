import React, { useState, useCallback } from 'react';

// Make pdfjsLib available from the global scope (loaded via CDN)
declare const pdfjsLib: any;

interface ImageUploaderProps {
  onImagesUpload: (imageUrls: string[]) => void;
  onCancel: () => void;
}

const UploadIcon: React.FC = () => (
  <svg className="w-12 h-12 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
  </svg>
);

const ArrowUturnLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesUpload, onCancel }) => {
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
      const uploadedImageUrls: string[] = [];
      
      // FIX: Explicitly type the array of files to resolve type inference issues where `file` was `unknown`.
      const fileList: File[] = Array.from(files);
      for (const file of fileList) {
        if (file.type === 'application/pdf') {
          const pdfAsArrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument(pdfAsArrayBuffer).promise;
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            // Use a higher scale for better quality
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport }).promise;
            uploadedImageUrls.push(canvas.toDataURL('image/jpeg'));
          }
        } else if (file.type.startsWith('image/')) {
          const imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Không thể đọc tệp dưới dạng URL dữ liệu.'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uploadedImageUrls.push(imageUrl);
        } else {
            console.warn(`Bỏ qua loại tệp không được hỗ trợ: ${file.type}`);
        }
      }
      
      onImagesUpload(uploadedImageUrls);

    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi xử lý tệp. Vui lòng thử lại.');
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
            <p className="text-xs text-gray-500">Hình ảnh (SVG, PNG, JPG) hoặc PDF</p>
            {loading && <p className="text-blue-500 mt-4">Đang xử lý tệp...</p>}
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
          <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange} disabled={loading} />
        </label>
      </div>
      <div className="text-center mt-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 mx-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
          Quay về danh sách sách
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;
