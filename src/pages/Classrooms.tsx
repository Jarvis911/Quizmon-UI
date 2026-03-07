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
                headers: { Authorization: token }
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
                headers: { Authorization: token }
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
                headers: { Authorization: token }
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card/80 backdrop-blur-xl p-8 rounded-4xl shadow-xl border border-white/10 mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Lớp Học Của Tôi</h1>
                    <p className="text-muted-foreground font-bold mt-2 opacity-80 uppercase tracking-widest text-xs">Quản lý không gian học tập và bài tập về nhà của bạn.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsJoinModalOpen(true)}
                        className="flex items-center gap-2 border-indigo-500/30 text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 font-black h-12 px-6 rounded-2xl transition-all"
                    >
                        <DoorOpen size={20} />
                        THAM GIA LỚP
                    </Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground hover:scale-105 shadow-lg shadow-primary/20 transition-all active:scale-95 font-black h-12 px-6 rounded-2xl"
                    >
                        <Plus size={20} />
                        TẠO LỚP HỌC
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
                        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">Tạo lớp học</Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {classrooms.map(c => (
                        <div key={c.id} onClick={() => navigate(`/classrooms/${c.id}`)} className="bg-card/60 backdrop-blur-xl group cursor-pointer rounded-3xl p-8 shadow-lg border border-white/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-primary text-primary-foreground w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transform group-hover:rotate-3 transition-transform">
                                    {c.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="bg-foreground/5 text-xs font-black px-4 py-2 rounded-full text-muted-foreground uppercase tracking-widest border border-foreground/5">
                                    {c._count.members} Thành viên
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">{c.name}</h3>
                            <p className="text-muted-foreground font-medium text-sm line-clamp-2 h-10 mb-6 opacity-70">{c.description || "Không có mô tả."}</p>

                            <div className="flex justify-between items-center border-t border-foreground/5 pt-6 mt-4">
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span className="font-black text-foreground">{c.teacher?.username}</span>
                                    <span className="opacity-60 text-xs uppercase font-black ml-1">(Giáo viên)</span>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                                    <ArrowRight size={20} />
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
                    <form onSubmit={handleJoinClassroom} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-muted-foreground mb-3 uppercase tracking-widest">Mã lớp học</label>
                            <Input
                                type="text"
                                placeholder="X7A-9P2"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                className="w-full h-16 uppercase font-black text-center tracking-[0.5em] text-3xl bg-foreground/5 border-2 border-foreground/10 focus:border-primary rounded-2xl"
                                maxLength={6}
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-4 text-center font-bold opacity-60 italic">Hỏi giáo viên mã lớp của bạn, sau đó nhập vào đây.</p>
                        </div>
                        <DialogFooter className="sm:justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsJoinModalOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={joinCode.length < 3} className="bg-primary text-primary-foreground hover:bg-primary/90">Tham gia</Button>
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
                    <form onSubmit={handleCreateClassroom} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black text-muted-foreground mb-3 uppercase tracking-widest">Tên lớp học</label>
                            <Input
                                type="text"
                                placeholder="ví dụ Lịch sử 101"
                                value={createForm.name}
                                onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                className="h-14 bg-foreground/5 border-2 border-foreground/10 focus:border-primary rounded-2xl font-bold px-6"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-muted-foreground mb-3 uppercase tracking-widest">Mô tả <span className="text-muted-foreground/40 font-normal">(Tùy chọn)</span></label>
                            <Textarea
                                placeholder="Mô tả ngắn gọn về lớp học này..."
                                value={createForm.description}
                                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                                className="resize-none h-32 bg-foreground/5 border-2 border-foreground/10 focus:border-primary rounded-2xl font-medium p-6"
                            />
                        </div>
                        <DialogFooter className="sm:justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
                            <Button type="submit" disabled={!createForm.name} className="bg-primary text-primary-foreground border-transparent hover:bg-primary/90">Tạo lớp</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
