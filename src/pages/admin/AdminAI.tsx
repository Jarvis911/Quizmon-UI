import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Save } from "lucide-react";
import {
    AdminLoading,
    AdminPageHeader,
    adminFieldClass,
    adminTableShellClass,
} from "@/components/admin/adminQuizmonChrome";

export default function AdminAI() {
    const { token } = useAuth();
    const [configs, setConfigs] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [jobStatus, setJobStatus] = useState("");

    const [editConfig, setEditConfig] = useState<{ featureName: string; modelName: string; isActive: boolean }>({ featureName: '', modelName: 'gemini-2.5-flash', isActive: true });

    const loadData = async () => {
        try {
            // Loading options first and independently
            try {
                const optsRes = await apiClient.get("/admin/ai-config-options");
                setFeatures(optsRes.data.features || []);
                setModels(optsRes.data.models || []);
            } catch (e) {
                console.error("Failed to load AI config options", e);
            }

            // Loading other data
            const [cfgRes, jobsRes] = await Promise.all([
                apiClient.get("/admin/ai-config").catch(err => ({ data: [] })),
                apiClient.get("/admin/ai-jobs", { params: { status: jobStatus || undefined } }).catch(err => ({ data: [] }))
            ]);
            
            setConfigs(cfgRes.data);
            setJobs(jobsRes.data);
        } catch (e) {
            console.error("General error in loadData", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [token, jobStatus]);

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.put("/admin/ai-config", editConfig);
            setEditConfig({ featureName: '', modelName: 'gemini-2.0-flash', isActive: true });
            loadData();
        } catch (e) {
            console.error(e);
            alert("Lỗi khi lưu cấu hình");
        }
    };

    if (loading) return <AdminLoading label="Đang tải cấu hình AI…" />;

    return (
        <div className="space-y-6 md:space-y-10">
            <AdminPageHeader
              title="Cài đặt AI"
              subtitle="Mô hình Gemini theo từng tính năng và lịch sử job AI."
            />

            {/* AI Configurations */}
            <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
                <div className={`${adminTableShellClass} flex flex-col`}>
                    <div className="border-b border-primary/15 bg-primary/10 px-4 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground md:px-8 md:text-xs">
                        Mô hình tính năng đang hoạt động
                    </div>
                    <ul className="divide-y divide-white/5 grow">
                        {configs.map(cfg => (
                            <li key={cfg.id} className="p-4 md:p-8 flex justify-between items-center group hover:bg-white/5 transition-all">
                                <div className="min-w-0 flex-1 pr-2">
                                    <h4 className="truncate text-sm font-black tracking-tight text-primary md:text-lg">{cfg.featureName.replace(/_/g, ' ')}</h4>
                                    <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-75 md:text-sm">Mô hình: {cfg.modelName}</p>
                                </div>
                                <span className={`shrink-0 px-2 md:px-4 py-1 text-[8px] md:text-[10px] rounded-full font-black uppercase tracking-wider shadow-sm ${cfg.isActive ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-500 border border-rose-500/20'}`}>
                                    {cfg.isActive ? 'BẬT' : 'TẮT'}
                                </span>
                            </li>
                        ))}
                        {configs.length === 0 && <li className="p-8 text-sm font-bold italic text-muted-foreground">Chưa có cấu hình tùy chỉnh.</li>}
                    </ul>
                </div>

                <div className="rounded-3xl border-2 border-primary/10 bg-primary/5 p-4 shadow-xl backdrop-blur-md md:rounded-[2.5rem] md:p-8 dark:bg-primary/[0.07]">
                    <h3 className="mb-4 text-lg font-black tracking-tight text-foreground md:mb-6 md:text-xl">Cập nhật mô hình</h3>
                    <form onSubmit={handleSaveConfig} className="space-y-4 md:space-y-6">
                        <div>
                            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground md:mb-3 md:text-xs">Tính năng</label>
                            <select 
                                required className={`${adminFieldClass} appearance-none`}
                                value={editConfig.featureName} onChange={e => setEditConfig({...editConfig, featureName: e.target.value})}
                            >
                                <option value="" disabled>Chọn tính năng...</option>
                                {features.map(f => (
                                    <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-muted-foreground md:mb-3 md:text-xs">Mô hình Gemini</label>
                            <select 
                                required className={`${adminFieldClass} appearance-none`}
                                value={editConfig.modelName} onChange={e => setEditConfig({...editConfig, modelName: e.target.value})}
                            >
                                <option value="" disabled>Chọn mô hình...</option>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border-2 border-primary/15 bg-card/60 p-3 md:rounded-2xl md:p-4">
                            <input type="checkbox" id="isActive" checked={editConfig.isActive} 
                                   className="h-4 w-4 rounded-lg accent-primary md:h-5 md:w-5"
                                   onChange={e => setEditConfig({...editConfig, isActive: e.target.checked})} />
                            <label htmlFor="isActive" className="text-xs font-black uppercase tracking-wider text-foreground md:text-sm">Đang hoạt động</label>
                        </div>
                        <button type="submit" className="flex items-center justify-center gap-3 w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 text-xs md:text-sm">
                            <Save className="w-4 h-4 md:w-5 md:h-5" /> Lưu cấu hình
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Jobs History */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-xl font-black tracking-tight text-foreground md:text-2xl">Lịch sử yêu cầu AI</h3>
                    <select 
                        className="h-11 w-full min-w-[12rem] appearance-none rounded-xl border-2 border-white/5 bg-card/60 px-4 text-[10px] font-black uppercase tracking-wider shadow-inner backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/25 md:text-xs"
                        value={jobStatus}
                        onChange={(e) => setJobStatus(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="COMPLETED">Thành công</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="FAILED">Thất bại</option>
                    </select>
                </div>
                <div className={adminTableShellClass}>
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[700px] md:min-w-0">
                            <thead className="border-b border-primary/10 bg-primary/10 dark:bg-primary/15">
                                <tr>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">ID Yêu cầu</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Người dùng</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-muted-foreground">Trạng thái</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 text-right font-black uppercase tracking-wider text-muted-foreground">Token</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 text-right font-black uppercase tracking-wider text-muted-foreground">Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-mono font-bold text-primary">#{job.id}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-black text-foreground">{job.user?.username || job.userId}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5">
                                            <span className={`px-2 md:px-4 py-1 text-[8px] md:text-[10px] rounded-full font-black uppercase tracking-wider shadow-sm ${
                                                job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 
                                                job.status === 'FAILED' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20' :
                                                'bg-primary/20 text-primary border border-primary/20'
                                            }`}>
                                                {job.status === 'COMPLETED' ? 'THÀNH CÔNG' : job.status === 'FAILED' ? 'THẤT BẠI' : 'ĐANG XỬ LÝ'}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-right font-black text-foreground/80">
                                            {job.totalTokens ? job.totalTokens.toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-right font-medium text-muted-foreground">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
