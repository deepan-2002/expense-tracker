# 💰 Spendly - Personal Expense Tracker

Spendly is a modern, cross-platform expense tracking application built with React Native (Expo) and NestJS. Track your income and expenses effortlessly with beautiful UI and powerful features.

![Spendly](https://img.shields.io/badge/Spendly-Expense%20Tracker-6366f1?style=for-the-badge&logo=react)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=flat-square&logo=react)
![NestJS](https://img.shields.io/badge/NestJS-10.0.0-E0234E?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat-square&logo=typescript)

## ✨ Features

### 📱 User Features
- **Transaction Management**: Add, edit, and delete income and expense transactions
- **Account Management**: Create and manage multiple accounts (Cash, Bank, Card, etc.)
- **Category Organization**: Organize transactions with custom categories and icons
- **Statistics Dashboard**: View spending analytics by category, payment method, and monthly breakdown
- **Search & Filter**: Search transactions and filter by date range and type
- **Dark Mode Support**: Full light/dark mode with system preference detection
- **Opening Balance**: Set and manage account opening balances
- **Transaction History**: Complete transaction history with detailed information

### 🎨 UI/UX Features
- **Modern Design**: Clean, intuitive interface with smooth animations
- **Theme Support**: Light mode, dark mode, and system default
- **Responsive Layout**: Works seamlessly on iOS, Android, and Web
- **Haptic Feedback**: Enhanced user experience with haptic feedback
- **Pull to Refresh**: Easy data refreshing on all screens

### 🔒 Security
- **JWT Authentication**: Secure authentication with JWT tokens
- **Password Hashing**: Bcrypt password hashing for security
- **Protected Routes**: Route protection with authentication guards

## 🏗️ Tech Stack

### Frontend (Client)
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0.25) - Development platform and toolchain
- **Expo Router** (~6.0.15) - File-based routing for React Native
- **TypeScript** (5.9.2) - Type-safe JavaScript
- **AsyncStorage** - Local storage for theme preferences
- **Axios** - HTTP client for API requests
- **React Navigation** - Navigation library

### Backend (Server)
- **NestJS** (10.0.0) - Progressive Node.js framework
- **TypeORM** (0.3.22) - Object-Relational Mapping
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Redis** (via cache-manager) - Caching layer
- **Class Validator** - DTO validation
- **Class Transformer** - Object transformation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Redis** (optional, for caching)
- **Expo CLI** (for mobile development)
- **iOS Simulator** (for Mac) or **Android Emulator**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd expense-tracker
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Run database migrations
npm run migration:run

# Start the development server
npm run start:dev
```

The backend server will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start Expo development server
npm start

# For iOS
npm run ios

# For Android
npm run android

# For Web
npm run web
```

## 📁 Project Structure

```
expense-tracker/
├── client/                 # React Native Expo app
│   ├── app/               # Expo Router pages
│   │   ├── (auth)/       # Authentication screens
│   │   ├── (tabs)/       # Main tab screens
│   │   └── ...           # Other screens
│   ├── components/        # Reusable components
│   ├── constants/         # Constants and theme
│   ├── hooks/             # Custom React hooks
│   ├── src/               # Source files
│   │   ├── context/      # React contexts
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   └── assets/           # Images and assets
│
└── server/                # NestJS backend
    ├── src/
    │   ├── modules/      # Feature modules
    │   │   ├── auth/     # Authentication
    │   │   ├── users/    # User management
    │   │   ├── accounts/ # Account management
    │   │   ├── categories/ # Category management
    │   │   ├── expenses/  # Expense tracking
    │   │   └── transactions/ # Transaction management
    │   ├── config/       # Configuration files
    │   ├── common/       # Shared utilities
    │   └── main.ts       # Application entry point
    └── database/         # Database schemas
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=spendly_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development
```

### Frontend API Configuration

Update the API base URL in `client/src/services/api.ts` if your backend runs on a different port.

## 🌙 Theme System

Spendly includes a comprehensive theme system with:

- **Light Mode**: Clean, bright interface
- **Dark Mode**: Comfortable dark interface
- **System Default**: Automatically follows device theme

Theme preferences are saved to AsyncStorage and persist across app restarts.

### Customizing Themes

Edit `client/hooks/use-app-theme.ts` to customize color schemes:

```typescript
colors: {
  background: isDark ? '#0d0d0d' : '#ffffff',
  cardBackground: isDark ? '#1a1a1a' : '#ffffff',
  text: isDark ? '#f1f1f1' : '#111111',
  // ... more colors
}
```

## 📱 Available Scripts

### Backend
```bash
npm run start          # Start production server
npm run start:dev      # Start development server with watch mode
npm run start:debug    # Start in debug mode
npm run build          # Build for production
npm run lint           # Run ESLint
npm run test           # Run tests
```

### Frontend
```bash
npm start              # Start Expo development server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in web browser
npm run lint           # Run ESLint
```

## 🗄️ Database Schema

### Key Tables
- **users**: User accounts and authentication
- **accounts**: Financial accounts (Cash, Bank, etc.)
- **categories**: Transaction categories
- **transactions**: Income and expense transactions
- **expenses**: Legacy expense records (if applicable)

See `server/database/init.sql` for complete schema.

## 🔐 Authentication

Spendly uses JWT-based authentication:

1. **Register**: Create a new account with email, password, and name
2. **Login**: Authenticate with email and password
3. **Protected Routes**: All app routes require authentication
4. **Token Storage**: JWT tokens stored securely

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token

### Accounts
- `GET /accounts` - Get all accounts
- `POST /accounts` - Create account
- `DELETE /accounts/:id` - Delete account

### Categories
- `GET /categories` - Get all categories
- `POST /categories` - Create category
- `DELETE /categories/:id` - Delete category

### Transactions
- `GET /transactions` - Get transactions (with filters)
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction
- `GET /transactions/balances` - Get account balances

### Statistics
- `GET /expenses/stats` - Get expense statistics
- `GET /expenses/monthly` - Get monthly breakdown

See API documentation for complete endpoint details.

## 🎯 Key Features Explained

### Transaction Types
- **Credit**: Income/Deposits (shown in green)
- **Debit**: Expenses/Withdrawals (shown in red)

### Balance Calculation
```
Current Balance = Opening Balance + Total Credit - Total Debit
```

### Account Management
- Default Cash account cannot be deleted
- Accounts with transactions cannot be deleted
- Each account maintains its own balance

## 🐛 Troubleshooting

### Common Issues

**Issue**: Backend not connecting to database
- **Solution**: Check PostgreSQL is running and `.env` credentials are correct

**Issue**: Theme not persisting
- **Solution**: Ensure AsyncStorage is properly installed and permissions are granted

**Issue**: Build errors on mobile
- **Solution**: Clear cache with `expo start -c` or `npm start -- --clear`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👥 Authors

- **Deeban Yathiraja R**

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Powered by [NestJS](https://nestjs.com/)
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)

---

Made with ❤️ using React Native and NestJS

