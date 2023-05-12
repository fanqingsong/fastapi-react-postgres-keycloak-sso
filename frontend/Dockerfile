FROM node:lts as build

WORKDIR /app

COPY ./app/ /app
RUN npm install --legacy-peer-deps --registry=https://registry.npm.taobao.org
RUN npm run build

FROM nginx

COPY ./nginx.conf /etc/nginx/conf.d/angular.conf
COPY --from=build /app/build /usr/share/nginx/html
RUN chmod -R o+r /usr/share/nginx/html/

