import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Check, X } from "lucide-react";
import {
    AdminLoading,
    AdminPageHeader,
    adminFieldClass,
    adminFilterPanelClass,
    adminTableShellClass,
} from "@/components/admin/adminQuizmonChrome";

function reportTypeShort(t: string) {
    if (t === "QUIZ") return "Quiz";
    if (t === "USER") return "User";
    return "Khác";
}

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

    if (loading) return <AdminLoading />;

    return (
        <div className="space-y-6 md:space-y-8">
            <AdminPageHeader
              title="Báo cáo kiểm duyệt"
              subtitle="Xử lý khiếu nại Quiz, người dùng và nội dung khác."
            />

            {/* Filters */}
            <div className={adminFilterPanelClass}>
                <div className="flex-1">
                    <select 
                        className={`${adminFieldClass} appearance-none`}
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
                        className={`${adminFieldClass} appearance-none`}
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">Tất cả loại báo cáo</option>
                        <option value="QUIZ">Quiz</option>
                        <option value="USER">Người dùng</option>
                        <option value="OTHER">Khác</option>
                    </select>
                </div>
            </div>

            <div className={adminTableShellClass}>
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[800px] md:min-w-0">
                        <thead className="border-b border-primary/10 bg-primary/10 dark:bg-primary/15">
                            <tr>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">ID</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Loại</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">ID Mục tiêu</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Lý do</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-right font-black uppercase tracking-wider text-muted-foreground">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-bold text-muted-foreground">{report.id}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5">
                                        <span className="rounded-full border border-primary/15 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-primary md:px-3 md:text-[10px]">
                                            {reportTypeShort(report.reportType)}
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 font-mono font-bold tracking-tighter text-primary">{report.targetId}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 max-w-[150px] truncate font-medium text-foreground/85 md:max-w-xs">{report.reason}</td>
                                    <td className="px-4 md:px-8 py-4 md:py-5">
                                        <span className={`px-3 md:px-4 py-1 rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-wider shadow-sm ${
                                            report.status === 'PENDING' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/20' :
                                            report.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' :
                                            'bg-slate-500/20 text-slate-500 border border-slate-500/20'
                                        }`}>
                                            {report.status === 'PENDING' ? 'CHỜ XỬ LÝ' : report.status === 'RESOLVED' ? 'ĐÃ GIẢI QUYẾT' : 'ĐÃ BỎ QUA'}
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-8 py-4 md:py-5 text-right space-x-2">
                                        {report.status === 'PENDING' && (
                                            <div className="flex justify-end gap-1.5 md:gap-2">
                                                <button 
                                                    onClick={() => handleResolve(report.id, 'RESOLVED')}
                                                    title="Đánh dấu đã giải quyết"
                                                    className="text-emerald-500 hover:text-emerald-700 p-2 md:p-2.5 rounded-xl md:rounded-2xl hover:bg-emerald-500/10 transition-all"
                                                >
                                                    <Check className="w-4 h-4 md:w-5 md:h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleResolve(report.id, 'DISMISSED')}
                                                    title="Bỏ qua"
                                                    className="text-slate-500 hover:text-slate-700 p-2 md:p-2.5 rounded-xl md:rounded-2xl hover:bg-slate-500/10 transition-all"
                                                >
                                                    <X className="w-4 h-4 md:w-5 md:h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 md:px-8 py-10 md:py-20 text-center font-bold text-muted-foreground">Không có báo cáo nào cần xem xét.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
