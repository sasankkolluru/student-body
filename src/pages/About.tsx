import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Users, Award } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { councilMembers } from '../data/mockData';

export const About: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Leadership Excellence',
      description: 'Fostering strong leadership skills and empowering students to take initiative in campus improvement.'
    },
    {
      icon: Eye,
      title: 'Transparent Governance',
      description: 'Maintaining open communication and accountability in all council decisions and activities.'
    },
    {
      icon: Users,
      title: 'Inclusive Community',
      description: 'Creating an environment where every student voice is heard and valued regardless of background.'
    },
    {
      icon: Award,
      title: 'Excellence in Service',
      description: 'Committed to providing exceptional service and support to enhance the student experience.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            About Our Council
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-blue-100"
          >
            Dedicated to representing student interests, fostering community engagement, and creating positive change across our campus
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To serve as the bridge between students and administration, advocating for student rights, 
                organizing meaningful events, and creating opportunities for academic, personal, and 
                professional growth within our campus community.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We are committed to fostering an inclusive environment where every student can thrive, 
                contribute, and make lasting connections that extend beyond their college years.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-700 leading-relaxed">
                  To be the catalyst for positive transformation on campus, creating a vibrant, 
                  inclusive, and empowering environment where every student can reach their full 
                  potential and contribute meaningfully to the college community.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do and every decision we make
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <value.icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Council Members */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Your Council</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Dedicated leaders working tirelessly to represent your interests and enhance campus life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {councilMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="p-6">
                    <div className="relative mb-4">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto object-cover"
                      />
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          {member.position}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{member.department}</p>
                    <p className="text-gray-500 text-sm mb-3">Year {member.year}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>
                    <div className="text-blue-600 text-sm font-medium">{member.contact}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizational Chart */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Organizational Structure</h2>
            <p className="text-xl text-gray-600">
              Understanding how our council operates and serves the student body
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex flex-col items-center space-y-8">
              {/* President */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg px-6 py-4">
                  <div className="text-lg font-bold">President</div>
                  <div className="text-sm opacity-90">Sarah Chen</div>
                </div>
              </motion.div>

              {/* Executive Level */}
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  { title: 'Vice President', name: 'Marcus Rodriguez' },
                  { title: 'Secretary', name: 'Emily Watson' },
                  { title: 'Treasurer', name: 'David Kim' }
                ].map((role, index) => (
                  <motion.div
                    key={role.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg px-4 py-3">
                      <div className="font-semibold">{role.title}</div>
                      <div className="text-sm opacity-90">{role.name}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Committees */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                {[
                  'Academic Affairs',
                  'Student Activities',
                  'Campus Services',
                  'Communications'
                ].map((committee, index) => (
                  <motion.div
                    key={committee}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg px-3 py-2">
                      <div className="text-sm font-medium">{committee}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History & Achievements */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our History</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Founded in 1995</h3>
                  <p className="text-gray-600">
                    Established to give students a stronger voice in campus governance and decision-making processes.
                  </p>
                </div>
                <div className="border-l-4 border-purple-600 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Digital Transformation</h3>
                  <p className="text-gray-600">
                    Pioneered online voting systems and digital platforms for student engagement in 2020.
                  </p>
                </div>
                <div className="border-l-4 border-green-600 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sustainability Initiative</h3>
                  <p className="text-gray-600">
                    Led campus-wide environmental programs resulting in 40% reduction in waste by 2024.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Recent Achievements</h2>
              <div className="space-y-4">
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      National Recognition Award 2024
                    </h3>
                    <p className="text-gray-600">
                      Received the Outstanding Student Government Award for innovation in campus engagement.
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Campus Safety Improvements
                    </h3>
                    <p className="text-gray-600">
                      Successfully advocated for enhanced lighting and emergency call stations across campus.
                    </p>
                  </div>
                </Card>
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Mental Health Support Program
                    </h3>
                    <p className="text-gray-600">
                      Launched comprehensive mental wellness initiatives serving 1,000+ students annually.
                    </p>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};