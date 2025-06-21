# Evential - Event Management System

A complete event management platform consisting of a robust backend API built with NestJS and a modern admin panel built with React.js. This system provides comprehensive functionality for managing events, users, speakers, orders, and more.

## 🏗️ Project Structure

```
event-management/
├── events-backend/          # NestJS Backend API
│   ├── src/
│   ├── package.json
│   └── README.md
└── events-cms/              # React.js Admin Panel
    ├── src/
    ├── package.json
    └── README.md
```

## 🚀 Features

### Backend (events-backend)
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Event Management**: Create, update, delete, and manage events with speaker assignments
- **User Management**: User registration, profile management, and role-based permissions
- **Speaker Management**: Speaker profiles, event assignments, and profile management
- **Order & Cart System**: Shopping cart functionality and order processing
- **Event Registration**: User registration for events with payment integration
- **Withdrawal System**: Payment withdrawal requests and management
- **Email Notifications**: Automated email notifications using Handlebars templates
- **File Upload**: Image and document upload functionality
- **Caching**: Redis-based caching for improved performance
- **API Documentation**: Swagger/OpenAPI documentation
- **Multi-language Support**: Internationalization for countries and regions

### Admin Panel (events-cms)
- **Dashboard**: Comprehensive analytics and overview
- **Event Management**: Full CRUD operations for events
- **User Management**: User administration and role management
- **Speaker Management**: Speaker profile and event assignment management
- **Order Management**: Order tracking and processing
- **Withdrawal Management**: Payment withdrawal request handling
- **File Management**: Upload and manage images and documents
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Live data updates and notifications

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer with Handlebars templates
- **Caching**: Cache Manager
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator & Class-transformer
- **Security**: bcrypt for password hashing

### Admin Panel
- **Framework**: React.js
- **Language**: JavaScript/JSX
- **UI Library**: React Bootstrap
- **State Management**: Redux
- **HTTP Client**: Axios
- **Styling**: SCSS/CSS
- **Icons**: Font Awesome
- **Charts**: ApexCharts, Chart.js, Recharts
- **Forms**: Form validation and handling
- **File Upload**: Image and document upload components

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd event-management
```

### 2. Backend Setup (events-backend)

```bash
cd events-backend

# Install dependencies
npm install

# Create .env file with required environment variables
cp .env.example .env
# Edit .env file with your configuration

# Start development server
npm run start:dev
```

The backend will be available at `http://localhost:3000`

### 3. Admin Panel Setup (events-cms)

```bash
cd events-cms

# Install dependencies
npm install

# Start development server
npm start
```

The admin panel will be available at `http://localhost:3001`

## 🔧 Environment Configuration

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/evential_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_password

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Admin Panel (.env)
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENV=development
```

## 📚 API Documentation

Once the backend server is running, access the Swagger API documentation at:
```
http://localhost:3000/api-docs
```

## 🎯 Main Features Overview

### Event Management
- Create and manage events with detailed information
- Assign speakers to events
- Upload event images and documents
- Set event dates, locations, and pricing
- Manage event categories and tags

### User Management
- User registration and authentication
- Role-based access control (Admin, User, Speaker)
- User profile management
- Password reset functionality
- User activity tracking

### Speaker Management
- Speaker profile creation and management
- Speaker event assignments
- Speaker bio and expertise management
- Speaker image uploads

### Order & Payment System
- Shopping cart functionality
- Order processing and tracking
- Payment integration
- Order history and receipts
- Refund management

### Withdrawal System
- Payment withdrawal requests
- Document upload for verification
- Withdrawal status tracking
- Admin approval workflow

### Admin Dashboard
- Real-time analytics and statistics
- Event performance metrics
- User activity monitoring
- Revenue and order tracking
- System health monitoring

## 🧪 Testing

### Backend Testing
```bash
cd events-backend
npm run test
npm run test:watch
```

### Frontend Testing
```bash
cd events-cms
npm test
```

## 🚀 Deployment

### Backend Deployment
The backend is configured for Vercel deployment with the included `vercel.json` configuration.

### Frontend Deployment
The React admin panel can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

### Production Environment Variables
Make sure to set all required environment variables in your production environment for both backend and frontend.

## 📁 File Structure

### Backend Structure
```
events-backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── user/              # User management
│   ├── event/             # Event management
│   ├── speaker/           # Speaker management
│   ├── cart/              # Shopping cart
│   ├── order/             # Order processing
│   ├── registerEvent/     # Event registration
│   ├── withdrawal/        # Withdrawal requests
│   ├── countries/         # Countries and regions
│   ├── jwt/               # JWT configuration
│   ├── middleware/        # Custom middleware
│   ├── service/           # Shared services
│   ├── utils/             # Utility functions
│   └── uploads/           # File uploads
```

### Frontend Structure
```
events-cms/
├── src/
│   ├── App/               # Main application components
│   ├── Pages/             # Page components
│   │   ├── Authentication/
│   │   ├── Events/
│   │   ├── Users/
│   │   ├── Orders/
│   │   └── Withdrawal/
│   ├── store/             # Redux store
│   ├── components/        # Reusable components
│   ├── assets/            # Static assets
│   └── utils/             # Utility functions
```

## 🔐 Authentication Flow

1. **Login**: Users authenticate via the admin panel
2. **JWT Token**: Backend issues JWT tokens for authenticated requests
3. **Role-based Access**: Different features based on user roles
4. **Token Refresh**: Automatic token refresh mechanism
5. **Logout**: Secure token invalidation

## 📊 Dashboard Features

- **Event Analytics**: Event performance metrics
- **User Statistics**: User registration and activity data
- **Revenue Tracking**: Order and payment analytics
- **System Health**: API status and performance monitoring
- **Real-time Updates**: Live data refresh and notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED license.

## 👨‍💻 Author

**Simal Chaudhari**

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔗 Quick Links

- [Backend Documentation](./events-backend/README.md)
- [Admin Panel Documentation](./events-cms/README.md)
- [API Documentation](http://localhost:3000/api-docs) (when server is running)

---

**Note**: Make sure to update the environment variables and database configuration according to your specific setup before running the applications.
