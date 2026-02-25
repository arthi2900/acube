import React from "react";
import { Box } from "lucide-react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="gradient-hero border-t border-primary/20">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About A Cube */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 gradient-purple-blue rounded-lg flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                A Cube
              </h3>
            </div>
            <p className="text-white/80 text-sm">
              Smart, secure, and scalable online exam management system designed for educational institutions, NEET preparation, and schools.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Links
            </h3>
            <div className="text-white/80 space-y-2 text-sm">
              <p className="hover:text-white cursor-pointer transition-colors">Home</p>
              <p className="hover:text-white cursor-pointer transition-colors">Exams</p>
              <p className="hover:text-white cursor-pointer transition-colors">Question Bank</p>
              <p className="hover:text-white cursor-pointer transition-colors">Analytics</p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Support
            </h3>
            <div className="text-white/80 space-y-2 text-sm">
              <p>Available 24/7</p>
              <p>Email: support@acube.edu</p>
              <p>Help Center</p>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/80 text-sm">
          <p>
            {currentYear} A Cube
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
