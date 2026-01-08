export interface ImagePreview {
    preview: string;
    filename: string;
    size: number;
    detectedJiraKeys?: string[];
    ocrConfidence?: number;
}

export interface ImagePreviewGridProps {
    images: ImagePreview[];
    onRemove: (index: number) => void;
    onJiraKeyClick?: (jiraKey: string) => void;
}

function ImagePreviewGrid({
    images,
    onRemove,
    onJiraKeyClick
}: ImagePreviewGridProps) {
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (images.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                    Uploaded Images ({images.length})
                </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        {/* Image Preview */}
                        <div className="aspect-square bg-gray-100 relative">
                            <img
                                src={image.preview}
                                alt={image.filename}
                                className="w-full h-full object-cover"
                            />

                            {/* Remove button */}
                            <button
                                onClick={() => onRemove(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remove image"
                            >
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>

                            {/* OCR Confidence Badge */}
                            {image.ocrConfidence !== undefined && image.ocrConfidence > 0 && (
                                <div className="absolute bottom-2 left-2">
                                    <span className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                        OCR: {Math.round(image.ocrConfidence)}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Image Info */}
                        <div className="p-2 space-y-1">
                            <p className="text-xs text-gray-700 truncate font-medium" title={image.filename}>
                                {image.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatFileSize(image.size)}
                            </p>

                            {/* Detected JIRA Keys */}
                            {image.detectedJiraKeys && image.detectedJiraKeys.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {image.detectedJiraKeys.map((key, keyIndex) => (
                                        <button
                                            key={keyIndex}
                                            onClick={() => onJiraKeyClick?.(key)}
                                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded hover:bg-indigo-200 transition-colors"
                                            title="Click to use this JIRA key"
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ImagePreviewGrid;
