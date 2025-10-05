import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bell, 
  User, 
  LogOut,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  registered: boolean;
  registrationStatus?: 'pending' | 'approved' | 'rejected';
}

interface Notification {
  id: string;
  message: string;
  type: 'registration' | 'event' | 'system';
  read: boolean;
  createdAt: string;
}

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const quickStats = [
    { icon: Calendar, label: 'Events Registered', value: '3', color: 'text-blue-600' },
    { icon: Vote, label: 'Votes Cast', value: '2', color: 'text-green-600' },
    { icon: Lightbulb, label: 'Ideas Submitted', value: '1', color: 'text-purple-600' },
    { icon: Award, label: 'Achievements', value: '5', color: 'text-orange-600' }
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'vote',
      title: 'Voted in "Campus Dining Preferences"',
      time: '2 hours ago',
      icon: Vote,
      color: 'text-green-600 bg-green-100'
    },
    {
      id: '2',
      type: 'event',
      title: 'Registered for Annual Cultural Festival',
      time: '1 day ago',
      icon: Calendar,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: '3',
      type: 'idea',
      title: 'Submitted "Green Campus Initiative"',
      time: '3 days ago',
      icon: Lightbulb,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  const upcomingEvents = events.slice(0, 3);
  const activeVotes = activePolls.slice(0, 2);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Welcome back, {currentUser.name.split(' ')[0]}!
              </h1>
              <p className="text-gray-600 mt-2">
                Here's what's happening in your student community
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell size={16} className="mr-2" />
                Notifications
              </Button>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {quickStats.map((stat, index) => (
            <Card key={stat.label}>
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} mr-4`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                          <activity.icon size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{activity.title}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Clock size={12} className="mr-1" />
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Activity
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Upcoming Events</h2>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString()} at {event.time}
                          </div>
                          <div className="text-sm text-gray-500">{event.location}</div>
                        </div>
                        <Button size="sm" variant="outline">Register</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Active Polls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Polls</h2>
                  <div className="space-y-4">
                    {activeVotes.map((poll) => (
                      <div key={poll.id} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">{poll.title}</h3>
                        <div className="text-sm text-gray-600 mb-3">
                          {poll.totalVotes} votes • Ends {new Date(poll.endDate).toLocaleDateString()}
                        </div>
                        <Button size="sm" className="w-full">Vote Now</Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Polls
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Lightbulb size={16} className="mr-2" />
                      Submit New Idea
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle size={16} className="mr-2" />
                      Contact Council
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar size={16} className="mr-2" />
                      Browse Events
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users size={16} className="mr-2" />
                      Join Discussion
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Achievements</h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        🏆
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Active Participant</div>
                        <div className="text-xs text-gray-500">Voted in 5+ polls</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        💡
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Idea Generator</div>
                        <div className="text-xs text-gray-500">Submitted approved idea</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        🎯
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Event Enthusiast</div>
                        <div className="text-xs text-gray-500">Attended 3+ events</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Engagement Level</h3>
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This Month</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
                <p className="text-xs text-gray-500">+12% from last month</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Participation Score</h3>
                <CheckCircle className="text-blue-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">4.7/5</div>
              <p className="text-xs text-gray-500">Based on activity and feedback</p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Impact Points</h3>
                <Award className="text-purple-600" size={20} />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">1,247</div>
              <p className="text-xs text-gray-500">Earned through contributions</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};