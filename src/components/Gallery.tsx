import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiTrash2, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface GalleryImage {
  id: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  isApproved: boolean;
}

interface GalleryProps {
  isAdmin?: boolean;
  userId: string;
}

const Gallery: React.FC<GalleryProps> = ({ isAdmin = false, userId }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Fetch gallery images
  const fetchImages = useCallback(async () => {
    try {
      // In a real app, this would be an API call to your backend
      // const response = await fetch('/api/gallery');
      // const data = await response.json();
      // setImages(data);
      
      // Mock data for demonstration
      setImages([
        {
          id: '1',
          url: 'https://via.placeholder.com/300',
          uploadedBy: 'user1',
          uploadedAt: new Date().toISOString(),
          isApproved: isAdmin || Math.random() > 0.5 // Random approval for demo
        },
        // Add more mock images as needed
      ]);
    } catch (err) {
      setError('Failed to load gallery images');
      console.error('Error fetching images:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    
    const file = acceptedFiles[0];
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // In a real app, you would upload to your server
      // const formData = new FormData();
      // formData.append('image', file);
      // formData.append('userId', userId);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add the new image to the gallery
      const newImage: GalleryImage = {
        id: Date.now().toString(),
        url: URL.createObjectURL(file),
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        isApproved: !isAdmin // Auto-approve for admins, pending for students
      };
      
      setImages(prev => [newImage, ...prev]);
      setUploadProgress(0);
      
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [isAdmin, userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isUploading
  });

  // Handle image approval (admin only)
  const handleApproveImage = async (imageId: string, approve: boolean) => {
    try {
      // In a real app, this would be an API call to your backend
      // await fetch(`/api/gallery/${imageId}/approve`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ approved: approve })
      // });
      
      // Update local state
      setImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, isApproved: approve } : img
        )
      );
      
    } catch (err) {
      setError('Failed to update image status');
      console.error('Approval error:', err);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      // In a real app, this would be an API call to your backend
      // await fetch(`/api/gallery/${imageId}`, { method: 'DELETE' });
      
      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId));
      
      // Close the modal if the deleted image is currently selected
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
      
    } catch (err) {
      setError('Failed to delete image');
      console.error('Deletion error:', err);
    }
  };

  // Filter images based on user role
  const filteredImages = isAdmin 
    ? images 
    : images.filter(img => img.isApproved || img.uploadedBy === userId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gallery</h1>
        {isAdmin && (
          <div className="text-sm text-gray-500">
            {images.filter(img => !img.isApproved).length} pending approval
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-600">
            {isDragActive 
              ? 'Drop the image here...' 
              : 'Drag & drop an image here, or click to select'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            JPG, PNG, GIF up to 5MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-700 hover:text-red-900"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredImages.map((image) => (
          <div 
            key={image.id} 
            className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            onClick={() => setSelectedImage(image)}
          >
            <img 
              src={image.url} 
              alt="Gallery item" 
              className="w-full h-40 object-cover"
            />
            
            {/* Admin Controls */}
            {isAdmin && !image.isApproved && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveImage(image.id, true);
                  }}
                  className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                  title="Approve"
                >
                  <FiCheck size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.id);
                  }}
                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <FiX size={16} />
                </button>
              </div>
            )}
            
            {/* User Controls */}
            {!isAdmin && image.uploadedBy === userId && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(image.id);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete"
              >
                <FiTrash2 size={14} />
              </button>
            )}
            
            {/* Pending Badge */}
            {!image.isApproved && (
              <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                Pending
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredImages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No images found. Upload some images to get started.
        </div>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <motion.div 
              className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src={selectedImage.url} 
                alt="Full size" 
                className="w-full max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      Uploaded by: {selectedImage.uploadedBy}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(selectedImage.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {(isAdmin || selectedImage.uploadedBy === userId) && (
                      <button
                        onClick={() => handleDeleteImage(selectedImage.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                    {isAdmin && !selectedImage.isApproved && (
                      <button
                        onClick={() => handleApproveImage(selectedImage.id, true)}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                        title="Approve"
                      >
                        <FiCheck />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                      title="Close"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
