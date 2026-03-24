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
        if (!confirm("Bạn có chắc chắn muốn xoá quiz này không?")) return;
        try {
            await apiClient.delete(`/admin/quizzes/${id}`);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Lỗi khi xoá quiz");
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Kiểm duyệt Quiz</h1>
                <p className="text-slate-500 dark:text-slate-400">Quản lý và loại bỏ các quiz không phù hợp.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Tìm theo tiêu đề hoặc người tạo..." 
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
                        <option value="">Tất cả danh mục</option>
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
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Tiêu đề</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Người tạo</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Ngày tạo</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Hành động</th>
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
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Không tìm thấy quiz nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
