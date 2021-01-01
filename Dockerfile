
FROM node:12
ADD . .
RUN npm i
RUN npm run build
CMD npm run start