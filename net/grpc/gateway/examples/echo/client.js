goog.provide('haha');

goog.require('grpc.web.GrpcWebClientReadableStream');
goog.require('proto.grpc.gateway.testing.EchoServiceClient');
goog.require('proto.grpc.gateway.testing.EchoRequest');
goog.require('proto.grpc.gateway.testing.EchoResponse');
goog.require('proto.grpc.gateway.testing.ServerStreamingEchoRequest');

proto.grpc.gateway.testing.EchoServiceClient.prototype['echo'] =
    proto.grpc.gateway.testing.EchoServiceClient.prototype.echo;

proto.grpc.gateway.testing.EchoRequest.prototype['setMessage'] =
    proto.grpc.gateway.testing.EchoRequest.prototype.setMessage;

proto.grpc.gateway.testing.EchoResponse.prototype['getMessage'] =
    proto.grpc.gateway.testing.EchoResponse.prototype.getMessage;

grpc.web.GrpcWebClientReadableStream.prototype['on'] =
    grpc.web.GrpcWebClientReadableStream.prototype.on;

module['EchoServiceClient'] = proto.grpc.gateway.testing.EchoServiceClient;
module['EchoRequest'] = proto.grpc.gateway.testing.EchoRequest;
module['ServerStreamingEchoRequest'] = proto.grpc.gateway.testing.ServerStreamingEchoRequest;