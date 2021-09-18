#FROM node:12-stretch
FROM selenium/standalone-chrome:93.0

USER root

RUN apt-get update && \
  apt-get install -y nodejs npm python

WORKDIR /grpc-web

COPY ./javascript ./javascript
COPY ./packages ./packages
COPY ./scripts ./scripts

WORKDIR /grpc-web/packages/grpc-web

RUN npm install
