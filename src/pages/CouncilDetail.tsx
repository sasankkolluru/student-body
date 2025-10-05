import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Users, Calendar, Target, Award } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ContactForm } from '../components/common/ContactForm';
import { studentBodies, councilMembers, events } from '../data/mockData';

export const CouncilDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const council = studentBodies.find(body => body.id === id);

  if (!council) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Council Not Found</h1>
          <Link to="/councils">
            <Button>Back to Councils</Button>
          </Link>
        </div>
      </div>
    );
  }

  const councilEvents = events.filter(event => 
    event.organizer.toLowerCase().includes(council.abbreviation.toLowerCase()) ||
    event.organizer.toLowerCase().includes(council.name.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className={`py-20 bg-gradient-to-br ${council.color} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/councils"
            className="inline-flex items-center text-white hover:text-gray-200 mb-8 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Councils
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">{council.icon}</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">{council.abbreviation}</h1>
            <h2 className="text-2xl md:text-3xl text-gray-200 mb-6">{council.name}</h2>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed">{council.description}</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* About Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">About {council.abbreviation}</h2>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-600 leading-relaxed mb-6">
                      The {council.name} ({council.abbreviation}) is dedicated to {council.description.toLowerCase()}. 
                      Our team works tirelessly to ensure that every student has the opportunity to engage, contribute, 
                      and benefit from the vibrant campus community.
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      Through various initiatives, programs, and events, we strive to create an inclusive environment 
                      where students can develop leadership skills, build meaningful connections, and make lasting 
                      contributions to our college community.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.section>

            {/* Mission & Vision */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <Target className="text-blue-600 mr-3" size={24} />
                      <h3 className="text-xl font-bold text-gray-900">Our Mission</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      To provide exceptional leadership and support services that enhance the student experience 
                      and foster personal and academic growth within our diverse campus community.
                    </p>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <Award className="text-purple-600 mr-3" size={24} />
                      <h3 className="text-xl font-bold text-gray-900">Our Vision</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      To be recognized as the premier student organization that empowers individuals, builds 
                      community, and creates positive change that extends beyond the college years.
                    </p>
                  </div>
                </Card>
              </div>
            </motion.section>

            {/* Events */}
            {councilEvents.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-gray-900">Our Events</h2>
                      <Link to="/events">
                        <Button variant="outline">View All Events</Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {councilEvents.slice(0, 2).map((event) => (
                        <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                          <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <Button size="sm">Register</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.section>
            )}

            {/* Contact Form */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                  <p className="text-gray-600 mb-8">
                    Have questions or suggestions? We'd love to hear from you. Send us a message and we'll get back to you soon.
                  </p>
                  <ContactForm />
                </div>
              </Card>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Info</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Users className="text-gray-400 mr-3" size={20} />
                      <span className="text-gray-600">500+ Active Members</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="text-gray-400 mr-3" size={20} />
                      <span className="text-gray-600">12+ Events This Year</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="text-gray-400 mr-3" size={20} />
                      <span className="text-gray-600">Excellence Award 2024</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-3" size={20} />
                      <span className="text-gray-600">{council.id}@college.edu</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Leadership Team */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Leadership Team</h3>
                  <div className="space-y-4">
                    {councilMembers.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-600">{member.position}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/about" className="mt-4 inline-block">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Members
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Recent Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Achievements</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-sm font-medium text-yellow-800">
                        🏆 Outstanding Organization Award
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">December 2024</div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-800">
                        🌱 Sustainability Initiative
                      </div>
                      <div className="text-xs text-green-600 mt-1">November 2024</div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">
                        📚 Academic Excellence Program
                      </div>
                      <div className="text-xs text-blue-600 mt-1">October 2024</div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};