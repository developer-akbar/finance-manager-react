# Finance Manager Setup Guide

## Environment Configuration

### Step 1: Create Environment File
Copy the template file to create your local environment configuration:

```bash
cp backend/config.env.template backend/config.env
```

### Step 2: Configure Your Environment
Edit `backend/config.env` with your local settings:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/finance-manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration - Multiple origins supported
# CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Start Development
1. Start MongoDB locally
2. Run backend: `cd backend && npm run dev`
3. Run frontend: `npm run dev`

## Security Notes

- ✅ `config.env` is in `.gitignore` - it won't be committed
- ✅ Template file is safe to commit
- ✅ No credentials in repository
- ✅ Each developer manages their own environment

## Production Deployment

For production deployment, environment variables should be set in the deployment platform (Render, Heroku, etc.) rather than in files.
