FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY src ./src
COPY data ./data
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "src/server.js"]
