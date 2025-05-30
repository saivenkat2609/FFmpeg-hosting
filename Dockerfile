FROM node:18-slim

# Install ffmpeg, yt-dlp, bash, python
RUN apt-get update && \
    apt-get install -y ffmpeg curl bash python3 python3-pip && \
    pip3 install yt-dlp && \
    npm install -g n8n

# Create working dir
RUN mkdir -p /home/node/.n8n
WORKDIR /home/node/

# Set env to avoid issues
ENV N8N_BASIC_AUTH_ACTIVE=true
ENV N8N_BASIC_AUTH_USER=admin
ENV N8N_BASIC_AUTH_PASSWORD=password
ENV GENERIC_TIMEZONE=Asia/Kolkata
ENV NODE_ENV=production

# Expose port
EXPOSE 5678

# Start n8n
CMD ["n8n"]
