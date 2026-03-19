import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

export default function AdminUsers() {
    const { token } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("http://localhost:5000/admin/users", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setUsers(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [token]);

    const getSubscriptionStatus = (user: any) => {
        const orgMember = user.organizationMembers?.[0];
        if (!orgMember) return { status: 'Free', plan: 'N/A' };
        const sub = orgMember.organization?.subscriptions?.[0];
        if (!sub) return { status: 'Free', plan: 'N/A' };
        
        return { 
            status: sub.status, 
            plan: sub.plan?.name || "Unknown"
        };
    };

    if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Users & Revenue</h1>
                <p className="text-slate-500 dark:text-slate-400">View user accounts, subscription plans, and trial status.</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">ID</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Username</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Email</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Plan</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {users.map((user) => {
                            const subInfo = getSubscriptionStatus(user);
                            return (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4">{user.id}</td>
                                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                                        {user.username}
                                        {user.isAdmin && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-sm uppercase font-bold">Admin</span>}
                                    </td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">{subInfo.plan}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                            subInfo.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                                            subInfo.status === 'TRIALING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {subInfo.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
