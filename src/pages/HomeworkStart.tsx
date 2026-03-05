import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import endpoints from "../api/api";
import { Clock, PlayCircle, AlertCircle, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function HomeworkStart() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    const [homework, setHomework] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHomeworkInfo = async () => {
            try {
                if (!token) return;
                const res = await axios.get(endpoints.match(Number(id)), {
                    headers: { Authorization: token }
                });

                if (res.data.mode !== 'HOMEWORK') {
                    setError("This match is not available for homework mode.");
                    return;
                }

                setHomework(res.data);
            } catch (err: any) {
                setError(err.response?.data?.message || "Could not load homework assignment");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeworkInfo();
    }, [id, token]);

    const handleStartHomework = async () => {
        try {
            await axios.post(endpoints.homework_start(Number(id)), {}, {
                headers: { Authorization: token }
            });
            // Navigate directly to MatchPlay
            navigate(`/match/${id}/play`);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to start homework");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !homework) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Unavailable</h2>
                    <p className="text-gray-600 mb-8">{error || "Assignment not found."}</p>
                    <button
                        onClick={() => navigate('/classrooms')}
                        className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors w-full"
                    >
                        Return to Classrooms
                    </button>
                </div>
            </div>
        );
    }

    const quiz = homework.quiz;
    const deadline = homework.deadline ? new Date(homework.deadline) : null;
    const isPastDeadline = deadline && deadline < new Date();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full">
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100">

                    {/* Header Image Area */}
                    <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 p-8 flex flex-col justify-end">
                        {quiz.image && (
                            <img src={quiz.image} alt="Quiz Cover" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
                        )}
                        <div className="relative z-10 text-white">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-semibold mb-3">
                                <BookOpen size={16} /> Homework Assignment
                            </span>
                            <h1 className="text-3xl font-extrabold drop-shadow-md">{quiz.title}</h1>
                        </div>
                    </div>

                    <div className="p-8">
                        <p className="text-gray-600 text-lg mb-8">{quiz.description || "No description provided for this quiz."}</p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <BookOpen size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Questions</p>
                                        <p className="text-xs text-gray-500">{quiz.questions?.length || 0} questions total</p>
                                    </div>
                                </div>
                                <span className="font-bold text-lg text-indigo-700">{quiz.questions?.length || 0}</span>
                            </div>

                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isPastDeadline ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPastDeadline ? 'bg-red-200 text-red-700' : 'bg-orange-200 text-orange-700'}`}>
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${isPastDeadline ? 'text-red-900' : 'text-orange-900'}`}>Deadline</p>
                                        <p className={`text-xs ${isPastDeadline ? 'text-red-700' : 'text-orange-700'}`}>
                                            {isPastDeadline ? 'Assignment expired' : 'Complete before time runs out'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${isPastDeadline ? 'text-red-700' : 'text-orange-700 text-right'}`}>
                                    {deadline ? deadline.toLocaleString() : "No time limit"}
                                </span>
                            </div>

                            {homework.strictMode && (
                                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-purple-900">Strict Mode Enabled</p>
                                            <p className="text-xs text-purple-700">Do not leave the tab while playing</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleStartHomework}
                            disabled={!!isPastDeadline}
                            className="w-full h-16 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xl rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                        >
                            <PlayCircle size={24} />
                            {isPastDeadline ? "Dealine Passed" : "Start Assignment"}
                        </button>

                        <div className="mt-4 text-center">
                            <button
                                onClick={() => navigate('/classrooms')}
                                className="text-gray-500 font-medium hover:text-indigo-600 transition-colors"
                            >
                                Back to Classrooms
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
