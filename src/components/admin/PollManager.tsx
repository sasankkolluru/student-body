import React, { useState, useEffect } from 'react';
import { usePolls } from '../../contexts/PollContext';
import { useAuth } from '../../contexts/AuthContext';
import { Poll } from '../../types/poll';
import { format, isAfter, isBefore } from 'date-fns';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { DatePicker } from '../ui/DatePicker';

export const PollManager: React.FC = () => {
  const { 
    polls, 
    activePolls, 
    upcomingPolls, 
    endedPolls, 
    loading, 
    createPoll, 
    startPoll, 
    endPoll, 
    deletePoll 
  } = usePolls();
  
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPoll, setNewPoll] = useState<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    options: { text: string }[];
  }>({
    title: '',
    description: '',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days from now
    options: [{ text: '' }, { text: '' }] // Start with 2 empty options
  });
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'ended'>('active');

  const handleCreatePoll = async () => {
    if (!newPoll.title.trim() || newPoll.options.length < 2) {
      alert('Please provide a title and at least 2 options');
      return;
    }
    
    const result = await createPoll({
      ...newPoll,
      options: newPoll.options.filter(opt => opt.text.trim() !== '')
    });
    
    if (result.success) {
      setIsCreateModalOpen(false);
      setNewPoll({
        title: '',
        description: '',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        options: [{ text: '' }, { text: '' }]
      });
    } else {
      alert(result.message || 'Failed to create poll');
    }
  };

  const handleStartPoll = async (pollId: string) => {
    if (window.confirm('Are you sure you want to start this poll?')) {
      const result = await startPoll(pollId);
      if (!result.success) {
        alert(result.message || 'Failed to start poll');
      }
    }
  };

  const handleEndPoll = async (pollId: string) => {
    if (window.confirm('Are you sure you want to end this poll?')) {
      const result = await endPoll(pollId);
      if (!result.success) {
        alert(result.message || 'Failed to end poll');
      }
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      const result = await deletePoll(pollId);
      if (!result.success) {
        alert(result.message || 'Failed to delete poll');
      }
    }
  };

  const renderPollCard = (poll: Poll) => {
    const startDate = new Date(poll.startDate);
    const endDate = new Date(poll.endDate);
    const now = new Date();
    const isUpcoming = isAfter(startDate, now);
    const isActive = !isUpcoming && isBefore(now, endDate);
    const isEnded = !isActive && !isUpcoming;

    return (
      <div key={poll._id} className="border rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{poll.title}</h3>
            {poll.description && <p className="text-gray-600 mt-1">{poll.description}</p>}
            <div className="mt-2 text-sm text-gray-500">
              <div>Starts: {format(startDate, 'PPpp')}</div>
              <div>Ends: {format(endDate, 'PPpp')}</div>
              <div className="mt-1">
                Status: <span className={`font-medium ${
                  isActive ? 'text-green-600' : isUpcoming ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Ended'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {isUpcoming && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleStartPoll(poll._id)}
              >
                Start Now
              </Button>
            )}
            {isActive && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleEndPoll(poll._id)}
              >
                End Now
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleDeletePoll(poll._id)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Delete
            </Button>
          </div>
        </div>
        
        {poll.options && poll.options.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Options:</h4>
            <ul className="space-y-1">
              {poll.options.map((option, idx) => (
                <li key={`${poll._id}-opt-${idx}`} className="flex items-center">
                  <span className="mr-2">•</span>
                  <span>{option.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Poll Management</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create New Poll
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active ({activePolls.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming ({upcomingPolls.length})
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ended'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ended ({endedPolls.length})
          </button>
        </nav>
      </div>

      {/* Polls List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'active' && (
            activePolls.length > 0 ? (
              activePolls.map(renderPollCard)
            ) : (
              <div className="text-center py-8 text-gray-500">No active polls</div>
            )
          )}
          
          {activeTab === 'upcoming' && (
            upcomingPolls.length > 0 ? (
              upcomingPolls.map(renderPollCard)
            ) : (
              <div className="text-center py-8 text-gray-500">No upcoming polls</div>
            )
          )}
          
          {activeTab === 'ended' && (
            endedPolls.length > 0 ? (
              endedPolls.map(renderPollCard)
            ) : (
              <div className="text-center py-8 text-gray-500">No ended polls</div>
            )
          )}
        </div>
      )}

      {/* Create Poll Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Poll"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll Title *
            </label>
            <Input
              value={newPoll.title}
              onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
              placeholder="Enter poll title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <Textarea
              value={newPoll.description}
              onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
              placeholder="Enter poll description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <DatePicker
                selected={new Date(newPoll.startDate)}
                onChange={(date) => {
                  if (date) {
                    const newDate = new Date(date);
                    // If the new start date is after the current end date, update end date too
                    const endDate = new Date(newPoll.endDate);
                    if (newDate > endDate) {
                      endDate.setDate(newDate.getDate() + 1);
                      setNewPoll({
                        ...newPoll,
                        startDate: newDate.toISOString(),
                        endDate: endDate.toISOString()
                      });
                    } else {
                      setNewPoll({
                        ...newPoll,
                        startDate: newDate.toISOString()
                      });
                    }
                  }
                }}
                minDate={new Date()}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <DatePicker
                selected={new Date(newPoll.endDate)}
                onChange={(date) => {
                  if (date) {
                    setNewPoll({
                      ...newPoll,
                      endDate: new Date(date).toISOString()
                    });
                  }
                }}
                minDate={new Date(newPoll.startDate)}
                showTimeSelect
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Options *
              </label>
              <button
                type="button"
                onClick={() => {
                  if (newPoll.options.length < 10) {
                    setNewPoll({
                      ...newPoll,
                      options: [...newPoll.options, { text: '' }]
                    });
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={newPoll.options.length >= 10}
              >
                + Add Option
              </button>
            </div>
            
            <div className="space-y-2">
              {newPoll.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...newPoll.options];
                      newOptions[index].text = e.target.value;
                      setNewPoll({ ...newPoll, options: newOptions });
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {newPoll.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = [...newPoll.options];
                        newOptions.splice(index, 1);
                        setNewPoll({ ...newPoll, options: newOptions });
                      }}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {newPoll.options.length < 2 && (
              <p className="mt-1 text-sm text-red-600">At least 2 options are required</p>
            )}
            
            {newPoll.options.length >= 10 && (
              <p className="mt-1 text-sm text-gray-500">Maximum 10 options allowed</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreatePoll}
              disabled={
                !newPoll.title.trim() || 
                newPoll.options.length < 2 ||
                newPoll.options.some(opt => !opt.text.trim())
              }
            >
              Create Poll
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
