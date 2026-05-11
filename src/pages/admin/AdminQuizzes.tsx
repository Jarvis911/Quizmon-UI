import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Trash2, Search } from "lucide-react";
import {
    AdminLoading,
    AdminPageHeader,
    adminFieldClass,
    adminFilterPanelClass,
    adminTableShellClass,
} from "@/components/admin/adminQuizmonChrome";

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

    if (loading) return <AdminLoading />;

    return (
        <div className="space-y-6 md:space-y-8">
            <AdminPageHeader
              title="Kiểm duyệt Quiz"
              subtitle="Lọc, xem và xóa các bài quiz không phù hợp."
            />

            {/* Filters */}
            <div className={adminFilterPanelClass}>
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                    <input 
                        type="text" 
                        placeholder="Tìm tiêu đề hoặc người tạo…" 
                        className={`${adminFieldClass} pl-11`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        className={`${adminFieldClass} appearance-none`}
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

            <div className={adminTableShellClass}>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[700px] md:min-w-0">
                        <thead className="border-b border-primary/10 bg-primary/10 dark:bg-primary/15">
                            <tr>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">ID</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Tiêu đề</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Người tạo</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Ngày tạo</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-right font-black uppercase tracking-wider text-muted-foreground">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {quizzes.map((quiz) => (
                                <tr key={quiz.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-muted-foreground">{quiz.id}</td>
                                    <td className="max-w-[200px] truncate px-4 py-4 font-black text-foreground md:max-w-none md:px-8 md:py-5">{quiz.title}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-foreground/85">{quiz.creator?.username || quiz.creatorId}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-medium text-muted-foreground">{new Date(quiz.createdAt).toLocaleDateString()}</td>
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
                                    <td colSpan={5} className="px-4 md:px-8 py-10 md:py-20 text-center font-bold text-muted-foreground">Không tìm thấy quiz nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
