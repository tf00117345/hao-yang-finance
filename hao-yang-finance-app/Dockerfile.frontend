# Use Node.js 20 for building
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Set environment variables for build
ENV VITE_API_URL=https://hao-yang-finance-api-production.up.railway.app
ENV NODE_ENV=production

# Build the application
RUN yarn build

# Use nginx for serving the built application
FROM nginx:alpine AS production

# Copy the built application from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]