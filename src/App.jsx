import { useEffect, useState } from "react";

import { db, auth, googleProvider } from "./firebase";
import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

const GUEST_STORAGE_KEY = "my-bookshelf-books-guest";
const USERS_COLLECTION = "users";
const BOOKS_SUBCOLLECTION = "books";

const getStorageKey = (userId) => {
  return userId ? `my-bookshelf-books-${userId}` : GUEST_STORAGE_KEY;
};

const initialBooks = [
  {
    id: 1,
    title: "데미안",
    author: "헤르만 헤세",
    pages: 240,
    status: "read",
    rating: 5,
    category: "소설",
    color: "#8B5E3C",
    readDate: "2026.04.12",
    price: "13,800",
    quote: "새는 알을 깨고 나온다.",
    memo: "성장과 자아를 찾는 과정이 인상 깊었다.",
  },
  {
    id: 2,
    title: "아몬드",
    author: "손원평",
    pages: 264,
    status: "read",
    rating: 5,
    category: "소설",
    color: "#C08457",
    readDate: "2026.03.20",
    price: "12,000",
    quote: "감정을 느끼는 방식은 사람마다 다르다.",
    memo: "주인공의 감정 변화가 기억에 남았다.",
  },
  {
    id: 3,
    title: "불편한 편의점",
    author: "김호연",
    pages: 320,
    status: "read",
    rating: 4,
    category: "소설",
    color: "#7C9473",
    readDate: "2026.03.15",
    price: "14,000",
    quote: "작은 친절이 누군가에게 위로가 될 수 있다.",
    memo: "따뜻하고 편안하게 읽을 수 있는 책이었다.",
  },
  {
    id: 4,
    title: "역행자",
    author: "자청",
    pages: 288,
    status: "want",
    rating: 0,
    category: "자기계발",
    color: "#D8A48F",
    readDate: "-",
    price: "17,500",
    quote: "",
    memo: "",
  },
  {
    id: 5,
    title: "코스모스",
    author: "칼 세이건",
    pages: 720,
    status: "want",
    rating: 0,
    category: "과학",
    color: "#5D737E",
    readDate: "-",
    price: "18,500",
    quote: "",
    memo: "",
  },
];

