import { useState, useEffect } from 'react';
import { Poll, PollOption } from '../../../types/poll';
import { Plus, X, Trash2, Edit } from 'lucide-react';
import { Button } from '../../ui/Button';

interface PollFormProps {
  initialData?: Omit<Poll, 'id' | 'createdAt' | 'totalVotes'>;
  onSubmit: (poll: Omit<Poll, 'id' | 'createdAt' | 'totalVotes'>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const PollForm = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: PollFormProps) => {
  const [question, setQuestion] = useState(initialData?.question || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>(
    initialData?.options.map(opt => ({
      id: opt.id,
      text: opt.text,
    })) || [{ id: '1', text: '' }]
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate || ''
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    if (options.length < 2) {
      newErrors.options = 'At least two options are required';
    } else {
      const hasEmptyOption = options.some(opt => !opt.text.trim());
      if (hasEmptyOption) {
        newErrors.options = 'Option text cannot be empty';
      }
      
      const uniqueOptions = new Set(options.map(opt => opt.text.toLowerCase()));
      if (uniqueOptions.size !== options.length) {
        newErrors.options = 'Options must be unique';
      }
    }
    
    if (endDate && new Date(endDate) < new Date()) {
      newErrors.endDate = 'End date must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    onSubmit({
      question,
      description,
      options: options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: initialData?.options.find(o => o.id === opt.id)?.votes || 0,
      })),
      isActive,
      endDate: endDate || undefined,
      createdBy: initialData?.createdBy || 'admin', // In a real app, this would be the current user's ID
    });
  };

  const addOption = () => {
    setOptions([...options, { id: Date.now().toString(), text: '' }]);
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(opt => (opt.id === id ? { ...opt, text } : opt)));
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(opt => opt.id !== id));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="question" className="block text-sm font-medium text-gray-700">
          Question *
        </label>
        <input
          type="text"
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className={`mt-1 block w-full rounded-md border ${
            errors.question ? 'border-red-300' : 'border-gray-300'
          } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2`}
          placeholder="Enter your question"
        />
        {errors.question && (
          <p className="mt-1 text-sm text-red-600">{errors.question}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          placeholder="Add a description (optional)"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Options *
          </label>
          <button
            type="button"
            onClick={addOption}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Option
          </button>
        </div>
        
        <div className="mt-2 space-y-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center">
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                className={`flex-1 rounded-md border ${
                  errors.options ? 'border-red-300' : 'border-gray-300'
                } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 mr-2`}
                placeholder={`Option ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={options.length <= 2}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title={options.length <= 2 ? 'At least two options are required' : 'Remove option'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        
        {errors.options && (
          <p className="mt-1 text-sm text-red-600">{errors.options}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date (Optional)
          </label>
          <input
            type="datetime-local"
            id="endDate"
            value={endDate}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Active Poll
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Poll' : 'Create Poll'}
        </Button>
      </div>
    </form>
  );
};
