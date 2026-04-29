import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Book, BookBorrowing } from "../../types";
import { BookOpen, Search, RotateCcw, Calendar, AlertCircle, CheckCircle, Library } from "lucide-react";
import toast from "react-hot-toast";

export default function StudentLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<BookBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "mybooks">("catalog");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, borrowingsRes] = await Promise.all([
        api.get("/student/library/books"),
        api.get("/student/library/borrowings"),
      ]);
      setBooks(booksRes.data.data || []);
      setBorrowings(borrowingsRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(
    (b) =>
      (b.title?.toLowerCase().includes(search.toLowerCase()) ||
        b.author?.toLowerCase().includes(search.toLowerCase()) ||
        b.isbn?.toLowerCase().includes(search.toLowerCase())) &&
      (selectedCategory === "" || b.category === selectedCategory)
  );

  const activeBorrowings = borrowings.filter((b) => b.status !== 'Returned');
  const historyBorrowings = borrowings.filter((b) => b.status === 'Returned');

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const categories = ["Academic", "Reference", "Fiction", "Non-Fiction", "Journal", "Magazine"];

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Library"
        subtitle="Browse books and manage your borrowings"
      />

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === "catalog" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Library className="w-4 h-4 inline mr-2" />
          Book Catalog
        </button>
        <button
          onClick={() => setActiveTab("mybooks")}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === "mybooks" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          My Books ({activeBorrowings.length})
        </button>
      </div>

      {/* Book Catalog */}
      {activeTab === "catalog" && (
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <div key={book.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-gray-500">{book.author}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{book.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ISBN</span>
                    <span className="text-gray-700">{book.isbn || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Publisher</span>
                    <span className="text-gray-700">{book.publisher || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shelf</span>
                    <span className="text-gray-700">{book.shelf_number || "N/A"}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${book.available_copies > 0 ? "text-green-600" : "text-red-600"}`}>
                      {book.available_copies > 0 ? `${book.available_copies} Available` : "Out of Stock"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {book.available_copies}/{book.total_copies} copies
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No books found</p>
            </div>
          )}
        </div>
      )}

      {/* My Books */}
      {activeTab === "mybooks" && (
        <div className="space-y-6">
          {/* Active Borrowings */}
          <div className="card">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary-600" />
              Currently Borrowed
            </h3>
            {activeBorrowings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                <p>You have no active borrowings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBorrowings.map((borrowing) => (
                  <div
                    key={borrowing.id}
                    className={`p-4 rounded-xl border ${borrowing.due_date && isOverdue(borrowing.due_date) ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{borrowing.book?.title}</h4>
                          <p className="text-sm text-gray-500">{borrowing.book?.author}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              Issued: {borrowing.issue_date ? new Date(borrowing.issue_date).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${borrowing.due_date && isOverdue(borrowing.due_date) ? "text-red-600" : "text-green-600"}`}>
                          {borrowing.due_date && isOverdue(borrowing.due_date) ? "Overdue" : "Due Date"}
                        </p>
                        <p className={`text-lg font-bold ${borrowing.due_date && isOverdue(borrowing.due_date) ? "text-red-600" : "text-gray-900"}`}>
                          {borrowing.due_date ? new Date(borrowing.due_date).toLocaleDateString() : 'N/A'}
                        </p>
                        {borrowing.due_date && isOverdue(borrowing.due_date) && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>Please return immediately</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Borrowing History */}
          {historyBorrowings.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Borrowing History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Book</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Issued Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Returned Date</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyBorrowings.map((borrowing) => (
                      <tr key={borrowing.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{borrowing.book?.title}</div>
                          <div className="text-xs text-gray-500">{borrowing.book?.author}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {borrowing.issue_date ? new Date(borrowing.issue_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {borrowing.return_date ? new Date(borrowing.return_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            Returned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
