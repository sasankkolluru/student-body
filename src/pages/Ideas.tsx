import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ThumbsUp, MessageCircle, Send, Filter, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ideas } from '../data/mockData';
import { Idea } from '../types';

export const Ideas: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: ''
  });

  const statuses = ['all', 'pending', 'approved', 'rejected', 'implemented'];

  const filteredIdeas = ideas.filter(idea => 
    selectedStatus === 'all' || idea.status === selectedStatus
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'implemented': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitIdea = () => {
    // In a real app, this would make an API call
    console.log('Submitting idea:', newIdea);
    setIsSubmitModalOpen(false);
    setNewIdea({ title: '', description: '', category: '' });
    alert('Idea submitted successfully!');
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Student Ideas Portal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto mb-8"
          >
            Share your innovative ideas to improve campus life and help shape the future of our community
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              size="lg" 
              onClick={() => setIsSubmitModalOpen(true)}
              className="text-lg px-8"
            >
              <Plus size={20} className="mr-2" />
              Submit New Idea
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filter Ideas</h2>
            <div className="flex items-center space-x-4">
              <Filter size={20} className="text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Ideas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {filteredIdeas.map((idea, index) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 pr-4">{idea.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(idea.status)}`}>
                      {idea.status.charAt(0).toUpperCase() + idea.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium mr-3">
                      {idea.category}
                    </span>
                    <span>by {idea.submittedBy}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(idea.submittedDate).toLocaleDateString()}</span>
                  </div>

                  <p className="text-gray-600 mb-6 leading-relaxed">{idea.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                        <ThumbsUp size={16} />
                        <span className="text-sm">{idea.votes}</span>
                      </button>
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                        <MessageCircle size={16} />
                        <span className="text-sm">{idea.comments.length}</span>
                      </button>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>

                  {/* Comments Preview */}
                  {idea.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-2">
                        {idea.comments.slice(0, 2).map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                              <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600">{comment.text}</p>
                          </div>
                        ))}
                        {idea.comments.length > 2 && (
                          <button className="text-sm text-blue-600 hover:text-blue-700">
                            View {idea.comments.length - 2} more comments
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">47</div>
              <div className="text-gray-600">Ideas Submitted</div>
            </div>
          </Card>
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">12</div>
              <div className="text-gray-600">Approved</div>
            </div>
          </Card>
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">8</div>
              <div className="text-gray-600">Implemented</div>
            </div>
          </Card>
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">23</div>
              <div className="text-gray-600">In Review</div>
            </div>
          </Card>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full text-white mb-4">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Submit Idea</h3>
              <p className="text-gray-600 text-sm">Share your innovative ideas to improve campus life.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 rounded-full text-white mb-4">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Community Vote</h3>
              <p className="text-gray-600 text-sm">Students vote and comment on submitted ideas.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-full text-white mb-4">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Council Review</h3>
              <p className="text-gray-600 text-sm">Student council reviews and evaluates popular ideas.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-full text-white mb-4">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Implementation</h3>
              <p className="text-gray-600 text-sm">Approved ideas are implemented to benefit students.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Submit Idea Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit New Idea"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idea Title
            </label>
            <input
              type="text"
              value={newIdea.title}
              onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Give your idea a catchy title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={newIdea.category}
              onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              <option value="Academics">Academics</option>
              <option value="Environment">Environment</option>
              <option value="Technology">Technology</option>
              <option value="Campus Life">Campus Life</option>
              <option value="Sports & Recreation">Sports & Recreation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newIdea.description}
              onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your idea in detail. What problem does it solve? How would it benefit students?"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Lightbulb className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Tips for a great idea:</strong>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Be specific about the problem you're solving</li>
                  <li>Explain how it benefits the student community</li>
                  <li>Consider feasibility and implementation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={handleSubmitIdea}
              disabled={!newIdea.title || !newIdea.description || !newIdea.category}
              className="flex-1"
            >
              <Send size={16} className="mr-2" />
              Submit Idea
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};