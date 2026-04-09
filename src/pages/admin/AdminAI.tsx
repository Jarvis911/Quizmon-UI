import { useEffect, useState } from "react";
import apiClient from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Save } from "lucide-react";

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

    if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;

    return (
        <div className="space-y-6 md:space-y-10">
            <div className="relative">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Cài đặt AI & Hạn mức</h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">Quản lý mô hình Gemini cho từng tính năng và theo dõi hiệu suất.</p>
            </div>

            {/* AI Configurations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <div className="rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-card/40 dark:bg-slate-900/40 overflow-hidden backdrop-blur-md shadow-xl flex flex-col">
                    <div className="p-4 md:p-8 border-b border-white/5 bg-white/5 font-black uppercase text-[10px] md:text-xs tracking-widest text-slate-500 dark:text-slate-400">
                        Mô hình tính năng đang hoạt động
                    </div>
                    <ul className="divide-y divide-white/5 grow">
                        {configs.map(cfg => (
                            <li key={cfg.id} className="p-4 md:p-8 flex justify-between items-center group hover:bg-white/5 transition-all">
                                <div className="min-w-0 flex-1 pr-2">
                                    <h4 className="font-black text-sm md:text-lg text-primary dark:text-blue-400 tracking-tight truncate">{cfg.featureName.replace(/_/g, ' ')}</h4>
                                    <p className="text-[10px] md:text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider opacity-60 truncate">Mô hình: {cfg.modelName}</p>
                                </div>
                                <span className={`shrink-0 px-2 md:px-4 py-1 text-[8px] md:text-[10px] rounded-full font-black uppercase tracking-wider shadow-sm ${cfg.isActive ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-500 border border-rose-500/20'}`}>
                                    {cfg.isActive ? 'BẬT' : 'TẮT'}
                                </span>
                            </li>
                        ))}
                        {configs.length === 0 && <li className="p-8 text-sm font-bold text-slate-500 italic">Chưa có cấu hình tùy chỉnh.</li>}
                    </ul>
                </div>

                <div className="rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-card/40 dark:bg-slate-900/40 p-4 md:p-8 shadow-xl backdrop-blur-md">
                    <h3 className="font-black text-lg md:text-xl text-slate-900 dark:text-white mb-4 md:mb-6 tracking-tight">Cập nhật mô hình</h3>
                    <form onSubmit={handleSaveConfig} className="space-y-4 md:space-y-6">
                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 md:mb-3 ml-1">Tính năng</label>
                            <select 
                                required className="w-full h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                value={editConfig.featureName} onChange={e => setEditConfig({...editConfig, featureName: e.target.value})}
                            >
                                <option value="" disabled>Chọn tính năng...</option>
                                {features.map(f => (
                                    <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 md:mb-3 ml-1">Mô hình Gemini</label>
                            <select 
                                required className="w-full h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                value={editConfig.modelName} onChange={e => setEditConfig({...editConfig, modelName: e.target.value})}
                            >
                                <option value="" disabled>Chọn mô hình...</option>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 dark:bg-white/5 border border-white/5">
                            <input type="checkbox" id="isActive" checked={editConfig.isActive} 
                                   className="w-4 h-4 md:w-5 md:h-5 rounded-lg accent-primary"
                                   onChange={e => setEditConfig({...editConfig, isActive: e.target.checked})} />
                            <label htmlFor="isActive" className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Đang hoạt động</label>
                        </div>
                        <button type="submit" className="flex items-center justify-center gap-3 w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 text-xs md:text-sm">
                            <Save className="w-4 h-4 md:w-5 md:h-5" /> Lưu cấu hình
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Jobs History */}
            <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Lịch sử yêu cầu AI</h3>
                    <select 
                        className="h-10 px-4 rounded-xl border border-white/5 bg-card/40 dark:bg-slate-900/40 text-[10px] md:text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xl backdrop-blur-md appearance-none"
                        value={jobStatus}
                        onChange={(e) => setJobStatus(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="COMPLETED">Thành công</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="FAILED">Thất bại</option>
                    </select>
                </div>
                <div className="rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-card/30 dark:bg-slate-900/30 overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-xs md:text-sm text-left border-collapse min-w-[700px] md:min-w-0">
                            <thead className="bg-white/10 dark:bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">ID Yêu cầu</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Người dùng</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Trạng thái</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Token</th>
                                    <th className="px-4 md:px-8 py-4 md:py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-mono font-bold text-primary">#{job.id}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 font-black text-slate-900 dark:text-white">{job.user?.username || job.userId}</td>
                                        <td className="px-4 md:px-8 py-4 md:py-5">
                                            <span className={`px-2 md:px-4 py-1 text-[8px] md:text-[10px] rounded-full font-black uppercase tracking-wider shadow-sm ${
                                                job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 
                                                job.status === 'FAILED' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20' :
                                                'bg-primary/20 text-primary border border-primary/20'
                                            }`}>
                                                {job.status === 'COMPLETED' ? 'THÀNH CÔNG' : job.status === 'FAILED' ? 'THẤT BẠI' : 'ĐANG XỬ LÝ'}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-right font-black text-slate-600 dark:text-slate-300">
                                            {job.totalTokens ? job.totalTokens.toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-4 md:px-8 py-4 md:py-5 text-right font-medium text-slate-500">
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
