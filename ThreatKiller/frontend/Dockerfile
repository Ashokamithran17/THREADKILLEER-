# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package configurations and install dependencies
COPY package.json ./
RUN npm install

# Copy frontend source files
COPY . .

# Build production asset bundle
RUN npm run build

# Production Stage
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
