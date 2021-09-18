/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
goog.module('grpc.web.GrpcWebClientBaseTest');
goog.setTestOnly('grpc.web.GrpcWebClientBaseTest');

const ClientReadableStream = goog.require('grpc.web.ClientReadableStream');
const EventType = goog.require('goog.net.EventType');
const GrpcWebClientBase = goog.require('grpc.web.GrpcWebClientBase');
const Map = goog.require('goog.structs.Map');
const googCrypt = goog.require('goog.crypt.base64');
const googEvents = goog.require('goog.events');
const testSuite = goog.require('goog.testing.testSuite');
const {StreamInterceptor} = goog.require('grpc.web.Interceptor');
goog.require('goog.testing.jsunit');

const REQUEST_BYTES = [1, 2, 3];
const FAKE_METHOD = 'fake-method';
const PROTO_FIELD_VALUE = 'meow';
const DEFAULT_UNARY_HEADERS =
    ['Content-Type', 'Accept', 'X-User-Agent', 'X-Grpc-Web'];
const DEFAULT_UNARY_HEADER_VALUES = [
  'application/grpc-web-text', 'application/grpc-web-text',
  'grpc-web-javascript/0.1', '1'
];
let dataCallback;
let expectedHeaders;
let expectedHeaderValues;


testSuite({
  setUp: function() {
    googEvents.listen = function(a, event_type, listener, d, e) {
      if (event_type == EventType.READY_STATE_CHANGE) {
        dataCallback = listener;
      }
      return;
    };
  },

  tearDown: function() {
    expectedHeaders = null;
    expectedHeaderValues = null;
  },

  testRpcResponse: function() {
    var client = new GrpcWebClientBase();
    client.newXhr_ = function() {
      return new MockXhr({
        // This parses to [ { DATA: [4,5,6] }, { TRAILER: "a: b" } ]
        response: googCrypt.encodeByteArray(new Uint8Array(
            [0, 0, 0, 0, 3, 4, 5, 6, 128, 0, 0, 0, 4, 97, 58, 32, 98])),
      });
    };

    expectUnaryHeaders();
    client.rpcCall(
        FAKE_METHOD, /** requestMessage */ {}, /** metadata */ {}, {
          requestSerializeFn: function(request) {
            return REQUEST_BYTES;
          },
          responseDeserializeFn: function(bytes) {
            assertElementsEquals([4, 5, 6], [].slice.call(bytes));
            return {'field1': PROTO_FIELD_VALUE};
          }
        },
        function(error, response) {
          assertNull(error);
          assertEquals(PROTO_FIELD_VALUE, response['field1']);
        });
    dataCallback();
  },

  testDeadline: function() {
    const client = new GrpcWebClientBase();
    client.newXhr_ = function() {
      return new MockXhr({
        deadline: true,
        response: googCrypt.encodeByteArray(new Uint8Array(0)),
      });
    };

    expectUnaryHeaders();
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 1);
    client.rpcCall(
        FAKE_METHOD, /** requestMessage */ {}, {'deadline': deadline}, {
          requestSerializeFn: (request) => REQUEST_BYTES,
          responseDeserializeFn: (bytes) => {},

        },
        (error, response) => assertNull(error));
    dataCallback();
  },

  testStreamInterceptor: function() {
    var interceptor = new StreamResponseInterceptor();
    var client = new GrpcWebClientBase({'streamInterceptors': [interceptor]});
    client.newXhr_ = function() {
      return new MockXhr({
        // This parses to [ { DATA: [4,5,6] }, { TRAILER: "a: b" } ]
        response: googCrypt.encodeByteArray(new Uint8Array(
            [0, 0, 0, 0, 3, 4, 5, 6, 128, 0, 0, 0, 4, 97, 58, 32, 98])),
      });
    };

    expectUnaryHeaders();
    client.rpcCall(
        FAKE_METHOD, {}, {}, {
          requestSerializeFn: function(request) {
            return REQUEST_BYTES;
          },
          responseDeserializeFn: function(bytes) {
            assertElementsEquals([4, 5, 6], [].slice.call(bytes));
            return {'field1': PROTO_FIELD_VALUE};
          }
        },
        function(error, response) {
          assertNull(error);
          assertEquals('field2', response['field2']);
        });
    dataCallback();
  },

  testRpcError: function() {
    var client = new GrpcWebClientBase();
    client.newXhr_ = function() {
      return new MockXhr({
        // This decodes to "grpc-status: 3"
        response: googCrypt.encodeByteArray(new Uint8Array([
          128, 0, 0, 0, 14, 103, 114, 112, 99, 45, 115, 116, 97, 116, 117, 115,
          58, 32, 51
        ])),
      });
    };

    expectUnaryHeaders();
    client.rpcCall(
        FAKE_METHOD, {}, {}, {
          requestSerializeFn: function(request) {
            return REQUEST_BYTES;
          },
          responseDeserializeFn: function(bytes) {
            return {};
          }
        },
        function(error, response) {
          assertNull(response);
          assertEquals(3, error.code);
        });
    dataCallback();
  },

  testRpcResponseHeader: function() {
    var client = new GrpcWebClientBase();
    client.newXhr_ = function() {
      return new MockXhr({
        // This parses to [ { DATA: [4,5,6] }, { TRAILER: "a: b" } ]
        response: googCrypt.encodeByteArray(new Uint8Array(
            [0, 0, 0, 0, 3, 4, 5, 6, 128, 0, 0, 0, 4, 97, 58, 32, 98])),
      });
    };

    expectUnaryHeaders();
    var call = client.rpcCall(
        FAKE_METHOD, {}, {}, {
          requestSerializeFn: function(request) {
            return REQUEST_BYTES;
          },
          responseDeserializeFn: function(bytes) {
            assertElementsEquals([4, 5, 6], [].slice.call(bytes));
            return {'field1': PROTO_FIELD_VALUE};
          }
        },
        function(error, response) {
          assertNull(error);
          assertEquals(PROTO_FIELD_VALUE, response['field1']);
        });
    call.on('metadata', (metadata) => {
      assertEquals(
          metadata['sample-initial-metadata-1'], 'sample-initial-metadata-val');
    });
    dataCallback();
  }

});


