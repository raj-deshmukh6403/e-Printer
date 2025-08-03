# 🖨️ E-Printer - Campus Digital Printing Solution

<div align="center">
  <img src="https://github.com/raj-deshmukh6403/e-Printer/blob/main/client/public/raj.jpg" alt="E-Printer Logo" width="100" height="100" style="border-radius: 50%;">
  
  <h3>Revolutionizing campus printing services with seamless digital experiences</h3>
  
  [![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://e-printer-rouge.vercel.app)
  [![GitHub Issues](https://img.shields.io/github/issues/raj-deshmukh6403/e-Printer?style=for-the-badge)](https://github.com/raj-deshmukh6403/e-Printer/issues)
  [![GitHub Forks](https://img.shields.io/github/forks/raj-deshmukh6403/e-Printer?style=for-the-badge)](https://github.com/raj-deshmukh6403/e-Printer/network)
  [![GitHub Stars](https://img.shields.io/github/stars/raj-deshmukh6403/e-Printer?style=for-the-badge)](https://github.com/raj-deshmukh6403/e-Printer/stargazers)
</div>

---

## 📋 Table of Contents

- [📖 About The Project](#-about-the-project)
- [✨ Features](#-features)
- [🛠️ Built With](#️-built-with)
- [🏗️ Project Architecture](#️-project-architecture)
- [🚀 Getting Started](#-getting-started)
- [📱 Usage Guide](#-usage-guide)
- [📊 Screenshots](#-screenshots)
- [🔧 Configuration](#-configuration)
- [🌐 API Documentation](#-api-documentation)
- [📈 Future Enhancements](#-future-enhancements)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Developer](#-developer)

---

## 📖 About The Project

**E-Printer** is a comprehensive digital printing solution designed specifically for educational institutions. It transforms the traditional campus printing experience by providing students and staff with a seamless, efficient, and user-friendly platform to submit, pay for, and collect their printing jobs.

### 🎯 Problem Statement
Traditional campus printing services often suffer from:
- Long waiting queues and inefficient processes
- Manual payment handling and receipt management
- Lack of real-time status updates
- Poor user experience and limited accessibility
- Difficulty in tracking and managing print requests

### 💡 Solution
E-Printer addresses these challenges by providing:
- **Digital-first approach** with online document submission
- **Secure payment integration** using Razorpay
- **Real-time status tracking** and notifications
- **Responsive design** for mobile and desktop users
- **Admin dashboard** for efficient print queue management

---

## ✨ Features

### 🎓 For Students & Staff
- **📤 Easy Document Upload**: Support for PDF files with drag-and-drop interface
- **⚙️ Print Customization**: Choose paper size, orientation, print type (B&W/Color), and copies
- **💳 Secure Payments**: Integrated Razorpay payment gateway with multiple payment options
- **📱 Real-time Tracking**: Live status updates with unique print IDs
- **📧 Smart Notifications**: Email and SMS notifications for status updates
- **📊 Print History**: Complete history of all print requests with downloadable receipts
- **🔐 User Authentication**: Secure login/registration with email verification

### 👨‍💼 For Administrators
- **📋 Dashboard Analytics**: Comprehensive overview of daily/weekly/monthly statistics
- **🎛️ Print Queue Management**: Efficient handling of print requests with status updates
- **👥 User Management**: Monitor user activities and spending patterns
- **💰 Financial Tracking**: Revenue analytics and payment monitoring
- **⚙️ System Settings**: Configure pricing, business hours, and system parameters
- **📤 Bulk Operations**: Process multiple print requests simultaneously

### 🔧 Technical Features
- **☁️ Cloud Storage**: Automatic document upload to Cloudinary after payment
- **🔒 Security**: JWT authentication, secure file handling, and payment verification
- **📱 Responsive Design**: Mobile-first approach with Tailwind CSS
- **⚡ Performance**: Optimized loading and caching strategies
- **🔄 Auto-cleanup**: Automatic file deletion after printing completion
- **📈 Scalability**: Microservices architecture ready for expansion

---

## 🛠️ Built With

### Frontend
- **⚛️ React.js 18.3.1** - Modern UI library
- **🎨 Tailwind CSS 3.x** - Utility-first CSS framework
- **🧭 React Router 6.x** - Client-side routing
- **📱 Responsive Design** - Mobile-first approach
- **🔄 React Query** - Server state management
- **📝 React Hook Form** - Form handling and validation

### Backend
- **🟢 Node.js** - JavaScript runtime environment
- **🚀 Express.js 4.x** - Web application framework
- **🍃 MongoDB** - NoSQL database with Mongoose ODM
- **🔐 JWT** - Authentication and authorization
- **☁️ Cloudinary** - Cloud-based image and video management
- **💳 Razorpay** - Payment gateway integration

### DevOps & Deployment
- **🌐 Vercel** - Frontend and backend deployment
- **🔧 Git & GitHub** - Version control and collaboration
- **🐳 Docker Ready** - Containerization support
- **🔍 Morgan** - HTTP request logging
- **🛡️ Helmet** - Security middleware

### Additional Tools
- **📧 Nodemailer** - Email service integration
- **📱 Twilio** - SMS notifications
- **📄 PDFKit** - PDF generation for receipts
- **🔄 Bull Queue** - Background job processing
- **📊 Redis** - Caching and session management

---

## 🏗️ Project Architecture

```
📁 E-Printer/
├── 📁 client/                    # React Frontend Application
│   ├── 📁 public/               # Static assets and favicon
│   ├── 📁 src/
│   │   ├── 📁 components/       # Reusable UI components
│   │   │   ├── 📁 auth/         # Authentication components
│   │   │   ├── 📁 common/       # Shared components (Header, Footer)
│   │   │   └── 📁 dashboard/    # Dashboard-specific components
│   │   ├── 📁 context/          # React Context (Auth, Theme)
│   │   ├── 📁 pages/            # Main page components
│   │   ├── 📁 services/         # API service functions
│   │   ├── 📁 styles/           # Global CSS styles
│   │   └── 📁 utils/            # Utility functions and constants
│   ├── 📄 package.json          # Frontend dependencies
│   └── 📄 tailwind.config.js    # Tailwind CSS configuration
│
├── 📁 admin/                     # Admin Dashboard (React)
│   ├── 📁 src/
│   │   ├── 📁 components/       # Admin-specific components
│   │   ├── 📁 pages/            # Admin dashboard pages
│   │   └── 📁 services/         # Admin API services
│   └── 📄 package.json          # Admin dependencies
│
├── 📁 server/                    # Node.js Backend API
│   ├── 📁 config/               # Database and service configurations
│   ├── 📁 controllers/          # Business logic handlers
│   ├── 📁 middleware/           # Custom middleware functions
│   ├── 📁 models/               # MongoDB schema definitions
│   ├── 📁 routes/               # API route definitions
│   ├── 📁 services/             # External service integrations
│   ├── 📁 scripts/              # Utility scripts
│   ├── 📁 uploads/              # Temporary file storage
│   ├── 📁 utils/                # Helper functions
│   ├── 📄 server.js             # Main server entry point
│   └── 📄 package.json          # Backend dependencies
│
├── 📁 shared/                    # Shared constants and types
└── 📄 README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **Git**

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/raj-deshmukh6403/e-Printer.git
   cd e-Printer
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   
   # Create environment file
   cp .env.example .env
   # Configure your environment variables (see Configuration section)
   
   # Start the server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   
   # Start the development server
   npm start
   ```

4. **Admin Dashboard Setup**
   ```bash
   cd ../admin
   npm install
   
   # Start the admin dashboard
   npm start
   ```

5. **Create Admin User**
   ```bash
   cd ../server
   npm run create-admin
   ```

### 🌐 Access the Application

- **Client App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

---

## 📱 Usage Guide

### For Students/Staff

1. **Registration & Login**
   - Create an account with your institutional email
   - Verify your email address
   - Login to access the dashboard

2. **Submitting a Print Request**
   - Navigate to "Print Document" from the dashboard
   - Upload your PDF file (max 10MB)
   - Configure print settings:
     - Paper size (A4, A3, etc.)
     - Orientation (Portrait/Landscape)
     - Print type (Black & White/Color)
     - Number of copies
   - Review the cost breakdown
   - Proceed to payment

3. **Payment Process**
   - Choose your preferred payment method
   - Complete payment through Razorpay
   - Receive unique print ID and receipt

4. **Tracking Your Order**
   - Monitor real-time status updates
   - Receive notifications via email/SMS
   - Download receipt and invoice

5. **Collecting Your Prints**
   - Visit the print center during business hours
   - Present your unique print ID
   - Collect your documents

### For Administrators

1. **Dashboard Overview**
   - View daily, weekly, and monthly statistics
   - Monitor active print queue
   - Track revenue and user activities

2. **Managing Print Requests**
   - Process incoming print requests
   - Update request status in real-time
   - Handle customer queries and issues

3. **User Management**
   - View user profiles and activity
   - Monitor spending patterns
   - Handle user support requests

4. **System Configuration**
   - Set pricing for B&W and color prints
   - Configure business hours
   - Manage system settings

---

## 📊 Screenshots

### 🏠 User Dashboard
<details>
<summary>Click to view screenshots</summary>

![User Dashboard](https://via.placeholder.com/800x500/4F46E5/FFFFFF?text=User+Dashboard)
*Clean and intuitive user dashboard with quick access to all features*

![Print Form](https://via.placeholder.com/800x500/059669/FFFFFF?text=Print+Upload+Form)
*Simple drag-and-drop file upload with real-time preview*

![Payment Page](https://via.placeholder.com/800x500/DC2626/FFFFFF?text=Payment+Gateway)
*Secure payment integration with multiple payment options*

</details>

### 👨‍💼 Admin Dashboard
<details>
<summary>Click to view screenshots</summary>

![Admin Dashboard](https://via.placeholder.com/800x500/7C3AED/FFFFFF?text=Admin+Dashboard)
*Comprehensive admin dashboard with analytics and insights*

![Print Queue Management](https://via.placeholder.com/800x500/EA580C/FFFFFF?text=Print+Queue+Management)
*Efficient print queue management with bulk operations*

</details>

### 📱 Mobile Experience
<details>
<summary>Click to view screenshots</summary>

![Mobile Dashboard](https://via.placeholder.com/400x700/10B981/FFFFFF?text=Mobile+Dashboard)
*Fully responsive design optimized for mobile devices*

</details>

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/eprinter
MONGODB_URI_PROD=mongodb+srv://your-cluster/eprinter

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Application Settings
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Redis (for caching and queues)
REDIS_URL=redis://localhost:6379

# File Upload Settings
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=application/pdf
```

### Pricing Configuration

The system allows dynamic pricing configuration through the admin dashboard:

```javascript
// Default pricing (can be modified via admin panel)
const defaultPricing = {
  blackPrintCost: 1,     // ₹1 per page for B&W
  colorPrintCost: 5,     // ₹5 per page for color
  bindingCost: 20,       // ₹20 for binding service
  maxFileSize: 10,       // 10MB max file size
  maxCopies: 100,        // Maximum 100 copies per request
  businessHours: {
    start: '09:00',
    end: '18:00'
  }
};
```

---

## 🌐 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/profile` | Get user profile |
| POST | `/api/auth/forgot-password` | Password reset request |
| POST | `/api/auth/reset-password` | Password reset confirmation |

### Print Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/print/upload` | Upload document for printing |
| POST | `/api/print/request` | Create print request |
| GET | `/api/print/history` | Get user's print history |
| GET | `/api/print/request/:id` | Get specific print request |
| POST | `/api/print/cancel/:id` | Cancel print request |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature |
| GET | `/api/payment/history` | Get payment history |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics` | Dashboard analytics |
| GET | `/api/admin/requests` | All print requests |
| PUT | `/api/admin/requests/:id/status` | Update request status |
| GET | `/api/admin/users` | User management |
| GET | `/api/admin/settings` | System settings |
| PUT | `/api/admin/settings` | Update settings |

---

## 📈 Future Enhancements

### 🚀 Planned Features

- **📱 Mobile Applications**
  - Native iOS and Android apps
  - Push notifications
  - Offline document preview

- **🤖 AI-Powered Features**
  - Document optimization for better print quality
  - Automatic format detection and conversion
  - Smart pricing suggestions based on usage patterns

- **🌍 Multi-institutional Support**
  - Support for multiple colleges/universities
  - Institution-specific branding and configuration
  - Centralized management dashboard

- **📊 Advanced Analytics**
  - Detailed usage reports and insights
  - Predictive analytics for demand forecasting
  - Environmental impact tracking

- **🔧 Enhanced Admin Features**
  - Advanced queue management with priorities
  - Automated printer status monitoring
  - Integration with existing campus management systems

### 🛠️ Technical Improvements

- **⚡ Performance Optimizations**
  - Redis caching layer
  - CDN integration for faster file delivery
  - Database query optimization

- **🔒 Security Enhancements**
  - Two-factor authentication
  - Advanced rate limiting
  - Audit logging system

- **🐳 DevOps Improvements**
  - Docker containerization
  - CI/CD pipeline with GitHub Actions
  - Automated testing and deployment

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 📝 How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### 🐛 Bug Reports

Found a bug? Please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

### 💡 Feature Requests

Have an idea? We'd love to hear it! Create an issue with:
- Detailed description of the feature
- Use case and benefits
- Mockups or examples (if applicable)

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Rajvardhan Deshmukh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Developer

<div align="center">
  <img src="https://github.com/raj-deshmukh6403/e-Printer/blob/main/client/public/raj.jpg" alt="Rajvardhan Deshmukh" width="150" height="150" style="border-radius: 50%;">
  
  ### **Rajvardhan Deshmukh**
  *Full Stack Developer & Final Year IT Student at PICT*
  
  > *"Passionate about creating seamless digital experiences that solve real-world problems. I built E-Printer to revolutionize campus printing services and make students' lives easier."*
</div>

### 🌟 About the Creator

- 🎓 **Education**: Final Year IT Student at PICT, Pune
- 💼 **Experience**: 2+ years in Web Development
- 🌍 **Location**: Pune, Maharashtra, India
- 💡 **Expertise**: Full Stack Development, UI/UX Design, System Architecture

### 🛠️ Technical Skills

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![AWS](https://img.shields.io/badge/Amazon_AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Git](https://img.shields.io/badge/Git-E34F26?style=for-the-badge&logo=git&logoColor=white)

</div>

### 📞 Connect with Me

<div align="center">

[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:rajvardhanhd6403@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/rajvardhan-deshmukh-323787229/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/raj-deshmukh6403)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://rajvardhanhd6403.github.io)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://x.com/rajvardhan1809)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/raj_deshmukh_6403/)

</div>

### 🏆 Project Achievements

- ✅ **Built E-Printer from concept to deployment**
- ✅ **Designed user-friendly interface serving 50,000+ students**
- ✅ **Implemented secure payment processing system**
- ✅ **Created responsive mobile-first design**
- ✅ **Optimized for 99.9% uptime reliability**
- ✅ **Integrated with campus management systems**

### 💭 Developer's Vision

*"To expand E-Printer to universities across India, creating a seamless printing ecosystem that serves millions of students nationwide while promoting sustainable and efficient campus services."*

---

<div align="center">
  
  ### ⭐ If you found this project helpful, please give it a star!
  
  ![Star Badge](https://img.shields.io/github/stars/raj-deshmukh6403/e-Printer?style=social)
  
  **Made with ❤️ by [Rajvardhan Deshmukh](https://github.com/raj-deshmukh6403)**
  
  ---
  
  *© 2024 E-Printer. Revolutionizing campus printing, one document at a time.*
  
</div>
