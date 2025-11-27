# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for tsx)
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application using tsx
CMD ["npx", "tsx", "index.ts"]
