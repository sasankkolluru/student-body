import { useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
// Custom Button component with variant support
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  children: React.ReactNode;
  className?: string;
}

const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Import the Poll type from the correct path
import type { Poll } from '../../../../src/types/poll';
import { format } from 'date-fns';
import { PollForm } from './PollForm';
import { Modal } from '../../../components/ui/Modal';

interface PollListProps {
  polls: Poll[];
  onEdit: (poll: Poll) => void;
  onDelete: (id: string) => void;
  onVote: (pollId: string, optionId: string) => void;
  onCreate: (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalVotes'>) => Promise<boolean>;
  isLoading: boolean;
}

export const PollList = ({
  polls,
  onEdit,
  onDelete,
  // onVote is currently not used but kept for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onVote: _onVote, // Prefix with underscore to indicate it's intentionally unused
  onCreate,
  isLoading,
}: PollListProps) => {
  const handleCreateNewPoll = async (pollData: Omit<Poll, 'id' | 'createdAt' | 'totalVotes'>) => {
    const success = await onCreate(pollData);
    if (success) {
      setShowCreateModal(false);
    }
    return success;
  };
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      onDelete(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const getPollStatus = (poll: Poll) => {
    if (!poll.isActive) return 'Inactive';
    if (poll.endDate && new Date(poll.endDate) < new Date()) return 'Ended';
    return 'Active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Ended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && polls.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Polls</h2>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </Button>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">No polls found. Create your first poll!</p>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {polls.map((poll) => (
              <li key={poll.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">{poll.question}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          getPollStatus(poll)
                        )}`}
                      >
                        {getPollStatus(poll)}
                      </span>
                    </div>
                    {poll.description && (
                      <p className="mt-1 text-sm text-gray-500">{poll.description}</p>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>Total Votes: {poll.totalVotes}</span>
                      <span className="mx-2">•</span>
                      <span>
                        Created: {format(new Date(poll.createdAt), 'MMM d, yyyy')}
                      </span>
                      {poll.endDate && (
                        <>
                          <span className="mx-2">•</span>
                          <span>
                            Ends: {format(new Date(poll.endDate), 'MMM d, yyyy')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(poll)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      title="Edit poll"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(poll.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Delete poll"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {editingPoll?.id === poll.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Edit Poll</h4>
                    <PollForm
                      initialData={poll}
                      onSubmit={(updatedPoll) => {
                        onEdit({ ...poll, ...updatedPoll });
                        setEditingPoll(null);
                      }}
                      onCancel={() => setEditingPoll(null)}
                      isSubmitting={isLoading}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create Poll Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Poll"
        maxWidth="max-w-2xl"
      >
        <PollForm
          onSubmit={handleCreateNewPoll}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={isLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Delete Poll"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this poll? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
