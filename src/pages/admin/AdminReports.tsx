import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Check, X } from "lucide-react";

export default function AdminReports() {
    const { token } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [type, setType] = useState("");

    const loadReports = () => {
        apiClient.get("/admin/reports", { params: { status, reportType: type } })
        .then(res => setReports(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReports();
    }, [token, status, type]);

    const handleResolve = async (id: number, status: 'RESOLVED' | 'DISMISSED') => {
        try {
            await apiClient.put(`/admin/reports/${id}/resolve`, { status });
            loadReports();
        } catch (e) {
            console.error(e);
            alert("Lỗi khi cập nhật báo cáo");
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;

    return (
        <div className="space-y-8">
            <div className="relative">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Báo cáo kiểm duyệt</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Xử lý các khiếu nại của người dùng về nội dung và hành vi trên hệ thống.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-card/40 dark:bg-slate-900/40 p-6 rounded-4xl border border-white/10 backdrop-blur-md shadow-xl">
                <div className="flex-1">
                    <select 
                        className="w-full h-12 px-6 rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="RESOLVED">Đã giải quyết</option>
                        <option value="DISMISSED">Đã bỏ qua</option>
                    </select>
                </div>
                <div className="flex-1">
                    <select 
                        className="w-full h-12 px-6 rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">Tất cả loại báo cáo</option>
                        <option value="QUIZ_CONTENT">Nội dung Quiz</option>
                        <option value="USER_BEHAVIOR">Hành vi người dùng</option>
                        <option value="SYSTEM_BUG">Lỗi hệ thống</option>
                    </select>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-card/30 dark:bg-slate-900/30 overflow-hidden backdrop-blur-md shadow-2xl">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-white/10 dark:bg-white/5 border-b border-white/5">
                        <tr>
                            <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
                            <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Loại</th>
                            <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">ID Mục tiêu</th>
                            <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Lý do</th>
                            <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Trạng thái</th>
                            <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                                <td className="px-8 py-5 font-bold text-slate-500">{report.id}</td>
                                <td className="px-8 py-5">
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] rounded-full font-black uppercase tracking-wider border border-primary/10">
                                        {report.reportType === 'QUIZ_CONTENT' ? 'QUIZ' : report.reportType === 'USER_BEHAVIOR' ? 'USER' : 'SYSTEM'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-primary dark:text-blue-400 font-mono font-bold tracking-tighter">{report.targetId}</td>
                                <td className="px-8 py-5 max-w-xs truncate font-medium text-slate-600 dark:text-slate-300">{report.reason}</td>
                                <td className="px-8 py-5">
                                    <span className={`px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm ${
                                        report.status === 'PENDING' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/20' :
                                        report.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' :
                                        'bg-slate-500/20 text-slate-500 border border-slate-500/20'
                                    }`}>
                                        {report.status === 'PENDING' ? 'CHỜ XỬ LÝ' : report.status === 'RESOLVED' ? 'ĐÃ GIẢI QUYẾT' : 'ĐÃ BỎ QUA'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right space-x-2">
                                    {report.status === 'PENDING' && (
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleResolve(report.id, 'RESOLVED')}
                                                title="Đánh dấu đã giải quyết"
                                                className="text-emerald-500 hover:text-emerald-700 p-2.5 rounded-2xl hover:bg-emerald-500/10 transition-all"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleResolve(report.id, 'DISMISSED')}
                                                title="Bỏ qua"
                                                className="text-slate-500 hover:text-slate-700 p-2.5 rounded-2xl hover:bg-slate-500/10 transition-all"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold">Không có báo cáo nào cần xem xét.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
