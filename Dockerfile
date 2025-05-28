FROM node:18

# Install system dependencies and yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        curl \
        ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy rest of the app
COPY . .
# After copying source files
COPY cookies.txt ./cookies.txt

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
