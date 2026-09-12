FROM hyperledger/fabric-nodeenv:2.5

USER root
WORKDIR /usr/src/app

COPY package*.json ./
COPY node_modules ./node_modules
COPY dist ./dist

ENV PORT=9999
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999

EXPOSE 9999

CMD ["sh", "-c", "npm start"]
