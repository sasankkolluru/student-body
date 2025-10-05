import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Image as ImageIcon, Download, X, Plus, ArrowLeft, ArrowRight, Heart, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addGalleryComment, deleteGallery, deleteGalleryComment, listGallery, toggleLikeGallery, uploadGallery, type GalleryItem, API_BASE } from '../lib/api';
import { io, Socket } from 'socket.io-client';

type GalleryImage = GalleryItem;

const categories = [
  'Campus Life',
  'Student Activities Council',
  'Vignan Sports Contingent',
  'Entrepreneurship Cell',
  'NCC',
  'University Extension Activities Council - National Service Scheme',
  'Alma Connects',
  'Anti-Ragging Committee'
];

const Gallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Campus Life');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [newImage, setNewImage] = useState({
    title: '',
    description: '',
    file: null as File | null,
    category: 'Campus Life'
  });
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [commentText, setCommentText] = useState('');
  const backendOrigin = useMemo(() => { try { return new URL(API_BASE).origin; } catch { return window.location.origin; } }, []);

  const makeUrl = (u: string) => {
    if (!u) return u;
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/')) return `${backendOrigin}${u}`;
    return `${backendOrigin}/${u}`;
  };

  const loadImages = async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await listGallery(category);
      setImages(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages(selectedCategory);
    const socket = io(backendOrigin, { withCredentials: true });
    socketRef.current = socket;
    socket.on('gallery:new', (doc: GalleryImage) => setImages(prev => [doc, ...prev]));
    socket.on('gallery:update', (doc: GalleryImage) => setImages(prev => prev.map(i => i._id === doc._id ? doc : i)));
    socket.on('gallery:delete', ({ _id }: { _id: string }) => setImages(prev => prev.filter(i => i._id !== _id)));
    socket.on('gallery:like', ({ _id, likes, likedBy }: { _id: string; likes: number; likedBy: string[] }) => setImages(prev => prev.map(i => i._id === _id ? { ...i, likes, likedBy } : i)));
    socket.on('gallery:comment', ({ _id, comment }: { _id: string; comment: GalleryImage['comments'][number] }) => setImages(prev => prev.map(i => i._id === _id ? { ...i, comments: [...i.comments, comment] } : i)));
    socket.on('gallery:comment:delete', ({ _id, commentId }: { _id: string; commentId: string }) => setImages(prev => prev.map(i => i._id === _id ? { ...i, comments: i.comments.filter(c => c._id !== commentId) } : i)));
    return () => { socket.disconnect(); socketRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const filteredImages = useMemo(() => images.filter(img => img.category === selectedCategory), [images, selectedCategory]);

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage.file || !currentUser) return;

    setUploading(true);
    try {
      await uploadGallery({ image: newImage.file, title: newImage.title, description: newImage.description, category: newImage.category });

      // Reset form
      setNewImage({
        title: '',
        description: '',
        file: null,
        category: 'Campus Life'
      });
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await deleteGallery(imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const openImageViewer = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    setIsViewerOpen(true);
    setCommentText('');
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < filteredImages.length) {
      setSelectedImage(filteredImages[newIndex]);
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">College Gallery</h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore the vibrant life at our campus through these moments
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => { setSelectedCategory(category); loadImages(category); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Button (Admin Only) */}
        {isAdmin && (
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Upload Image
            </button>
          </div>
        )}

        {/* Image Grid */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map((image, index) => (
              <div key={image._id} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <div 
                  className="aspect-w-16 aspect-h-9 bg-gray-200 cursor-pointer"
                  onClick={() => openImageViewer(image, index)}
                >
                  <img
                    src={makeUrl(image.url)}
                    alt={image.title}
                    className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{image.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{image.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-3 items-center">
                      <button
                        className={`flex items-center text-sm ${image.likedBy.includes(currentUser?.id || '') ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                        onClick={(e) => { e.stopPropagation(); toggleLikeGallery(image._id).catch(()=>{}); }}
                      >
                        <Heart className="h-4 w-4 mr-1" /> {image.likes}
                      </button>
                      <a
                        href={makeUrl(image.url)}
                        download
                        className="text-gray-400 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image._id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No images found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading a new image.
            </p>
            {isAdmin && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  New Image
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Upload New Image</h2>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleImageUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={newImage.category}
                      onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      required
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newImage.title}
                      onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="Enter image title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newImage.description}
                      onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="Enter image description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setNewImage({ ...newImage, file: e.target.files[0] });
                                }
                              }}
                              required
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        {newImage.file && (
                          <p className="text-sm text-gray-900 mt-2">
                            Selected: {newImage.file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:col-start-2 sm:text-sm ${
                      uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {isViewerOpen && selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsViewerOpen(false)}
          >
            <div className="relative max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-white">{selectedImage.title}</h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsViewerOpen(false);
                  }}
                  className="text-white hover:text-gray-300"
                >
                  <X className="h-8 w-8" />
                </button>
              </div>
              
              <div className="relative flex-1 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                  disabled={currentIndex === 0}
                  className={`absolute left-4 p-2 rounded-full ${currentIndex === 0 ? 'text-gray-500' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
                >
                  <ArrowLeft className="h-8 w-8" />
                </button>
                
                <img
                  src={makeUrl(selectedImage.url)}
                  alt={selectedImage.title}
                  className="max-h-[70vh] max-w-full object-contain"
                />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                  disabled={currentIndex === filteredImages.length - 1}
                  className={`absolute right-4 p-2 rounded-full ${currentIndex === filteredImages.length - 1 ? 'text-gray-500' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
                >
                  <ArrowRight className="h-8 w-8" />
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-gray-900 bg-opacity-50 rounded-lg">
                <p className="text-white">{selectedImage.description}</p>
                <div className="mt-2 flex justify-between items-center text-sm text-gray-300">
                  <span>{selectedImage.category}</span>
                  <a
                    href={makeUrl(selectedImage.url)}
                    download
                    className="flex items-center text-blue-400 hover:text-blue-300"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
                {/* Comments */}
                <div className="mt-4">
                  <div className="flex items-center text-gray-300 mb-2">
                    <MessageSquare className="h-4 w-4 mr-2" /> Comments
                  </div>
                  {selectedImage.comments.length === 0 ? (
                    <div className="text-gray-400 text-sm">No comments yet.</div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-auto">
                      {selectedImage.comments.map((c) => (
                        <div key={c._id} className="bg-gray-800/60 p-2 rounded flex items-start justify-between">
                          <div>
                            <div className="text-sm text-white">{c.text}</div>
                            <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
                          </div>
                          {(isAdmin || c.userId === currentUser?.id) && (
                            <button className="text-gray-400 hover:text-red-400 ml-3" onClick={() => deleteGalleryComment(selectedImage._id, c._id).catch(()=>{})}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment" className="flex-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none" />
                    <button onClick={() => { if (commentText.trim()) { addGalleryComment(selectedImage._id, commentText.trim()).then(()=>setCommentText('')); } }} className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm">Post</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
