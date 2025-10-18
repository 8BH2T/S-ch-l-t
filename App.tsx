import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import FlipBook from './components/FlipBook';
import TitleEditor from './components/TitleEditor';

export interface BookPage {
  imageId: string;
  title: string;
}

export interface Book {
  id: string;
  title: string;
  pages: BookPage[];
  createdAt: number;
}


interface User {
  email: string;
}

// Interface for user data stored in localStorage
interface StoredUser extends User {
  password: string;
}

// --- IndexedDB Image Service ---
const DB_NAME = 'LikebookImageDB';
const STORE_NAME = 'images';

const imageDB = {
  db: null as IDBDatabase | null,

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve();
      
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        console.error("IndexedDB error:", request.error);
        reject("Lỗi khi mở cơ sở dữ liệu hình ảnh.");
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  },

  addImage(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Cơ sở dữ liệu chưa được khởi tạo.");
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const id = self.crypto.randomUUID();
      const request = store.add({ id, dataUrl });

      request.onerror = () => reject("Lỗi khi thêm hình ảnh vào cơ sở dữ liệu.");
      request.onsuccess = () => resolve(id);
    });
  },

  getImage(id: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Cơ sở dữ liệu chưa được khởi tạo.");
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject("Lỗi khi lấy hình ảnh từ cơ sở dữ liệu.");
      request.onsuccess = () => {
        resolve(request.result ? request.result.dataUrl : null);
      };
    });
  },
  
  deleteImage(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!this.db) return reject("Cơ sở dữ liệu chưa được khởi tạo.");
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        
        request.onerror = () => reject("Lỗi khi xóa hình ảnh khỏi cơ sở dữ liệu.");
        request.onsuccess = () => resolve();
    });
  }
};

// Expose to window for component access
declare global {
  interface Window { imageDB: typeof imageDB; }
}
window.imageDB = imageDB;


// --- Mock Authentication Service ---
const USERS_KEY = 'flipbook_users';
const SESSION_KEY = 'flipbook_session';

