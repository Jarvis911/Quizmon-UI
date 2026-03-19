import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Trash2 } from "lucide-react";

export default function AdminQuizzes() {
    const { token } = useAuth();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadQuizzes = () => {
        axios.get("http://localhost:5000/admin/quizzes", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setQuizzes(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadQuizzes();
    }, [token]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this quiz?")) return;
        try {
            await axios.delete(`http://localhost:5000/admin/quizzes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadQuizzes();
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
