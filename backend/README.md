# Finance Manager Backend API

A robust Express.js backend API for the Finance Manager React application with MongoDB integration, user authentication, and Excel import functionality.

## 🚀 Features

- **User Authentication** - JWT-based login/register system
- **Transaction Management** - Full CRUD operations for financial transactions
- **User Settings** - Personalized accounts, categories, and configurations
- **Excel Import** - Bulk import transactions from Excel files
- **Data Isolation** - Each user's data is completely isolated
- **Security** - Rate limiting, CORS, input validation, and error handling

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- MongoDB Compass (for database management)

## 🛠️ Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `config.env` and update the values:
   ```env
   MONGODB_URI=mongodb://localhost:27017/finance-manager
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start MongoDB:**
   - Ensure MongoDB is running on `mongodb://localhost:27017`
   - The database `finance-manager` will be created automatically

5. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 Database Schema

### Collections Created:
- `users` - User accounts and authentication
- `transactions` - Financial transactions (user-specific)
- `usersettings` - User configurations (accounts, categories, etc.)

### Indexes:
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

### Health Check
```
GET /api/health - API health status
```

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📁 Excel Import Format

The API accepts Excel files (.xlsx, .xls) with the following expected columns:
- **Date** - Transaction date (required)
- **Amount** or **INR** - Transaction amount (required)
- **Description** - Transaction description (optional)
- **Category** - Transaction category (optional)
- **Account** - Transaction account (optional)

### Example Excel Structure:
| Date       | Amount | Description        | Category    | Account |
|------------|--------|-------------------|-------------|---------|
| 2024-01-15 | 1000   | Grocery shopping   | Food        | Cash    |
| 2024-01-16 | -500   | Restaurant dinner  | Food        | Card    |

## 🧪 Testing the API

### 1. Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. Get transactions (with token):
```bash
curl -X GET http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/finance-manager` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-change-this-in-production` |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## 🚨 Security Features

- **Rate Limiting** - Prevents abuse with configurable limits
- **Input Validation** - All inputs are validated using express-validator
- **CORS Protection** - Configured for specific origins
- **Helmet** - Security headers
- **Password Hashing** - bcryptjs for secure password storage
- **JWT Authentication** - Stateless authentication with expiration

## 📝 Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // Optional
}
```

## 🔄 Data Migration

When a user registers, the system automatically creates default settings:
- Default accounts (Cash, SBI, HDFC, etc.)
- Default categories (Housing, Transportation, Food & Dining, etc.)
- Default account groups and mappings

## 🚀 Production Deployment

1. **Update environment variables** for production
2. **Change JWT_SECRET** to a strong, unique value
3. **Set NODE_ENV=production**
4. **Configure CORS_ORIGIN** for your frontend domain
5. **Use a process manager** like PM2
6. **Set up MongoDB** with proper authentication
7. **Configure reverse proxy** (nginx) if needed

## 📞 Support

For issues or questions:
1. Check the logs for error details
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Check CORS configuration matches your frontend URL

## 🔗 Frontend Integration

The frontend should:
1. Store JWT token in localStorage or secure storage
2. Include token in Authorization header for all API calls
3. Handle 401 responses by redirecting to login
4. Use the API endpoints to replace localStorage operations 