# Railway Deployment Guide

## Prerequisites

1. Install Railway CLI:

```bash
npm install -g @railway/cli
```

2. Login to Railway:

```bash
railway login
```

## Automated Deployment (Recommended)

### Windows Environment

#### Using PowerShell (Recommended)

1. **Deploy Backend**:

```powershell
.\deploy-backend.ps1
```

2. **Deploy Frontend** (requires backend URL):

```powershell
.\deploy-frontend.ps1 -BackendUrl https://your-backend-domain.railway.app
```

#### Using Batch Files

1. **Deploy Backend**:

```cmd
deploy-backend.bat
```

2. **Deploy Frontend** (requires backend URL):

```cmd
deploy-frontend.bat https://your-backend-domain.railway.app
```

### Linux/macOS Environment

1. **Deploy Backend**:

```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

2. **Deploy Frontend** (requires backend URL):

```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh https://your-backend-domain.railway.app
```

### Manual Deployment

#### 1. Deploy Backend API

```bash
cd hao-yang-finance-api

# Create new project
railway init

# Add PostgreSQL
railway add --database postgres

# Set environment variables
railway variables --set "ASPNETCORE_ENVIRONMENT=Production"
railway variables --set "JWT_KEY=feacf38ac41111f2c7514bfa3927c07c5a796c90b5686ade58b51dade46c1680"
railway variables --set "JWT_ISSUER=hao-yang-finance-api"
railway variables --set "JWT_AUDIENCE=hao-yang-finance-app"
railway variables --set "JWT_EXPIRE_MINUTES=30"

# Deploy
railway up
```

#### 2. Deploy Frontend Application

```bash
cd ../hao-yang-finance-app

# Create new project
railway init

# Set environment variables (replace with your backend URL)
railway variables --set "VITE_API_URL=https://hao-yang-finance-api-production.up.railway.app"
railway variables --set "NODE_ENV=production"

# Deploy
railway up -s hao-yang-finance-app --path-as-root ./
```

## Important Configuration

### Backend Configuration

- Uses PostgreSQL database (Railway automatically provides `DATABASE_URL`)
- JWT secret key updated for more security in production environment
- CORS configuration automatically uses frontend URL

### Frontend Configuration

- Uses environment variable `VITE_API_URL` to connect to backend
- Nginx configuration includes SPA routing support and static resource optimization

### Environment Variables List

**Backend Required Variables:**

- `DATABASE_URL` (automatically provided by Railway)
- `JWT_KEY` - JWT signing key
- `JWT_ISSUER` - JWT issuer
- `JWT_AUDIENCE` - JWT audience
- `JWT_EXPIRE_MINUTES` - JWT expiration time
- `FRONTEND_URL` - Frontend domain (for CORS)

**Frontend Required Variables:**

- `VITE_API_URL` - Backend API address

## Post-Deployment Steps

1. Ensure backend database is properly migrated
2. Test API endpoints are working correctly
3. Test frontend can correctly connect to backend
4. Check CORS configuration is correct

## Troubleshooting

### Common Issues

1. **CORS Error**: Ensure backend's `FRONTEND_URL` environment variable is set correctly
2. **Database Connection Issues**: Check if `DATABASE_URL` is configured correctly
3. **API Connection Failed**: Confirm frontend's `VITE_API_URL` points to the correct backend address

### View Logs

```bash
# View backend logs
railway logs

# View specific service logs
railway logs --service=your-service-name
```

## Update Deployment

```bash
# Redeploy
railway up

# Force rebuild
railway up --detach
```
