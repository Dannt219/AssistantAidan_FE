import { useState, useEffect } from 'react';
import ImageUploader, { type UploadedImage } from './ImageUploader';
import ImagePreviewGrid from './ImagePreviewGrid';
import api from '../lib/api';

// Define ImagePreview interface locally to avoid import issues
interface ImagePreview {
    preview: string;
    filename: string;
    size: number;
    detectedJiraKeys?: string[];
    ocrConfidence?: number;
}

export interface UnifiedInputBoxProps {
    value: string;
    onChange: (value: string) => void;
    onAnalyze: (imageSessionId?: string) => void;
    onGenerate: (imageSessionId?: string) => void;
    analyzing: boolean;
    generating: boolean;
}

export default function UnifiedInputBox({
    value,
    onChange,
    onAnalyze,
    onGenerate,
    analyzing,
    generating
}: UnifiedInputBoxProps) {
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [imageSessionId, setImageSessionId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [detectedJiraKeys, setDetectedJiraKeys] = useState<string[]>([]);
    const [showDetectedKeys, setShowDetectedKeys] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Handle image selection
    const handleImagesSelected = async (uploadedImages: UploadedImage[]) => {
        setUploading(true);
        setUploadError(null);

        try {
            // Create FormData
            const formData = new FormData();
            uploadedImages.forEach(img => {
                formData.append('images', img.file);
            });

            // Upload to backend
            const response = await api.post('/generations/upload-images', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const data = response.data.data;

            // Update state with uploaded images and OCR results
            const imagePreviews: ImagePreview[] = uploadedImages.map((img, index) => ({
                preview: img.preview,
                filename: data.images[index]?.filename || img.filename,
                size: img.size,
                detectedJiraKeys: data.images[index]?.detectedJiraKeys || [],
                ocrConfidence: data.images[index]?.ocrConfidence || 0
            }));

            setImages(imagePreviews);
            setImageSessionId(data.sessionId);
            setDetectedJiraKeys(data.detectedJiraKeys || []);

            // Show detected keys if found
            if (data.detectedJiraKeys && data.detectedJiraKeys.length > 0) {
                setShowDetectedKeys(true);
            }

            console.log('Images uploaded successfully:', data);
        } catch (error: any) {
            console.error('Image upload failed:', error);
            setUploadError(error?.response?.data?.error || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    // Handle image removal
    const handleRemoveImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);

        // Clear session if no images left
        if (newImages.length === 0) {
            if (imageSessionId) {
                // Optional: Call API to delete session
                api.delete(`/generations/image-sessions/${imageSessionId}`).catch(console.error);
            }
            setImageSessionId(null);
            setDetectedJiraKeys([]);
            setShowDetectedKeys(false);
        }
    };

    // Handle JIRA key click from detected keys
    const handleJiraKeyClick = (jiraKey: string) => {
        onChange(jiraKey);
        setShowDetectedKeys(false);
    };

    // Handle analyze with session
    const handleAnalyze = () => {
        onAnalyze(imageSessionId || undefined);
    };

    // Handle generate with session
    const handleGenerate = () => {
        onGenerate(imageSessionId || undefined);
    };

    // Clear images when component unmounts
    useEffect(() => {
        return () => {
            if (imageSessionId) {
                api.delete(`/generations/image-sessions/${imageSessionId}`).catch(console.error);
            }
        };
    }, [imageSessionId]);

    return (
        <div className="space-y-4">
            {/* Main Input Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* JIRA Key Input */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                        JIRA Issue Key
                    </label>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !analyzing && handleAnalyze()}
                                placeholder="Enter JIRA issue key (e.g., TES-123)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all pr-12"
                                disabled={analyzing || generating}
                            />
                            {images.length > 0 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-medium">
                                        📎 {images.length}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Image Upload Button - Inline */}
                        <ImageUploader
                            onImagesSelected={handleImagesSelected}
                            disabled={uploading || generating}
                            compact={true}
                        />

                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing || !value.trim() || generating}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {analyzing ? 'Analyzing...' : 'Analyze'}
                        </button>
                        <button
                            disabled={!value || generating || analyzing}
                            onClick={handleGenerate}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {generating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>

                    {/* Upload Status */}
                    {uploading && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs flex items-center">
                            <svg className="animate-spin h-3 w-3 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing images...
                        </div>
                    )}

                    {uploadError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                            {uploadError}
                        </div>
                    )}

                    {/* Detected JIRA Keys from OCR */}
                    {showDetectedKeys && detectedJiraKeys.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-indigo-900 mb-2">
                                        🔍 Detected JIRA keys in images:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {detectedJiraKeys.map((key, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleJiraKeyClick(key)}
                                                className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetectedKeys(false)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <ImagePreviewGrid
                        images={images}
                        onRemove={handleRemoveImage}
                        onJiraKeyClick={handleJiraKeyClick}
                    />
                </div>
            )}
        </div>
    );
}
