# Use a lightweight Node.js image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json file
COPY package*.json ./

# Install the dependencies (express)
RUN npm install --omit=dev

# Copy the rest of your application's source code
COPY . .

# Google Cloud Run injects the PORT environment variable (default 8080)
ENV PORT=8080
EXPOSE 8080

# Start the unified server
CMD ["npm", "start"]
