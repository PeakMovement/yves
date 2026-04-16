FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with npm ci for cleaner installs
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the TypeScript and Vite app
RUN npm run build

# Copy serve config
RUN cp serve.json dist/serve.json

# Expose port
EXPOSE 3000

# Start the app using serve
CMD ["npm", "start"]
