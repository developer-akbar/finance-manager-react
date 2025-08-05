# 💰 Finance Manager - React + MongoDB

A modern, full-stack personal finance management application built with React.js frontend and Express.js + MongoDB backend. Track your income, expenses, and financial goals with a beautiful, responsive interface.

## 🚀 Features

### 🔐 Authentication & Security
- **User Registration & Login** - Secure JWT-based authentication
- **Password Protection** - bcrypt hashed passwords
- **Data Isolation** - Each user's data is completely private
- **Session Management** - Automatic token refresh and logout

### 💳 Transaction Management
- **Add/Edit/Delete Transactions** - Full CRUD operations
- **Categorization** - Custom categories and subcategories
- **Account Management** - Multiple accounts and account groups
- **Search & Filter** - Advanced filtering by date, category, account
- **Bulk Operations** - Import multiple transactions at once

### 📊 Analytics & Insights
- **Dashboard Overview** - Real-time financial summary
- **Interactive Charts** - Visual representation of spending patterns
- **Monthly Reports** - Income vs expense analysis
- **Category Breakdown** - Spending by category visualization

### 📁 Data Import/Export
- **Excel Import** - Upload financial data from Excel files
- **CSV Support** - Import from CSV files
- **Data Validation** - Automatic data cleaning and validation
- **Error Handling** - Detailed import error reporting

### 🎨 User Experience
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Clean, intuitive interface
- **Real-time Updates** - Instant data synchronization
- **Loading States** - Smooth user experience with loading indicators

## 🏗️ Architecture

```
finance-manager/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts (Auth, App)
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/                  # Express.js API server
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API endpoints
│   ├── middleware/          # Authentication & validation
│   └── server.js            # Main server file
└── README.md
```

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **MongoDB Compass** (for database management)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/developer-akbar/finance-manager-react.git
cd finance-manager-react
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy config.env and update the values:
cp config.env .env
# Edit .env with your MongoDB connection and JWT secret

# Start MongoDB (ensure it's running on localhost:27017)
# The database 'finance-manager' will be created automatically

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate back to root directory
cd ..

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🔧 Environment Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/finance-manager
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 📊 Database Schema

### Collections
- **users** - User accounts and authentication
- **transactions** - Financial transactions (user-specific)
- **usersettings** - User configurations (accounts, categories, etc.)

### Indexes
- User ID indexes for data isolation
- Transaction date, category, and account indexes for efficient querying

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - User login
GET  /api/auth/me - Get current user (protected)
```

### Transactions
```
GET    /api/transactions - Get all transactions (protected)
GET    /api/transactions/:id - Get single transaction (protected)
POST   /api/transactions - Create transaction (protected)
PUT    /api/transactions/:id - Update transaction (protected)
DELETE /api/transactions/:id - Delete transaction (protected)
POST   /api/transactions/bulk - Bulk import transactions (protected)
```

### Settings
```
GET /api/settings - Get user settings (protected)
PUT /api/settings - Update user settings (protected)
PUT /api/settings/accounts - Update accounts (protected)
PUT /api/settings/categories - Update categories (protected)
PUT /api/settings/account-groups - Update account groups (protected)
PUT /api/settings/account-mapping - Update account mapping (protected)
```

### Import
```
POST /api/import/excel - Import from Excel file (protected)
POST /api/import/json - Import from JSON data (protected)
```

## 🧪 Testing the Application

### 1. Create a New Account
1. Open http://localhost:5173
2. Click "Sign Up"
3. Fill in username, email, and password
4. Click "Create Account"

### 2. Use Demo Account
- **Username**: `demo`
- **Password**: `demo`

### 3. Add Transactions
1. Click "Add Transaction" from the dashboard
2. Fill in transaction details
3. Save the transaction

### 4. Import Excel Data
1. Prepare an Excel file with columns: Date, Amount, Description, Category, Account
2. Go to Settings → Import
3. Upload your Excel file
4. Review and confirm the import

## 📁 Excel Import Format

The application accepts Excel files (.xlsx, .xls) with the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| Date | ✅ | Transaction date (DD/MM/YYYY) |
| Amount/INR | ✅ | Transaction amount (positive for income, negative for expense) |
| Description | ❌ | Transaction description |
| Category | ❌ | Transaction category |
| Account | ❌ | Transaction account |

### Example Excel Structure:
```
| Date       | Amount | Description        | Category    | Account |
|------------|--------|-------------------|-------------|---------|
| 2024-01-15 | 1000   | Grocery shopping   | Food        | Cash    |
| 2024-01-16 | -500   | Restaurant dinner  | Food        | Card    |
```

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcryptjs for secure password storage
- **Rate Limiting** - Prevents API abuse
- **CORS Protection** - Configured for specific origins
- **Input Validation** - All inputs validated and sanitized
- **Error Handling** - Secure error responses

## 🚀 Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Update `JWT_SECRET` to a strong, unique value
3. Configure `CORS_ORIGIN` for your frontend domain
4. Set up MongoDB with authentication
5. Use a process manager like PM2
6. Configure reverse proxy (nginx) if needed

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Update API base URL in `src/services/api.js`
4. Configure environment variables

## 🛠️ Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

#### Backend
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
```

### Code Structure
- **Components**: Modular React components with CSS modules
- **Contexts**: Global state management with React Context
- **Services**: API communication layer
- **Models**: MongoDB schemas and validation
- **Routes**: Express.js API endpoints
- **Middleware**: Authentication and validation middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the console for error details
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Check CORS configuration matches your frontend URL
5. Review the API documentation

## 🔗 Links

- **GitHub Repository**: https://github.com/developer-akbar/finance-manager-react
- **Backend API**: http://localhost:5000/api
- **Frontend App**: http://localhost:5173

---

**Built with ❤️ by developer-akbar** 