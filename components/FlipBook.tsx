import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { BookPage } from '../App';
import HTMLFlipBook from 'react-pageflip';

interface FlipBookProps {
  title: string;
  pages: BookPage[];
  onTitleUpdate: (pageIndex: number, newTitle: string) => void;
  onPageDelete: (pageIndex: number) => void;
  onGoToDashboard: () => void;
  onAddPages: () => void;
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
const ListBulletIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);
const PlusCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    mediaQueryList.addEventListener('change', listener);
    
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};


const Page = React.forwardRef<HTMLDivElement, { children?: React.ReactNode, number?: number }>((props, ref) => {
  return (
    <div className="bg-white border flex flex-col justify-start items-stretch text-center" ref={ref}>
        <div className="relative w-full flex-grow">
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

const TOCPage = React.forwardRef<HTMLDivElement, { tocEntries: {title: string, originalIndex: number}[], onLinkClick: (index: number) => void }>((props, ref) => {
    return (
        <div className="bg-white border flex justify-center items-center" ref={ref}>
            <div className="w-full h-full flex flex-col justify-start items-center bg-gray-100 p-8 overflow-y-auto">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 flex-shrink-0 w-full text-center pb-4 border-b-2 border-gray-300">Mục lục</h3>
                {props.tocEntries.length > 0 ? (
                    <ul className="space-y-2 text-sm w-full">
                        {props.tocEntries.map(entry => (
                            <li
                                key={entry.originalIndex}
                                className="flex justify-between items-baseline cursor-pointer group"
                                onClick={() => props.onLinkClick(entry.originalIndex)}
                            >
                                <span className="text-gray-700 group-hover:text-blue-600 truncate pr-2">{entry.title}</span>
                                <span className="flex-shrink-0 border-b border-dotted border-gray-300 flex-grow mx-2"></span>
                                <span className="font-mono text-gray-600 group-hover:text-blue-600">{entry.originalIndex + 1}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 mt-8">Cuốn sách này không có mục lục.</p>
                )}
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
    return <img src={imageUrl} alt={alt} className="w-full h-full object-contain" />;
};


const FlipBook: React.FC<FlipBookProps> = ({ title, pages = [], onTitleUpdate, onPageDelete, onAddPages }) => {
  const book = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tocTargetPage = useRef<number | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0); 
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  const [pageDimensions, setPageDimensions] = useState({ width: 500, height: 707 });
  const isSinglePageView = useMediaQuery('(orientation: portrait)');

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth === 0) return;

      const aspectRatio = 1.4142; // Tỷ lệ khổ giấy A4 (cao/rộng)

      let newWidth: number;

      if (isSinglePageView) {
        newWidth = containerWidth;
      } else {
        newWidth = containerWidth / 2;
      }

      const newHeight = newWidth * aspectRatio;

      setPageDimensions({ width: newWidth, height: newHeight });
    };

    const timeoutId = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSinglePageView]);


  const tocEntries = useMemo(() => {
    return pages
      .map((p, i) => ({ title: p.title, originalIndex: i }))
      .filter(p => p.title.trim() !== '');
  }, [pages]);

  const onPage = useCallback((e: any) => {
    if (tocTargetPage.current !== null) {
        setCurrentPage(tocTargetPage.current);
        tocTargetPage.current = null;
    } else {
        setCurrentPage(e.data);
    }
    setIsEditingTitle(false);
  }, []);

  const handleNextPage = () => book.current?.pageFlip().flipNext();
  const handlePrevPage = () => book.current?.pageFlip().flipPrev();
  
  const handleTocLinkClick = (pageIndexOfClickedLink: number) => {
    if (!book.current) return;

    const destinationContentIndex = pageIndexOfClickedLink - 1;

    if (destinationContentIndex < 0) {
        // User clicked "Trang 1", go to TOC. TOC is now book page 0.
        tocTargetPage.current = 0;
        book.current.pageFlip().turnToPage(0);
    } else {
        // Destination content page is at index `destinationContentIndex`.
        // Its book page number is `destinationContentIndex + 1`.
        // Structure: TOC(0), Content0(1), Content1(2), ...
        const destinationBookPageNumber = destinationContentIndex + 1;
        tocTargetPage.current = destinationBookPageNumber;
        book.current.pageFlip().turnToPage(destinationBookPageNumber);
    }
    setIsEditingTitle(false);
  };

  const handleGoToToc = () => {
    book.current?.pageFlip().turnToPage(0);
    setCurrentPage(0);
  };

  // New book structure: TOC(0), ContentPage0(1), ContentPage1(2), etc.
  const isContentVisible = currentPage >= 1 && currentPage <= pages.length;
  const contentPageIndex = isContentVisible ? currentPage - 1 : -1;
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
  
    const getPageNumberDisplay = useCallback(() => {
    const totalContentPages = pages.length;
    // Structure: 0=TOC, 1..N=Content, N+1=BackCover

    const getLabel = (bookIndex: number) => {
        if (bookIndex === 0) return 'Mục lục';
        if (bookIndex > 0 && bookIndex <= totalContentPages) return `Trang ${bookIndex}`;
        if (bookIndex === totalContentPages + 1) return 'Bìa sau';
        return '';
    };

    if (isSinglePageView) {
      const label = getLabel(currentPage);
      return (currentPage > 0 && currentPage <= totalContentPages)
        ? `${label} / ${totalContentPages}`
        : label;
    } else { // Landscape view
      const leftIdx = (currentPage % 2 === 0) ? currentPage : currentPage - 1;
      const rightIdx = leftIdx + 1;

      const leftLabel = getLabel(leftIdx);
      const rightLabel = getLabel(rightIdx);
      
      if (leftLabel && rightLabel) {
        return `${leftLabel} - ${rightLabel}`;
      }
      if (leftLabel) {
        return leftLabel;
      }
      return '';
    }
  }, [currentPage, pages.length, isSinglePageView]);


  if (pages.length === 0) {
    return (
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Cuốn sách này trống</h2>
            <p className="text-gray-500 mb-6">Không có trang nào trong cuốn sách này. Hãy quay lại và thêm trang.</p>
        </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-start overflow-y-auto">
        <div className="w-full max-w-md text-center flex items-center justify-center gap-2 group min-h-[44px] my-2">
            {isContentVisible && currentPageData ? (
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
                    <h2 className="text-xl font-bold text-gray-800 py-1 truncate">{currentPageData.title || `Trang ${contentPageIndex + 1}`}</h2>
                )
            ) : ( currentPage === 0 && <h2 className="text-xl font-bold text-gray-800 py-1">Mục lục</h2> )}
        </div>
        
        <div className="flex justify-center items-center" style={{minHeight: `${pageDimensions.height}px`}}>
            <HTMLFlipBook
                key={isSinglePageView ? `p-${pageDimensions.width}` : `l-${pageDimensions.width}`}
                style={{}}
                width={pageDimensions.width}
                height={pageDimensions.height}
                minWidth={pageDimensions.width}
                maxWidth={pageDimensions.width}
                minHeight={pageDimensions.height}
                maxHeight={pageDimensions.height}
                flippingTime={300}
                size="fixed"
                maxShadowOpacity={0.5}
                showCover={false}
                mobileScrollSupport={true}
                onFlip={onPage}
                className="shadow-2xl"
                ref={book}
                startPage={0}
                drawShadow={true}
                usePortrait={isSinglePageView}
                startZIndex={0}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
                autoSize={false}
            >
                <TOCPage tocEntries={tocEntries} onLinkClick={handleTocLinkClick} />

                {pages.map((page, index) => (
                    <Page number={index + 1} key={page.imageId}>
                        <PageImage imageId={page.imageId} alt={page.title || `Trang ${index + 1}`} />
                    </Page>
                ))}
                
                <PageCover>Kết thúc</PageCover>
            </HTMLFlipBook>
        </div>
        
        <div className="flex justify-between items-center mt-4 mb-4 p-2 border bg-white rounded-full shadow-md w-full max-w-md">
            <div className="flex justify-start items-center gap-1">
                <button onClick={handleStartEditing} disabled={!currentPageData} className="p-2 rounded-full hover:bg-blue-100 disabled:opacity-40 transition-colors" aria-label="Edit title" title="Sửa tiêu đề trang">
                    <PencilSquareIcon className="w-6 h-6 text-blue-500"/>
                </button>
                <button onClick={handleDelete} disabled={!currentPageData} className="p-2 rounded-full hover:bg-red-100 disabled:opacity-40 transition-colors" aria-label="Delete page" title="Xóa trang">
                    <TrashIcon className="w-6 h-6 text-red-500"/>
                </button>
                <button onClick={onAddPages} className="p-2 rounded-full hover:bg-green-100 transition-colors" aria-label="Add pages" title="Thêm trang">
                    <PlusCircleIcon className="w-6 h-6 text-green-500"/>
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

            <div className="w-[120px] flex justify-end items-center">
                <button onClick={handleGoToToc} disabled={currentPage === 0} className="p-2 rounded-full enabled:hover:bg-gray-100 disabled:opacity-40 transition-colors" aria-label="Về mục lục" title="Về mục lục">
                    <ListBulletIcon className="w-6 h-6 text-gray-700"/>
                </button>
            </div>
        </div>
    </div>
  )
}

export default FlipBook;