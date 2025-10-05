import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="text-xl font-bold">Student Council</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering students, fostering community, and creating positive change on campus through collaborative leadership and innovative initiatives.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-gray-400 hover:text-white transition-colors text-sm">
                About Council
              </Link>
              <Link to="/events" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Events
              </Link>
              <Link to="/voting" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Voting
              </Link>
              <Link to="/ideas" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Submit Ideas
              </Link>
              <Link to="/faq" className="block text-gray-400 hover:text-white transition-colors text-sm">
                FAQ
              </Link>
            </div>
          </div>

          {/* Student Bodies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Student Bodies</h3>
            <div className="space-y-2">
              <Link to="/councils/sac" className="block text-gray-400 hover:text-white transition-colors text-sm">
                Student Affairs Council
              </Link>
              <Link to="/councils/ueac" className="block text-gray-400 hover:text-white transition-colors text-sm">
                UEAC
              </Link>
              <Link to="/councils/ecell" className="block text-gray-400 hover:text-white transition-colors text-sm">
                E-Cell
              </Link>
              <Link to="/councils/ncc" className="block text-gray-400 hover:text-white transition-colors text-sm">
                NCC
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-400 text-sm">council@college.edu</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-gray-400" />
                <span className="text-gray-400 text-sm">(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-400 text-sm">Student Center, Room 201</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex space-x-4 pt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 College Student Council. All rights reserved. Built with ❤️ for students.
          </p>
        </div>
      </div>
    </footer>
  );
};