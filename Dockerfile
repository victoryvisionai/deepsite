# Use the official Node.js LTS image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy only the package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Optional build step (safe fallback if you're not using Vite)
RUN npm run build || true

# Let Render know which port to bind
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
