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
            const [cfgRes, jobsRes, optsRes] = await Promise.all([
                apiClient.get("/admin/ai-config"),
                apiClient.get("/admin/ai-jobs", { params: { status: jobStatus || undefined } }),
                apiClient.get("/admin/ai-config-options")
            ]);
            setConfigs(cfgRes.data);
            setJobs(jobsRes.data);
            setFeatures(optsRes.data.features);
            setModels(optsRes.data.models);
        } catch (e) {
            console.error(e);
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
        <div className="space-y-10">
            <div className="relative">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Cài đặt AI & Hạn mức</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Quản lý mô hình Gemini cho từng tính năng và theo dõi hiệu suất sử dụng trên toàn hệ thống.</p>
            </div>

            {/* AI Configurations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-[2.5rem] border border-white/10 bg-card/40 dark:bg-slate-900/40 overflow-hidden backdrop-blur-md shadow-xl flex flex-col">
                    <div className="p-8 border-b border-white/5 bg-white/5 font-black uppercase text-xs tracking-widest text-slate-500 dark:text-slate-400">
                        Mô hình tính năng đang hoạt động
                    </div>
                    <ul className="divide-y divide-white/5 grow">
                        {configs.map(cfg => (
                            <li key={cfg.id} className="p-8 flex justify-between items-center group hover:bg-white/5 transition-all">
                                <div>
                                    <h4 className="font-black text-lg text-primary dark:text-blue-400 tracking-tight">{cfg.featureName.replace(/_/g, ' ')}</h4>
                                    <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider opacity-60">Mô hình: {cfg.modelName}</p>
                                </div>
                                <span className={`px-4 py-1 text-[10px] rounded-full font-black uppercase tracking-wider shadow-sm ${cfg.isActive ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-500 border border-rose-500/20'}`}>
                                    {cfg.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ TẮT'}
                                </span>
                            </li>
                        ))}
                        {configs.length === 0 && <li className="p-8 text-sm font-bold text-slate-500 italic">Chưa có cấu hình tùy chỉnh. Đang sử dụng mặc định.</li>}
                    </ul>
                </div>

                <div className="rounded-[2.5rem] border border-white/10 bg-card/40 dark:bg-slate-900/40 p-8 shadow-xl backdrop-blur-md">
                    <h3 className="font-black text-xl text-slate-900 dark:text-white mb-6 tracking-tight">Cài đặt/Cập nhật mô hình</h3>
                    <form onSubmit={handleSaveConfig} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 ml-1">Tên tính năng</label>
                            <select 
                                required className="w-full h-12 px-6 rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                value={editConfig.featureName} onChange={e => setEditConfig({...editConfig, featureName: e.target.value})}
                            >
                                <option value="" disabled>Chọn một tính năng...</option>
                                {features.map(f => (
                                    <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 ml-1">Tên mô hình Gemini</label>
                            <select 
                                required className="w-full h-12 px-6 rounded-2xl border border-white/5 bg-white/50 dark:bg-slate-900/50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                value={editConfig.modelName} onChange={e => setEditConfig({...editConfig, modelName: e.target.value})}
                            >
                                <option value="" disabled>Chọn một mô hình...</option>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/5">
                            <input type="checkbox" id="isActive" checked={editConfig.isActive} 
                                   className="w-5 h-5 rounded-lg accent-primary"
                                   onChange={e => setEditConfig({...editConfig, isActive: e.target.checked})} />
                            <label htmlFor="isActive" className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Tính năng đang hoạt động</label>
                        </div>
                        <button type="submit" className="flex items-center justify-center gap-3 w-full bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest py-4 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
                            <Save className="w-5 h-5" /> Lưu cấu hình
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Jobs History */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Lịch sử yêu cầu AI</h3>
                    <select 
                        className="h-10 px-4 rounded-xl border border-white/5 bg-card/40 dark:bg-slate-900/40 text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xl backdrop-blur-md appearance-none"
                        value={jobStatus}
                        onChange={(e) => setJobStatus(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="COMPLETED">Thành công</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="FAILED">Thất bại</option>
                    </select>
                </div>
                <div className="rounded-[2.5rem] border border-white/10 bg-card/30 dark:bg-slate-900/30 overflow-hidden backdrop-blur-md shadow-2xl">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-white/10 dark:bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">ID Yêu cầu</th>
                                <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Người dùng</th>
                                <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Trạng thái</th>
                                <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Token sử dụng</th>
                                <th className="px-8 py-5 font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-8 py-5 font-mono font-bold text-primary">#{job.id}</td>
                                    <td className="px-8 py-5 font-black text-slate-900 dark:text-white">{job.user?.username || job.userId}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-4 py-1 text-[10px] rounded-full font-black uppercase tracking-wider shadow-sm ${
                                            job.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20' : 
                                            job.status === 'FAILED' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/20' :
                                            'bg-primary/20 text-primary border border-primary/20'
                                        }`}>
                                            {job.status === 'COMPLETED' ? 'THÀNH CÔNG' : job.status === 'FAILED' ? 'THẤT BẠI' : 'ĐANG XỬ LÝ'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-slate-600 dark:text-slate-300">
                                        {job.totalTokens ? job.totalTokens.toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-8 py-5 text-right font-medium text-slate-500">
                                        {new Date(job.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
