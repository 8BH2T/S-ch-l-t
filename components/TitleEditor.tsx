import React, { useState, useEffect } from 'react';

// Define a local type for the component's state to decouple it from the global BookPage interface
interface EditablePage {
  imageUrl: string;
  title: string;
}

interface TitleEditorProps {
  imageUrls: string[];
  onConfirm: (bookData: { title: string; pages: EditablePage[] }) => void;
  onCancel: () => void;
}

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ArrowUturnLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

const TitleEditor: React.FC<TitleEditorProps> = ({ imageUrls, onConfirm, onCancel }) => {
  const [editablePages, setEditablePages] = useState<EditablePage[]>([]);
  const [bookTitle, setBookTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    if (!bookTitle.trim()) {
        setError("Vui lòng nhập tiêu đề cho cuốn sách.");
        return;
    }
    setError(null);
    onConfirm({ title: bookTitle, pages: editablePages });
  };

  if (imageUrls.length > 0 && editablePages.length === 0) {
    return (
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Không còn trang nào</h2>
            <p className="text-gray-500 mb-6">Bạn đã xóa tất cả các trang. Vui lòng quay lại và tải lên hình ảnh mới.</p>
             <button
              onClick={onCancel}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              Bắt đầu lại
            </button>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Hoàn thiện cuốn sách của bạn</h2>
      <p className="text-center text-gray-500 mb-6">Đặt tiêu đề cho sách và cho từng trang (tùy chọn).</p>
      
      <div className="mb-6">
        <label htmlFor="book-title" className="block text-lg font-medium text-gray-800 mb-2">
            Tiêu đề sách <span className="text-red-500">*</span>
        </label>
        <input
            id="book-title"
            type="text"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder="Ví dụ: Chuyến phiêu lưu của tôi, Sách dạy nấu ăn..."
            required
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 border-t pt-6">
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
                placeholder="Chỉ trang có tiêu đề mới hiện trong mục lục"
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
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
          Quay lại
        </button>
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