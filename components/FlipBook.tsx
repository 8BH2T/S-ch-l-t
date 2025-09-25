import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { BookPage } from '../App';
import HTMLFlipBook from 'react-pageflip';

interface FlipBookProps {
  title: string;
  pages: BookPage[];
  onTitleUpdate: (pageIndex: number, newTitle: string) => void;
  onPageDelete: (pageIndex: number) => void;
  onGoToDashboard: () => void;
}

// Icons
const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.033-2.124H8.033c-1.12 0-2.033.944-2.033 2.124v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);
const PencilSquareIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);
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


const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode, number?: number }>((props, ref) => {
  return (
    <div className="bg-white border flex justify-center items-center" ref={ref}>
      <div className="relative w-full h-full">
        {props.children}
        {props.number && (
            <div className="absolute bottom-2 right-2 text-sm bg-black bg-opacity-20 text-white rounded-full w-6 h-6 flex items-center justify-center">
                {props.number}
            </div>
        )}
      </div>
    </div>
  );
});

const PageCover = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>((props, ref) => {
  return (
    <div className="bg-white border flex justify-center items-center" ref={ref}>
        <div className="w-full h-full flex flex-col justify-center items-center bg-gray-200 p-4">
            <h2 className="text-3xl font-bold text-gray-800 text-center">{props.children}</h2>
        </div>
    </div>
  );
});

const PageImage: React.FC<{ imageId: string; alt: string }> = ({ imageId, alt }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        let isMounted = true;
        if (!window.imageDB) {
            console.error("imageDB không có trên đối tượng window.");
            setError("Lỗi tải hình ảnh.");
            return;
        }

        window.imageDB.getImage(imageId)
            .then((url: string | null) => {
                if (isMounted) {
                    if (url) {
                        setImageUrl(url);
                    } else {
                        setError("Không tìm thấy hình ảnh.");
                    }
                }
            })
            .catch((err: any) => {
                console.error("Không thể lấy hình ảnh từ DB", err);
                if (isMounted) {
                    setError("Lỗi tải hình ảnh.");
                }
            });

        return () => { isMounted = false; };
    }, [imageId]);

    if (error) {
        return <div className="w-full h-full flex items-center justify-center bg-gray-100 text-red-500 p-4 text-center">{error}</div>;
    }
    if (!imageUrl) {
        return <div className="w-full h-full flex items-center justify-center bg-gray-100">Đang tải...</div>;
    }
    return <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />;
};


