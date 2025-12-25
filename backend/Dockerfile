FROM node:18-alpine

WORKDIR /app

# Install bash and tini for better signal handling
RUN apk add --no-cache bash tini postgresql-client

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]
