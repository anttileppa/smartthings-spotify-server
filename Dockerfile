
FROM node:12
ADD . .
RUN npm run build
CMD npm run start