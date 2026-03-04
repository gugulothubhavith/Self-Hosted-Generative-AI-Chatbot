# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files correctly
COPY package.json package-lock.json* ./

# Increase memory limit and use clean install
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm ci --legacy-peer-deps

# Copy the rest
COPY . .

# Ensure env vars are passed to the frontend
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Run build allowing TS errors
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Define Nginx configuration for a SPA (Single Page Application)
RUN echo 'server { \
    listen       80; \
    server_name  localhost; \
    location / { \
        root   /usr/share/nginx/html; \
        index  index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
