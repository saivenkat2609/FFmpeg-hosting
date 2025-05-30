FROM node:18-slim

# Set environment variable to prevent prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        curl \
        bash \
        python3 \
        python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp using pip
RUN pip3 install yt-dlp

# Install n8n globally
RUN npm install -g n8n

# Create a working directory
RUN mkdir -p /home/node/.n8n
WORKDIR /home/node/

# Set environment variables for n8n
ENV N8N_BASIC_AUTH_ACTIVE=true
ENV N8N_BASIC_AUTH_USER=admin
ENV N8N_BASIC_AUTH_PASSWORD=password
ENV GENERIC_TIMEZONE=Asia/Kolkata
ENV NODE_ENV=production

# Expose the default n8n port
EXPOSE 5678

# Start n8n
CMD ["n8n"]
