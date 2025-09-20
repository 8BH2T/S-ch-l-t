import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { BookPage } from '../App';

interface FlipBookProps {
  pages: BookPage[];
  onTitleUpdate: (pageIndex: number, newTitle: string) => void;
  onPageDelete: (pageIndex: number) => void;
}

const ChevronLeftIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRightIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

const HomeIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.125 1.125 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
    </svg>
);

const PencilIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
);

const XMarkIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const FlipBook: React.FC<FlipBookProps> = ({ pages, onTitleUpdate, onPageDelete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const totalPages = pages.length + 1; 
  
  useEffect(() => {
    const lastValidContentPage = pages.length;
    if (currentPage > lastValidContentPage) {
      setCurrentPage(lastValidContentPage);
    }
  }, [pages, currentPage]);

  const goNextPage = useCallback(() => {
    setCurrentPage((current) => Math.min(current + 1, totalPages));
  }, [totalPages]);

  const goPrevPage = useCallback(() => {
    setCurrentPage((current) => Math.max(current - 1, 0));
  }, []);
  
  const jumpToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  }
    
  const dragStartX = useRef<number | null>(null);

  const handleDragStart = (clientX: number) => {
    dragStartX.current = clientX;
  };

  const handleDragEnd = (clientX: number) => {
    if (dragStartX.current === null) return;
    const deltaX = clientX - dragStartX.current;
    if (deltaX < -20) { 
      goNextPage();
    } else if (deltaX > 20) {
      goPrevPage();
    }
    dragStartX.current = null;
  };

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input')) { return; }
      handleDragStart(e.clientX);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (dragStartX.current !== null) { handleDragEnd(e.clientX); }
    };
    const onTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('button, input')) { return; }
      handleDragStart(e.touches[0].clientX);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (dragStartX.current !== null) { handleDragEnd(e.changedTouches[0].clientX); }
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [goNextPage, goPrevPage]);

  const handleStartEditing = (pageNumber: number) => {
    setEditingPage(pageNumber);
    setEditingTitle(pages[pageNumber - 1]?.title || '');
  };

  const handleCancelEditing = () => {
    setEditingPage(null);
    setEditingTitle('');
  };

  const handleSaveTitle = () => {
    if (editingPage === null) return;
    onTitleUpdate(editingPage - 1, editingTitle);
    setEditingPage(null);
    setEditingTitle('');
  };

  const handleDeletePage = (pageIndex: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa trang này không? Thao tác này không thể hoàn tác.')) {
      onPageDelete(pageIndex);
    }
  };

  const getPageIndicatorText = () => {
    if (pages.length === 0) return 'Sách trống';
    if (currentPage === 0) return 'Mục lục';
    if (currentPage > pages.length) return 'Hoàn thành';
    return `Trang ${currentPage} / ${pages.length}`;
  };


  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full max-w-[90vw] md:max-w-lg flex justify-center items-center"
        style={{ perspective: '2000px' }}
      >
        <div 
          className="relative w-full aspect-[210/297]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {Array.from({ length: totalPages }).map((_, index) => {
            const actualPageIndex = index - 1;
            return (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-transform duration-700 ease-in-out`}
              style={{
                transformOrigin: 'left',
                transformStyle: 'preserve-3d',
                transform: index < currentPage ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                zIndex: index < currentPage ? index + 1 : totalPages - index,
              }}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-white shadow-lg flex items-center justify-center overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4 relative">
                  {index > 0 && pages[actualPageIndex] && (
                    <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/50 to-transparent z-10 text-white"
                      // Prevent interactions from bubbling up to the drag handler
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      {editingPage === index ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle();
                              if (e.key === 'Escape') handleCancelEditing();
                            }}
                            className="w-full bg-transparent border-b-2 border-white/70 focus:border-white focus:outline-none text-sm p-1"
                            autoFocus
                          />
                          <button onClick={handleSaveTitle} className="p-1 rounded-full hover:bg-white/20 transition-colors"><CheckIcon className="w-5 h-5"/></button>
                          <button onClick={handleCancelEditing} className="p-1 rounded-full hover:bg-white/20 transition-colors"><XMarkIcon className="w-5 h-5"/></button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 min-h-[34px]">
                          <p className="text-sm font-medium truncate">{pages[actualPageIndex]?.title || 'Chưa có tiêu đề'}</p>
                          <div className="flex items-center">
                            <button onClick={() => handleStartEditing(index)} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Chỉnh sửa tiêu đề"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDeletePage(actualPageIndex)} className="p-1 rounded-full hover:bg-white/20 transition-colors text-red-300 hover:text-red-500" aria-label="Xóa trang"><TrashIcon className="w-5 h-5"/></button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {index === 0 ? (
                    <div className="w-full h-full overflow-y-auto p-4">
                      <h2 className="text-2xl font-bold text-center mb-6 border-b pb-2">Mục lục</h2>
                      <ul className="space-y-3">
                        {pages
                          .map((page, pageIndex) => ({ page, originalIndex: pageIndex }))
                          .filter(({ page }) => page.title && page.title.trim() !== '')
                          .map(({ page, originalIndex }) => (
                            <li key={originalIndex}>
                              <button 
                                onClick={() => jumpToPage(originalIndex + 1)} 
                                className="w-full text-left text-gray-700 hover:text-blue-600 hover:underline transition-colors flex justify-between"
                              >
                                <span>{page.title}</span>
                                <span>Trang {originalIndex + 1}</span>
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : (
                    pages[actualPageIndex] && <img 
                      src={pages[actualPageIndex].imageUrl} 
                      alt={pages[actualPageIndex].title || `Trang ${index}`} 
                      className="w-full h-full object-contain" 
                    />
                  )}
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-full bg-white shadow-lg" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="w-full h-full bg-gray-100"></div>
              </div>
            </div>
          )})}
        </div>
      </div>
      <div className="flex flex-col items-center space-y-4 mt-8">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={goPrevPage}
            disabled={currentPage === 0}
            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Trang trước"
          >
              <ChevronLeftIcon className="w-6 h-6 text-gray-700"/>
          </button>
          
          <div className="w-12 h-12 flex items-center justify-center">
            {currentPage > 0 && currentPage <= pages.length && (
              <button
                onClick={() => jumpToPage(0)}
                className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 transition"
                aria-label="Về mục lục"
              >
                  <HomeIcon className="w-6 h-6 text-gray-700"/>
              </button>
            )}
          </div>

          <button
            onClick={goNextPage}
            disabled={currentPage === totalPages}
            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            aria-label="Trang sau"
          >
              <ChevronRightIcon className="w-6 h-6 text-gray-700"/>
          </button>
        </div>
        <div className="text-center text-gray-700">
          <p>{getPageIndicatorText()}</p>
          <p className="text-xs text-gray-500">(Kéo để lật trang)</p>
        </div>
      </div>
    </div>
  );
};

export default FlipBook;