# Deployment Guide

This guide provides step-by-step instructions for deploying the oferTASAS application to production.

## Prerequisites

- Railway account (for API and database)
- Vercel account (for frontend)
- PostgreSQL database (via Railway)
- Redis instance (via Railway)

## Step-by-Step Deployment

### 1. Create Railway Project

1. Create a new project on Railway
2. Add a PostgreSQL database service
3. Add a Redis service
4. Note the DATABASE_URL and REDIS_URL from the service settings

### 2. Configure Environment Variables

Set the following environment variables in Railway:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `VTEX_TIMEOUT` - Timeout for VTEX API requests (e.g., 5000)
- `FRONTEND_URL` - URL of the deployed frontend (e.g., https://ofertasas.vercel.app)

### 3. Deploy API with Docker

1. In Railway, connect your GitHub repository
2. Select the `apps/api` directory as the root
3. Railway will automatically use the `Dockerfile` for deployment
4. Alternatively, you can manually deploy using the Railway CLI:
   ```bash
   railway login
   railway init
   railway add
   railway up
   ```

### 4. Run Database Migrations and Seeding

1. After the API is deployed, access the Railway shell
2. Run database migrations:
   ```bash
   pnpm db:migrate
   ```
3. Run the seed script to populate initial data:
   ```bash
   pnpm db:seed
   ```

### 5. Create Vercel Project for Web Frontend

1. Create a new project on Vercel
2. Connect your GitHub repository
3. Select the `apps/web` directory as the root
4. Vercel will automatically detect and configure the Next.js project

### 6. Configure Frontend Environment Variables

Set the following environment variable in Vercel:

- `NEXT_PUBLIC_API_URL` - URL of your Railway API deployment

### 7. Deploy Frontend

1. Vercel will automatically deploy the frontend after connecting the repository
2. You can also manually trigger a deployment:
   ```bash
   vercel --prod
   ```

## Monitoring and Maintenance

- Monitor Railway logs for the API service
- Monitor Vercel deployment logs
- Set up health checks for both API and frontend
- Regularly check for failed background jobs in the Railway dashboard

## Troubleshooting

### Database Issues

If you encounter database connection issues:

1. Verify the DATABASE_URL is correctly set
2. Check Railway's PostgreSQL service status
3. Run `pnpm db:push` to push the schema to the database

### Redis Issues

If you encounter Redis connection issues:

1. Verify the REDIS_URL is correctly set
2. Check Railway's Redis service status
3. Ensure the Redis instance is properly configured

### API Issues

If the API is not responding:

1. Check Railway logs for error messages
2. Verify all environment variables are set correctly
3. Ensure the database migrations have been run
4. Check that the workers are running correctly