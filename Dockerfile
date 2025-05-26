FROM node:18

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    mkdir /app

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
