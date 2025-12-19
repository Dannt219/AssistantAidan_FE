import React, { useState, useRef, useCallback } from 'react';

interface UploadedImage {
    file: File;
    preview: string;
    originalName: string;
    size: number;
}

interface ImageUploadProps {
    onImagesChange: (images: File[]) => void;
    maxImages?: number;
    maxSizePerImage?: number; // in MB
    disabled?: boolean;
}

export default function ImageUpload({ 
    onImagesChange, 
    maxImages = 5, 
    maxSizePerImage = 10,
    disabled = false 
}: ImageUploadProps) {
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`;
        }

        // Check file size
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

        // Check total count
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

            // Check for duplicates
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
        
        // Notify parent component
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
        
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [processFiles, disabled]);

    const removeImage = useCallback((index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        
        // Revoke object URL to prevent memory leaks
        URL.revokeObjectURL(images[index].preview);
        
        setImages(updatedImages);
        setError('');
        onImagesChange(updatedImages.map(img => img.file));
    }, [images, onImagesChange]);

    const clearAllImages = useCallback(() => {
        // Revoke all object URLs
        images.forEach(img => URL.revokeObjectURL(img.preview));
        
        setImages([]);
        setError('');
        onImagesChange([]);
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
            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                        ? 'border-indigo-500 bg-indigo-50'
                        : error
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !disabled && fileInputRef.current?.click()}
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
                
                <div className="text-center">
                    <svg
                        className={`mx-auto h-12 w-12 ${
                            error ? 'text-red-400' : 'text-gray-400'
                        }`}
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                    >
                        <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <div className="mt-4">
                        <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-600'}`}>
                            {error || (
                                <>
                                    <span className="font-medium">Click to upload</span> or drag and drop
                                </>
                            )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF, WebP up to {maxSizePerImage}MB each (max {maxImages} images)
                        </p>
                    </div>
                </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                            Uploaded Images ({images.length}/{maxImages})
                        </h4>
                        <button
                            onClick={clearAllImages}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                            disabled={disabled}
                        >
                            Clear All
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
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
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                    disabled={disabled}
                                >
                                    ×
                                </button>
                                
                                {/* Image info */}
                                <div className="mt-2">
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
                </div>
            )}
        </div>
    );
}