import React, { useState, useEffect } from 'react';
import type { BookPage } from '../App';

interface TitleEditorProps {
  imageUrls: string[];
  onConfirm: (pages: BookPage[]) => void;
}

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const TitleEditor: React.FC<TitleEditorProps> = ({ imageUrls, onConfirm }) => {
  const [editablePages, setEditablePages] = useState<BookPage[]>([]);

  useEffect(() => {
    setEditablePages(imageUrls.map(url => ({ imageUrl: url, title: '' })));
  }, [imageUrls]);


  const handleTitleChange = (index: number, newTitle: string) => {
    const newPages = [...editablePages];
    newPages[index].title = newTitle;
    setEditablePages(newPages);
  };
  
  const handleDeletePage = (indexToDelete: number) => {
    setEditablePages(currentPages => currentPages.filter((_, index) => index !== indexToDelete));
  };

  const handleSubmit = () => {
    onConfirm(editablePages);
  };

  if (editablePages.length === 0) {
    return (
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Không còn trang nào</h2>
            <p className="text-gray-500 mb-6">Bạn đã xóa tất cả các trang. Vui lòng quay lại và tải lên hình ảnh mới.</p>
             <button
              onClick={() => onConfirm([])} // Effectively resets by confirming with empty array
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              Bắt đầu lại
            </button>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Đặt tên cho các trang sách</h2>
      <p className="text-center text-gray-500 mb-6">Chỉ những trang có tiêu đề mới xuất hiện trong mục lục.</p>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
        {editablePages.map((page, index) => (
          <div key={page.imageUrl + index} className="flex items-center space-x-4 p-2 border rounded-md">
            <img src={page.imageUrl} alt={`Preview ${index + 1}`} className="w-20 h-20 object-cover rounded-md bg-gray-100 flex-shrink-0" />
            <div className="flex-grow">
              <label htmlFor={`title-${index}`} className="block text-sm font-medium text-gray-600 mb-1">
                Tiêu đề trang {index + 1} (tùy chọn)
              </label>
              <input
                id={`title-${index}`}
                type="text"
                value={page.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ví dụ: Giới thiệu, Chương 1..."
              />
            </div>
             <button 
                onClick={() => handleDeletePage(index)} 
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                aria-label={`Xóa trang ${index + 1}`}
             >
                <TrashIcon className="w-6 h-6"/>
            </button>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          Tạo sách
        </button>
      </div>
    </div>
  );
};

export default TitleEditor;