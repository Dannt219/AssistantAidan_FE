import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../state/auth';
export default function DashboardPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [filter, setFilter] = useState<'all' | 'mine' | 'published'>('all');

    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/generations', {
                    params: {
                        page,
                        limit: 10,
                        filter
                    }
                });
                setItems(res.data.data.generations || []);
                setPagination(res.data.data.pagination);
            } catch (err: any) {
                console.error('Failed to load generations:', err);
                if (err.response?.status !== 401) {
                    setError(err.response?.data?.error || 'Failed to load generations. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [page, filter]);

    // Helper function to get status badge styling
    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            completed: 'bg-green-100 text-green-800',
            running: 'bg-blue-100 text-blue-800',
            queued: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || colors.cancelled}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Helper function to format dates
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Helper function to format time in seconds
    const formatTime = (seconds: number | undefined) => {
        if (!seconds && seconds !== 0) return '—';
        if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    // Helper function to format cost
    const formatCost = (cost: number | undefined) => {
        if (!cost && cost !== 0) return '—';
        return `$${cost.toFixed(4)}`;
    };
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-2 text-gray-600">View and manage your test case generations</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={() => { setFilter('all'); setPage(1); }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => { setFilter('mine'); setPage(1); }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'mine'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Mine
                </button>
                <button
                    onClick={() => { setFilter('published'); setPage(1); }}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'published'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Published
                </button>
            </div>
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Generations List */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading generations...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-600">No generations found. Start by generating test cases!</p>
                    <Link
                        to="/"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Generate Test Cases
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Issue Key
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mode
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Owner
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cost
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Images
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {items.map((g) => (
                                    <tr key={g._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{g.issueKey}</span>
                                                {g.published && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                        Published
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(g.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 capitalize">{g.mode || 'manual'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {g.email === user?.email ? (
                                                <span className="text-gray-900 font-medium">You</span>
                                            ) : (
                                                <span className="text-gray-600">{g.email}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(g.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatTime(g.generationTimeSeconds)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                            {formatCost(g.cost)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {g.images && g.images.length > 0 ? (
                                                <span className="flex items-center gap-1.5 text-indigo-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {g.images.length}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {g.status === 'completed' ? (
                                                <Link
                                                    to={`/view/${g._id}`}
                                                    className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                                                >
                                                    View
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{pagination.page}</span> of{' '}
                        <span className="font-medium text-gray-900">{pagination.pages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= pagination.pages}
                            className="px-4 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                            Next
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}