const authService = {
  getCurrentUser: (): User | null => {
    try {
      const userJson = localStorage.getItem(SESSION_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error("Failed to parse user session", error);
      return null;
    }
  },
  login: async (email: string, password: string): Promise<User> => {
     const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
     const user = users.find((u) => u.email === email && u.password === password);
     if (user) {
       const sessionUser = { email: user.email };
       localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
       return sessionUser;
     } else {
       throw new Error('Email hoặc mật khẩu không hợp lệ.');
     }
  },
  signup: async (email: string, password: string): Promise<User> => {
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.some((u) => u.email === email)) {
      throw new Error('Email này đã được sử dụng.');
    }
    const newUser: StoredUser = { email, password };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const sessionUser = { email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },
  forgotPassword: async (email: string): Promise<void> => {
    // This is a mock. In a real app, this would trigger a backend service to send an email.
    console.log(`Yêu cầu đặt lại mật khẩu cho: ${email}. Đây là một chức năng giả lập. Không có email nào được gửi.`);
    const users: StoredUser[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userExists = users.some(u => u.email === email);
    
    if (userExists) {
      // Simulate sending an email. In a real app, you'd generate a token.
      console.log(`[MOCK] Đang gửi email đặt lại mật khẩu đến ${email}. Trong một ứng dụng thực tế, email sẽ chứa một liên kết duy nhất để đặt lại mật khẩu.`);
    } else {
      // Don't reveal that the user doesn't exist.
      console.log(`[MOCK] Yêu cầu đặt lại mật khẩu nhận được cho email không tồn tại, nhưng chúng tôi không tiết lộ thông tin này cho người dùng để bảo mật.`);
    }
    
    // Always resolve successfully to prevent user enumeration.
    return Promise.resolve();
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};

// --- Mock Book Service ---
const BOOKS_DATA_KEY = 'likebook_data';

const bookService = {
  getBooks: (email: string): Book[] => {
    try {
        const allData = JSON.parse(localStorage.getItem(BOOKS_DATA_KEY) || '{}');
        return allData[email] || [];
    } catch (error) {
        console.error("Failed to parse books data from localStorage", error);
        return [];
    }
  },
  saveBooks: (email: string, books: Book[]) => {
    try {
        const allData = JSON.parse(localStorage.getItem(BOOKS_DATA_KEY) || '{}');
        allData[email] = books;
        localStorage.setItem(BOOKS_DATA_KEY, JSON.stringify(allData));
    } catch (error) {
        console.error("Failed to save books data to localStorage", error);
    }
  }
};


// --- Authentication UI Component ---
const AuthComponent: React.FC<{onLoginSuccess: (user: User) => void}> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResetRequested(false);

    if (!email) {
      setError("Vui lòng nhập địa chỉ email.");
      setLoading(false);
      return;
    }
    
    if ((view === 'login' || view === 'signup') && !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      setLoading(false);
      return;
    }

    try {
      if (view === 'login') {
        const user = await authService.login(email, password);
        onLoginSuccess(user);
      } else if (view === 'signup') {
        const user = await authService.signup(email, password);
        onLoginSuccess(user);
      } else if (view === 'forgot') {
        await authService.forgotPassword(email);
        setResetRequested(true);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setResetRequested(false);
  };

  const renderLoginSignup = () => (
    <>
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Chào mừng bạn trở lại</h1>
      <p className="text-center text-gray-500 mb-8">{view === 'login' ? 'Đăng nhập để tiếp tục' : 'Tạo một tài khoản mới'}</p>
      <div className="flex border border-gray-200 rounded-md p-1 mb-6 bg-gray-50">
        <button onClick={() => { setView('login'); resetFormState(); }} className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${view === 'login' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Đăng nhập</button>
        <button onClick={() => { setView('signup'); resetFormState(); }} className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${view !== 'login' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Đăng ký</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Địa chỉ email</label>
          <input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
          <label htmlFor="password"className="block text-sm font-medium text-gray-700">Mật khẩu</label>
          <input id="password" name="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        {view === 'login' && (
          <div className="text-right text-sm">
            <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); resetFormState(); }} className="font-medium text-blue-600 hover:text-blue-500">
                Quên mật khẩu?
            </a>
          </div>
        )}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
            {loading ? 'Đang xử lý...' : (view === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
          </button>
        </div>
      </form>
    </>
  );

  const renderForgotPassword = () => (
     <>
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Đặt lại mật khẩu</h1>
      <p className="text-center text-gray-500 mb-8">Nhập email của bạn để nhận hướng dẫn.</p>
      {resetRequested ? (
          <div className="text-center p-4 bg-green-50 text-green-700 rounded-lg">
              <p>Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi một liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn (và cả thư mục spam).</p>
          </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Địa chỉ email</label>
              <input id="email" name="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                {loading ? 'Đang xử lý...' : 'Gửi hướng dẫn'}
              </button>
            </div>
        </form>
      )}
       <div className="text-center mt-6 text-sm">
            <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); resetFormState(); }} className="font-medium text-blue-600 hover:text-blue-500">
                &larr; Quay lại Đăng nhập
            </a>
        </div>
     </>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        {view === 'forgot' ? renderForgotPassword() : renderLoginSignup()}
      </div>
       <footer className="w-full text-center p-4 mt-8 text-gray-500 text-sm">
        <p>Phát triển bởi 8BH2T</p>
      </footer>
    </div>
  );
};

const PlusIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
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
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);


