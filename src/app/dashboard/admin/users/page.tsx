'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/providers/AuthProvider';

type Profile = {
    id: string;
    full_name: string;
    email: string;
    role: 'influencer' | 'brand' | 'admin' | 'superadmin' | null;
    status: string;
};

export default function AdminUsersPage() {
    const { user, profile } = useAuth();
    const supabase = createClient();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all profiles (requires admin rights)
    const fetchProfiles = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, status')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }
        setProfiles(data as Profile[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    // Ban/unban a user – call API route (see step 2b)
    const toggleBan = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'banned' ? 'approved' : 'banned';
        const res = await fetch('/api/admin/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, status: newStatus }),
        });
        if (res.ok) {
            // Update local state
            setProfiles(prev =>
                prev.map(p => (p.id === userId ? { ...p, status: newStatus } : p))
            );
        } else {
            alert('Failed to update user status');
        }
    };

    // Protect the page – only admin or superadmin can see it
    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        return (
            <div className="p-10">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>You must be an admin to view this page.</p>
            </div>
        );
    }

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Role</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {profiles.map(p => (
                            <tr key={p.id} className="border-t border-gray-200">
                                <td className="px-4 py-2">{p.full_name}</td>
                                <td className="px-4 py-2">{p.email}</td>
                                <td className="px-4 py-2 capitalize">{p.role}</td>
                                <td className="px-4 py-2">
                    <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                            p.status === 'banned'
                                ? 'bg-red-100 text-red-800'
                                : p.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {p.status}
                    </span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button
                                        onClick={() => toggleBan(p.id, p.status ?? '')}
                                        className={`px-3 py-1 text-xs rounded border ${
                                            p.status === 'banned'
                                                ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                                                : 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        {p.status === 'banned' ? 'Unban' : 'Ban'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}