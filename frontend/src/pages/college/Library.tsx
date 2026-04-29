import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Book, BookBorrowing, Student } from "../../types";
import { BookOpen, Plus, Search, RotateCcw, UserCheck, AlertCircle, Library as LibraryIcon, BookCheck } from "lucide-react";
import toast from "react-hot-toast";

interface DashboardStats {
  total_books: number;
  available_books: number;
  borrowed_books: number;
  overdue_books: number;
  total_students: number;
  recent_borrowings: BookBorrowing[];
}

export default function CollegeLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<BookBorrowing[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"books" | "borrowings" | "issue">("books");
  const [showBookModal, setShowBookModal] = useState(false);

  const [bookForm, setBookForm] = useState({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    edition: "",
    category: "",
    subject: "",
    shelf_location: "",
    total_copies: 1,
    price: 0,
    year_of_publication: new Date().getFullYear(),
    description: "",
  });

  const [issueForm, setIssueForm] = useState({
    book_id: "",
    student_id: "",
    due_days: 14,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, borrowingsRes, studentsRes, statsRes] = await Promise.all([
        api.get("/college/library/books"),
        api.get("/college/library/borrowings"),
        api.get("/college/students"),
        api.get("/college/library/dashboard"),
      ]);
      setBooks(booksRes.data.data || []);
      setBorrowings(borrowingsRes.data.data || []);
      setStudents(studentsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/library/books", bookForm);
      toast.success("Book added successfully");
      setShowBookModal(false);
      resetBookForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add book");
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/college/library/issue", {
        book_id: parseInt(issueForm.book_id),
        student_id: parseInt(issueForm.student_id),
        due_days: issueForm.due_days,
      });
      toast.success("Book issued successfully");
      resetIssueForm();
      fetchData();
      setActiveTab("borrowings");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to issue book");
    }
  };

  const handleReturnBook = async (id: number) => {
    try {
      await api.put(`/college/library/return/${id}`);
      toast.success("Book returned successfully");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to return book");
    }
  };

  const resetBookForm = () => {
    setBookForm({
      isbn: "",
      title: "",
      author: "",
      publisher: "",
      edition: "",
      category: "",
      subject: "",
      shelf_location: "",
      total_copies: 1,
      price: 0,
      year_of_publication: new Date().getFullYear(),
      description: "",
    });
  };

  const resetIssueForm = () => {
    setIssueForm({
      book_id: "",
      student_id: "",
      due_days: 14,
    });
  };

  const filteredBooks = books.filter(
    (b) =>
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ["Academic", "Reference", "Fiction", "Non-Fiction", "Journal", "Magazine"];

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Library Management"
        subtitle="Manage books, borrowings, and returns"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LibraryIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Books</p>
                <p className="text-xl font-bold">{stats.total_books}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-xl font-bold">{stats.available_books}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Borrowed</p>
                <p className="text-xl font-bold">{stats.borrowed_books}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-xl font-bold">{stats.overdue_books}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("books")}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === "books" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <LibraryIcon className="w-4 h-4 inline mr-2" />
          Books Catalog
        </button>
        <button
          onClick={() => setActiveTab("borrowings")}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === "borrowings" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Borrowings
        </button>
        <button
          onClick={() => setActiveTab("issue")}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === "issue" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-2" />
          Issue Book
        </button>
      </div>

      {/* Books Tab */}
      {activeTab === "books" && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search books by title, author, or ISBN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
            <button
              onClick={() => setShowBookModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Book</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Author</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Available</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{book.title}</div>
                      <div className="text-xs text-gray-500">ISBN: {book.isbn}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{book.author}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${book.available_copies > 0 ? "text-green-600" : "text-red-600"}`}>
                        {book.available_copies} / {book.total_copies}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        book.available_copies > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {book.available_copies > 0 ? "Available" : "Out of Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No books found</p>
            </div>
          )}
        </div>
      )}

      {/* Borrowings Tab */}
      {activeTab === "borrowings" && (
        <div className="card">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Active Borrowings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Book</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Issue Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Due Date</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {borrowings.filter(b => b.status !== 'Returned').map((borrowing) => (
                  <tr key={borrowing.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{borrowing.book?.title}</div>
                      <div className="text-xs text-gray-500">{borrowing.book?.author}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {borrowing.student ? `${borrowing.student.first_name} ${borrowing.student.last_name}` : "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {borrowing.issue_date ? new Date(borrowing.issue_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${borrowing.due_date && new Date(borrowing.due_date) < new Date() ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {borrowing.due_date ? new Date(borrowing.due_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        borrowing.status === "Issued" ? "bg-blue-100 text-blue-700" :
                        borrowing.status === "Overdue" ? "bg-red-100 text-red-700" :
                        borrowing.status === "Lost" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {borrowing.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleReturnBook(borrowing.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Return Book"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {borrowings.filter(b => b.status !== 'Returned').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No active borrowings</p>
            </div>
          )}
        </div>
      )}

      {/* Issue Book Tab */}
      {activeTab === "issue" && (
        <div className="card max-w-lg mx-auto">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Issue Book to Student</h3>
          <form onSubmit={handleIssueBook} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Book</label>
              <select
                value={issueForm.book_id}
                onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}
                className="input-field w-full"
                required
              >
                <option value="">Choose a book</option>
                {books.filter(b => b.available_copies > 0).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} by {b.author} ({b.available_copies} available)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
              <select
                value={issueForm.student_id}
                onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })}
                className="input-field w-full"
                required
              >
                <option value="">Choose a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.enrollment_number || "No ID"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Days</label>
              <select
                value={issueForm.due_days}
                onChange={(e) => setIssueForm({ ...issueForm, due_days: parseInt(e.target.value) })}
                className="input-field w-full"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={21}>21 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">
              <UserCheck className="w-4 h-4 inline mr-2" />
              Issue Book
            </button>
          </form>
        </div>
      )}

      {/* Add Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add New Book</h2>
            </div>
            <form onSubmit={handleAddBook} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                  <input
                    type="text"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                    <input
                      type="text"
                      value={bookForm.publisher}
                      onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Edition</label>
                    <input
                      type="text"
                      value={bookForm.edition}
                      onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={bookForm.category}
                      onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="">Select</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={bookForm.subject}
                      onChange={(e) => setBookForm({ ...bookForm, subject: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Location</label>
                    <input
                      type="text"
                      value={bookForm.shelf_location}
                      onChange={(e) => setBookForm({ ...bookForm, shelf_location: e.target.value })}
                      className="input-field w-full"
                      placeholder="e.g., A-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Copies</label>
                    <input
                      type="number"
                      value={bookForm.total_copies}
                      onChange={(e) => setBookForm({ ...bookForm, total_copies: parseInt(e.target.value) })}
                      className="input-field w-full"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