/** Sets expected headers as the unary response headers */
function expectUnaryHeaders() {
  expectedHeaders = [...DEFAULT_UNARY_HEADERS];
  expectedHeaderValues = [...DEFAULT_UNARY_HEADER_VALUES];
}


/** @unrestricted */
class MockXhr {
  /**
   * @param {?Object} mockValues
   * Mock XhrIO object to test the outgoing values
   */
  constructor(mockValues) {
    this.mockValues = mockValues;
    this.headers = new Map();
  }

  /**
   * @param {string} url
   * @param {string=} method
   * @param {string=} content
   * @param {string=} headers
   */
  send(url, method, content, headers) {
    assertEquals(FAKE_METHOD, url);
    assertEquals('POST', method);
    assertElementsEquals(
        googCrypt.encodeByteArray(new Uint8Array([0, 0, 0, 0, 3, 1, 2, 3])),
        content);
    if (!this.mockValues.deadline) {
      assertElementsEquals(expectedHeaders, this.headers.getKeys());
      assertElementsEquals(expectedHeaderValues, this.headers.getValues());
    } else {
      expectedHeaders.push('grpc-timeout');
      assertElementsEquals(expectedHeaders, this.headers.getKeys());
    }
  }

  /**
   * @param {number} ms
   */
  setTimeoutInterval(ms) {
    return;
  }

  /**
   * @param {boolean} withCredentials
   */
  setWithCredentials(withCredentials) {
    return;
  }

  /**
   * @return {string} response
   */
  getResponseText() {
    return this.mockValues.response;
  }

  /**
   * @param {string} key header key
   * @return {string} content-type
   */
  getStreamingResponseHeader(key) {
    return 'application/grpc-web-text';
  }

  /**
   * @return {string} response
   */
  getResponseHeaders() {
    return {'sample-initial-metadata-1': 'sample-initial-metadata-val'};
  }

  /**
   * @return {number} xhr state
   */
  getReadyState() {
    return 0;
  }

  /**
   * @return {number} lastErrorCode
   */
  getLastErrorCode() {
    return 0;
  }

  /**
   * @return {string} lastError
   */
  getLastError() {
    return 'server not responding';
  }

  /**
   * @param {string} responseType
   */
  setResponseType(responseType) {
    return;
  }
}



/**
 * @implements {StreamInterceptor}
 * @unrestricted
 */
class StreamResponseInterceptor {
  constructor() {}

  /** @override */
  intercept(request, invoker) {
    /**
     * @implements {ClientReadableStream}
     * @constructor
     * @param {!ClientReadableStream<RESPONSE>} stream
     * @template RESPONSE
     */
    const InterceptedStream = function(stream) {
      this.stream = stream;
    };

    /** @override */
    InterceptedStream.prototype.on = function(eventType, callback) {
      if (eventType == 'data') {
        const newCallback = (response) => {
          response['field2'] = 'field2';
          callback(response);
        };
        this.stream.on(eventType, newCallback);
      } else {
        this.stream.on(eventType, callback);
      }
      return this;
    };

    /** @override */
    InterceptedStream.prototype.cancel = function() {
      this.stream.cancel();
      return this;
    };

    return new InterceptedStream(invoker(request));
  }
}
