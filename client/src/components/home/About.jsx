import React, { useState, useEffect } from 'react';
import { Target, Eye, Clock, Leaf, Users, Shield, Heart, Rocket, CheckCircle, Mail, Phone } from 'lucide-react';

const About = () => {
  const [isVisible, setIsVisible] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide for background animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Availability",
      description: "Submit your print requests anytime, anywhere on campus. Our system works round the clock.",
      color: "blue",
      delay: "0ms"
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Eco-Friendly",
      description: "Smart printing options help reduce paper waste. Print only what you need, when you need it.",
      color: "green",
      delay: "200ms"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Focused",
      description: "Built specifically for academic environments with features tailored to student and faculty needs.",
      color: "purple",
      delay: "400ms"
    }
  ];

  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Security First",
      description: "We prioritize the security and privacy of your documents above everything else.",
      color: "blue"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "User Experience",
      description: "Every feature is designed with the user in mind, ensuring simplicity and efficiency.",
      color: "red"
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Innovation",
      description: "We continuously innovate to bring you the latest in printing technology.",
      color: "purple"
    }
  ];

  const stats = [
    { number: "1M+", label: "Documents Printed", icon: "📄" },
    { number: "50,000+", label: "Happy Users", icon: "😊" },
    { number: "99.9%", label: "Uptime", icon: "⚡" },
    { number: "30%", label: "Paper Waste Reduced", icon: "🌱" }
  ];

  const techFeatures = [
    { title: "End-to-end encryption", icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
    { title: "Automatic backup", icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
    { title: "GDPR compliant", icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
    { title: "Real-time status updates", icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
    { title: "Priority handling", icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
    { title: "Automated notifications", icon: <CheckCircle className="w-5 h-5 text-green-600" /> }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-1000 ${
            currentSlide === 0 ? 'from-blue-50 via-indigo-50 to-purple-50' :
            currentSlide === 1 ? 'from-purple-50 via-pink-50 to-red-50' :
            'from-green-50 via-teal-50 to-blue-50'
          }`} />
          
          {/* Floating Elements */}
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="animate-fadeInUp">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                About{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  E-Printer
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                Revolutionizing campus printing with cutting-edge technology, seamless user experience, 
                and unmatched convenience for the entire academic community.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission-vision" data-animate className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className={`group transition-all duration-1000 ${
              isVisible['mission-vision'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  To provide a seamless, secure, and efficient printing solution that eliminates the 
                  traditional hassles of campus printing. We aim to save time, reduce waste, and 
                  enhance the academic experience for students, staff, and professors alike.
                </p>
              </div>
            </div>

            <div className={`group transition-all duration-1000 delay-200 ${
              isVisible['mission-vision'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-full">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  To become the leading digital printing platform in educational institutions worldwide, 
                  setting new standards for convenience, security, and environmental sustainability in 
                  academic document management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" data-animate className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the innovative features that set E-Printer apart from traditional printing services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group text-center p-8 rounded-2xl bg-gradient-to-br transition-all duration-500 transform hover:scale-105 hover:shadow-2xl cursor-pointer ${
                  feature.color === 'blue' ? 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200' :
                  feature.color === 'green' ? 'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200' :
                  'from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200'
                }`}
                style={{ animationDelay: feature.delay }}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg ${
                  feature.color === 'blue' ? 'bg-blue-600' :
                  feature.color === 'green' ? 'bg-green-600' :
                  'bg-purple-600'
                }`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section id="stats" data-animate className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible.stats ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Impact</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Numbers that showcase our commitment to excellence and environmental responsibility
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-4xl mb-4">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <p className="text-blue-100 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" data-animate className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible.technology ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powered by Modern Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with cutting-edge technology to ensure security, reliability, and performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 group-hover:text-blue-600 transition-colors">
                Secure Cloud Storage
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Your documents are encrypted and stored securely in the cloud. We use industry-standard 
                security protocols to protect your data with military-grade encryption.
              </p>
              <div className="space-y-3">
                {techFeatures.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center">
                    {feature.icon}
                    <span className="ml-3 text-gray-700">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="group bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6 group-hover:text-green-600 transition-colors">
                Smart Queue Management
              </h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Our intelligent queue system ensures fair processing and optimal printing schedules 
                for all users on campus with real-time monitoring.
              </p>
              <div className="space-y-3">
                {techFeatures.slice(3, 6).map((feature, index) => (
                  <div key={index} className="flex items-center">
                    {feature.icon}
                    <span className="ml-3 text-gray-700">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" data-animate className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible.values ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do and shape our commitment to excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-center"
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg ${
                  value.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                  value.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  'bg-gradient-to-r from-purple-500 to-purple-600'
                }`}>
                  {value.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Questions About E-Printer?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            We're here to help! Get in touch with our support team for any queries or learn more about our services.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/contact"
              className="group bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Us
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            <a
              href="mailto:support@eprinter.edu"
              className="group border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              Email Support
            </a>
          </div>
        </div>
      </section>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default About;