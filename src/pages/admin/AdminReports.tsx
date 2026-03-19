import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Check, X } from "lucide-react";

export default function AdminReports() {
    const { token } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReports = () => {
        axios.get("http://localhost:5000/admin/reports", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setReports(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReports();
    }, [token]);

    const handleResolve = async (id: number, status: 'RESOLVED' | 'DISMISSED') => {
        try {
            await axios.put(`http://localhost:5000/admin/reports/${id}/resolve`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadReports();
        } catch (e) {
            console.error(e);
            alert("Failed to update report");
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Moderation Reports</h1>
                <p className="text-slate-500 dark:text-slate-400">Handle user submitted complaints for content and behavior.</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">ID</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Type</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Target ID</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Reason</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-6 py-4">{report.id}</td>
                                <td className="px-6 py-4 font-medium"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded-full">{report.reportType}</span></td>
                                <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-mono">{report.targetId}</td>
                                <td className="px-6 py-4 max-w-xs truncate">{report.reason}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                        report.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                        report.status === 'RESOLVED' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                    }`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {report.status === 'PENDING' && (
                                        <>
                                            <button 
                                                onClick={() => handleResolve(report.id, 'RESOLVED')}
                                                title="Mark Resolved"
                                                className="text-green-600 hover:text-green-800 p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-500/10"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleResolve(report.id, 'DISMISSED')}
                                                title="Dismiss"
                                                className="text-slate-500 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No reports requiring review.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
