FROM node:12.18

# Create app directory
WORKDIR /usr/src/app
COPY . .

RUN npm install

VOLUME ["data"]


CMD [ "npm", "run", "fetch"]