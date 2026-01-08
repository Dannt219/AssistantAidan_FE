import { useRef, useState, useCallback, useEffect } from 'react';

export interface UploadedImage {
    file: File;
    preview: string;
    filename: string;
    size: number;
}

export interface ImageUploaderProps {
    onImagesSelected: (images: UploadedImage[]) => void;
    maxFiles?: number;
    maxSizeMB?: number;
    disabled?: boolean;
    compact?: boolean; // New prop for inline button mode
}

export default function ImageUploader({
    onImagesSelected,
    maxFiles = 5,
    maxSizeMB = 10,
    disabled = false,
    compact = false
}: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // Validate and process files
    const processFiles = useCallback((files: FileList | File[]) => {
        setError(null);
        const fileArray = Array.from(files);

        // Filter only image files
        const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            setError('Please select image files only');
            return;
        }

        if (imageFiles.length > maxFiles) {
            setError(`Maximum ${maxFiles} images allowed`);
            return;
        }

        // Check file sizes
        const oversizedFiles = imageFiles.filter(file => file.size > maxSizeBytes);
        if (oversizedFiles.length > 0) {
            setError(`Some files exceed ${maxSizeMB}MB limit`);
            return;
        }

        // Create previews
        const uploadedImages: UploadedImage[] = [];
        let processed = 0;

        imageFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImages.push({
                    file,
                    preview: e.target?.result as string,
                    filename: file.name,
                    size: file.size
                });
                processed++;

                if (processed === imageFiles.length) {
                    onImagesSelected(uploadedImages);
                }
            };
            reader.readAsDataURL(file);
        });
    }, [maxFiles, maxSizeBytes, maxSizeMB, onImagesSelected]);

    // Handle file input change
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };

    // Handle click to browse
    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    // Handle drag events
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    // Handle paste from clipboard
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (disabled) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            processFiles(files);
        }
    }, [disabled, processFiles]);

    // Add paste event listener
    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);

    // Compact button mode for inline usage
    if (compact) {
        return (
            <>
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    max={maxFiles}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={disabled}
                />

                {/* Compact upload button */}
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={disabled}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-gray-700 font-medium"
                    title="Upload images (or paste with Ctrl+V)"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Images</span>
                </button>

                {/* Error message */}
                {error && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs z-10">
                        {error}
                    </div>
                )}
            </>
        );
    }

    // Default dropzone mode
    return (
        <div className="space-y-2">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                max={maxFiles}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Dropzone */}
            <div
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-all duration-200
                    ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <div className="flex flex-col items-center space-y-2">
                    {/* Icon */}
                    <svg
                        className={`w-12 h-12 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>

                    {/* Text */}
                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            {isDragging ? 'Drop images here' : 'Click to browse or drag & drop images'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            or press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+V</kbd> to paste
                        </p>
                    </div>

                    {/* Limits */}
                    <p className="text-xs text-gray-400">
                        Max {maxFiles} images, {maxSizeMB}MB each
                    </p>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
