FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/node:16 as build

WORKDIR /app

# 设置npm镜像源为更快的国内源
RUN npm config set registry https://registry.npmmirror.com/
RUN npm config set cache /tmp/npm-cache

COPY ./app/package*.json ./
RUN npm ci --legacy-peer-deps --cache /tmp/npm-cache

COPY ./app/ /app

RUN npm run build

FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/library/nginx:1.25.3

COPY ./nginx.conf /etc/nginx/conf.d/angular.conf
COPY --from=build /app/build /usr/share/nginx/html
RUN chmod -R o+r /usr/share/nginx/html/

