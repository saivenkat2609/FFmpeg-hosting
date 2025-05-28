FROM node:18

# Install system dependencies and yt-dlp
RUN apt-get update && \
    apt-get install -y \
        ffmpeg \
        curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    mkdir -p /app

# Set working directory
WORKDIR /app

# Copy and install Node.js dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
