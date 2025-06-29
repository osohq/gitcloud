# Use the official Node.js image as the base image
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production
COPY . .
RUN yarn build

# Expose the port Next.js will run on
EXPOSE 8000
ENV PORT 8000

# Command to start the Next.js app
CMD ["yarn", "start"]