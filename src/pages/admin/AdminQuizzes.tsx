import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Trash2 } from "lucide-react";

export default function AdminQuizzes() {
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");

    const loadData = async () => {
        try {
            const [quizzesRes, categoriesRes] = await Promise.all([
                apiClient.get("/admin/quizzes", { params: { search, categoryId } }),
                apiClient.get("/category")
            ]);
            setQuizzes(quizzesRes.data);
            setCategories(categoriesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            loadData();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [token, search, categoryId]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this quiz?")) return;
        try {
            await apiClient.delete(`/admin/quizzes/${id}`);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Failed to delete quiz");
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Quiz Moderation</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage and remove inappropriate quizzes.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Search by title or creator..." 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">ID</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Title</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Creator</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Created At</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {quizzes.map((quiz) => (
                            <tr key={quiz.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4">{quiz.id}</td>
                                <td className="px-6 py-4 font-medium">{quiz.title}</td>
                                <td className="px-6 py-4">{quiz.creator?.username || quiz.creatorId}</td>
                                <td className="px-6 py-4">{new Date(quiz.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(quiz.id)}
                                        className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {quizzes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No quizzes found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
