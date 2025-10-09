// src/components/common/Footer.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { printService } from '../../services/print';
import { Printer, Mail, Phone, MapPin, Clock, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  const { isAuthenticated } = useAuth();
  
  // Dynamic data states
  const [pricing, setPricing] = useState({
    blackAndWhite: 1.0,
    color: 5.0
  });
  const [businessHours, setBusinessHours] = useState({
    start: '09:00',
    end: '18:00'
  });
  const [contactInfo, setContactInfo] = useState({
    email: 'support@eprinter.edu',
    phone: '+91 XXX-XXX-XXXX',
    address: 'Campus Library, Ground Floor\nUniversity Campus'
  });
  const [loading, setLoading] = useState(true);

  // Fetch dynamic data
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dynamic data concurrently
        const [settingsResponse, pricingResponse] = await Promise.all([
          printService.getSettings(),
          printService.getPricingInfo()
        ]);

        // Update pricing
        if (pricingResponse.success && pricingResponse.data) {
          setPricing({
            blackAndWhite: pricingResponse.data.basic?.blackAndWhite || 1.0,
            color: pricingResponse.data.basic?.color || 5.0
          });
        }

        // Update business hours and contact info
        if (settingsResponse.success && settingsResponse.data) {
          // Business hours
          if (settingsResponse.data.businessHours) {
            setBusinessHours({
              start: settingsResponse.data.businessHours.start || '09:00',
              end: settingsResponse.data.businessHours.end || '18:00'
            });
          }

          // Contact info (if available in settings)
          if (settingsResponse.data.contactInfo) {
            setContactInfo(prev => ({
              ...prev,
              ...settingsResponse.data.contactInfo
            }));
          }
        }

      } catch (error) {
        console.error('Failed to fetch dynamic data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicData();
  }, []);

  // Format business hours for display
  const formatBusinessHours = () => {
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    return `${formatTime(businessHours.start)} - ${formatTime(businessHours.end)}`;
  };

  // Format weekday hours
  const getWeekdayHours = () => {
    if (loading) return 'Loading...';
    return `Mon-Fri: ${formatBusinessHours()}`;
  };

  // Format weekend hours (assuming reduced hours or same)
  const getWeekendHours = () => {
    if (loading) return 'Loading...';
    // You can modify this based on your business logic
    // For now, assuming same hours or you can fetch separate weekend hours
    return `Sat-Sun: 8:00 AM - 2:00 PM`;
  };

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Printer className="h-8 w-8 text-blue-400" />
              <h3 className="text-2xl font-bold text-blue-400">E-Printer</h3>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your reliable campus printing solution. We provide quick, easy, and secure printing 
              services designed specifically for students, staff, and professors.
            </p>
            <div className="flex space-x-4">
              <a 
                href="/" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="/" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="/" 
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {!isAuthenticated ? (
                <>
                  <li>
                    <Link 
                      to="/" 
                      className="text-gray-300 hover:text-blue-400 transition-colors flex items-center"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/about" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/contact" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/login" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      Register
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link 
                      to="/dashboard" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/print" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      New Print Job
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/history" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      Print History
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/profile" 
                      className="text-gray-300 hover:text-blue-400 transition-colors"
                    >
                      My Profile
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Contact Info</h4>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className={loading ? 'animate-pulse bg-gray-700 h-4 w-32 rounded' : ''}>
                  {loading ? '' : contactInfo.email}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className={loading ? 'animate-pulse bg-gray-700 h-4 w-32 rounded' : ''}>
                  {loading ? '' : contactInfo.phone}
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className={loading ? 'animate-pulse bg-gray-700 h-8 w-32 rounded' : ''}>
                  {loading ? '' : contactInfo.address.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < contactInfo.address.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className={loading ? 'animate-pulse bg-gray-700 h-8 w-32 rounded' : ''}>
                  {loading ? '' : (
                    <>
                      <div>{getWeekdayHours()}</div>
                      <div>{getWeekendHours()}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        {!isAuthenticated && (
          <div className="border-t border-gray-700 mt-8 pt-8">
            <h4 className="text-lg font-semibold mb-4 text-white text-center">Our Services</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="text-gray-300">
                <h5 className="font-medium text-white mb-2">Black & White</h5>
                <p className="text-sm">
                  {loading ? (
                    <span className="animate-pulse bg-gray-700 h-4 w-16 rounded inline-block"></span>
                  ) : (
                    `₹${pricing.blackAndWhite.toFixed(0)} per page`
                  )}
                </p>
              </div>
              <div className="text-gray-300">
                <h5 className="font-medium text-white mb-2">Color Printing</h5>
                <p className="text-sm">
                  {loading ? (
                    <span className="animate-pulse bg-gray-700 h-4 w-16 rounded inline-block"></span>
                  ) : (
                    `₹${pricing.color.toFixed(0)} per page`
                  )}
                </p>
              </div>
              <div className="text-gray-300">
                <h5 className="font-medium text-white mb-2">Binding</h5>
                <p className="text-sm">Available</p>
              </div>
              <div className="text-gray-300">
                <h5 className="font-medium text-white mb-2">Lamination</h5>
                <p className="text-sm">Available</p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 E-Printer. All rights reserved. Made with ❤️ for students.
            </p>
            <div className="flex flex-wrap justify-center space-x-6">
              {/*disabled web team link for babar next time change that from /web-team to / */}
              <a 
                href="/" 
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                Web Team
              </a>
              <a 
                href="/" 
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="/" 
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a 
                href="/" 
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                Support
              </a>
              <a 
                href="/" 
                className="text-gray-400 hover:text-blue-400 text-sm transition-colors"
              >
                FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;