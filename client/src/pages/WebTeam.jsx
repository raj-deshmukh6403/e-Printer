// src/pages/WebTeam.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import creatorInfo from '../data/creatorInfo'; // Import your configuration
import { 
  Code, 
  Heart, 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink,
  Star,
  Users,
  Award,
  MapPin,
  GraduationCap,
  Briefcase,
  Smartphone,
  Database,
  Server,
  Zap,
  Globe,
  Coffee,
  Calendar,
  Target,
  Lightbulb
} from 'lucide-react';

const WebTeam = () => {
  const [isVisible, setIsVisible] = useState({});
  
  const [currentTechIndex, setCurrentTechIndex] = useState(0);

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

  // Tech stack carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTechIndex(prev => (prev + 1) % creatorInfo.technologies.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const projectFeatures = [
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile-First Design",
      description: "Responsive interface that works perfectly on all devices"
      
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Secure Data Management",
      description: "Encrypted document storage with privacy protection"
    },
    {
      icon: <Server className="w-6 h-6" />,
      title: "Scalable Architecture",
      description: "Built to handle thousands of concurrent users"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Optimized performance for quick printing workflows"
    }
  ];

  const stats = [
    { 
      number: creatorInfo.projectStats.users, 
      label: "Users Served", 
      icon: <Users className="w-8 h-8" /> 
    },
    { 
      number: creatorInfo.projectStats.documents, 
      label: "Documents Printed", 
      icon: <Star className="w-8 h-8" /> 
    },
    { 
      number: creatorInfo.projectStats.uptime, 
      label: "Uptime", 
      icon: <Award className="w-8 h-8" /> 
    },
    { 
      number: creatorInfo.projectStats.availability, 
      label: "Service Available", 
      icon: <Globe className="w-8 h-8" /> 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="relative mx-auto mb-6 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-white/30 via-blue-200/50 to-purple-200/50 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative">
                  <img
                    src={creatorInfo.avatar}
                    alt={creatorInfo.name}
                    className="w-56 h-72 md:w-72 md:h-96 rounded-3xl mx-auto border-4 border-white/30 shadow-2xl object-cover backdrop-blur-sm transform transition-all duration-500 hover:scale-105 hover:shadow-3xl"
                  />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                Meet the Creator
              </h1>
              <h2 className="text-2xl md:text-3xl font-light mb-6 text-blue-100">
                {creatorInfo.name}
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                {creatorInfo.title}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <MapPin className="w-4 h-4" />
                <span>{creatorInfo.location}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <GraduationCap className="w-4 h-4" />
                <span>{creatorInfo.education}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Briefcase className="w-4 h-4" />
                <span>{creatorInfo.experience}</span>
              </div>
            </div>

            <div className="flex justify-center space-x-6">
              <a
                href={creatorInfo.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
                title="GitHub Profile"
              >
                <Github className="w-6 h-6" />
              </a>
              <a
                href={creatorInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href={`mailto:${creatorInfo.email}`}
                className="group bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
                title="Send Email"
              >
                <Mail className="w-6 h-6" />
              </a>
              <a
                href={creatorInfo.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
                title="View Portfolio"
              >
                <ExternalLink className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" data-animate className="py-20 px-4">
        <div className="container mx-auto">
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible.about ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
              <div className="flex items-center mb-8">
                <Heart className="w-8 h-8 text-red-500 mr-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  About the Creator
                </h2>
              </div>
              
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                {creatorInfo.bio}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Code className="w-5 h-5 mr-2 text-blue-600" />
                    Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {creatorInfo.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-default"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-green-600" />
                    Key Achievements
                  </h3>
                  <ul className="space-y-2">
                    {creatorInfo.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="w-4 h-4 text-yellow-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Motivation & Vision */}
      <section id="motivation" data-animate className="py-20 px-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto">
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible.motivation ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Motivation & Vision
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <Lightbulb className="w-8 h-8 text-yellow-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">Why E-Printer?</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {creatorInfo.motivation}
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-blue-500 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">Future Vision</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {creatorInfo.vision}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="tech" data-animate className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible.tech ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Technology Stack
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern technologies for optimal performance and user experience
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Featured Technology */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg">
                <span className="text-6xl">{creatorInfo.technologies[currentTechIndex].icon}</span>
                <div className="text-left">
                  <h3 className={`text-2xl font-bold ${creatorInfo.technologies[currentTechIndex].color}`}>
                    {creatorInfo.technologies[currentTechIndex].name}
                  </h3>
                  <p className="text-gray-600">{creatorInfo.technologies[currentTechIndex].description}</p>
                </div>
              </div>
            </div>

            {/* All Technologies */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {creatorInfo.technologies.map((tech, index) => (
                <div
                  key={index}
                  className={`bg-white p-6 rounded-xl text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer border-2 ${
                    index === currentTechIndex ? 'border-blue-300 shadow-lg' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentTechIndex(index)}
                >
                  <span className="text-3xl mb-2 block">{tech.icon}</span>
                  <h4 className={`font-semibold text-sm ${tech.color}`}>{tech.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Project Features */}
      <section id="features" data-animate className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              E-Printer Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Key features I implemented to create the best printing experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {projectFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" data-animate className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible.stats ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Impact & Results
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              The numbers speak for themselves - E-Printer has transformed campus printing
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-white mb-4 flex justify-center transform hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Plans */}
      <section id="future" data-animate className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible.future ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                What's Next?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Exciting features and improvements planned for E-Printer
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creatorInfo.futurePlans.map((plan, index) => (
                <div key={index} className="flex items-start space-x-4 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 font-medium">{plan}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" data-animate className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            isVisible.contact ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Let's Connect
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Interested in collaborating or have questions about E-Printer? 
              I'd love to hear from you!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <a
                href={`mailto:${creatorInfo.email}`}
                className="group bg-white p-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Me</h3>
                <p className="text-gray-600 text-sm">{creatorInfo.email}</p>
              </a>

              <a
                href={creatorInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Linkedin className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">LinkedIn</h3>
                <p className="text-gray-600 text-sm">Professional Network</p>
              </a>

              <a
                href={creatorInfo.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white p-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Github className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">GitHub</h3>
                <p className="text-gray-600 text-sm">View My Code</p>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                ← Back to E-Printer
              </Link>
              <a
                href={creatorInfo.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                View Portfolio →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Made with Love Footer */}
      <section className="py-8 bg-gray-900 text-white text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span>Made with</span>
            <Heart className="w-5 h-5 text-red-500 animate-pulse" />
            <span>and lots of</span>
            <Coffee className="w-5 h-5 text-yellow-500" />
            <span>by {creatorInfo.name}</span>
          </div>
          
          {/* Fun Facts */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            {creatorInfo.funFacts.map((fact, index) => (
              <span key={index} className="hover:text-white transition-colors cursor-default">
                {fact}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};


export default WebTeam;

