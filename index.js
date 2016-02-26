/**
 * Promise wrapper for superagent
 */

function wrap(superagent, Promise) {

  var PromiseRequest = createPromise(superagent.Request, Promise);

  /**
   * Request builder with same interface as superagent.
   * It is convenient to import this as `request` in place of superagent.
   */
  var request = function(method, url) {
    return new PromiseRequest(method, url);
  };

  /**
   * Inherit methods and properties from superagent so we can use request the same way as superagent
   */
  for (var method in superagent) {
    if (superagent.hasOwnProperty(method)) {
      request[method] = superagent[method];
    }
  }

  var AgentPromise = createPromise(request.agent, Promise);
  var agentFn = function() {
    return new AgentPromise(...arguments);
  }
  var callAgent = function(agent) {
    return function(method, url) {
      agent[method.toLowerCase()].apply(agent, url);
    }
  }
  request.agent = function() {
    var agent = agentFn.apply(request, arguments);
    return addHelpers(callAgent(agent), agent);
  }

  return addHelpers(request);
}

function createPromise(request, Promise) {
  /**
   * Request object similar to superagent.Request, but with end() returning
   * a promise.
   */
  function PromiseRequest() {
    request.apply(this, arguments);
  }

  // Inherit form superagent.Request
  PromiseRequest.prototype = Object.create(request.prototype);

  /** Send request and get a promise that `end` was emitted */
  PromiseRequest.prototype.end = function(cb) {
    var _end = request.prototype.end;
    var self = this;

    return new Promise(function(accept, reject) {
      _end.call(self, function(err, response) {
        if (cb) {
          cb(err, response);
        }

        if (err) {
          err.response = response;
          reject(err);
        } else {
          accept(response);
        }
      });
    });
  };

  /** Provide a more promise-y interface */
  PromiseRequest.prototype.then = function(resolve, reject) {
    var _end = request.prototype.end;
    var self = this;

    return new Promise(function(accept, reject) {
      _end.call(self, function(err, response) {
        if (err) {
          err.response = response;
          reject(err);
        } else {
          accept(response);
        }
      });
    }).then(resolve, reject);
  };

  return PromiseRequest;
}

function addHelpers(request, obj) {
  /** Helper for making an options request */
  (obj || request).options = function(url) {
    return request('OPTIONS', url);
  }

  /** Helper for making a head request */
  (obj || request).head = function(url, data) {
    var req = request('HEAD', url);
    if (data) {
      req.send(data);
    }
    return req;
  };

  /** Helper for making a get request */
  (obj || request).get = function(url, data) {
    var req = request('GET', url);
    if (data) {
      req.query(data);
    }
    return req;
  };

  /** Helper for making a post request */
  (obj || request).post = function(url, data) {
    var req = request('POST', url);
    if (data) {
      req.send(data);
    }
    return req;
  };

  /** Helper for making a put request */
  (obj || request).put = function(url, data) {
    var req = request('PUT', url);
    if (data) {
      req.send(data);
    }
    return req;
  };

  /** Helper for making a patch request */
  (obj || request).patch = function(url, data) {
    var req = request('PATCH', url);
    if (data) {
      req.send(data);
    }
    return req;
  };

  /** Helper for making a delete request */
  (obj || request).del = function(url) {
    return request('DELETE', url);
  };

  // Export the request builder
  return obj || request;
}

module.exports = wrap;
