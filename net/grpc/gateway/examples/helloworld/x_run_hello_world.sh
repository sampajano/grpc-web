#!/usr/bin/env bash

protoc -I=. helloworld.proto \
  --js_out=import_style=commonjs:. \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:.
# npm install # Only needed the first time
npx webpack client.js

echo "node server.js &"
echo 'docker run -d -v "$(pwd)"/envoy.yaml:/etc/envoy/envoy.yaml:ro \'
echo "    -p 8080:8080 -p 9901:9901 envoyproxy/envoy:v1.17.0"
echo "python3 -m http.server 8081"
