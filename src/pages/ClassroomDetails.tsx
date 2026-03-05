import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import endpoints from "../api/api";
import { ArrowLeft, Users, FileText, Settings, Copy, Check } from "lucide-react";

interface User {
    id: number;
    username: string;
    email: string;
}

interface ClassroomMember {
    id: number;
    role: string;
    joinDate: string;
    user: User;
}

interface ClassroomAssignment {
    id: number;
    mode: string;
    deadline?: string;
    quiz: {
        id: number;
        title: string;
    };
}

interface ClassroomDetails {
    id: number;
    name: string;
    description: string;
    joinCode: string;
    teacher: User;
    members: ClassroomMember[];
    assignments: ClassroomAssignment[];
}

export default function ClassroomDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Check if the current user is the teacher
    const currentUserId = (() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch { return null; }
    })();

    useEffect(() => {
        fetchClassroom();
    }, [id]);

    const fetchClassroom = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(endpoints.classroom(Number(id)), {
                headers: { Authorization: token }
            });
            setClassroom(res.data);
        } catch (error: any) {
            console.error("Failed to fetch classroom", error);
            alert("Lỗi tải thông tin lớp học");
            navigate('/classrooms');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (classroom?.joinCode) {
            navigator.clipboard.writeText(classroom.joinCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Đang tải thông tin...</div>;
    }

    if (!classroom) return null;

    const isTeacher = currentUserId === classroom.teacher.id;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header Section */}
            <button
                onClick={() => navigate('/classrooms')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium mb-6 transition-colors"
            >
                <ArrowLeft size={18} /> Quay lại danh sách lớp
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white relative">
                    <h1 className="text-4xl font-bold mb-2">{classroom.name}</h1>
                    <p className="text-indigo-100 max-w-2xl">{classroom.description || "Không có mô tả."}</p>

                    {/* Floating teacher badge */}
                    <div className="absolute top-8 right-8 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                        <span>Giáo viên: {classroom.teacher.username}</span>
                    </div>
                </div>

                <div className="px-8 py-4 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                    <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 font-semibold border-r border-gray-200">
                            Mã Lớp Học
                        </div>
                        <div className="px-6 py-2 font-mono font-bold tracking-widest text-indigo-700 bg-indigo-50">
                            {classroom.joinCode}
                        </div>
                        <button
                            onClick={handleCopyCode}
                            className={`px-4 py-2 flex items-center gap-2 transition-colors ${copied ? "bg-green-100 text-green-700" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-indigo-600"}`}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? "Đã sao chép!" : "Sao chép"}
                        </button>
                    </div>

                    {isTeacher && (
                        <button className="text-gray-500 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                            <Settings size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Assignments */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Bài tập</h2>
                            </div>
                            {isTeacher && (
                                <button onClick={() => navigate('/')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                                    + Giao Bài
                                </button>
                            )}
                        </div>

                        {classroom.assignments.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500">Chưa có bài tập nào được giao.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {classroom.assignments.map(assignment => (
                                    <div key={assignment.id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow bg-white">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-gray-800 text-lg">{assignment.quiz.title}</h3>
                                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
                                                    {assignment.mode}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 font-medium">
                                                Hạn chót: {assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'Không có thời hạn'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            {isTeacher ? (
                                                <button
                                                    onClick={() => window.location.href = `${endpoints.report_excel(assignment.id)}`}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-green-50 text-green-700 font-semibold rounded-lg hover:bg-green-100 transition-colors text-sm text-center"
                                                >
                                                    Báo cáo Excel
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/homework/${assignment.id}/start`)}
                                                    className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm text-center"
                                                >
                                                    Làm Bài
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: People */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                <Users size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Thành viên <span className="text-gray-400 text-sm font-normal">({classroom.members.length})</span></h2>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {classroom.members.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-600">
                                            {member.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{member.user.username}</p>
                                            <p className="text-xs text-gray-500">{member.user.email}</p>
                                        </div>
                                    </div>
                                    {member.role === 'TEACHER' && (
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">GIÁO VIÊN</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
