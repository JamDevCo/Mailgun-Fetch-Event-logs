FROM node:12.18

# Create app directory
WORKDIR /usr/src/app
COPY . .

RUN npm install
RUN mkdir -p /usr/src/app/src/data
RUN ln -s /usr/src/app/src/data /data

VOLUME ["/data"]


CMD [ "npm", "run", "fetch"]