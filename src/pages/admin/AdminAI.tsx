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
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Cài đặt AI & Hạn mức</h1>
                <p className="text-slate-500 dark:text-slate-400">Quản lý mô hình Gemini cho từng tính năng và theo dõi mức độ sử dụng.</p>
            </div>

            {/* AI Configurations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                        Mô hình tính năng đang hoạt động
                    </div>
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {configs.map(cfg => (
                            <li key={cfg.id} className="p-4 flex justify-between items-center group">
                                <div>
                                    <h4 className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{cfg.featureName}</h4>
                                    <p className="text-sm text-slate-500 mt-1">Mô hình: {cfg.modelName}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${cfg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {cfg.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                                </span>
                            </li>
                        ))}
                        {configs.length === 0 && <li className="p-4 text-sm text-slate-500">Chưa có cấu hình tùy chỉnh. Đang sử dụng mặc định.</li>}
                    </ul>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Cài đặt/Cập nhật mô hình</h3>
                    <form onSubmit={handleSaveConfig} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên tính năng</label>
                            <select 
                                required className="w-full px-3 py-2 border border-slate-300 rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                value={editConfig.featureName} onChange={e => setEditConfig({...editConfig, featureName: e.target.value})}
                            >
                                <option value="" disabled>Chọn một tính năng...</option>
                                {features.map(f => (
                                    <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tên mô hình Gemini</label>
                            <select 
                                required className="w-full px-3 py-2 border border-slate-300 rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                value={editConfig.modelName} onChange={e => setEditConfig({...editConfig, modelName: e.target.value})}
                            >
                                <option value="" disabled>Chọn một mô hình...</option>
                                {models.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="isActive" checked={editConfig.isActive} 
                                   onChange={e => setEditConfig({...editConfig, isActive: e.target.checked})} />
                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">Đang hoạt động</label>
                        </div>
                        <button type="submit" className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                            <Save className="w-4 h-4" /> Lưu cấu hình
                        </button>
                    </form>
                </div>
            </div>

            {/* AI Jobs History */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Lịch sử yêu cầu AI gần đây</h3>
                    <select 
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={jobStatus}
                        onChange={(e) => setJobStatus(e.target.value)}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="COMPLETED">Thành công</option>
                        <option value="PROCESSING">Đang xử lý</option>
                        <option value="FAILED">Thất bại</option>
                    </select>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 font-medium text-slate-500">ID Yêu cầu</th>
                                <th className="px-6 py-3 font-medium text-slate-500">Người dùng</th>
                                <th className="px-6 py-3 font-medium text-slate-500">Trạng thái</th>
                                <th className="px-6 py-3 font-medium text-slate-500 text-right">Token sử dụng</th>
                                <th className="px-6 py-3 font-medium text-slate-500 text-right">Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-mono">#{job.id}</td>
                                    <td className="px-6 py-4">{job.user?.username || job.userId}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-md ${
                                            job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                                            job.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {job.status === 'COMPLETED' ? 'THÀNH CÔNG' : job.status === 'FAILED' ? 'THẤT BẠI' : job.status === 'PROCESSING' ? 'ĐANG XỬ LÝ' : job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                        {job.totalTokens ? job.totalTokens.toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500">
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
