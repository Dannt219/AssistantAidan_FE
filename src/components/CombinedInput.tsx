import React, { useState, useRef, useCallback } from 'react';

interface UploadedImage {
    file: File;
    preview: string;
    originalName: string;
    size: number;
}

interface CombinedInputProps {
    value: string;
    onChange: (value: string) => void;
    onImagesChange: (images: File[]) => void;
    onKeyPress?: (e: React.KeyboardEvent) => void;
    placeholder?: string;
    disabled?: boolean;
    maxImages?: number;
    maxSizePerImage?: number; // in MB
}

export default function CombinedInput({
    value,
    onChange,
    onImagesChange,
    onKeyPress,
    placeholder = "Enter JIRA issue key (e.g., SDETPRO-123)",
    disabled = false,
    maxImages = 5,
    maxSizePerImage = 10
}: CombinedInputProps) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`;
        }

        const maxSizeBytes = maxSizePerImage * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return `File size must be less than ${maxSizePerImage}MB.`;
        }

        return null;
    };

    const processFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const newImages: UploadedImage[] = [];
        let errorMessage = '';

        if (images.length + fileArray.length > maxImages) {
            errorMessage = `Maximum ${maxImages} images allowed.`;
            setError(errorMessage);
            return;
        }

        fileArray.forEach((file) => {
            const validationError = validateFile(file);
            if (validationError) {
                errorMessage = validationError;
                return;
            }

            const isDuplicate = images.some(img => 
                img.file.name === file.name && img.file.size === file.size
            );
            
            if (!isDuplicate) {
                const preview = URL.createObjectURL(file);
                newImages.push({
                    file,
                    preview,
                    originalName: file.name,
                    size: file.size
                });
            }
        });

        if (errorMessage) {
            setError(errorMessage);
            return;
        }

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        setError('');
        
        onImagesChange(updatedImages.map(img => img.file));
    }, [images, maxImages, maxSizePerImage, onImagesChange]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
    }, [processFiles, disabled]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processFiles, disabled]);

    const removeImage = useCallback((index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        
        URL.revokeObjectURL(images[index].preview);
        
        setImages(updatedImages);
        setError('');
        onImagesChange(updatedImages.map(img => img.file));
    }, [images, onImagesChange]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-4">
            {/* Combined Input Field */}
            <div
                className={`relative border-2 rounded-lg transition-colors ${
                    dragActive
                        ? 'border-indigo-500 bg-indigo-50'
                        : error
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    disabled={disabled}
                />
                
                <div className="flex items-center">
                    {/* Text Input */}
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyPress={onKeyPress}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-0"
                    />
                    
                    {/* Upload Button */}
                    <button
                        type="button"
                        onClick={() => !disabled && fileInputRef.current?.click()}
                        disabled={disabled}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2 mr-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''}` : 'Add images'}
                    </button>
                </div>

                {/* Drag overlay */}
                {dragActive && (
                    <div className="absolute inset-0 bg-indigo-50 bg-opacity-90 flex items-center justify-center rounded-lg">
                        <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mt-2 text-sm text-indigo-600 font-medium">Drop images here</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {error}
                </div>
            )}

            {/* Helper Text */}
            <div className="text-xs text-gray-500">
                {images.length === 0 ? (
                    <>Enter JIRA issue key and optionally drag & drop images or click "Add images" • PNG, JPG, GIF, WebP up to {maxSizePerImage}MB each (max {maxImages} images)</>
                ) : (
                    <>Will use GPT-4o Vision model for enhanced analysis with {images.length} image{images.length > 1 ? 's' : ''}</>
                )}
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {images.map((image, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img
                                    src={image.preview}
                                    alt={image.originalName}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            {/* Remove button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(index);
                                }}
                                disabled={disabled}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                ×
                            </button>
                            
                            {/* Image info */}
                            <div className="mt-1">
                                <p className="text-xs text-gray-600 truncate" title={image.originalName}>
                                    {image.originalName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(image.size)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}