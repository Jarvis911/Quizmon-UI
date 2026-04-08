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
        <div className="space-y-6 md:space-y-8">
            <div className="relative">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Kiểm duyệt Quiz</h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">Quản lý và loại bỏ các quiz không phù hợp từ cộng đồng.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 bg-card/40 dark:bg-slate-900/40 p-4 md:p-6 rounded-3xl md:rounded-4xl border border-white/10 backdrop-blur-md shadow-xl">
                <div className="flex-1">
                    <input 
                        type="text" 
                        placeholder="Tìm tiêu đề hoặc người tạo..." 
                        className="w-full h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        className="w-full h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none"
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

            <div className="rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-card/30 dark:bg-slate-900/30 overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[700px] md:min-w-0">
                        <thead className="bg-white/10 dark:bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Tiêu đề</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Người tạo</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Ngày tạo</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {quizzes.map((quiz) => (
                                <tr key={quiz.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-slate-500">{quiz.id}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-black text-slate-900 dark:text-white max-w-[200px] md:max-w-none truncate">{quiz.title}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-slate-600 dark:text-slate-300">{quiz.creator?.username || quiz.creatorId}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-slate-500">{new Date(quiz.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 text-right">
                                        <button 
                                            onClick={() => handleDelete(quiz.id)}
                                            className="text-rose-500 hover:text-rose-700 p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-rose-500/10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 whitespace-nowrap"
                                        >
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {quizzes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 md:px-8 py-10 md:py-20 text-center text-slate-500 font-bold">Không tìm thấy quiz nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