function App() {
  const [books, setBooks] = useState(() => {
    try {
      const savedBooks = localStorage.getItem(GUEST_STORAGE_KEY);
      return savedBooks ? JSON.parse(savedBooks) : initialBooks;
    } catch {
      return initialBooks;
    }
  });

  const [activePage, setActivePage] = useState(() => {
    return localStorage.getItem("my-bookshelf-active-page") || "shelf";
  });
  const [searchText, setSearchText] = useState("");

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isLoggedIn = !!currentUser;

  const [thicknessMode, setThicknessMode] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);

  useEffect(() => {
    const storageKey = getStorageKey(currentUser?.uid);
    localStorage.setItem(storageKey, JSON.stringify(books));
  }, [books, currentUser]);

  useEffect(() => {
    if (authLoading) return;

    const loadBooks = async () => {
      const storageKey = getStorageKey(currentUser?.uid);

      try {
        const savedBooks = localStorage.getItem(storageKey);
        const localBooks = savedBooks ? JSON.parse(savedBooks) : initialBooks;

        if (!currentUser) {
          setBooks(initialBooks);
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(initialBooks));
          return;
        }

        const booksRef = collection(
          db,
          USERS_COLLECTION,
          currentUser.uid,
          BOOKS_SUBCOLLECTION
        );

        const snapshot = await getDocs(booksRef);

        if (!snapshot.empty) {
          const firebaseBooks = snapshot.docs.map((document) => {
            const data = document.data();

            return {
              ...data,
              id: data.id ?? Number(document.id),
            };
          });

          setBooks(firebaseBooks);
          localStorage.setItem(storageKey, JSON.stringify(firebaseBooks));
          console.log("사용자별 Firestore 책 데이터를 불러왔습니다.");
        } else {
          setBooks(localBooks);

          await Promise.all(
            localBooks.map((book) =>
              setDoc(
                doc(
                  db,
                  USERS_COLLECTION,
                  currentUser.uid,
                  BOOKS_SUBCOLLECTION,
                  String(book.id)
                ),
                book
              )
            )
          );

          console.log("사용자별 Firestore에 초기 책 데이터를 저장했습니다.");
        }
      } catch (error) {
        console.error("사용자별 Firestore 불러오기 오류:", error);

        const savedBooks = localStorage.getItem(storageKey);
        setBooks(savedBooks ? JSON.parse(savedBooks) : initialBooks);
      }
    };

    loadBooks();
  }, [authLoading, currentUser]);

  useEffect(() => {
    localStorage.setItem("my-bookshelf-active-page", activePage);
  }, [activePage]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddBook = async (newBook) => {
    setBooks((prevBooks) => [...prevBooks, newBook]);
    setShowAddModal(false);

    if (!currentUser) {
      console.log("로그인하지 않은 상태라 localStorage에만 저장됩니다.");
      return;
    }

    try {
      await setDoc(
        doc(
          db,
          USERS_COLLECTION,
          currentUser.uid,
          BOOKS_SUBCOLLECTION,
          String(newBook.id)
        ),
        newBook
      );

      console.log("사용자별 Firestore에 책이 추가되었습니다.");
    } catch (error) {
      console.error("Firestore 추가 오류:", error);
      alert("Firestore 저장에는 실패했지만, localStorage에는 저장되었습니다.");
    }
  };

  const handleEmailLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    setActivePage("shelf");
  };

  const handleGoogleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
    setActivePage("shelf");
  };

  const handleSignUp = async ({ name, email, password }) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (name.trim()) {
      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });
    }

    setActivePage("shelf");
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActivePage("login");
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      alert("로그인된 사용자가 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      "정말 회원 탈퇴하시겠어요?\n계정은 삭제되며, 이 작업은 되돌릴 수 없습니다."
    );

    if (!confirmed) return;

    try {
      await deleteUser(auth.currentUser);

      localStorage.removeItem("my-bookshelf-login");
      localStorage.removeItem("my-bookshelf-active-page");

      alert("회원 탈퇴가 완료되었습니다.");
      setActivePage("login");
    } catch (error) {
      console.error("회원 탈퇴 오류:", error);

      if (error.code === "auth/requires-recent-login") {
        alert("보안을 위해 다시 로그인한 후 회원 탈퇴를 시도해주세요.");
        await signOut(auth);
        setActivePage("login");
        return;
      }

      alert("회원 탈퇴 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateBook = async (updatedBook) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) => (book.id === updatedBook.id ? updatedBook : book))
    );
    setEditingBook(null);

    if (!currentUser) {
      console.log("로그인하지 않은 상태라 localStorage에서만 수정됩니다.");
      return;
    }

    try {
      await setDoc(
        doc(
          db,
          USERS_COLLECTION,
          currentUser.uid,
          BOOKS_SUBCOLLECTION,
          String(updatedBook.id)
        ),
        updatedBook
      );

      console.log("사용자별 Firestore에서 책 정보가 수정되었습니다.");
    } catch (error) {
      console.error("Firestore 수정 오류:", error);
      alert("Firestore 수정에는 실패했지만, localStorage에는 저장되었습니다.");
    }
  };

  const handleDeleteBook = async (bookId) => {
    setBooks((prevBooks) => prevBooks.filter((book) => book.id !== bookId));
    setDeletingBook(null);
    setSelectedBook(null);

    if (!currentUser) {
      console.log("로그인하지 않은 상태라 localStorage에서만 삭제됩니다.");
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          USERS_COLLECTION,
          currentUser.uid,
          BOOKS_SUBCOLLECTION,
          String(bookId)
        )
      );

      console.log("사용자별 Firestore에서 책이 삭제되었습니다.");
    } catch (error) {
      console.error("Firestore 삭제 오류:", error);
      alert("Firestore 삭제에는 실패했지만, localStorage에서는 삭제되었습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6efe6] text-[#3f2f24]">
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      <main className="mx-auto max-w-7xl px-8 py-8">
        {activePage === "shelf" && (
          <ShelfPage
            books={books}
            thicknessMode={thicknessMode}
            setThicknessMode={setThicknessMode}
            onAddClick={() => setShowAddModal(true)}
            onSelectBook={setSelectedBook}
          />
        )}

        {activePage === "list" && (
          <ListPage
            books={books}
            searchText={searchText}
            setSearchText={setSearchText}
            onAddClick={() => setShowAddModal(true)}
            onSelectBook={setSelectedBook}
            onEditBook={setEditingBook}
            onDeleteBook={setDeletingBook}
          />
        )}

        {activePage === "stats" && <StatisticsPage books={books} />}

        {activePage === "login" && (
          <LoginPage
            setActivePage={setActivePage}
            onEmailLogin={handleEmailLogin}
            onGoogleLogin={handleGoogleLogin}
          />
        )}

        {activePage === "signup" && (
          <SignUpPage
            setActivePage={setActivePage}
            onSignUp={handleSignUp}
          />
        )}

        {activePage === "mypage" && (
          <MyPage
            books={books}
            setActivePage={setActivePage}
            currentUser={currentUser}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={() => {
            setEditingBook(selectedBook);
            setSelectedBook(null);
          }}
          onDelete={() => {
            setDeletingBook(selectedBook);
            setSelectedBook(null);
          }}
        />
      )}

      {showAddModal && (
        <BookFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBook}
        />
      )}

      {editingBook && (
        <BookFormModal
          mode="edit"
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSubmit={handleUpdateBook}
        />
      )}

      {deletingBook && (
        <DeleteConfirmModal
          book={deletingBook}
          onClose={() => setDeletingBook(null)}
          onDelete={() => handleDeleteBook(deletingBook.id)}
        />
      )}
    </div>
  );
}

function Header({
  activePage,
  setActivePage,
  isLoggedIn,
  currentUser,
  searchText,
  setSearchText,
}) {
  return (
    <header className="border-b border-[#e1d2c1] bg-[#fbf7f1]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
        <button
          onClick={() => setActivePage("shelf")}
          className="text-2xl font-bold text-[#5a3f2d]"
        >
          나만의 책장
        </button>

        <nav className="flex gap-3">
          <NavButton
            active={activePage === "shelf"}
            onClick={() => setActivePage("shelf")}
          >
            책장
          </NavButton>

          <NavButton
            active={activePage === "list"}
            onClick={() => setActivePage("list")}
          >
            리스트
          </NavButton>

          <NavButton
            active={activePage === "stats"}
            onClick={() => setActivePage("stats")}
          >
            통계
          </NavButton>
        </nav>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setActivePage("list");
              }
            }}
            placeholder="책 검색"
            className="w-44 rounded-full border border-[#d8c6b5] bg-white px-4 py-2 text-sm outline-none"
          />

        {isLoggedIn ? (
          <button
            onClick={() => setActivePage("mypage")}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
              activePage === "mypage"
                ? "bg-[#3f2f24] text-white"
                : "bg-[#6b4f3b] text-white"
            }`}
          >
            {currentUser?.displayName?.[0] ||
              currentUser?.email?.[0]?.toUpperCase() ||
              "J"}
          </button>
        ) : (
          <button
            onClick={() => setActivePage("login")}
            className="rounded-full border border-[#d8c6b5] bg-white px-4 py-2 text-sm font-semibold text-[#6b4f3b] hover:bg-[#eee0d1]"
          >
            로그인
          </button>
        )}
        </div>
      </div>
    </header>
  );
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#6b4f3b] text-white"
          : "text-[#6b4f3b] hover:bg-[#eee0d1]"
      }`}
    >
      {children}
    </button>
  );
}

