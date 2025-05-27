FROM node:18

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
        ffmpeg \
        curl \
        python3-pip \
        python3-setuptools && \
    pip3 install --break-system-packages --no-cache-dir yt-dlp && \
    mkdir -p /app


WORKDIR /app

# Copy and install Node.js dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
