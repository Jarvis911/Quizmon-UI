import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { useModal } from "@/context/ModalContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import endpoints from "../api/api";
import { Users, Plus, DoorOpen, ArrowRight, HelpCircle, Info, CheckCircle2, GraduationCap, UserCircle } from "lucide-react";
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
    teacher: { id: number; username: string; email: string };
    _count: { members: number; assignments: number };
}

export default function Classrooms() {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const { showAlert } = useModal();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [showGuide, setShowGuide] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [createForm, setCreateForm] = useState({ name: "", description: "" });
    const navigate = useNavigate();

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(endpoints.classrooms);
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
            await apiClient.post(endpoints.classroom_join, { code: joinCode });
            setIsJoinModalOpen(false);
            setJoinCode("");
            fetchClassrooms();
        } catch (error: any) {
            showAlert({
                title: "Thất bại",
                message: error.response?.data?.message || "Không thể tham gia lớp học",
                type: "error"
            });
        }
    };

    const handleCreateClassroom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post(endpoints.classrooms, createForm);
            setIsCreateModalOpen(false);
            setCreateForm({ name: "", description: "" });
            fetchClassrooms();
        } catch (error: any) {
            showAlert({
                title: "Thất bại",
                message: error.response?.data?.message || "Không thể tạo lớp học",
                type: "error"
            });
        }
    };
    const filteredClassrooms = classrooms.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );


    if (loading) {
        return <div className="flex justify-center items-center h-full">Đang tải danh sách lớp học...</div>;
    }

    return (
        <div className="min-h-[calc(100vh-64px)] p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-2 md:gap-3">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/8388/8388104.png"
                            alt="Classrooms"
                            className="w-8 h-8 md:w-10 md:h-10 object-contain"
                        />
                        Lớp học của tôi
                    </h1>
                    <p className="text-muted-foreground font-bold mt-1 md:mt-2 opacity-80 uppercase tracking-widest text-[10px] md:text-xs">
                        Quản lý không gian học tập và bài tập về nhà của bạn.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 w-full md:w-auto">
                    <Button
                        onClick={() => setShowGuide(!showGuide)}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 border-2 border-primary/30 font-black h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl transition-all text-xs md:text-sm ${showGuide ? 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90' : 'text-primary bg-primary/10 hover:bg-primary/20 border-primary-20'}`}
                    >
                        <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
                        {showGuide ? 'Đóng hướng dẫn' : 'Cách sử dụng'}
                    </Button>
                    <div className="flex flex-row gap-2 md:gap-4 flex-1">
                        <Button
                            variant="outline"
                            onClick={() => setIsJoinModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 font-black h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl transition-all text-xs md:text-sm"
                        >
                            <DoorOpen className="w-4 h-4 md:w-5 md:h-5" />
                            Tham gia
                        </Button>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-primary text-primary-foreground hover:scale-105 shadow-lg shadow-primary/20 transition-all active:scale-95 font-black h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl text-xs md:text-sm"
                        >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            Tạo lớp
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <img
                    src="https://cdn-icons-png.flaticon.com/512/11552/11552108.png"
                    alt="Search"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 object-contain opacity-50 group-focus-within:opacity-100 transition-opacity"
                />
                <Input
                    placeholder="Tìm kiếm lớp học của bạn..."
                    className="pl-10 md:pl-12 h-12 md:h-14 bg-card/50 backdrop-blur-md border-2 border-white/5 rounded-xl md:rounded-2xl text-sm md:text-lg font-medium shadow-inner focus:ring-primary/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Quick Guide Section */}
            {showGuide && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Teacher Guide */}
                    <div className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group">
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-primary">Dành cho Giáo viên</h3>
                        </div>
                        <ul className="space-y-4 md:space-y-6 relative z-10">
                            {[
                                { title: "Tạo không gian", desc: "Tạo lớp học mới và mô tả mục tiêu học tập của bạn." },
                                { title: "Mời học sinh", desc: "Chia sẻ mã lớp học (6 ký tự) để học sinh có thể tham gia." },
                                { title: "Giao bài tập", desc: "Chọn bài trắc nghiệm từ thư viện và giao trực tiếp vào lớp." }
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3 md:gap-4 items-start">
                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 mt-1.5 md:mt-1">{i + 1}</div>
                                    <div>
                                        <h4 className="font-black text-sm md:text-base text-foreground mb-1">{step.title}</h4>
                                        <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">{step.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Student Guide */}
                    <div className="bg-slate-500/5 dark:bg-slate-500/10 border-2 border-slate-500/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden group">
                        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-500 text-white flex items-center justify-center shadow-lg shadow-slate-500/20">
                                <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-slate-500">Dành cho Học sinh</h3>
                        </div>
                        <ul className="space-y-4 md:space-y-6 relative z-10">
                            {[
                                { title: "Tham gia lớp", desc: "Nhập mã tham gia được giáo viên cung cấp để vào lớp." },
                                { title: "Xem bài tập", desc: "Khi giáo viên giao bài, bạn sẽ thấy bài tập mới hiện lên." },
                                { title: "Hoàn thành", desc: "Làm bài trắc nghiệm và nhận ngay kết quả thống kê." }
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3 md:gap-4 items-start">
                                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-slate-500/20 text-slate-500 flex items-center justify-center text-[10px] md:text-xs font-black shrink-0 mt-1.5 md:mt-1">{i + 1}</div>
                                    <div>
                                        <h4 className="font-black text-sm md:text-base text-foreground mb-1">{step.title}</h4>
                                        <p className="text-xs md:text-sm font-medium text-muted-foreground leading-relaxed">{step.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {classrooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 md:py-20 px-4 text-center space-y-4 bg-card/20 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] border-4 border-dashed border-white/10">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/8388/8388104.png"
                        alt="Classrooms"
                        className="w-10 h-10 object-contain opacity-20"
                    />
                    <h2 className="text-xl md:text-2xl font-black text-foreground/50">{searchQuery ? "Không tìm thấy lớp học nào" : "Chưa có lớp học nào"}</h2>
                    <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto font-medium">
                        {searchQuery ? "Hãy thử tìm kiếm với từ khóa khác." : "Bạn chưa tham gia hoặc tạo lớp học nào. Hãy tham gia lớp học hiện có bằng mã, hoặc tạo lớp học mới để mời học sinh."}
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-4 mt-4 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => setIsJoinModalOpen(true)} className="rounded-xl font-bold w-full sm:w-auto text-xs md:text-sm h-10 md:h-10">Nhập mã tham gia</Button>
                        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold w-full sm:w-auto text-xs md:text-sm h-10 md:h-10">Tạo lớp học</Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4 md:mt-8">
                    {filteredClassrooms.map(c => {
                        const isOwner = user?.id === c.teacher?.id;
                        return (
                            <div
                                key={c.id}
                                onClick={() => navigate(`/classrooms/${c.joinCode}`)}
                                className="bg-card/40 backdrop-blur-md group cursor-pointer rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-lg border-2 border-white/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                            >
                                <div className="flex justify-between items-start mb-4 md:mb-6">
                                    <div className="bg-primary text-primary-foreground w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg transform group-hover:rotate-3 transition-transform">
                                        {c.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="bg-foreground/5 text-[9px] md:text-[10px] font-black px-3 py-1.5 md:px-4 md:py-2 rounded-full text-muted-foreground uppercase tracking-widest border border-foreground/5">
                                            {c._count.members} Thành viên
                                        </div>
                                        {!isOwner && (
                                            <div className="bg-indigo-500/10 text-indigo-500 text-[8px] md:text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-indigo-500/20 shadow-xs">
                                                Học sinh
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-lg md:text-2xl font-black text-foreground mb-1 md:mb-2 group-hover:text-primary transition-colors line-clamp-1">{c.name}</h3>
                                <p className="text-muted-foreground font-medium text-xs md:text-sm line-clamp-2 h-8 md:h-10 mb-4 md:mb-6 opacity-70 leading-relaxed">{c.description || "Không có mô tả."}</p>

                                <div className="flex justify-between items-center border-t border-white/5 pt-4 md:pt-6 mt-2 md:mt-4">
                                    <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-1">
                                        <span className="font-black text-foreground">{c.teacher?.username}</span>
                                        <span className="opacity-60 text-[9px] md:text-[10px] uppercase font-black ml-1">(GV)</span>
                                    </div>
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
