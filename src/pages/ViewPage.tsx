import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../lib/api';
import { useAuthStore } from "../state/auth";


export default function ViewPage() {
    const { id } = useParams<{ id: string }>();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Metadata state
    const [issueKey, setIssueKey] = useState<string>('');
    const [projectKey, setProjectKey] = useState<string | null>(null);
    const [currentVersion, setCurrentVersion] = useState<number>(1);
    const [lastUpdatedBy, setLastUpdatedBy] = useState<string>('');
    const [updatedAt, setUpdatedAt] = useState<string>('');
    const [filename, setFilename] = useState<string>('output.md');
    const [images, setImages] = useState<any[]>([]);
    const [imagesCount, setImagesCount] = useState<number>(0);

    // Edit state
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedContent, setEditedContent] = useState<string>('');
    const [saving, setSaving] = useState<boolean>(false);
    const [isOwner, setIsOwner] = useState<boolean>(false);

    // Publish state
    const [published, setPublished] = useState<boolean>(false);
    // const [publishedAt, setPublishedAt] = useState<string | null>(null);
    // const [publishedBy, setPublishedBy] = useState<string | null>(null);
    const [publishing, setPublishing] = useState<boolean>(false);

    // Download state
    type DownloadFormat = 'md' | 'pdf' | 'xlsx';


    // const [format, setFormat] = useState<DownloadFormat>('md');
    const [downloading, setDownloading] = useState<boolean>(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState<boolean>(false);

    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [deleting, setDeleting] = useState<boolean>(false);
    const navigate = useNavigate();


    const user = useAuthStore((s) => s.user);

    const setup = () => {
        (async () => {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                const viewRes = await api.get(`/generations/${id}/view`);
                const viewData = viewRes.data.data;
                setContent(viewData.content);
                setEditedContent(viewData.content); // Initialize edited content
                setFilename(viewData.filename);

                // Check ownership
                setIsOwner(viewData.email === user?.email);

                // Set metadata for header
                setIssueKey(viewData.issueKey || '');
                setProjectKey(viewData.projectKey || null);
                setPublished(viewData.published || false);
                setCurrentVersion(viewData.currentVersion || 1);
                setLastUpdatedBy(viewData.lastUpdatedBy || '');
                setUpdatedAt(viewData.updatedAt || '');
                setImages(viewData.images || []);
                setImagesCount(viewData.imagesCount || 0);

                // Set publish state
                setPublished(viewData.published || false);
                // setPublishedAt(viewData.publishedAt);
                // setPublishedBy(viewData.publishedBy);


            } catch (err: any) {
                console.error('Failed to load content:', err);
                setError(err?.response?.data?.error || 'Failed to load content');
                setContent('');
                setEditedContent(''); // Reset edited content on error

            } finally {
                setLoading(false);
            }
        })();
    }
    useEffect(setup, [id]);

    // Helper function to format dates
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    async function handleSave() {
        if (!id) return;

        setSaving(true);
        setError(null);

        try {
            const res = await api.put(`/generations/${id}/content`, {
                content: editedContent
            });

            // Update content with saved version
            setContent(res.data.data.content);

            // Update version if returned
            if (res.data.data.currentVersion) {
                setCurrentVersion(res.data.data.currentVersion);
            }

            // Exit edit mode
            setIsEditing(false);
        } catch (err: any) {
            console.error('Failed to save content:', err);
            setError(err?.response?.data?.error || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    function handleCancel() {
        // Reset edited content to original content
        setEditedContent(content);

        // Exit edit mode
        setIsEditing(false);

        // Clear any errors
        setError(null);
    };

    async function handlePublish(publish: boolean) {
        if (!id) return;

        setPublishing(true);
        setError(null);

        try {
            const res = await api.put(`/generations/${id}/publish`, {
                published: publish
            });

            // Update publish state with response data
            setPublished(res.data.data.published);
            // setPublishedAt(res.data.data.publishedAt);
            // setPublishedBy(res.data.data.publishedBy);
        } catch (err: any) {
            console.error('Failed to publish/unpublish:', err);
            setError(err?.response?.data?.error || 'Failed to update publish status');
        } finally {
            setPublishing(false);
        }
    }

    async function download(fmt: DownloadFormat) {
        setDownloading(true);
        setShowDownloadMenu(false);

        try {
            const res = await api.get(
                `/generations/${id}/download`,
                {
                    params: { format: fmt },
                    responseType: 'blob'
                }
            );

            const blob = new Blob([res.data]);
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.${fmt}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        } finally {
            setDownloading(false);
        }
    }

    async function handleDelete() {
        if (!id) return;

        setDeleting(true);
        setError(null);

        try {
            await api.delete(`/generations/${id}`);

            // Navigate to dashboard after successful deletion
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Failed to delete generation:', err);
            setError(err?.response?.data?.error || 'Failed to delete generation');
            setShowDeleteModal(false); // Close modal on error
        } finally {
            setDeleting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Back Link */}
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Dashboard</span>
                </Link>

                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-5">
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 min-w-0">
                                {/* Title & Badge */}
                                <div className="flex items-center gap-3 mb-3">
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        {issueKey ? `${issueKey}'s test cases` : filename}
                                    </h1>
                                    {published && (
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200">
                                            Published
                                        </span>
                                    )}
                                </div>

                                {/* Metadata - Single Line */}
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500">
                                    {projectKey && (
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            <span className="font-medium text-gray-700">{projectKey}</span>
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span>Version {currentVersion}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{formatDate(updatedAt)}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="truncate max-w-[180px]">{lastUpdatedBy}</span>
                                    </span>
                                    {imagesCount > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>{imagesCount} image{imagesCount > 1 ? 's' : ''}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving || editedContent === content}
                                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Save
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {isOwner && (
                                            <button
                                                onClick={() => {
                                                    setEditedContent(content);
                                                    setIsEditing(true);
                                                }}
                                                disabled={!content}
                                                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                        )}
                                    </>
                                )}

                                {isOwner && (
                                    <button
                                        onClick={() => handlePublish(!published)}
                                        disabled={publishing || !content}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 ${published
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            }`}
                                    >
                                        {publishing ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                        ) : published ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Unpublish
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                Publish
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* <button
                                    onClick={download}
                                    disabled={downloading || !content}
                                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {downloading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download
                                        </>
                                    )}
                                </button> */}
                                <div className="relative flex items-center gap-1">
                                    {/* Download button */}
                                    <button
                                        onClick={() => setShowDownloadMenu(v => !v)}
                                        disabled={downloading || !content}
                                        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 rounded-lg
            hover:bg-gray-50 transition-colors disabled:opacity-50
            flex items-center gap-1.5"
                                    >
                                        {downloading ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-700 border-t-transparent" />
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                    />
                                                </svg>
                                                Download
                                            </>
                                        )}
                                    </button>

                                    {/* Dropdown menu */}
                                    {showDownloadMenu && !downloading && (
                                        <div className="absolute right-0 top-full mt-1 w-40
            bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                            <button
                                                onClick={() => download('md')}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                            >
                                                Markdown (.md)
                                            </button>
                                            <button
                                                onClick={() => download('pdf')}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                            >
                                                PDF (.pdf)
                                            </button>
                                            <button
                                                onClick={() => download('xlsx')}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                            >
                                                Excel (.xlsx)
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isOwner && (
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        disabled={!content}
                                        className="px-4 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                )}
                                {/* Delete Confirmation Modal */}
                                {showDeleteModal && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-4 flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                        Delete Generation
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-4">
                                                        Are you sure you want to delete this test case generation? This action cannot be undone.
                                                    </p>
                                                    {published && (
                                                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                                                            <p className="text-sm font-medium">⚠️ This generation is published. Deleting it will remove it from public view.</p>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setShowDeleteModal(false)}
                                                            disabled={deleting}
                                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleDelete}
                                                            disabled={deleting}
                                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                        >
                                                            {deleting ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                'Delete'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Images Gallery */}
                {images && images.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Uploaded Images ({images.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((image: any, index: number) => (
                                <div key={index} className="group relative">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                        <img
                                            src={`/api/generations/images/${image.filename}`}
                                            alt={image.originalName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMMTMuNTg1NyA2LjQxNDI5QzE0LjM2NjggNS42MzMxNyAxNS42MzMyIDUuNjMzMTcgMTYuNDE0MyA2LjQxNDI5TDIwIDE0TTYgMjBIMThBMiAyIDAgMDAyMCAxOFY2QTIgMiAwIDAwMTggNEg2QTIgMiAwIDAwNCA2VjE4QTIgMiAwIDAwNiAyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                                            }}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-600 truncate" title={image.originalName}>
                                            {image.originalName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {image.width && image.height && `${image.width}×${image.height}`}
                                            {image.size && ` • ${(image.size / 1024).toFixed(1)}KB`}
                                        </p>
                                    </div>
                                    
                                    {/* Click to view full size */}
                                    <button
                                        onClick={() => {
                                            const modal = document.createElement('div');
                                            modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
                                            modal.innerHTML = `
                                                <div class="relative max-w-4xl max-h-full">
                                                    <img src="/api/generations/images/${image.filename}" alt="${image.originalName}" class="max-w-full max-h-full object-contain rounded-lg" />
                                                    <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75 transition-colors" onclick="this.parentElement.parentElement.remove()">×</button>
                                                    <div class="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded text-sm">${image.originalName}</div>
                                                </div>
                                            `;
                                            modal.onclick = (e) => {
                                                if (e.target === modal) modal.remove();
                                            };
                                            document.body.appendChild(modal);
                                        }}
                                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Display - from previous lesson */}
                {isEditing ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-[calc(100vh-350px)] min-h-[600px] p-8 font-mono text-sm text-gray-900 bg-white border-0 resize-none focus:outline-none"
                            placeholder="Enter markdown content..."
                            spellCheck={false}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-8 prose prose-sm max-w-none 
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
            prose-ul:list-disc prose-ul:ml-6 prose-ul:my-4
            prose-ol:list-decimal prose-ol:ml-6 prose-ol:my-4
            prose-li:text-gray-700 prose-li:my-1.5
            prose-strong:text-gray-900 prose-strong:font-semibold 
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mb-3 prose-headings:mt-6">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isInlineCode = !match;

                                        return isInlineCode ? (
                                            <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                {children}
                                            </code>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre({ children, ...props }: any) {
                                        return (
                                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono" {...props}>
                                                {children}
                                            </pre>
                                        );
                                    },
                                    h1({ children }) {
                                        return <h1 className="text-3xl font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 mt-6">{children}</h1>;
                                    },
                                    h2({ children }) {
                                        return <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">{children}</h2>;
                                    },
                                    h3({ children }) {
                                        return <h3 className="text-xl font-bold text-gray-900 mt-4 mb-3">{children}</h3>;
                                    },
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
