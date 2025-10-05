import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Calendar, Award } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { studentBodies } from '../data/mockData';

export const Councils: React.FC = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Student Bodies & Councils
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Discover the diverse organizations that make up our vibrant campus community. 
            Each council brings unique opportunities for leadership, service, and personal growth.
          </motion.p>
        </div>

        {/* Councils Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {studentBodies.map((council, index) => (
            <motion.div
              key={council.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="h-full group">
                <div className="relative overflow-hidden">
                  <div className={`h-32 bg-gradient-to-br ${council.color} flex items-center justify-center text-white transition-transform group-hover:scale-105`}>
                    <span className="text-6xl">{council.icon}</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded text-sm font-medium">
                      {council.abbreviation}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{council.name}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                    {council.description}
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div>
                      <Users size={16} className="text-gray-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">250+</div>
                      <div className="text-xs text-gray-500">Members</div>
                    </div>
                    <div>
                      <Calendar size={16} className="text-gray-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">15+</div>
                      <div className="text-xs text-gray-500">Events</div>
                    </div>
                    <div>
                      <Award size={16} className="text-gray-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">5+</div>
                      <div className="text-xs text-gray-500">Awards</div>
                    </div>
                  </div>

                  <Link to={`/councils/${council.id}`} className="block">
                    <Button className="w-full group">
                      Learn More
                      <ArrowRight 
                        size={16} 
                        className="ml-2 transition-transform group-hover:translate-x-1" 
                      />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* How to Join Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <Card>
            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">How to Get Involved</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Explore & Choose</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Browse through different student bodies and find ones that align with your interests and goals.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-bold text-xl">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect & Apply</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Reach out to council members, attend meetings, and submit your application to join.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-xl">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Engage & Lead</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Participate in activities, contribute to initiatives, and develop your leadership skills.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Join a Student Body?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Being part of a student council offers numerous benefits for personal and professional development
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Leadership Skills',
                description: 'Develop essential leadership abilities through hands-on experience'
              },
              {
                icon: '🤝',
                title: 'Networking',
                description: 'Build valuable connections with peers, faculty, and professionals'
              },
              {
                icon: '📈',
                title: 'Career Growth',
                description: 'Enhance your resume with meaningful extracurricular involvement'
              },
              {
                icon: '🌟',
                title: 'Make Impact',
                description: 'Create positive change in your campus community'
              }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="p-6">
                    <div className="text-4xl mb-4">{benefit.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Get Involved?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Take the first step towards becoming a campus leader and making a meaningful impact
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Join a Council Today
            </Button>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white hover:text-blue-600">
                Get More Information
              </Button>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};