const BookDashboard: React.FC<{
  books: Book[];
  onSelectBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onStartCreate: () => void;
}> = ({ books, onSelectBook, onDeleteBook, onStartCreate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 self-start sm:self-center">Sách của tôi</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                </span>
                <input
                    type="text"
                    placeholder="Tìm kiếm sách..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 transition-all"
                    aria-label="Tìm kiếm sách của bạn"
                />
            </div>
            <button onClick={onStartCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 w-full sm:w-auto justify-center">
                <PlusIcon className="w-5 h-5"/>
                Tạo sách mới
            </button>
        </div>
      </div>
      {books.length > 0 ? (
        filteredBooks.length > 0 ? (
            <ul className="space-y-3">
            {filteredBooks.map(book => (
                <li key={book.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                <div className="cursor-pointer flex-grow" onClick={() => onSelectBook(book)}>
                    <p className="font-semibold text-gray-800 group-hover:text-blue-600">{book.title}</p>
                    <p className="text-sm text-gray-500">{book.pages.length} trang - Tạo lúc: {new Date(book.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => onDeleteBook(book.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors ml-4" aria-label={`Xóa sách ${book.title}`}>
                    <TrashIcon className="w-5 h-5"/>
                </button>
                </li>
            ))}
            </ul>
        ) : (
            <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-700">Không tìm thấy kết quả</h3>
                <p className="text-gray-500 mt-2">Không có sách nào khớp với tìm kiếm của bạn. Hãy thử một từ khóa khác.</p>
            </div>
        )
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700">Chào mừng bạn đến với Likebook!</h3>
          <p className="text-gray-500 mt-2">Bạn chưa có cuốn sách nào. Hãy tạo một cuốn sách đầu tiên nhé.</p>
        </div>
      )}
    </div>
  );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingPages, setIsAddingPages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    window.imageDB.init().catch(err => console.error("Không thể khởi tạo cơ sở dữ liệu hình ảnh", err));
    if(currentUser) {
      setBooks(bookService.getBooks(currentUser.email));
    } else {
      setBooks([]);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setSelectedBook(null);
    setIsCreating(false);
    setIsAddingPages(false);
    setUploadedImages([]);
  };
  
  const handleImagesUpload = (imageUrls: string[]) => {
    setUploadedImages(imageUrls);
  };
  
  const handleBookCreate = async (bookData: { title: string; pages: {imageUrl: string, title: string}[] }) => {
    if (!currentUser) return;
    try {
      const imageIds = await Promise.all(
        bookData.pages.map(p => window.imageDB.addImage(p.imageUrl))
      );
      
      const newPages: BookPage[] = imageIds.map((id, index) => ({
          imageId: id,
          title: bookData.pages[index].title,
      }));

      const newBook: Book = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        title: bookData.title,
        pages: newPages,
      };
      const updatedBooks = [...books, newBook];
      setBooks(updatedBooks);
      bookService.saveBooks(currentUser.email, updatedBooks);
      setUploadedImages([]);
      setIsCreating(false);
      setSelectedBook(newBook);
    } catch(err) {
      console.error("Không thể tạo sách:", err);
      alert("Đã xảy ra lỗi khi lưu hình ảnh. Vui lòng thử lại.");
    }
  }

  const handleAppendPages = async (bookData: { title: string; pages: {imageUrl: string, title: string}[] }) => {
    if (!currentUser || !selectedBook) return;
    try {
      const imageIds = await Promise.all(
          bookData.pages.map(p => window.imageDB.addImage(p.imageUrl))
      );
      
      const newPages: BookPage[] = imageIds.map((id, index) => ({
          imageId: id,
          title: bookData.pages[index].title,
      }));

      const updatedBook = {
          ...selectedBook,
          pages: [...selectedBook.pages, ...newPages]
      };

      const updatedBooks = books.map(b => b.id === selectedBook.id ? updatedBook : b);
      setBooks(updatedBooks);
      bookService.saveBooks(currentUser.email, updatedBooks);
      
      setUploadedImages([]);
      setIsAddingPages(false);
      setSelectedBook(updatedBook);
    } catch(err) {
      console.error("Không thể thêm trang:", err);
      alert("Đã xảy ra lỗi khi lưu hình ảnh. Vui lòng thử lại.");
    }
  };

  const handleCancelCreate = () => {
      setUploadedImages([]);
      setIsCreating(false);
  }
  
  const handleCancelAddPages = () => {
    setUploadedImages([]);
    setIsAddingPages(false);
  };


  const handleSelectBook = (book: Book) => {
      setSelectedBook(book);
  }
  
  const handleGoToDashboard = () => {
      setSelectedBook(null);
      setIsAddingPages(false);
  }

  const handleDeleteBook = async (bookId: string) => {
    if (!currentUser) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa cuốn sách này không? Thao tác này không thể hoàn tác.')) {
      const bookToDelete = books.find(b => b.id === bookId);
      if (bookToDelete) {
        try {
          await Promise.all(bookToDelete.pages.map(p => window.imageDB.deleteImage(p.imageId)));
        } catch(err) {
          console.error("Không thể xóa hình ảnh khỏi cơ sở dữ liệu", err);
        }
      }
      const updatedBooks = books.filter(b => b.id !== bookId);
      setBooks(updatedBooks);
      bookService.saveBooks(currentUser.email, updatedBooks);
    }
  }

  const handlePageUpdate = (pageIndex: number, newTitle: string) => {
    if (!currentUser || !selectedBook) return;

    const updatedPages = [...selectedBook.pages];
    if (updatedPages[pageIndex]) {
        updatedPages[pageIndex].title = newTitle;
    }
    
    const updatedBook = { ...selectedBook, pages: updatedPages };
    setSelectedBook(updatedBook);

    const updatedBooks = books.map(b => b.id === updatedBook.id ? updatedBook : b);
    setBooks(updatedBooks);
    bookService.saveBooks(currentUser.email, updatedBooks);
  };

  const handlePageDelete = async (pageIndexToDelete: number) => {
    if (!currentUser || !selectedBook) return;
    
    const pageToDelete = selectedBook.pages[pageIndexToDelete];
    if (pageToDelete) {
      try {
        await window.imageDB.deleteImage(pageToDelete.imageId);
      } catch(err) {
        console.error("Không thể xóa hình ảnh", err);
      }
    }

    const updatedPages = selectedBook.pages.filter((_, index) => index !== pageIndexToDelete);
    const updatedBook = { ...selectedBook, pages: updatedPages };
    
    const updatedBooks = books.map(b => b.id === updatedBook.id ? updatedBook : b);
    setBooks(updatedBooks);
    bookService.saveBooks(currentUser.email, updatedBooks);
    
    // If the book is empty, maybe go back to dashboard. For now, just update state.
    setSelectedBook(updatedBook);
  };
  
  const renderContent = () => {
    if (selectedBook) {
      if (isAddingPages) {
          if (uploadedImages.length > 0) {
              return <TitleEditor 
                  imageUrls={uploadedImages} 
                  onConfirm={handleAppendPages} 
                  onCancel={handleCancelAddPages} 
                  bookTitle={selectedBook.title}
                  isAddingPages={true}
              />
          }
          return <ImageUploader onImagesUpload={handleImagesUpload} onCancel={handleCancelAddPages} />;
      }
      return (
        <div className="w-full h-full">
          <FlipBook 
            key={selectedBook.id} 
            title={selectedBook.title}
            pages={selectedBook.pages} 
            onTitleUpdate={handlePageUpdate} 
            onPageDelete={handlePageDelete}
            onGoToDashboard={handleGoToDashboard}
            onAddPages={() => setIsAddingPages(true)}
          />
        </div>
      );
    }

    if (isCreating) {
      if (uploadedImages.length > 0) {
        return <TitleEditor imageUrls={uploadedImages} onConfirm={handleBookCreate} onCancel={handleCancelCreate} />
      }
      return <ImageUploader onImagesUpload={handleImagesUpload} onCancel={handleCancelCreate} />;
    }
    
    return <BookDashboard books={books} onSelectBook={handleSelectBook} onDeleteBook={handleDeleteBook} onStartCreate={() => setIsCreating(true)}/>;
  }

  if (!currentUser) {
    return <AuthComponent onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`bg-gray-100 min-h-screen w-full flex flex-col font-sans antialiased ${!selectedBook ? 'p-4 items-center justify-center' : ''}`}>
      <header className={`w-full max-w-5xl mx-auto ${selectedBook ? 'px-4 pt-4 mb-2' : 'mb-6'}`}>
        <div className="flex justify-between items-center">
            <div>
              {selectedBook ? (
                <button
                  onClick={handleGoToDashboard}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowUturnLeftIcon className="w-5 h-5" />
                  Quay về danh sách
                </button>
              ) : (
                <>
                  <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Likebook</h1>
                  <p className="text-gray-600 mt-2">thư viện sách của bạn</p>
                </>
              )}
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                <p className="text-sm text-gray-700 truncate">Xin chào, {currentUser.email.split('@')[0]}</p>
                <button 
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:underline focus:outline-none"
                >
                  Đăng xuất
                </button>
            </div>
        </div>
      </header>
      
      <main className="w-full flex-grow flex justify-center">
        {renderContent()}
      </main>
      
      <footer className="w-full text-center p-4 mt-8 text-gray-500 text-sm">
        <p>Phát triển bởi 8BH2T</p>
      </footer>
    </div>
  );
};

export default App;