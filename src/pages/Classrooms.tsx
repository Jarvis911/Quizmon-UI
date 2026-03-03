import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import endpoints from "../api/api";
import { Users, Plus, DoorOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface Classroom {
    id: number;
    name: string;
    description: string;
    joinCode: string;
    teacher: { username: string; email: string };
    _count: { members: number; assignments: number };
}

export default function Classrooms() {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [createForm, setCreateForm] = useState({ name: "", description: "" });
    const navigate = useNavigate();

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) return;
            const res = await axios.get(endpoints.classrooms, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClassrooms(res.data);
        } catch (error) {
            console.error("Failed to fetch classrooms", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinClassroom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post(endpoints.classroom_join, { code: joinCode }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsJoinModalOpen(false);
            setJoinCode("");
            fetchClassrooms();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to join classroom");
        }
    };

    const handleCreateClassroom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            await axios.post(endpoints.classrooms, createForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsCreateModalOpen(false);
            setCreateForm({ name: "", description: "" });
            fetchClassrooms();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to create classroom");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full">Đang tải danh sách lớp học...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Lớp Học Của Tôi</h1>
                    <p className="text-gray-500 mt-2">Quản lý không gian học tập và bài tập về nhà của bạn.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsJoinModalOpen(true)}
                        className="flex items-center gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800"
                    >
                        <DoorOpen size={18} />
                        Tham gia lớp
                    </Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-md transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        Tạo Lớp Học
                    </Button>
                </div>
            </div>

            {classrooms.length === 0 ? (
                <div className="text-center bg-white/50 backdrop-blur-md p-16 rounded-3xl border border-gray-100 shadow-sm mt-8">
                    <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                        <Users size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Chưa có lớp học nào</h2>
                    <p className="text-gray-500 max-w-md mx-auto mb-8">
                        Bạn chưa tham gia hoặc tạo lớp học nào. Hãy tham gia lớp học hiện có bằng mã, hoặc tạo lớp học mới để mời học sinh.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={() => setIsJoinModalOpen(true)}>Nhập mã tham gia</Button>
                        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">Tạo lớp học</Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map(c => (
                        <div key={c.id} onClick={() => navigate(`/classrooms/${c.id}`)} className="bg-white group cursor-pointer rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-inner">
                                    {c.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="bg-gray-100 text-xs font-semibold px-3 py-1 rounded-full text-gray-500">
                                    {c._count.members} Thành viên
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                            <p className="text-gray-500 text-sm line-clamp-2 h-10 mb-4">{c.description || "Không có mô tả."}</p>

                            <div className="flex justify-between items-center border-t border-gray-50 pt-4 mt-2">
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <span className="font-semibold text-gray-700">{c.teacher?.username}</span> (Giáo viên)
                                </div>
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Join Modal */}
            <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tham gia lớp học</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleJoinClassroom} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mã lớp học</label>
                            <Input
                                type="text"
                                placeholder="Nhập mã 6 ký tự ví dụ X7A-9P2"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                className="w-full uppercase font-mono text-center tracking-widest text-lg"
                                maxLength={6}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">Hỏi giáo viên mã lớp của bạn, sau đó nhập vào đây.</p>
                        </div>
                        <DialogFooter className="sm:justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsJoinModalOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={joinCode.length < 3} className="bg-indigo-600 text-white hover:bg-indigo-700">Tham gia</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tạo lớp học mới</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateClassroom} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên lớp học</label>
                            <Input
                                type="text"
                                placeholder="ví dụ Lịch sử 101"
                                value={createForm.name}
                                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả <span className="text-gray-400 font-normal">(Tùy chọn)</span></label>
                            <Textarea
                                placeholder="Mô tả ngắn gọn về lớp học này..."
                                value={createForm.description}
                                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                className="resize-none h-24"
                            />
                        </div>
                        <DialogFooter className="sm:justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={!createForm.name} className="bg-purple-600 text-white border-transparent hover:bg-purple-700">Tạo lớp</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
