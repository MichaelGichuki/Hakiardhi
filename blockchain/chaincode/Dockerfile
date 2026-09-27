FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /usr/src/app/dist ./dist

ENV PORT=9999
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999

EXPOSE 9999

CMD ["npm", "start", "--", "--peer.address", "0.0.0.0:9999"]