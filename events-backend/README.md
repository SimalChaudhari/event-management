# Evential Backend

A robust event management system backend built with NestJS, TypeScript, and PostgreSQL. This API provides comprehensive functionality for managing events, users, speakers, orders, and more.

## 🚀 Features

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

## 🛠️ Tech Stack

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

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd events-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
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
   
   # Firebase Configuration (if using Firebase services)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Database Setup**
   - Create a PostgreSQL database
   - Update the `DATABASE_URL` in your `.env` file
   - The application will automatically create tables using TypeORM synchronize

5. **Run the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start
   ```

## 📁 Project Structure

```
src/
├── auth/                 # Authentication module
├── user/                 # User management
├── event/                # Event management
├── speaker/              # Speaker management
├── cart/                 # Shopping cart functionality
├── order/                # Order processing
├── registerEvent/        # Event registration
├── withdrawal/           # Withdrawal requests
├── countries/            # Countries and regions
├── jwt/                  # JWT configuration and guards
├── middleware/           # Custom middleware
├── service/              # Shared services (email, firebase)
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
├── uploads/              # File uploads directory
├── app.module.ts         # Root module
├── main.ts              # Application entry point
└── app.controller.ts    # Root controller
```

## 🔧 Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint with auto-fix

## 📚 API Documentation

Once the server is running, you can access the Swagger API documentation at:
```
http://localhost:3000/api-docs
```

### Main API Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token

#### Events
- `GET /events` - Get all events
- `POST /events` - Create new event
- `GET /events/:id` - Get event by ID
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

#### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Speakers
- `GET /speakers` - Get all speakers
- `POST /speakers` - Create new speaker
- `GET /speakers/:id` - Get speaker by ID
- `PUT /speakers/:id` - Update speaker

#### Orders
- `GET /orders` - Get all orders
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order by ID

#### Cart
- `GET /cart` - Get user cart
- `POST /cart/add` - Add item to cart
- `DELETE /cart/:id` - Remove item from cart

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📁 File Uploads

The application supports file uploads for:
- Event images
- Speaker profile pictures
- Withdrawal documents
- User profile images

Files are stored in the `uploads/` directory and can be accessed via `/uploads/` endpoint.

## 🧪 Testing

Run the test suite:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🚀 Deployment

### Vercel Deployment
This project is configured for Vercel deployment. The `vercel.json` configuration is included for seamless deployment.

### Environment Variables for Production
Make sure to set all required environment variables in your production environment:
- `DATABASE_URL`
- `JWT_SECRET`
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`
- `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

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

---

**Note**: Make sure to update the environment variables and database configuration according to your specific setup before running the application.
