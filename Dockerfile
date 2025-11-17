FROM node:24
RUN apt update
RUN apt-get install npm libopenjp2-tools ruby-dev -y
RUN gem i fpm -f
RUN yarn global add node-gyp