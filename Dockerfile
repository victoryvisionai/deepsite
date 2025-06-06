# Use an official Node.js runtime as the base image
FROM node:22.1.0
USER root

# Update system packages (if needed)
RUN apt-get update

# Switch to non-root user
USER 1000

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first
COPY --chown=1000 package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY --chown=1000 . .

# Optional: build step if you’re using Vite/React/TS
RUN npm run build || true

# Ensure the port exposed matches your server
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
