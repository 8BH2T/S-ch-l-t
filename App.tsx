import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import FlipBook from './components/FlipBook';
import TitleEditor from './components/TitleEditor';

export interface BookPage {
  imageUrl: string;
  title: string;
}

const App: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [bookPages, setBookPages] = useState<BookPage[]>([]);

  const handleImagesUpload = (imageUrls: string[]) => {
    setUploadedImages(imageUrls);
  };
  
  const handleTitlesConfirm = (pages: BookPage[]) => {
    setBookPages(pages);
    setUploadedImages([]); // Clear uploaded images to move to the next stage
  }

  const handleReset = () => {
    setUploadedImages([]);
    setBookPages([]);
  };

  const handleTitleUpdate = (pageIndex: number, newTitle: string) => {
    setBookPages(currentPages => {
      const updatedPages = [...currentPages];
      if (updatedPages[pageIndex]) {
        updatedPages[pageIndex] = { ...updatedPages[pageIndex], title: newTitle };
      }
      return updatedPages;
    });
  };

  const handlePageDelete = (pageIndexToDelete: number) => {
    setBookPages(currentPages =>
      currentPages.filter((_, index) => index !== pageIndexToDelete)
    );
  };
  
  const renderContent = () => {
    if (bookPages.length > 0) {
      return (
        <div className="w-full">
          <FlipBook pages={bookPages} onTitleUpdate={handleTitleUpdate} onPageDelete={handlePageDelete} />
          <div className="text-center mt-8">
            <button
              onClick={handleReset}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
              Tải lên sách khác
            </button>
          </div>
        </div>
      );
    }
    
    if (uploadedImages.length > 0) {
      return <TitleEditor imageUrls={uploadedImages} onConfirm={handleTitlesConfirm} />
    }
    
    return <ImageUploader onImagesUpload={handleImagesUpload} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans antialiased">
      <header className="w-full max-w-5xl mx-auto text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Sách Lật 3D Khổ A4</h1>
        <p className="text-gray-600 mt-2">Tải lên, đặt tên trang và tạo một cuốn sách lật kỹ thuật số tuyệt đẹp.</p>
      </header>
      
      <main className="w-full flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
      
      <footer className="w-full text-center p-4 mt-8 text-gray-500 text-sm">
        <p>Phát triển bởi Kỹ sư AI với chuyên môn React & Gemini.</p>
      </footer>
    </div>
  );
};

export default App;