function ShelfPage({
  books,
  thicknessMode,
  setThicknessMode,
  onAddClick,
  onSelectBook,
}) {
  const readBooks = books.filter((book) => book.status === "read");
  const wantBooks = books.filter((book) => book.status === "want");

  const totalPages = readBooks.reduce((sum, book) => sum + book.pages, 0);
  const averageRating =
    readBooks.length > 0
      ? (
          readBooks.reduce((sum, book) => sum + book.rating, 0) /
          readBooks.length
        ).toFixed(1)
      : 0;

  return (
    <>
      <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">나의 책장</h2>
          <p className="mt-2 text-sm text-[#7a6554]">
            읽은 책과 읽고 싶은 책을 책장처럼 정리해보세요.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setThicknessMode(!thicknessMode)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              thicknessMode
                ? "bg-[#6b4f3b] text-white"
                : "border border-[#d8c6b5] bg-white text-[#6b4f3b]"
            }`}
          >
            실제 두께 {thicknessMode ? "ON" : "OFF"}
          </button>

          <button
            onClick={onAddClick}
            className="rounded-full bg-[#6b4f3b] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#563b29]"
          >
            + 책 추가
          </button>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="읽은 책" value={`${readBooks.length}권`} />
        <StatCard title="읽고 싶은 책" value={`${wantBooks.length}권`} />
        <StatCard title="총 페이지" value={`${totalPages}p`} />
        <StatCard title="평균 별점" value={`${averageRating}점`} />
      </section>

      <BookShelf
        title="읽은 책"
        books={readBooks}
        thicknessMode={thicknessMode}
        onSelectBook={onSelectBook}
      />

      <BookShelf
        title="읽고 싶은 책"
        books={wantBooks}
        thicknessMode={thicknessMode}
        onSelectBook={onSelectBook}
      />
    </>
  );
}

function ListPage({
  books,
  searchText,
  setSearchText,
  onAddClick,
  onSelectBook,
  onEditBook,
  onDeleteBook,
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOption, setSortOption] = useState("created");

  const categories = ["all", ...new Set(books.map((book) => book.category))];

  const filteredBooks = books
    .filter((book) => {
      const keyword = searchText.toLowerCase().trim();
      const matchesSearch =
        book.title.toLowerCase().includes(keyword) ||
        book.author.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" || book.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || book.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOption === "title") {
        return a.title.localeCompare(b.title, "ko");
      }

      if (sortOption === "pages") {
        return b.pages - a.pages;
      }

      if (sortOption === "rating") {
        return b.rating - a.rating;
      }

      return b.id - a.id;
    });

  const readCount = books.filter((book) => book.status === "read").length;
  const wantCount = books.filter((book) => book.status === "want").length;

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">리스트 보기</h2>
          <p className="mt-2 text-sm text-[#7a6554]">
            책장에 등록한 책들을 표 형태로 빠르게 확인하고 관리해보세요.
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="rounded-full bg-[#6b4f3b] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#563b29]"
        >
          + 책 추가
        </button>
      </div>

      <div className="mb-6 rounded-3xl border border-[#e1d2c1] bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="책 제목 또는 저자 검색"
            className="input-style"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-style"
          >
            <option value="all">전체 책</option>
            <option value="read">읽은 책</option>
            <option value="want">읽고 싶은 책</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-style"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "전체 카테고리" : category}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="input-style"
          >
            <option value="created">등록순</option>
            <option value="title">제목순</option>
            <option value="pages">페이지 많은순</option>
            <option value="rating">별점 높은순</option>
          </select>

          <button
            onClick={() => {
              setSearchText("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setSortOption("created");
            }}
            className="rounded-xl border border-[#d8c6b5] bg-[#f1e2d2] px-4 py-2 text-sm font-semibold text-[#6b4f3b] hover:bg-[#e5d2bf]"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[#7a6554]">
        <span>총 {books.length}권의 책</span>
        <span className="rounded-full border border-[#b8d1a8] bg-[#dcebd2] px-3 py-1 text-[#3f6b3f]">
          읽은 책 {readCount}권
        </span>
        <span className="rounded-full border border-[#dfc39b] bg-[#f4e6d2] px-3 py-1 text-[#8a5a2e]">
          읽고 싶은 책 {wantCount}권
        </span>
        <span className="ml-auto">현재 표시: {filteredBooks.length}권</span>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e1d2c1] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-[#3f2f24] text-left text-sm text-white">
                <th className="px-5 py-4">표지</th>
                <th className="px-5 py-4">제목</th>
                <th className="px-5 py-4">저자</th>
                <th className="px-5 py-4">상태</th>
                <th className="px-5 py-4">읽은 날짜</th>
                <th className="px-5 py-4">페이지</th>
                <th className="px-5 py-4">별점</th>
                <th className="px-5 py-4">카테고리</th>
                <th className="px-5 py-4 text-center">관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredBooks.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-12 text-center text-[#8a7462]"
                  >
                    조건에 맞는 책이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="border-b border-[#eee1d4] last:border-b-0 hover:bg-[#fffaf4]"
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="flex h-16 w-12 items-center justify-center rounded-md text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: book.color }}
                      >
                        책
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => onSelectBook(book)}
                        className="font-bold text-[#3f2f24] hover:underline"
                      >
                        {book.title}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#6b4f3b]">
                      {book.author}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={book.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-[#6b4f3b]">
                      {book.readDate}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-[#6b4f3b]">
                      {book.pages}p
                    </td>

                    <td className="px-5 py-4">
                      <StarRating rating={book.rating} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-[#f1e2d2] px-3 py-1 text-sm text-[#6b4f3b]">
                        {book.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onEditBook(book)}
                          className="rounded-lg bg-[#f1e2d2] px-3 py-2 text-sm font-semibold text-[#6b4f3b] hover:bg-[#e5d2bf]"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => onDeleteBook(book)}
                          className="rounded-lg bg-[#fff0f0] px-3 py-2 text-sm font-semibold text-[#c84a4a] hover:bg-[#ffe2e2]"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-sm text-[#8a7462]">
        1 - {filteredBooks.length} / 총 {books.length}권
      </p>
    </section>
  );
}

function StatisticsPage({ books }) {
  const readBooks = books.filter((book) => book.status === "read");
  const wantBooks = books.filter((book) => book.status === "want");

  const totalPages = readBooks.reduce((sum, book) => sum + book.pages, 0);

  const averageRating =
    readBooks.length > 0
      ? (
          readBooks.reduce((sum, book) => sum + book.rating, 0) /
          readBooks.length
        ).toFixed(1)
      : 0;

  const yearlyGoal = 20;
  const goalPercent = Math.min(
    100,
    Math.round((readBooks.length / yearlyGoal) * 100)
  );

  const monthlyCounts = [1, 2, 3, 4, 5, 6].map((month) => {
    const count = readBooks.filter((book) => {
      if (!book.readDate || book.readDate === "-") return false;
      const monthText = book.readDate.split(".")[1];
      return Number(monthText) === month;
    }).length;

    return {
      month: `${month}월`,
      count,
    };
  });

  const maxMonthlyCount = Math.max(
    1,
    ...monthlyCounts.map((item) => item.count)
  );

  const categoryCounts = readBooks.reduce((acc, book) => {
    acc[book.category] = (acc[book.category] || 0) + 1;
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryCounts);

  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: readBooks.filter((book) => book.rating === rating).length,
  }));

  const maxRatingCount = Math.max(1, ...ratingCounts.map((item) => item.count));

  const recentBooks = [...readBooks]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  const categoryColors = [
    "#8B5E3C",
    "#7C9473",
    "#D2AD68",
    "#A68A64",
    "#D8C6B5",
    "#5D737E",
  ];

  let currentDegree = 0;
  const donutGradient =
    categoryEntries.length === 0
      ? "#eadcca 0deg 360deg"
      : categoryEntries
          .map(([category, count], index) => {
            const start = currentDegree;
            const degree = (count / readBooks.length) * 360;
            currentDegree += degree;
            return `${categoryColors[index % categoryColors.length]} ${start}deg ${currentDegree}deg`;
          })
          .join(", ");

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">독서 통계</h2>
        <p className="mt-2 text-sm text-[#7a6554]">
          나의 독서 습관과 기록을 한눈에 확인해보세요.
        </p>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="총 읽은 책" value={`${readBooks.length}권`} />
        <StatCard title="총 읽은 페이지" value={`${totalPages}p`} />
        <StatCard title="평균 별점" value={`${averageRating}`} />
        <StatCard
          title="올해 독서 목표"
          value={`${readBooks.length}권 / ${yearlyGoal}권`}
        />
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-[#e1d2c1] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-[#5a3f2d]">
            월별 읽은 책 수
          </h3>

          <div className="flex h-64 items-end gap-6 border-b border-[#e1d2c1] px-4">
            {monthlyCounts.map((item) => (
              <div key={item.month} className="flex flex-1 flex-col items-center">
                <div className="mb-2 text-sm font-semibold text-[#6b4f3b]">
                  {item.count}
                </div>
                <div
                  className="w-full max-w-12 rounded-t-xl bg-[#8B5E3C]"
                  style={{
                    height: `${(item.count / maxMonthlyCount) * 180}px`,
                    minHeight: item.count > 0 ? "24px" : "4px",
                  }}
                />
                <p className="mt-3 text-sm text-[#7a6554]">{item.month}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#e1d2c1] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-[#5a3f2d]">
            카테고리별 독서 비율
          </h3>

          <div className="flex flex-col items-center justify-center gap-6 md:flex-row lg:flex-col">
            <div
              className="h-44 w-44 rounded-full"
              style={{
                background: `conic-gradient(${donutGradient})`,
              }}
            >
              <div className="relative left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-bold text-[#6b4f3b]">
                {readBooks.length}권
              </div>
            </div>

            <div className="w-full space-y-2">
              {categoryEntries.length === 0 ? (
                <p className="text-center text-sm text-[#8a7462]">
                  아직 읽은 책이 없습니다.
                </p>
              ) : (
                categoryEntries.map(([category, count], index) => (
                  <div
                    key={category}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            categoryColors[index % categoryColors.length],
                        }}
                      />
                      <span className="text-[#6b4f3b]">{category}</span>
                    </div>
                    <span className="font-semibold text-[#3f2f24]">
                      {count}권
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border border-[#e1d2c1] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-[#5a3f2d]">별점 분포</h3>

          <div className="space-y-4">
            {ratingCounts.map((item) => (
              <div key={item.rating} className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
                <p className="text-sm text-[#6b4f3b]">{item.rating}점</p>
                <div className="h-3 rounded-full bg-[#efe3d4]">
                  <div
                    className="h-3 rounded-full bg-[#8B5E3C]"
                    style={{
                      width: `${(item.count / maxRatingCount) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-right text-sm font-semibold text-[#6b4f3b]">
                  {item.count}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-[#f8efe5] p-4">
            <p className="text-sm text-[#6b4f3b]">
              올해 목표 달성률은{" "}
              <span className="font-bold">{goalPercent}%</span>입니다.
            </p>
            <div className="mt-3 h-3 rounded-full bg-[#eadcca]">
              <div
                className="h-3 rounded-full bg-[#7C9473]"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#e1d2c1] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-[#5a3f2d]">
            최근 독서 기록
          </h3>

          <div className="space-y-4">
            {recentBooks.length === 0 ? (
              <p className="text-sm text-[#8a7462]">
                아직 최근 독서 기록이 없습니다.
              </p>
            ) : (
              recentBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between border-b border-[#eee1d4] pb-4 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: book.color }}
                    >
                      책
                    </div>
                    <div>
                      <p className="font-bold text-[#3f2f24]">{book.title}</p>
                      <p className="mt-1 text-sm text-[#8a7462]">
                        {book.readDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm font-semibold text-[#d8862f]">
                    ★ {book.rating}.0
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function LoginPage({ setActivePage, onEmailLogin, onGoogleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await onEmailLogin(email, password);
    } catch (error) {
      console.error("로그인 오류:", error);
      alert("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    try {
      setLoading(true);
      await onGoogleLogin();
    } catch (error) {
      console.error("Google 로그인 오류:", error);
      alert("Google 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#e1d2c1] bg-[#fffaf4] p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#3f2f24]">로그인</h2>
          <p className="mt-2 text-sm text-[#7a6554]">
            나만의 책장에 오신 것을 환영합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8c6b5] bg-white px-4 py-3 text-sm font-semibold text-[#3f2f24] hover:bg-[#f8efe5] disabled:opacity-60"
        >
          <span className="font-bold text-[#4285F4]">G</span>
          Google로 로그인
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e1d2c1]" />
          <span className="text-xs text-[#9a7b5f]">또는 이메일로 로그인</span>
          <div className="h-px flex-1 bg-[#e1d2c1]" />
        </div>

        <form onSubmit={handleEmailSubmit}>
          <div className="space-y-4">
            <FormField label="이메일">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="input-style"
              />
            </FormField>

            <FormField label="비밀번호">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="input-style"
              />
            </FormField>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-[#7a6554]">
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              로그인 상태 유지
            </label>
            <button type="button" className="hover:underline">
              비밀번호 찾기
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[#6b4f3b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#563b29] disabled:opacity-60"
          >
            {loading ? "처리 중..." : "로그인"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-[#7a6554]">
          아직 계정이 없으신가요?{" "}
          <button
            onClick={() => setActivePage("signup")}
            className="font-bold text-[#6b4f3b] hover:underline"
          >
            회원가입
          </button>
        </div>
      </div>
    </section>
  );
}

function SignUpPage({ setActivePage, onSignUp }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    if (!form.email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    if (form.password.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (form.password !== form.passwordConfirm) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);
      await onSignUp({
        name: form.name,
        email: form.email,
        password: form.password,
      });
    } catch (error) {
      console.error("회원가입 오류:", error);
      alert("회원가입에 실패했습니다. 이미 가입된 이메일일 수 있습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#e1d2c1] bg-[#fffaf4] p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-[#3f2f24]">회원가입</h2>
          <p className="mt-2 text-sm text-[#7a6554]">
            나만의 온라인 서재를 시작해보세요.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormField label="이름">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="홍길동"
                className="input-style"
              />
            </FormField>

            <FormField label="이메일">
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="example@email.com"
                className="input-style"
              />
            </FormField>

            <FormField label="비밀번호">
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder="비밀번호 6자 이상"
                className="input-style"
              />
            </FormField>

            <FormField label="비밀번호 확인">
              <input
                name="passwordConfirm"
                value={form.passwordConfirm}
                onChange={handleChange}
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                className="input-style"
              />
            </FormField>
          </div>

          <label className="mt-5 flex items-start gap-2 text-sm text-[#7a6554]">
            <input type="checkbox" className="mt-1" />
            <span>이용약관 및 개인정보 처리방침에 동의합니다.</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[#6b4f3b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#563b29] disabled:opacity-60"
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-[#7a6554]">
          이미 계정이 있으신가요?{" "}
          <button
            onClick={() => setActivePage("login")}
            className="font-bold text-[#6b4f3b] hover:underline"
          >
            로그인
          </button>
        </div>
      </div>
    </section>
  );
}

function MyPage({
  books,
  setActivePage,
  currentUser,
  onLogout,
  onDeleteAccount,
}) {
  const readBooks = books.filter((book) => book.status === "read");
  const wantBooks = books.filter((book) => book.status === "want");

  const userName = currentUser?.displayName || "사용자";
  const userEmail = currentUser?.email || "로그인 정보 없음";
  const userInitial =
    currentUser?.displayName?.[0] ||
    currentUser?.email?.[0]?.toUpperCase() ||
    "J";

  const averageRating =
    readBooks.length > 0
      ? (
          readBooks.reduce((sum, book) => sum + book.rating, 0) /
          readBooks.length
        ).toFixed(1)
      : 0;

  const yearlyGoal = 20;
  const goalPercent = Math.min(
    100,
    Math.round((readBooks.length / yearlyGoal) * 100)
  );

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold">마이페이지</h2>
        <p className="mt-2 text-sm text-[#7a6554]">
          내 정보와 독서 목표를 관리해보세요.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#e1d2c1] bg-[#fffaf4] p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#eadcca] text-4xl font-bold text-[#6b4f3b]">
              {userInitial}
            </div>

            <h3 className="text-xl font-bold text-[#3f2f24]">{userName}</h3>
            <p className="mt-1 text-sm text-[#7a6554]">{userEmail}</p>

            <span className="mt-3 inline-block rounded-full bg-[#f1e2d2] px-3 py-1 text-xs font-semibold text-[#6b4f3b]">
              Google 계정 연동됨
            </span>

            <p className="mt-4 text-sm text-[#8a7462]">
              “나만의 온라인 서재를 꾸준히 채워가고 있어요.”
            </p>
          </div>

          <div className="rounded-3xl border border-[#e1d2c1] bg-[#fffaf4] p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-[#5a3f2d]">
              나의 독서 현황
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <MiniStat title="총 읽은 책" value={`${readBooks.length}권`} />
              <MiniStat title="읽고 싶은 책" value={`${wantBooks.length}권`} />
              <MiniStat title="평균 별점" value={`${averageRating}`} />
              <MiniStat title="목표 달성률" value={`${goalPercent}%`} />
            </div>

            <div className="mt-4 h-3 rounded-full bg-[#eadcca]">
              <div
                className="h-3 rounded-full bg-[#7C9473]"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#e1d2c1] bg-[#fffaf4] shadow-sm">
          <div className="border-b border-[#e1d2c1] p-6">
            <h3 className="text-xl font-bold text-[#3f2f24]">프로필 및 설정</h3>
            <p className="mt-1 text-sm text-[#7a6554]">
              변경 후 저장하기를 눌러주세요.
            </p>
          </div>

          <div className="space-y-8 p-6">
            <div>
              <h4 className="mb-4 font-bold text-[#6b4f3b]">기본 정보</h4>
              <div className="space-y-4">
                <FormField label="이름">
                  <input defaultValue={userName} className="input-style" />
                </FormField>

                <FormField label="이메일">
                  <input defaultValue={userEmail} className="input-style" />
                </FormField>

                <FormField label="비밀번호 변경">
                  <input
                    type="password"
                    placeholder="새 비밀번호 입력"
                    className="input-style"
                  />
                </FormField>
              </div>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-[#6b4f3b]">로그인 방식</h4>
              <div className="flex gap-3">
                <button className="rounded-xl bg-[#6b4f3b] px-4 py-3 text-sm font-semibold text-white">
                  Google 로그인
                </button>
                <button className="rounded-xl border border-[#d8c6b5] bg-white px-4 py-3 text-sm font-semibold text-[#6b4f3b]">
                  이메일 로그인
                </button>
              </div>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-[#6b4f3b]">독서 목표 설정</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="올해 목표 권 수">
                  <input defaultValue="20" className="input-style" />
                </FormField>

                <FormField label="전체 목표 권 수">
                  <input defaultValue="100" className="input-style" />
                </FormField>
              </div>
            </div>

            <div>
              <h4 className="mb-4 font-bold text-[#6b4f3b]">테마 설정</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <button className="rounded-2xl border-2 border-[#6b4f3b] bg-[#fffaf4] p-5 text-sm font-semibold text-[#6b4f3b]">
                  기본 테마
                </button>
                <button className="rounded-2xl border border-[#d8c6b5] bg-[#3f2f24] p-5 text-sm font-semibold text-white">
                  다크 모드
                </button>
              </div>
            </div>

            <div className="flex justify-between border-t border-[#e1d2c1] pt-6">
            <button
              onClick={onLogout}
              className="rounded-xl border border-[#d8c6b5] bg-[#f1e2d2] px-5 py-3 text-sm font-semibold text-[#6b4f3b] hover:bg-[#e5d2bf]"
            >
              로그아웃
            </button>

              <div className="flex gap-3">
                <button
                  onClick={onDeleteAccount}
                  className="rounded-xl border border-[#e3a4a4] bg-[#fff4f4] px-5 py-3 text-sm font-semibold text-[#c84a4a] hover:bg-[#ffe8e8]"
                >
                  회원 탈퇴
                </button>
                <button className="rounded-xl bg-[#6b4f3b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#563b29]">
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ title, value }) {
  return (
    <div className="rounded-2xl bg-[#f1e2d2] p-4">
      <p className="text-xs text-[#7a6554]">{title}</p>
      <p className="mt-2 text-xl font-bold text-[#3f2f24]">{value}</p>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-[#e1d2c1] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#8a7462]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[#5a3f2d]">{value}</p>
    </div>
  );
}

function BookShelf({ title, books, thicknessMode, onSelectBook }) {
  return (
    <section className="mb-10 rounded-3xl border border-[#e1d2c1] bg-[#fffaf4] p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold text-[#5a3f2d]">{title}</h3>
        <span className="text-sm text-[#8a7462]">{books.length}권</span>
      </div>

      <div className="flex min-h-[260px] items-end gap-3 overflow-x-auto rounded-2xl bg-[#f1e2d2] px-6 pt-8">
        {books.map((book) => (
          <BookSpine
            key={book.id}
            book={book}
            thicknessMode={thicknessMode}
            onClick={() => onSelectBook(book)}
          />
        ))}
      </div>

      <div className="h-5 rounded-b-2xl bg-[#8b5e3c]" />
    </section>
  );
}

function BookSpine({ book, thicknessMode, onClick }) {
  const width = thicknessMode ? Math.min(90, Math.max(38, book.pages / 8)) : 55;

  return (
    <button
      onClick={onClick}
      className="flex h-56 cursor-pointer items-center justify-center rounded-t-md border border-black/10 shadow-md transition hover:-translate-y-2 hover:shadow-lg"
      style={{
        width: `${width}px`,
        backgroundColor: book.color,
      }}
      title={`${book.title} / ${book.author}`}
    >
      <p
        className="text-sm font-bold text-white"
        style={{ writingMode: "vertical-rl" }}
      >
        {book.title}
      </p>
    </button>
  );
}

function BookFormModal({ mode, book, onClose, onSubmit }) {
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    title: book?.title || "",
    author: book?.author || "",
    pages: book?.pages || "",
    price: book?.price || "",
    category: book?.category || "소설",
    status: book?.status || "read",
    rating: book?.rating ? String(book.rating) : "5",
    color: book?.color || "#8B5E3C",
    readDate:
      book?.readDate && book.readDate !== "-"
        ? book.readDate.replaceAll(".", "-")
        : today,
    quote: book?.quote || "",
    memo: book?.memo || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("책 제목을 입력해주세요.");
      return;
    }

    if (!form.author.trim()) {
      alert("저자를 입력해주세요.");
      return;
    }

    if (!form.pages || Number(form.pages) <= 0) {
      alert("페이지 수를 올바르게 입력해주세요.");
      return;
    }

    const savedBook = {
      id: isEdit ? book.id : Date.now(),
      title: form.title.trim(),
      author: form.author.trim(),
      pages: Number(form.pages),
      status: form.status,
      rating: form.status === "read" ? Number(form.rating) : 0,
      category: form.category,
      color: form.color,
      readDate:
        form.status === "read" ? form.readDate.replaceAll("-", ".") : "-",
      price: form.price.trim() || "0",
      quote: form.quote.trim(),
      memo: form.memo.trim(),
    };

    onSubmit(savedBook);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-[#fffaf4] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-[#9a7b5f]">나만의 책장</p>
            <h2 className="mt-1 text-2xl font-bold text-[#3f2f24]">
              {isEdit ? "책 정보 수정" : "책 추가하기"}
            </h2>
            <p className="mt-2 text-sm text-[#7a6554]">
              {isEdit
                ? "기존에 등록한 책 정보를 수정해보세요."
                : "새로운 책 정보를 입력하고 나만의 책장에 추가해보세요."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e2d2] text-xl text-[#6b4f3b] hover:bg-[#e5d2bf]"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="책 제목">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="예: 달러구트 꿈 백화점"
                className="input-style"
              />
            </FormField>

            <FormField label="저자">
              <input
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="예: 이미예"
                className="input-style"
              />
            </FormField>

            <FormField label="페이지 수">
              <input
                name="pages"
                value={form.pages}
                onChange={handleChange}
                type="number"
                placeholder="예: 300"
                className="input-style"
              />
            </FormField>

            <FormField label="가격">
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="예: 13,800"
                className="input-style"
              />
            </FormField>

            <FormField label="카테고리">
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input-style"
              >
                <option>소설</option>
                <option>문학</option>
                <option>인문</option>
                <option>자기계발</option>
                <option>과학</option>
                <option>역사</option>
                <option>기타</option>
              </select>
            </FormField>

            <FormField label="읽은 날짜">
              <input
                name="readDate"
                value={form.readDate}
                onChange={handleChange}
                type="date"
                disabled={form.status === "want"}
                className="input-style disabled:opacity-50"
              />
            </FormField>

            <FormField label="상태">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: "read" }))
                  }
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    form.status === "read"
                      ? "bg-[#6b4f3b] text-white"
                      : "border border-[#d8c6b5] bg-white text-[#6b4f3b]"
                  }`}
                >
                  읽은 책
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, status: "want" }))
                  }
                  className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                    form.status === "want"
                      ? "bg-[#6b4f3b] text-white"
                      : "border border-[#d8c6b5] bg-white text-[#6b4f3b]"
                  }`}
                >
                  읽고 싶은 책
                </button>
              </div>
            </FormField>

            <FormField label="별점">
              <select
                name="rating"
                value={form.rating}
                onChange={handleChange}
                disabled={form.status === "want"}
                className="input-style disabled:opacity-50"
              >
                <option value="5">★★★★★ 5점</option>
                <option value="4">★★★★☆ 4점</option>
                <option value="3">★★★☆☆ 3점</option>
                <option value="2">★★☆☆☆ 2점</option>
                <option value="1">★☆☆☆☆ 1점</option>
              </select>
            </FormField>

            <FormField label="책 색상">
              <div className="flex items-center gap-3">
                <input
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  type="color"
                  className="h-11 w-16 cursor-pointer rounded-xl border border-[#d8c6b5] bg-white"
                />
                <input
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  className="input-style"
                />
              </div>
            </FormField>
          </div>

          <div className="mt-5 grid gap-5">
            <FormField label="기억하고 싶은 문장">
              <textarea
                name="quote"
                value={form.quote}
                onChange={handleChange}
                rows="3"
                placeholder="책에서 마음에 남은 문장을 적어보세요."
                className="input-style resize-none"
              />
            </FormField>

            <FormField label="감상">
              <textarea
                name="memo"
                value={form.memo}
                onChange={handleChange}
                rows="4"
                placeholder="이 책을 읽고 느낀 점을 자유롭게 적어보세요."
                className="input-style resize-none"
              />
            </FormField>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-[#e1d2c1] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#d8c6b5] bg-[#f1e2d2] px-5 py-2 text-sm font-semibold text-[#6b4f3b] hover:bg-[#e5d2bf]"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#6b4f3b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#563b29]"
            >
              {isEdit ? "수정 완료" : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ book, onClose, onDelete }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#fffaf4] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe8e8] text-2xl text-[#c84a4a]">
          !
        </div>

        <h2 className="text-2xl font-bold text-[#3f2f24]">
          책 기록을 삭제할까요?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#7a6554]">
          삭제한 책 기록은 복구할 수 없습니다.
          <br />
          정말로 이 책을 삭제하시겠어요?
        </p>

        <div className="my-6 rounded-2xl border border-[#e1d2c1] bg-[#f8efe5] p-5 text-left">
          <p className="font-bold text-[#3f2f24]">{book.title}</p>
          <p className="mt-1 text-sm text-[#7a6554]">{book.author}</p>
          <p className="mt-3 text-sm text-[#6b4f3b]">
            {book.status === "read" ? "읽은 책" : "읽고 싶은 책"} ·{" "}
            {book.readDate}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#f1e2d2] px-5 py-3 text-sm font-semibold text-[#6b4f3b] hover:bg-[#e5d2bf]"
          >
            취소
          </button>
          <button
            onClick={onDelete}
            className="rounded-xl bg-[#d34b4b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b93f3f]"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <p className="mb-2 text-sm font-semibold text-[#5a3f2d]">{label}</p>
      {children}
    </label>
  );
}

function BookDetailModal({ book, onClose, onEdit, onDelete }) {
  const statusText = book.status === "read" ? "읽은 책" : "읽고 싶은 책";
  const statusStyle =
    book.status === "read"
      ? "bg-[#dcebd2] text-[#3f6b3f] border-[#b8d1a8]"
      : "bg-[#f4e6d2] text-[#8a5a2e] border-[#dfc39b]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="grid max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-[#fffaf4] shadow-2xl md:grid-cols-[320px_1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center bg-gradient-to-b from-[#2b1609] to-[#6b3f20] p-10">
          <div
            className="flex h-72 w-44 flex-col items-center justify-center rounded-lg border border-white/20 p-5 text-center text-white shadow-xl"
            style={{ backgroundColor: book.color }}
          >
            <div className="mb-8 h-16 w-16 rounded-full bg-[#f3d77a]" />
            <p className="text-lg font-bold leading-relaxed">{book.title}</p>
            <p className="mt-3 text-sm text-white/80">{book.author}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[#9a7b5f]">나만의 책장</p>
              <h2 className="mt-1 text-2xl font-bold text-[#3f2f24]">
                {book.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1e2d2] text-xl text-[#6b4f3b] hover:bg-[#e5d2bf]"
            >
              ×
            </button>
          </div>

          <h3 className="mb-3 font-bold text-[#b06b2d]">도서 정보</h3>

          <div className="mb-6 rounded-2xl border border-[#e1d2c1] bg-white p-5 shadow-sm">
            <InfoRow label="저자" value={book.author} />
            <InfoRow label="읽은 날짜" value={book.readDate} />
            <InfoRow label="페이지 수" value={`${book.pages}p`} />
            <InfoRow label="가격" value={`${book.price}원`} />
            <InfoRow label="카테고리" value={book.category} />
            <InfoRow label="별점" value={<StarRating rating={book.rating} />} />
            <InfoRow
              label="상태"
              value={
                <span
                  className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusStyle}`}
                >
                  {statusText}
                </span>
              }
            />
          </div>

          <h3 className="mb-3 font-bold text-[#b06b2d]">독서 기록</h3>

          <div className="mb-4 rounded-2xl border border-[#e1d2c1] bg-white p-5 shadow-sm">
            <p className="mb-2 font-semibold text-[#6b4f3b]">
              기억하고 싶은 문장
            </p>
            <p className="border-l-4 border-[#c8843f] pl-4 text-sm text-[#4a3a2e]">
              {book.quote || "아직 기록된 문장이 없습니다."}
            </p>
          </div>

          <div className="mb-8 rounded-2xl border border-[#e1d2c1] bg-white p-5 shadow-sm">
            <p className="mb-2 font-semibold text-[#6b4f3b]">감상</p>
            <p className="text-sm leading-relaxed text-[#4a3a2e]">
              {book.memo || "아직 작성된 감상이 없습니다."}
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#e1d2c1] pt-5">
            <button
              onClick={onEdit}
              className="rounded-xl bg-[#6b4f3b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#563b29]"
            >
              수정
            </button>
            <button
              onClick={onDelete}
              className="rounded-xl border border-[#e3a4a4] bg-[#fff4f4] px-5 py-2 text-sm font-semibold text-[#c84a4a] hover:bg-[#ffe8e8]"
            >
              삭제
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-[#d8c6b5] bg-[#f1e2d2] px-5 py-2 text-sm font-semibold text-[#6b4f3b] hover:bg-[#e5d2bf]"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] border-b border-[#eee1d4] py-3 last:border-b-0">
      <p className="text-sm text-[#8a7462]">{label}</p>
      <div className="text-sm font-semibold text-[#3f2f24]">{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "read") {
    return (
      <span className="rounded-full border border-[#b8d1a8] bg-[#dcebd2] px-3 py-1 text-sm font-semibold text-[#3f6b3f]">
        읽은 책
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[#dfc39b] bg-[#f4e6d2] px-3 py-1 text-sm font-semibold text-[#8a5a2e]">
      읽고 싶은 책
    </span>
  );
}

function StarRating({ rating }) {
  if (!rating) {
    return <span className="text-sm text-[#8a7462]">미입력</span>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[#d8862f]">
        {"★".repeat(rating)}
        <span className="text-[#d8c6b5]">{"★".repeat(5 - rating)}</span>
      </span>
      <span className="text-[#6b4f3b]">{rating}.0</span>
    </div>
  );
}

export default App;