const FlipBook: React.FC<FlipBookProps> = ({ title, pages, onTitleUpdate, onPageDelete }) => {
  const book = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0); // This is the raw page number from the flipbook component
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  const ENTRIES_PER_TOC_PAGE = 12;

  const tocPages = useMemo(() => {
    const tocEntries = pages
      .map((p, i) => ({ title: p.title, originalIndex: i }))
      .filter(p => p.title.trim() !== '');
      
    if (tocEntries.length === 0) {
      return [];
    }

    const tocPageChunks = [];
    for (let i = 0; i < tocEntries.length; i += ENTRIES_PER_TOC_PAGE) {
        tocPageChunks.push(tocEntries.slice(i, i + ENTRIES_PER_TOC_PAGE));
    }
    return tocPageChunks;
  }, [pages]);

  const numTocPages = tocPages.length;

  const onPage = useCallback((e: any) => {
    setCurrentPage(e.data);
    setIsEditingTitle(false);
  }, []);

  const handleNextPage = () => book.current?.pageFlip().flipNext();
  const handlePrevPage = () => book.current?.pageFlip().flipPrev();
  
  const handleTocLinkClick = (pageIndex: number) => {
    // Correct navigation logic after empirical testing.
    // There appears to be an offset in the library's page counting.
    // Page structure: [Cover, ...TOCs, ...ContentPages, EndCover]
    // The target content page `pages[pageIndex]` is located at an absolute
    // position that requires adding 2 to the TOC and page indices.
    const targetPage = numTocPages + pageIndex + 2;
    book.current?.pageFlip().turnToPage(targetPage);
  };


  // Determine current page context
  const isTocVisible = currentPage > 0 && currentPage <= numTocPages;
  const isContentVisible = currentPage > numTocPages && currentPage <= numTocPages + pages.length;
  const contentPageIndex = isContentVisible ? currentPage - numTocPages - 1 : -1;
  const currentPageData = contentPageIndex !== -1 ? pages[contentPageIndex] : null;

  const handleStartEditing = () => {
    if (currentPageData) {
      setEditedTitle(currentPageData.title || '');
      setIsEditingTitle(true);
    }
  }

  const handleTitleSave = () => {
    if (currentPageData && contentPageIndex !== -1) {
        onTitleUpdate(contentPageIndex, editedTitle);
    }
    setIsEditingTitle(false);
  }
  
  const handleDelete = () => {
    if (currentPageData && contentPageIndex !== -1) {
        if (window.confirm(`Bạn có chắc muốn xóa trang ${contentPageIndex + 1} không?`)) {
            onPageDelete(contentPageIndex);
        }
    }
  }
  
  const getPageNumberDisplay = () => {
    if (isContentVisible) {
        return `Trang ${contentPageIndex + 1} / ${pages.length}`;
    }
    if (isTocVisible) {
        return `Mục lục`;
    }
    return `Trang 0 / ${pages.length}`;
  }


  if (pages.length === 0) {
    return (
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Cuốn sách này trống</h2>
            <p className="text-gray-500 mb-6">Không có trang nào trong cuốn sách này. Hãy quay lại và thêm trang.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center">
        {/* Main Content */}
        <div className="w-full" style={{minHeight: "707px"}}>
            <HTMLFlipBook
                width={500}
                height={707}
                flippingTime={400}
                size="stretch"
                minWidth={315}
                maxWidth={1000}
                minHeight={420}
                maxHeight={1414}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                onFlip={onPage}
                className="mx-auto shadow-2xl"
                ref={book}
                // FIX: Add missing required props to satisfy the IProps interface from react-pageflip.
                // This is likely due to a typing issue in the library where these props are not optional.
                style={{}}
                startPage={0}
                drawShadow={true}
                usePortrait={true}
                startZIndex={0}
                autoSize={true}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
            >
                <PageCover>{title}</PageCover>

                {tocPages.map((chunk, chunkIndex) => (
                    <Page key={`toc-${chunkIndex}`}>
                        <div className="p-8 flex flex-col h-full">
                            <h3 className="text-2xl font-bold mb-6 text-center border-b pb-3 text-gray-800">Mục lục</h3>
                            <ul className="space-y-3 text-sm">
                                {chunk.map(entry => (
                                <li 
                                    key={entry.originalIndex} 
                                    className="flex justify-between items-baseline cursor-pointer group"
                                    onClick={() => handleTocLinkClick(entry.originalIndex)}
                                >
                                    <span className="text-gray-700 group-hover:text-blue-600 truncate pr-2">{entry.title}</span>
                                    <span className="flex-shrink-0 border-b border-dotted border-gray-300 flex-grow mx-2"></span>
                                    <span className="font-mono text-gray-600 group-hover:text-blue-600">{entry.originalIndex + 1}</span>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </Page>
                ))}

                {pages.map((page, index) => (
                    <Page number={index + 1} key={page.imageId}>
                        <PageImage imageId={page.imageId} alt={page.title || `Trang ${index + 1}`} />
                    </Page>
                ))}
                <PageCover>Kết thúc</PageCover>
            </HTMLFlipBook>
        </div>
        
        <div className="w-full text-center flex items-center justify-center gap-2 group mt-4 min-h-[44px]">
            {isContentVisible && currentPageData && (
                isEditingTitle ? (
                    <input 
                        type="text"
                        value={editedTitle}
                        onChange={e => setEditedTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={e => {if(e.key === 'Enter') handleTitleSave()}}
                        className="text-xl font-bold text-center bg-transparent border-b-2 border-blue-500 focus:outline-none w-1/2"
                        autoFocus
                    />
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-gray-800 py-1 border-b-2 border-transparent">
                            {currentPageData.title || <span className="text-gray-400 font-normal italic">Chưa có tiêu đề</span>}
                        </h2>
                        <button onClick={handleStartEditing} className="p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Edit title">
                            <PencilSquareIcon className="w-5 h-5"/>
                        </button>
                    </>
                )
            )}
             {isTocVisible && (
                 <h2 className="text-xl font-bold text-gray-800 py-1 border-b-2 border-transparent">Mục lục</h2>
             )}
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center mt-4 p-2 border bg-white rounded-full shadow-md w-full max-w-md">
            <div className="w-[80px] flex items-center gap-1">
                 <button onClick={handleDelete} disabled={!currentPageData} className="p-2 rounded-full hover:bg-red-100 disabled:opacity-40 transition-colors" aria-label="Delete page" title="Xóa trang">
                    <TrashIcon className="w-6 h-6 text-red-500"/>
                </button>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={handlePrevPage} className="p-2 rounded-full enabled:hover:bg-gray-100 disabled:opacity-40 transition-colors" aria-label="Previous page">
                    <ChevronLeftIcon className="w-6 h-6"/>
                </button>
                <span className="text-gray-700 font-medium text-sm w-28 text-center">{getPageNumberDisplay()}</span>
                <button onClick={handleNextPage} className="p-2 rounded-full enabled:hover:bg-gray-100 disabled:opacity-40 transition-colors" aria-label="Next page">
                    <ChevronRightIcon className="w-6 h-6"/>
                </button>
            </div>

            <div className="w-[80px]"> {/* Spacer to balance flexbox */}
            </div>
        </div>
    </div>
  )
}

export default FlipBook;
