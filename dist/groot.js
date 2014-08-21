var define, requireModule, require, requirejs;

(function() {

  var _isArray;
  if (!Array.isArray) {
    _isArray = function (x) {
      return Object.prototype.toString.call(x) === "[object Array]";
    };
  } else {
    _isArray = Array.isArray;
  }
  
  var registry = {}, seen = {}, state = {};
  var FAILED = false;

  define = function(name, deps, callback) {
  
    if (!_isArray(deps)) {
      callback = deps;
      deps     =  [];
    }
  
    registry[name] = {
      deps: deps,
      callback: callback
    };
  };

  function reify(deps, name, seen) {
    var length = deps.length;
    var reified = new Array(length);
    var dep;
    var exports;

    for (var i = 0, l = length; i < l; i++) {
      dep = deps[i];
      if (dep === 'exports') {
        exports = reified[i] = seen;
      } else {
        reified[i] = require(resolve(dep, name));
      }
    }

    return {
      deps: reified,
      exports: exports
    };
  }

  requirejs = require = requireModule = function(name) {
    if (state[name] !== FAILED &&
        seen.hasOwnProperty(name)) {
      return seen[name];
    }

    if (!registry[name]) {
      throw new Error('Could not find module ' + name);
    }

    var mod = registry[name];
    var reified;
    var module;
    var loaded = false;

    seen[name] = { }; // placeholder for run-time cycles

    try {
      reified = reify(mod.deps, name, seen[name]);
      module = mod.callback.apply(this, reified.deps);
      loaded = true;
    } finally {
      if (!loaded) {
        state[name] = FAILED;
      }
    }

    return reified.exports ? seen[name] : (seen[name] = module);
  };

  function resolve(child, name) {
    if (child.charAt(0) !== '.') { return child; }

    var parts = child.split('/');
    var nameParts = name.split('/');
    var parentBase;

    if (nameParts.length === 1) {
      parentBase = nameParts;
    } else {
      parentBase = nameParts.slice(0, -1);
    }

    for (var i = 0, l = parts.length; i < l; i++) {
      var part = parts[i];

      if (part === '..') { parentBase.pop(); }
      else if (part === '.') { continue; }
      else { parentBase.push(part); }
    }

    return parentBase.join('/');
  }

  requirejs.entries = requirejs._eak_seen = registry;
  requirejs.clear = function(){
    requirejs.entries = requirejs._eak_seen = registry = {};
    seen = state = {};
  };
})();

/*!
 * @overview RSVP - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/tildeio/rsvp.js/master/LICENSE
 * @version   3.0.11
 */

(function() {
    "use strict";

    function $$rsvp$events$$indexOf(callbacks, callback) {
      for (var i=0, l=callbacks.length; i<l; i++) {
        if (callbacks[i] === callback) { return i; }
      }

      return -1;
    }

    function $$rsvp$events$$callbacksFor(object) {
      var callbacks = object._promiseCallbacks;

      if (!callbacks) {
        callbacks = object._promiseCallbacks = {};
      }

      return callbacks;
    }

    var $$rsvp$events$$default = {

      /**
        `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
        Example:

        ```javascript
        var object = {};

        RSVP.EventTarget.mixin(object);

        object.on('finished', function(event) {
          // handle event
        });

        object.trigger('finished', { detail: value });
        ```

        `EventTarget.mixin` also works with prototypes:

        ```javascript
        var Person = function() {};
        RSVP.EventTarget.mixin(Person.prototype);

        var yehuda = new Person();
        var tom = new Person();

        yehuda.on('poke', function(event) {
          console.log('Yehuda says OW');
        });

        tom.on('poke', function(event) {
          console.log('Tom says OW');
        });

        yehuda.trigger('poke');
        tom.trigger('poke');
        ```

        @method mixin
        @for RSVP.EventTarget
        @private
        @param {Object} object object to extend with EventTarget methods
      */
      mixin: function(object) {
        object.on = this.on;
        object.off = this.off;
        object.trigger = this.trigger;
        object._promiseCallbacks = undefined;
        return object;
      },

      /**
        Registers a callback to be executed when `eventName` is triggered

        ```javascript
        object.on('event', function(eventInfo){
          // handle the event
        });

        object.trigger('event');
        ```

        @method on
        @for RSVP.EventTarget
        @private
        @param {String} eventName name of the event to listen for
        @param {Function} callback function to be called when the event is triggered.
      */
      on: function(eventName, callback) {
        var allCallbacks = $$rsvp$events$$callbacksFor(this), callbacks;

        callbacks = allCallbacks[eventName];

        if (!callbacks) {
          callbacks = allCallbacks[eventName] = [];
        }

        if ($$rsvp$events$$indexOf(callbacks, callback) === -1) {
          callbacks.push(callback);
        }
      },

      /**
        You can use `off` to stop firing a particular callback for an event:

        ```javascript
        function doStuff() { // do stuff! }
        object.on('stuff', doStuff);

        object.trigger('stuff'); // doStuff will be called

        // Unregister ONLY the doStuff callback
        object.off('stuff', doStuff);
        object.trigger('stuff'); // doStuff will NOT be called
        ```

        If you don't pass a `callback` argument to `off`, ALL callbacks for the
        event will not be executed when the event fires. For example:

        ```javascript
        var callback1 = function(){};
        var callback2 = function(){};

        object.on('stuff', callback1);
        object.on('stuff', callback2);

        object.trigger('stuff'); // callback1 and callback2 will be executed.

        object.off('stuff');
        object.trigger('stuff'); // callback1 and callback2 will not be executed!
        ```

        @method off
        @for RSVP.EventTarget
        @private
        @param {String} eventName event to stop listening to
        @param {Function} callback optional argument. If given, only the function
        given will be removed from the event's callback queue. If no `callback`
        argument is given, all callbacks will be removed from the event's callback
        queue.
      */
      off: function(eventName, callback) {
        var allCallbacks = $$rsvp$events$$callbacksFor(this), callbacks, index;

        if (!callback) {
          allCallbacks[eventName] = [];
          return;
        }

        callbacks = allCallbacks[eventName];

        index = $$rsvp$events$$indexOf(callbacks, callback);

        if (index !== -1) { callbacks.splice(index, 1); }
      },

      /**
        Use `trigger` to fire custom events. For example:

        ```javascript
        object.on('foo', function(){
          console.log('foo event happened!');
        });
        object.trigger('foo');
        // 'foo event happened!' logged to the console
        ```

        You can also pass a value as a second argument to `trigger` that will be
        passed as an argument to all event listeners for the event:

        ```javascript
        object.on('foo', function(value){
          console.log(value.name);
        });

        object.trigger('foo', { name: 'bar' });
        // 'bar' logged to the console
        ```

        @method trigger
        @for RSVP.EventTarget
        @private
        @param {String} eventName name of the event to be triggered
        @param {Any} options optional value to be passed to any event handlers for
        the given `eventName`
      */
      trigger: function(eventName, options) {
        var allCallbacks = $$rsvp$events$$callbacksFor(this), callbacks, callback;

        if (callbacks = allCallbacks[eventName]) {
          // Don't cache the callbacks.length since it may grow
          for (var i=0; i<callbacks.length; i++) {
            callback = callbacks[i];

            callback(options);
          }
        }
      }
    };

    var $$rsvp$config$$config = {
      instrument: false
    };

    $$rsvp$events$$default.mixin($$rsvp$config$$config);

    function $$rsvp$config$$configure(name, value) {
      if (name === 'onerror') {
        // handle for legacy users that expect the actual
        // error to be passed to their function added via
        // `RSVP.configure('onerror', someFunctionHere);`
        $$rsvp$config$$config.on('error', value);
        return;
      }

      if (arguments.length === 2) {
        $$rsvp$config$$config[name] = value;
      } else {
        return $$rsvp$config$$config[name];
      }
    }

    function $$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function $$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function $$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var $$utils$$_isArray;

    if (!Array.isArray) {
      $$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      $$utils$$_isArray = Array.isArray;
    }

    var $$utils$$isArray = $$utils$$_isArray;
    var $$utils$$now = Date.now || function() { return new Date().getTime(); };

    var $$utils$$o_create = (Object.create || function(object) {
      var o = function() { };
      o.prototype = object;
      return o;
    });

    var $$instrument$$queue = [];

    var $$instrument$$default = function instrument(eventName, promise, child) {
      if (1 === $$instrument$$queue.push({
          name: eventName,
          payload: {
            guid: promise._guidKey + promise._id,
            eventName: eventName,
            detail: promise._result,
            childGuid: child && promise._guidKey + child._id,
            label: promise._label,
            timeStamp: $$utils$$now(),
            stack: new Error(promise._label).stack
          }})) {

            setTimeout(function() {
              var entry;
              for (var i = 0; i < $$instrument$$queue.length; i++) {
                entry = $$instrument$$queue[i];
                $$rsvp$config$$config.trigger(entry.name, entry.payload);
              }
              $$instrument$$queue.length = 0;
            }, 50);
          }
      };

    function $$$internal$$noop() {}
    var $$$internal$$PENDING   = void 0;
    var $$$internal$$FULFILLED = 1;
    var $$$internal$$REJECTED  = 2;
    var $$$internal$$GET_THEN_ERROR = new $$$internal$$ErrorObject();

    function $$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        $$$internal$$GET_THEN_ERROR.error = error;
        return $$$internal$$GET_THEN_ERROR;
      }
    }

    function $$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function $$$internal$$handleForeignThenable(promise, thenable, then) {
      $$rsvp$config$$config.async(function(promise) {
        var sealed = false;
        var error = $$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            $$$internal$$resolve(promise, value);
          } else {
            $$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          $$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          $$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function $$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === $$$internal$$FULFILLED) {
        $$$internal$$fulfill(promise, thenable._result);
      } else if (promise._state === $$$internal$$REJECTED) {
        $$$internal$$reject(promise, thenable._result);
      } else {
        $$$internal$$subscribe(thenable, undefined, function(value) {
          if (thenable !== value) {
            $$$internal$$resolve(promise, value);
          } else {
            $$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          $$$internal$$reject(promise, reason);
        });
      }
    }

    function $$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        $$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = $$$internal$$getThen(maybeThenable);

        if (then === $$$internal$$GET_THEN_ERROR) {
          $$$internal$$reject(promise, $$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          $$$internal$$fulfill(promise, maybeThenable);
        } else if ($$utils$$isFunction(then)) {
          $$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          $$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function $$$internal$$resolve(promise, value) {
      if (promise === value) {
        $$$internal$$fulfill(promise, value);
      } else if ($$utils$$objectOrFunction(value)) {
        $$$internal$$handleMaybeThenable(promise, value);
      } else {
        $$$internal$$fulfill(promise, value);
      }
    }

    function $$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      $$$internal$$publish(promise);
    }

    function $$$internal$$fulfill(promise, value) {
      if (promise._state !== $$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = $$$internal$$FULFILLED;

      if (promise._subscribers.length === 0) {
        if ($$rsvp$config$$config.instrument) {
          $$instrument$$default('fulfilled', promise);
        }
      } else {
        $$rsvp$config$$config.async($$$internal$$publish, promise);
      }
    }

    function $$$internal$$reject(promise, reason) {
      if (promise._state !== $$$internal$$PENDING) { return; }
      promise._state = $$$internal$$REJECTED;
      promise._result = reason;

      $$rsvp$config$$config.async($$$internal$$publishRejection, promise);
    }

    function $$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + $$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + $$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        $$rsvp$config$$config.async($$$internal$$publish, parent);
      }
    }

    function $$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if ($$rsvp$config$$config.instrument) {
        $$instrument$$default(settled === $$$internal$$FULFILLED ? 'fulfilled' : 'rejected', promise);
      }

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          $$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function $$$internal$$ErrorObject() {
      this.error = null;
    }

    var $$$internal$$TRY_CATCH_ERROR = new $$$internal$$ErrorObject();

    function $$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        $$$internal$$TRY_CATCH_ERROR.error = e;
        return $$$internal$$TRY_CATCH_ERROR;
      }
    }

    function $$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = $$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = $$$internal$$tryCatch(callback, detail);

        if (value === $$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          $$$internal$$reject(promise, new TypeError('A promises callback cannot return that same promise.'));
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== $$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        $$$internal$$resolve(promise, value);
      } else if (failed) {
        $$$internal$$reject(promise, error);
      } else if (settled === $$$internal$$FULFILLED) {
        $$$internal$$fulfill(promise, value);
      } else if (settled === $$$internal$$REJECTED) {
        $$$internal$$reject(promise, value);
      }
    }

    function $$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          $$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          $$$internal$$reject(promise, reason);
        });
      } catch(e) {
        $$$internal$$reject(promise, e);
      }
    }

    function $$enumerator$$makeSettledResult(state, position, value) {
      if (state === $$$internal$$FULFILLED) {
        return {
          state: 'fulfilled',
          value: value
        };
      } else {
        return {
          state: 'rejected',
          reason: value
        };
      }
    }

    function $$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor($$$internal$$noop, label);
      this._abortOnReject = abortOnReject;

      if (this._validateInput(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._init();

        if (this.length === 0) {
          $$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            $$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        $$$internal$$reject(this.promise, this._validationError());
      }
    }

    $$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return $$utils$$isArray(input);
    };

    $$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    $$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var $$enumerator$$default = $$enumerator$$Enumerator;

    $$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var promise = this.promise;
      var input   = this._input;

      for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    $$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      if ($$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== $$$internal$$PENDING) {
          entry._onerror = null;
          this._settledAt(entry._state, i, entry._result);
        } else {
          this._willSettleAt(c.resolve(entry), i);
        }
      } else {
        this._remaining--;
        this._result[i] = this._makeResult($$$internal$$FULFILLED, i, entry);
      }
    };

    $$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === $$$internal$$PENDING) {
        this._remaining--;

        if (this._abortOnReject && state === $$$internal$$REJECTED) {
          $$$internal$$reject(promise, value);
        } else {
          this._result[i] = this._makeResult(state, i, value);
        }
      }

      if (this._remaining === 0) {
        $$$internal$$fulfill(promise, this._result);
      }
    };

    $$enumerator$$Enumerator.prototype._makeResult = function(state, i, value) {
      return value;
    };

    $$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      $$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt($$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt($$$internal$$REJECTED, i, reason);
      });
    };

    var $$promise$all$$default = function all(entries, label) {
      return new $$enumerator$$default(this, entries, true /* abort on reject */, label).promise;
    };

    var $$promise$race$$default = function race(entries, label) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor($$$internal$$noop, label);

      if (!$$utils$$isArray(entries)) {
        $$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        $$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        $$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
        $$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    };

    var $$promise$resolve$$default = function resolve(object, label) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor($$$internal$$noop, label);
      $$$internal$$resolve(promise, object);
      return promise;
    };

    var $$promise$reject$$default = function reject(reason, label) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor($$$internal$$noop, label);
      $$$internal$$reject(promise, reason);
      return promise;
    };

    var $$rsvp$promise$$guidKey = 'rsvp_' + $$utils$$now() + '-';
    var $$rsvp$promise$$counter = 0;

    function $$rsvp$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function $$rsvp$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var $$rsvp$promise$$default = $$rsvp$promise$$Promise;

    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise’s eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class RSVP.Promise
      @param {function} resolver
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @constructor
    */
    function $$rsvp$promise$$Promise(resolver, label) {
      this._id = $$rsvp$promise$$counter++;
      this._label = label;
      this._subscribers = [];

      if ($$rsvp$config$$config.instrument) {
        $$instrument$$default('created', this);
      }

      if ($$$internal$$noop !== resolver) {
        if (!$$utils$$isFunction(resolver)) {
          $$rsvp$promise$$needsResolver();
        }

        if (!(this instanceof $$rsvp$promise$$Promise)) {
          $$rsvp$promise$$needsNew();
        }

        $$$internal$$initializePromise(this, resolver);
      }
    }

    // deprecated
    $$rsvp$promise$$Promise.cast = $$promise$resolve$$default;

    $$rsvp$promise$$Promise.all = $$promise$all$$default;
    $$rsvp$promise$$Promise.race = $$promise$race$$default;
    $$rsvp$promise$$Promise.resolve = $$promise$resolve$$default;
    $$rsvp$promise$$Promise.reject = $$promise$reject$$default;

    $$rsvp$promise$$Promise.prototype = {
      constructor: $$rsvp$promise$$Promise,

      _id: undefined,
      _guidKey: $$rsvp$promise$$guidKey,
      _label: undefined,

      _state: undefined,
      _result: undefined,
      _subscribers: undefined,

      _onerror: function (reason) {
        $$rsvp$config$$config.trigger('error', reason);
      },

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection, label) {
        var parent = this;
        var state = parent._state;

        if (state === $$$internal$$FULFILLED && !onFulfillment || state === $$$internal$$REJECTED && !onRejection) {
          if ($$rsvp$config$$config.instrument) {
            $$instrument$$default('chained', this, this);
          }
          return this;
        }

        parent._onerror = null;

        var child = new this.constructor($$$internal$$noop, label);
        var result = parent._result;

        if ($$rsvp$config$$config.instrument) {
          $$instrument$$default('chained', parent, child);
        }

        if (state) {
          var callback = arguments[state - 1];
          $$rsvp$config$$config.async(function(){
            $$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          $$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection, label) {
        return this.then(null, onRejection, label);
      },

    /**
      `finally` will be invoked regardless of the promise's fate just as native
      try/catch/finally behaves

      Synchronous example:

      ```js
      findAuthor() {
        if (Math.random() > 0.5) {
          throw new Error();
        }
        return new Author();
      }

      try {
        return findAuthor(); // succeed or fail
      } catch(error) {
        return findOtherAuther();
      } finally {
        // always runs
        // doesn't affect the return value
      }
      ```

      Asynchronous example:

      ```js
      findAuthor().catch(function(reason){
        return findOtherAuther();
      }).finally(function(){
        // author was either found, or not
      });
      ```

      @method finally
      @param {Function} callback
      @param {String} label optional string for labeling the promise.
      Useful for tooling.
      @return {Promise}
    */
      'finally': function(callback, label) {
        var constructor = this.constructor;

        return this.then(function(value) {
          return constructor.resolve(callback()).then(function(){
            return value;
          });
        }, function(reason) {
          return constructor.resolve(callback()).then(function(){
            throw reason;
          });
        }, label);
      }
    };

    function $$rsvp$node$$Result() {
      this.value = undefined;
    }

    var $$rsvp$node$$ERROR = new $$rsvp$node$$Result();
    var $$rsvp$node$$GET_THEN_ERROR = new $$rsvp$node$$Result();

    function $$rsvp$node$$getThen(obj) {
      try {
       return obj.then;
      } catch(error) {
        $$rsvp$node$$ERROR.value= error;
        return $$rsvp$node$$ERROR;
      }
    }

    function $$rsvp$node$$tryApply(f, s, a) {
      try {
        f.apply(s, a);
      } catch(error) {
        $$rsvp$node$$ERROR.value = error;
        return $$rsvp$node$$ERROR;
      }
    }

    function $$rsvp$node$$makeObject(_, argumentNames) {
      var obj = {};
      var name;
      var i;
      var length = _.length;
      var args = new Array(length);

      for (var x = 0; x < length; x++) {
        args[x] = _[x];
      }

      for (i = 0; i < argumentNames.length; i++) {
        name = argumentNames[i];
        obj[name] = args[i + 1];
      }

      return obj;
    }

    function $$rsvp$node$$arrayResult(_) {
      var length = _.length;
      var args = new Array(length - 1);

      for (var i = 1; i < length; i++) {
        args[i - 1] = _[i];
      }

      return args;
    }

    function $$rsvp$node$$wrapThenable(then, arg, args) {
      return {
        then: function() {
          return then.apply(arg, args);
        }
      };
    }

    var $$rsvp$node$$default = function denodeify(nodeFunc, options) {
      var fn = function() {
        var self = this;
        var l = arguments.length;
        var args = new Array(l + 1);
        var arg;
        var promiseInput = false;

        for (var i = 0; i < l; ++i) {
          arg = arguments[i];

          if (!promiseInput) {
            promiseInput = $$rsvp$node$$needsPromiseInput(arg);
            if (promiseInput === $$rsvp$node$$GET_THEN_ERROR) {
              var p = new $$rsvp$promise$$default($$$internal$$noop);
              $$$internal$$reject(p, $$rsvp$node$$GET_THEN_ERROR.value);
              return p;
            } else if (promiseInput && arg.constructor !== $$rsvp$promise$$default) {
              arg = $$rsvp$node$$wrapThenable(promiseInput, arguments);
            }
          }
          args[i] = arg;
        }

        var promise = new $$rsvp$promise$$default($$$internal$$noop);

        args[l] = function(err, val) {
          if (err)
            $$$internal$$reject(promise, err);
          else if (options === undefined)
            $$$internal$$resolve(promise, val);
          else if (options === true)
            $$$internal$$resolve(promise, $$rsvp$node$$arrayResult(arguments));
          else if ($$utils$$isArray(options))
            $$$internal$$resolve(promise, $$rsvp$node$$makeObject(arguments, options));
          else
            $$$internal$$resolve(promise, val);
        };

        if (promiseInput) {
          return $$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self);
        } else {
          return $$rsvp$node$$handleValueInput(promise, args, nodeFunc, self);
        }
      };

      fn.__proto__ = nodeFunc;

      return fn;
    };

    function $$rsvp$node$$handleValueInput(promise, args, nodeFunc, self) {
      var result = $$rsvp$node$$tryApply(nodeFunc, self, args);
      if (result === $$rsvp$node$$ERROR) {
        $$$internal$$reject(promise, result.value);
      }
      return promise;
    }

    function $$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self){
      return $$rsvp$promise$$default.all(args).then(function(args){
        var result = $$rsvp$node$$tryApply(nodeFunc, self, args);
        if (result === $$rsvp$node$$ERROR) {
          $$$internal$$reject(promise, result.value);
        }
        return promise;
      });
    }

    function $$rsvp$node$$needsPromiseInput(arg) {
      if (arg && typeof arg === 'object') {
        if (arg.constructor === $$rsvp$promise$$default) {
          return true;
        } else {
          return $$rsvp$node$$getThen(arg);
        }
      } else {
        return false;
      }
    }

    var $$rsvp$all$$default = function all(array, label) {
      return $$rsvp$promise$$default.all(array, label);
    };

    function $$rsvp$all$settled$$AllSettled(Constructor, entries, label) {
      this._superConstructor(Constructor, entries, false /* don't abort on reject */, label);
    }

    $$rsvp$all$settled$$AllSettled.prototype = $$utils$$o_create($$enumerator$$default.prototype);
    $$rsvp$all$settled$$AllSettled.prototype._superConstructor = $$enumerator$$default;
    $$rsvp$all$settled$$AllSettled.prototype._makeResult = $$enumerator$$makeSettledResult;

    $$rsvp$all$settled$$AllSettled.prototype._validationError = function() {
      return new Error('allSettled must be called with an array');
    };

    var $$rsvp$all$settled$$default = function allSettled(entries, label) {
      return new $$rsvp$all$settled$$AllSettled($$rsvp$promise$$default, entries, label).promise;
    };

    var $$rsvp$race$$default = function race(array, label) {
      return $$rsvp$promise$$default.race(array, label);
    };

    function $$promise$hash$$PromiseHash(Constructor, object, label) {
      this._superConstructor(Constructor, object, true, label);
    }

    var $$promise$hash$$default = $$promise$hash$$PromiseHash;
    $$promise$hash$$PromiseHash.prototype = $$utils$$o_create($$enumerator$$default.prototype);
    $$promise$hash$$PromiseHash.prototype._superConstructor = $$enumerator$$default;

    $$promise$hash$$PromiseHash.prototype._init = function() {
      this._result = {};
    };

    $$promise$hash$$PromiseHash.prototype._validateInput = function(input) {
      return input && typeof input === 'object';
    };

    $$promise$hash$$PromiseHash.prototype._validationError = function() {
      return new Error('Promise.hash must be called with an object');
    };

    $$promise$hash$$PromiseHash.prototype._enumerate = function() {
      var promise = this.promise;
      var input   = this._input;
      var results = [];

      for (var key in input) {
        if (promise._state === $$$internal$$PENDING && input.hasOwnProperty(key)) {
          results.push({
            position: key,
            entry: input[key]
          });
        }
      }

      var length = results.length;
      this._remaining = length;
      var result;

      for (var i = 0; promise._state === $$$internal$$PENDING && i < length; i++) {
        result = results[i];
        this._eachEntry(result.entry, result.position);
      }
    };

    var $$rsvp$hash$$default = function hash(object, label) {
      return new $$promise$hash$$default($$rsvp$promise$$default, object, label).promise;
    };

    function $$rsvp$hash$settled$$HashSettled(Constructor, object, label) {
      this._superConstructor(Constructor, object, false, label);
    }

    $$rsvp$hash$settled$$HashSettled.prototype = $$utils$$o_create($$promise$hash$$default.prototype);
    $$rsvp$hash$settled$$HashSettled.prototype._superConstructor = $$enumerator$$default;
    $$rsvp$hash$settled$$HashSettled.prototype._makeResult = $$enumerator$$makeSettledResult;

    $$rsvp$hash$settled$$HashSettled.prototype._validationError = function() {
      return new Error('hashSettled must be called with an object');
    };

    var $$rsvp$hash$settled$$default = function hashSettled(object, label) {
      return new $$rsvp$hash$settled$$HashSettled($$rsvp$promise$$default, object, label).promise;
    };

    var $$rsvp$rethrow$$default = function rethrow(reason) {
      setTimeout(function() {
        throw reason;
      });
      throw reason;
    };

    var $$rsvp$defer$$default = function defer(label) {
      var deferred = { };

      deferred.promise = new $$rsvp$promise$$default(function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      }, label);

      return deferred;
    };

    var $$rsvp$map$$default = function map(promises, mapFn, label) {
      return $$rsvp$promise$$default.all(promises, label).then(function(values) {
        if (!$$utils$$isFunction(mapFn)) {
          throw new TypeError("You must pass a function as map's second argument.");
        }

        var length = values.length;
        var results = new Array(length);

        for (var i = 0; i < length; i++) {
          results[i] = mapFn(values[i]);
        }

        return $$rsvp$promise$$default.all(results, label);
      });
    };

    var $$rsvp$resolve$$default = function resolve(value, label) {
      return $$rsvp$promise$$default.resolve(value, label);
    };

    var $$rsvp$reject$$default = function reject(reason, label) {
      return $$rsvp$promise$$default.reject(reason, label);
    };

    var $$rsvp$filter$$default = function filter(promises, filterFn, label) {
      return $$rsvp$promise$$default.all(promises, label).then(function(values) {
        if (!$$utils$$isFunction(filterFn)) {
          throw new TypeError("You must pass a function as filter's second argument.");
        }

        var length = values.length;
        var filtered = new Array(length);

        for (var i = 0; i < length; i++) {
          filtered[i] = filterFn(values[i]);
        }

        return $$rsvp$promise$$default.all(filtered, label).then(function(filtered) {
          var results = new Array(length);
          var newLength = 0;

          for (var i = 0; i < length; i++) {
            if (filtered[i]) {
              results[newLength] = values[i];
              newLength++;
            }
          }

          results.length = newLength;

          return results;
        });
      });
    };

    var $$rsvp$asap$$len = 0;

    var $$rsvp$asap$$default = function asap(callback, arg) {
      $$rsvp$asap$$queue[$$rsvp$asap$$len] = callback;
      $$rsvp$asap$$queue[$$rsvp$asap$$len + 1] = arg;
      $$rsvp$asap$$len += 2;
      if ($$rsvp$asap$$len === 2) {
        // If len is 1, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        $$rsvp$asap$$scheduleFlush();
      }
    };

    var $$rsvp$asap$$browserGlobal = (typeof window !== 'undefined') ? window : {};
    var $$rsvp$asap$$BrowserMutationObserver = $$rsvp$asap$$browserGlobal.MutationObserver || $$rsvp$asap$$browserGlobal.WebKitMutationObserver;

    // test for web worker but not in IE10
    var $$rsvp$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function $$rsvp$asap$$useNextTick() {
      return function() {
        process.nextTick($$rsvp$asap$$flush);
      };
    }

    function $$rsvp$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new $$rsvp$asap$$BrowserMutationObserver($$rsvp$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function $$rsvp$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = $$rsvp$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function $$rsvp$asap$$useSetTimeout() {
      return function() {
        setTimeout($$rsvp$asap$$flush, 1);
      };
    }

    var $$rsvp$asap$$queue = new Array(1000);

    function $$rsvp$asap$$flush() {
      for (var i = 0; i < $$rsvp$asap$$len; i+=2) {
        var callback = $$rsvp$asap$$queue[i];
        var arg = $$rsvp$asap$$queue[i+1];

        callback(arg);

        $$rsvp$asap$$queue[i] = undefined;
        $$rsvp$asap$$queue[i+1] = undefined;
      }

      $$rsvp$asap$$len = 0;
    }

    var $$rsvp$asap$$scheduleFlush;

    // Decide what async method to use to triggering processing of queued callbacks:
    if (typeof process !== 'undefined' && {}.toString.call(process) === '[object process]') {
      $$rsvp$asap$$scheduleFlush = $$rsvp$asap$$useNextTick();
    } else if ($$rsvp$asap$$BrowserMutationObserver) {
      $$rsvp$asap$$scheduleFlush = $$rsvp$asap$$useMutationObserver();
    } else if ($$rsvp$asap$$isWorker) {
      $$rsvp$asap$$scheduleFlush = $$rsvp$asap$$useMessageChannel();
    } else {
      $$rsvp$asap$$scheduleFlush = $$rsvp$asap$$useSetTimeout();
    }

    // default async is asap;
    $$rsvp$config$$config.async = $$rsvp$asap$$default;

    var $$rsvp$$cast = $$rsvp$resolve$$default;

    function $$rsvp$$async(callback, arg) {
      $$rsvp$config$$config.async(callback, arg);
    }

    function $$rsvp$$on() {
      $$rsvp$config$$config.on.apply($$rsvp$config$$config, arguments);
    }

    function $$rsvp$$off() {
      $$rsvp$config$$config.off.apply($$rsvp$config$$config, arguments);
    }

    // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
    if (typeof window !== 'undefined' && typeof window['__PROMISE_INSTRUMENTATION__'] === 'object') {
      var $$rsvp$$callbacks = window['__PROMISE_INSTRUMENTATION__'];
      $$rsvp$config$$configure('instrument', true);
      for (var $$rsvp$$eventName in $$rsvp$$callbacks) {
        if ($$rsvp$$callbacks.hasOwnProperty($$rsvp$$eventName)) {
          $$rsvp$$on($$rsvp$$eventName, $$rsvp$$callbacks[$$rsvp$$eventName]);
        }
      }
    }

    var rsvp$umd$$RSVP = {
      'race': $$rsvp$race$$default,
      'Promise': $$rsvp$promise$$default,
      'allSettled': $$rsvp$all$settled$$default,
      'hash': $$rsvp$hash$$default,
      'hashSettled': $$rsvp$hash$settled$$default,
      'denodeify': $$rsvp$node$$default,
      'on': $$rsvp$$on,
      'off': $$rsvp$$off,
      'map': $$rsvp$map$$default,
      'filter': $$rsvp$filter$$default,
      'resolve': $$rsvp$resolve$$default,
      'reject': $$rsvp$reject$$default,
      'all': $$rsvp$all$$default,
      'rethrow': $$rsvp$rethrow$$default,
      'defer': $$rsvp$defer$$default,
      'EventTarget': $$rsvp$events$$default,
      'configure': $$rsvp$config$$configure,
      'async': $$rsvp$$async
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define.amd) {
      define(function() { return rsvp$umd$$RSVP; });
    } else if (typeof module !== 'undefined' && module.exports) {
      module.exports = rsvp$umd$$RSVP;
    } else if (typeof this !== 'undefined') {
      this['RSVP'] = rsvp$umd$$RSVP;
    }
}).call(this);
define("route-recognizer", 
  ["exports"],
  function(__exports__) {
    "use strict";
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];

    var escapeRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');

    function isArray(test) {
      return Object.prototype.toString.call(test) === "[object Array]";
    }

    // A Segment represents a segment in the original route description.
    // Each Segment type provides an `eachChar` and `regex` method.
    //
    // The `eachChar` method invokes the callback with one or more character
    // specifications. A character specification consumes one or more input
    // characters.
    //
    // The `regex` method returns a regex fragment for the segment. If the
    // segment is a dynamic of star segment, the regex fragment also includes
    // a capture.
    //
    // A character specification contains:
    //
    // * `validChars`: a String with a list of all valid characters, or
    // * `invalidChars`: a String with a list of all invalid characters
    // * `repeat`: true if the character specification can repeat

    function StaticSegment(string) { this.string = string; }
    StaticSegment.prototype = {
      eachChar: function(callback) {
        var string = this.string, ch;

        for (var i=0, l=string.length; i<l; i++) {
          ch = string.charAt(i);
          callback({ validChars: ch });
        }
      },

      regex: function() {
        return this.string.replace(escapeRegex, '\\$1');
      },

      generate: function() {
        return this.string;
      }
    };

    function DynamicSegment(name) { this.name = name; }
    DynamicSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "/", repeat: true });
      },

      regex: function() {
        return "([^/]+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function StarSegment(name) { this.name = name; }
    StarSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "", repeat: true });
      },

      regex: function() {
        return "(.+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function EpsilonSegment() {}
    EpsilonSegment.prototype = {
      eachChar: function() {},
      regex: function() { return ""; },
      generate: function() { return ""; }
    };

    function parse(route, names, types) {
      // normalize route as not starting with a "/". Recognition will
      // also normalize.
      if (route.charAt(0) === "/") { route = route.substr(1); }

      var segments = route.split("/"), results = [];

      for (var i=0, l=segments.length; i<l; i++) {
        var segment = segments[i], match;

        if (match = segment.match(/^:([^\/]+)$/)) {
          results.push(new DynamicSegment(match[1]));
          names.push(match[1]);
          types.dynamics++;
        } else if (match = segment.match(/^\*([^\/]+)$/)) {
          results.push(new StarSegment(match[1]));
          names.push(match[1]);
          types.stars++;
        } else if(segment === "") {
          results.push(new EpsilonSegment());
        } else {
          results.push(new StaticSegment(segment));
          types.statics++;
        }
      }

      return results;
    }

    // A State has a character specification and (`charSpec`) and a list of possible
    // subsequent states (`nextStates`).
    //
    // If a State is an accepting state, it will also have several additional
    // properties:
    //
    // * `regex`: A regular expression that is used to extract parameters from paths
    //   that reached this accepting state.
    // * `handlers`: Information on how to convert the list of captures into calls
    //   to registered handlers with the specified parameters
    // * `types`: How many static, dynamic or star segments in this route. Used to
    //   decide which route to use if multiple registered routes match a path.
    //
    // Currently, State is implemented naively by looping over `nextStates` and
    // comparing a character specification against a character. A more efficient
    // implementation would use a hash of keys pointing at one or more next states.

    function State(charSpec) {
      this.charSpec = charSpec;
      this.nextStates = [];
    }

    State.prototype = {
      get: function(charSpec) {
        var nextStates = this.nextStates;

        for (var i=0, l=nextStates.length; i<l; i++) {
          var child = nextStates[i];

          var isEqual = child.charSpec.validChars === charSpec.validChars;
          isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;

          if (isEqual) { return child; }
        }
      },

      put: function(charSpec) {
        var state;

        // If the character specification already exists in a child of the current
        // state, just return that state.
        if (state = this.get(charSpec)) { return state; }

        // Make a new state for the character spec
        state = new State(charSpec);

        // Insert the new state as a child of the current state
        this.nextStates.push(state);

        // If this character specification repeats, insert the new state as a child
        // of itself. Note that this will not trigger an infinite loop because each
        // transition during recognition consumes a character.
        if (charSpec.repeat) {
          state.nextStates.push(state);
        }

        // Return the new state
        return state;
      },

      // Find a list of child states matching the next character
      match: function(ch) {
        // DEBUG "Processing `" + ch + "`:"
        var nextStates = this.nextStates,
            child, charSpec, chars;

        // DEBUG "  " + debugState(this)
        var returned = [];

        for (var i=0, l=nextStates.length; i<l; i++) {
          child = nextStates[i];

          charSpec = child.charSpec;

          if (typeof (chars = charSpec.validChars) !== 'undefined') {
            if (chars.indexOf(ch) !== -1) { returned.push(child); }
          } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
            if (chars.indexOf(ch) === -1) { returned.push(child); }
          }
        }

        return returned;
      }

      /** IF DEBUG
      , debug: function() {
        var charSpec = this.charSpec,
            debug = "[",
            chars = charSpec.validChars || charSpec.invalidChars;

        if (charSpec.invalidChars) { debug += "^"; }
        debug += chars;
        debug += "]";

        if (charSpec.repeat) { debug += "+"; }

        return debug;
      }
      END IF **/
    };

    /** IF DEBUG
    function debug(log) {
      console.log(log);
    }

    function debugState(state) {
      return state.nextStates.map(function(n) {
        if (n.nextStates.length === 0) { return "( " + n.debug() + " [accepting] )"; }
        return "( " + n.debug() + " <then> " + n.nextStates.map(function(s) { return s.debug() }).join(" or ") + " )";
      }).join(", ")
    }
    END IF **/

    // This is a somewhat naive strategy, but should work in a lot of cases
    // A better strategy would properly resolve /posts/:id/new and /posts/edit/:id.
    //
    // This strategy generally prefers more static and less dynamic matching.
    // Specifically, it
    //
    //  * prefers fewer stars to more, then
    //  * prefers using stars for less of the match to more, then
    //  * prefers fewer dynamic segments to more, then
    //  * prefers more static segments to more
    function sortSolutions(states) {
      return states.sort(function(a, b) {
        if (a.types.stars !== b.types.stars) { return a.types.stars - b.types.stars; }

        if (a.types.stars) {
          if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }
          if (a.types.dynamics !== b.types.dynamics) { return b.types.dynamics - a.types.dynamics; }
        }

        if (a.types.dynamics !== b.types.dynamics) { return a.types.dynamics - b.types.dynamics; }
        if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }

        return 0;
      });
    }

    function recognizeChar(states, ch) {
      var nextStates = [];

      for (var i=0, l=states.length; i<l; i++) {
        var state = states[i];

        nextStates = nextStates.concat(state.match(ch));
      }

      return nextStates;
    }

    var oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };

    function RecognizeResults(queryParams) {
      this.queryParams = queryParams || {};
    }
    RecognizeResults.prototype = oCreate({
      splice: Array.prototype.splice,
      slice:  Array.prototype.slice,
      push:   Array.prototype.push,
      length: 0,
      queryParams: null
    });

    function findHandler(state, path, queryParams) {
      var handlers = state.handlers, regex = state.regex;
      var captures = path.match(regex), currentCapture = 1;
      var result = new RecognizeResults(queryParams);

      for (var i=0, l=handlers.length; i<l; i++) {
        var handler = handlers[i], names = handler.names, params = {};

        for (var j=0, m=names.length; j<m; j++) {
          params[names[j]] = captures[currentCapture++];
        }

        result.push({ handler: handler.handler, params: params, isDynamic: !!names.length });
      }

      return result;
    }

    function addSegment(currentState, segment) {
      segment.eachChar(function(ch) {
        var state;

        currentState = currentState.put(ch);
      });

      return currentState;
    }

    // The main interface

    var RouteRecognizer = function() {
      this.rootState = new State();
      this.names = {};
    };


    RouteRecognizer.prototype = {
      add: function(routes, options) {
        var currentState = this.rootState, regex = "^",
            types = { statics: 0, dynamics: 0, stars: 0 },
            handlers = [], allSegments = [], name;

        var isEmpty = true;

        for (var i=0, l=routes.length; i<l; i++) {
          var route = routes[i], names = [];

          var segments = parse(route.path, names, types);

          allSegments = allSegments.concat(segments);

          for (var j=0, m=segments.length; j<m; j++) {
            var segment = segments[j];

            if (segment instanceof EpsilonSegment) { continue; }

            isEmpty = false;

            // Add a "/" for the new segment
            currentState = currentState.put({ validChars: "/" });
            regex += "/";

            // Add a representation of the segment to the NFA and regex
            currentState = addSegment(currentState, segment);
            regex += segment.regex();
          }

          var handler = { handler: route.handler, names: names };
          handlers.push(handler);
        }

        if (isEmpty) {
          currentState = currentState.put({ validChars: "/" });
          regex += "/";
        }

        currentState.handlers = handlers;
        currentState.regex = new RegExp(regex + "$");
        currentState.types = types;

        if (name = options && options.as) {
          this.names[name] = {
            segments: allSegments,
            handlers: handlers
          };
        }
      },

      handlersFor: function(name) {
        var route = this.names[name], result = [];
        if (!route) { throw new Error("There is no route named " + name); }

        for (var i=0, l=route.handlers.length; i<l; i++) {
          result.push(route.handlers[i]);
        }

        return result;
      },

      hasRoute: function(name) {
        return !!this.names[name];
      },

      generate: function(name, params) {
        var route = this.names[name], output = "";
        if (!route) { throw new Error("There is no route named " + name); }

        var segments = route.segments;

        for (var i=0, l=segments.length; i<l; i++) {
          var segment = segments[i];

          if (segment instanceof EpsilonSegment) { continue; }

          output += "/";
          output += segment.generate(params);
        }

        if (output.charAt(0) !== '/') { output = '/' + output; }

        if (params && params.queryParams) {
          output += this.generateQueryString(params.queryParams, route.handlers);
        }

        return output;
      },

      generateQueryString: function(params, handlers) {
        var pairs = [];
        var keys = [];
        for(var key in params) {
          if (params.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        keys.sort();
        for (var i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          var value = params[key];
          if (value == null) {
            continue;
          }
          var pair = key;
          if (isArray(value)) {
            for (var j = 0, l = value.length; j < l; j++) {
              var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
              pairs.push(arrayPair);
            }
          } else {
            pair += "=" + encodeURIComponent(value);
            pairs.push(pair);
          }
        }

        if (pairs.length === 0) { return ''; }

        return "?" + pairs.join("&");
      },

      parseQueryString: function(queryString) {
        var pairs = queryString.split("&"), queryParams = {};
        for(var i=0; i < pairs.length; i++) {
          var pair      = pairs[i].split('='),
              key       = decodeURIComponent(pair[0]),
              keyLength = key.length,
              isArray = false,
              value;
          if (pair.length === 1) {
            value = 'true';
          } else {
            //Handle arrays
            if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
              isArray = true;
              key = key.slice(0, keyLength - 2);
              if(!queryParams[key]) {
                queryParams[key] = [];
              }
            }
            value = pair[1] ? decodeURIComponent(pair[1]) : '';
          }
          if (isArray) {
            queryParams[key].push(value);
          } else {
            queryParams[key] = decodeURIComponent(value);
          }
        }
        return queryParams;
      },

      recognize: function(path) {
        var states = [ this.rootState ],
            pathLen, i, l, queryStart, queryParams = {},
            isSlashDropped = false;

        path = decodeURI(path);

        queryStart = path.indexOf('?');
        if (queryStart !== -1) {
          var queryString = path.substr(queryStart + 1, path.length);
          path = path.substr(0, queryStart);
          queryParams = this.parseQueryString(queryString);
        }

        // DEBUG GROUP path

        if (path.charAt(0) !== "/") { path = "/" + path; }

        pathLen = path.length;
        if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
          path = path.substr(0, pathLen - 1);
          isSlashDropped = true;
        }

        for (i=0, l=path.length; i<l; i++) {
          states = recognizeChar(states, path.charAt(i));
          if (!states.length) { break; }
        }

        // END DEBUG GROUP

        var solutions = [];
        for (i=0, l=states.length; i<l; i++) {
          if (states[i].handlers) { solutions.push(states[i]); }
        }

        states = sortSolutions(solutions);

        var state = solutions[0];

        if (state && state.handlers) {
          // if a trailing slash was dropped and a star segment is the last segment
          // specified, put the trailing slash back
          if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
            path = path + "/";
          }
          return findHandler(state, path, queryParams);
        }
      }
    };

    __exports__["default"] = RouteRecognizer;

    function Target(path, matcher, delegate) {
      this.path = path;
      this.matcher = matcher;
      this.delegate = delegate;
    }

    Target.prototype = {
      to: function(target, callback) {
        var delegate = this.delegate;

        if (delegate && delegate.willAddRoute) {
          target = delegate.willAddRoute(this.matcher.target, target);
        }

        this.matcher.add(this.path, target);

        if (callback) {
          if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
          this.matcher.addChild(this.path, target, callback, this.delegate);
        }
        return this;
      }
    };

    function Matcher(target) {
      this.routes = {};
      this.children = {};
      this.target = target;
    }

    Matcher.prototype = {
      add: function(path, handler) {
        this.routes[path] = handler;
      },

      addChild: function(path, target, callback, delegate) {
        var matcher = new Matcher(target);
        this.children[path] = matcher;

        var match = generateMatch(path, matcher, delegate);

        if (delegate && delegate.contextEntered) {
          delegate.contextEntered(target, match);
        }

        callback(match);
      }
    };

    function generateMatch(startingPath, matcher, delegate) {
      return function(path, nestedCallback) {
        var fullPath = startingPath + path;

        if (nestedCallback) {
          nestedCallback(generateMatch(fullPath, matcher, delegate));
        } else {
          return new Target(startingPath + path, matcher, delegate);
        }
      };
    }

    function addRoute(routeArray, path, handler) {
      var len = 0;
      for (var i=0, l=routeArray.length; i<l; i++) {
        len += routeArray[i].path.length;
      }

      path = path.substr(len);
      var route = { path: path, handler: handler };
      routeArray.push(route);
    }

    function eachRoute(baseRoute, matcher, callback, binding) {
      var routes = matcher.routes;

      for (var path in routes) {
        if (routes.hasOwnProperty(path)) {
          var routeArray = baseRoute.slice();
          addRoute(routeArray, path, routes[path]);

          if (matcher.children[path]) {
            eachRoute(routeArray, matcher.children[path], callback, binding);
          } else {
            callback.call(binding, routeArray);
          }
        }
      }
    }

    RouteRecognizer.prototype.map = function(callback, addRouteCallback) {
      var matcher = new Matcher();

      callback(generateMatch("", matcher, this.delegate));

      eachRoute([], matcher, function(route) {
        if (addRouteCallback) { addRouteCallback(this, route); }
        else { this.add(route); }
      }, this);
    };
  });

define("router/handler-info",
  ["./utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var bind = __dependency1__.bind;
    var merge = __dependency1__.merge;
    var serialize = __dependency1__.serialize;
    var promiseLabel = __dependency1__.promiseLabel;
    var applyHook = __dependency1__.applyHook;
    var Promise = __dependency2__["default"];

    function HandlerInfo(_props) {
      var props = _props || {};
      merge(this, props);
      this.initialize(props);
    }

    HandlerInfo.prototype = {
      name: null,
      handler: null,
      params: null,
      context: null,

      // Injected by the handler info factory.
      factory: null,

      initialize: function() {},

      log: function(payload, message) {
        if (payload.log) {
          payload.log(this.name + ': ' + message);
        }
      },

      promiseLabel: function(label) {
        return promiseLabel("'" + this.name + "' " + label);
      },

      getUnresolved: function() {
        return this;
      },

      serialize: function() {
        return this.params || {};
      },

      resolve: function(shouldContinue, payload) {
        var checkForAbort  = bind(this, this.checkForAbort,      shouldContinue),
            beforeModel    = bind(this, this.runBeforeModelHook, payload),
            model          = bind(this, this.getModel,           payload),
            afterModel     = bind(this, this.runAfterModelHook,  payload),
            becomeResolved = bind(this, this.becomeResolved,     payload);

        return Promise.resolve(undefined, this.promiseLabel("Start handler"))
               .then(checkForAbort, null, this.promiseLabel("Check for abort"))
               .then(beforeModel, null, this.promiseLabel("Before model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted during 'beforeModel' hook"))
               .then(model, null, this.promiseLabel("Model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted in 'model' hook"))
               .then(afterModel, null, this.promiseLabel("After model"))
               .then(checkForAbort, null, this.promiseLabel("Check if aborted in 'afterModel' hook"))
               .then(becomeResolved, null, this.promiseLabel("Become resolved"));
      },

      runBeforeModelHook: function(payload) {
        if (payload.trigger) {
          payload.trigger(true, 'willResolveModel', payload, this.handler);
        }
        return this.runSharedModelHook(payload, 'beforeModel', []);
      },

      runAfterModelHook: function(payload, resolvedModel) {
        // Stash the resolved model on the payload.
        // This makes it possible for users to swap out
        // the resolved model in afterModel.
        var name = this.name;
        this.stashResolvedModel(payload, resolvedModel);

        return this.runSharedModelHook(payload, 'afterModel', [resolvedModel])
                   .then(function() {
                     // Ignore the fulfilled value returned from afterModel.
                     // Return the value stashed in resolvedModels, which
                     // might have been swapped out in afterModel.
                     return payload.resolvedModels[name];
                   }, null, this.promiseLabel("Ignore fulfillment value and return model value"));
      },

      runSharedModelHook: function(payload, hookName, args) {
        this.log(payload, "calling " + hookName + " hook");

        if (this.queryParams) {
          args.push(this.queryParams);
        }
        args.push(payload);

        var result = applyHook(this.handler, hookName, args);

        if (result && result.isTransition) {
          result = null;
        }

        return Promise.resolve(result, this.promiseLabel("Resolve value returned from one of the model hooks"));
      },

      // overridden by subclasses
      getModel: null,

      checkForAbort: function(shouldContinue, promiseValue) {
        return Promise.resolve(shouldContinue(), this.promiseLabel("Check for abort")).then(function() {
          // We don't care about shouldContinue's resolve value;
          // pass along the original value passed to this fn.
          return promiseValue;
        }, null, this.promiseLabel("Ignore fulfillment value and continue"));
      },

      stashResolvedModel: function(payload, resolvedModel) {
        payload.resolvedModels = payload.resolvedModels || {};
        payload.resolvedModels[this.name] = resolvedModel;
      },

      becomeResolved: function(payload, resolvedContext) {
        var params = this.serialize(resolvedContext);

        if (payload) {
          this.stashResolvedModel(payload, resolvedContext);
          payload.params = payload.params || {};
          payload.params[this.name] = params;
        }

        return this.factory('resolved', {
          context: resolvedContext,
          name: this.name,
          handler: this.handler,
          params: params
        });
      },

      shouldSupercede: function(other) {
        // Prefer this newer handlerInfo over `other` if:
        // 1) The other one doesn't exist
        // 2) The names don't match
        // 3) This handler has a context that doesn't match
        //    the other one (or the other one doesn't have one).
        // 4) This handler has parameters that don't match the other.
        if (!other) { return true; }

        var contextsMatch = (other.context === this.context);
        return other.name !== this.name ||
               (this.hasOwnProperty('context') && !contextsMatch) ||
               (this.hasOwnProperty('params') && !paramsMatch(this.params, other.params));
      }
    };

    function paramsMatch(a, b) {
      if ((!a) ^ (!b)) {
        // Only one is null.
        return false;
      }

      if (!a) {
        // Both must be null.
        return true;
      }

      // Note: this assumes that both params have the same
      // number of keys, but since we're comparing the
      // same handlers, they should.
      for (var k in a) {
        if (a.hasOwnProperty(k) && a[k] !== b[k]) {
          return false;
        }
      }
      return true;
    }

    __exports__["default"] = HandlerInfo;
  });
define("router/handler-info/factory",
  ["router/handler-info/resolved-handler-info","router/handler-info/unresolved-handler-info-by-object","router/handler-info/unresolved-handler-info-by-param","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var ResolvedHandlerInfo = __dependency1__["default"];
    var UnresolvedHandlerInfoByObject = __dependency2__["default"];
    var UnresolvedHandlerInfoByParam = __dependency3__["default"];

    handlerInfoFactory.klasses = {
      resolved: ResolvedHandlerInfo,
      param: UnresolvedHandlerInfoByParam,
      object: UnresolvedHandlerInfoByObject
    };

    function handlerInfoFactory(name, props) {
      var Ctor = handlerInfoFactory.klasses[name],
          handlerInfo = new Ctor(props || {});
      handlerInfo.factory = handlerInfoFactory;
      return handlerInfo;
    }

    __exports__["default"] = handlerInfoFactory;
  });
define("router/handler-info/resolved-handler-info",
  ["../handler-info","router/utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var HandlerInfo = __dependency1__["default"];
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;
    var Promise = __dependency3__["default"];

    var ResolvedHandlerInfo = subclass(HandlerInfo, {
      resolve: function(shouldContinue, payload) {
        // A ResolvedHandlerInfo just resolved with itself.
        if (payload && payload.resolvedModels) {
          payload.resolvedModels[this.name] = this.context;
        }
        return Promise.resolve(this, this.promiseLabel("Resolve"));
      },

      getUnresolved: function() {
        return this.factory('param', {
          name: this.name,
          handler: this.handler,
          params: this.params
        });
      },

      isResolved: true
    });

    __exports__["default"] = ResolvedHandlerInfo;
  });
define("router/handler-info/unresolved-handler-info-by-object",
  ["../handler-info","router/utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var HandlerInfo = __dependency1__["default"];
    var merge = __dependency2__.merge;
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;
    var isParam = __dependency2__.isParam;
    var Promise = __dependency3__["default"];

    var UnresolvedHandlerInfoByObject = subclass(HandlerInfo, {
      getModel: function(payload) {
        this.log(payload, this.name + ": resolving provided model");
        return Promise.resolve(this.context);
      },

      initialize: function(props) {
        this.names = props.names || [];
        this.context = props.context;
      },

      /**
        @private

        Serializes a handler using its custom `serialize` method or
        by a default that looks up the expected property name from
        the dynamic segment.

        @param {Object} model the model to be serialized for this handler
      */
      serialize: function(_model) {
        var model = _model || this.context,
            names = this.names,
            handler = this.handler;

        var object = {};
        if (isParam(model)) {
          object[names[0]] = model;
          return object;
        }

        // Use custom serialize if it exists.
        if (handler.serialize) {
          return handler.serialize(model, names);
        }

        if (names.length !== 1) { return; }

        var name = names[0];

        if (/_id$/.test(name)) {
          object[name] = model.id;
        } else {
          object[name] = model;
        }
        return object;
      }
    });

    __exports__["default"] = UnresolvedHandlerInfoByObject;
  });
define("router/handler-info/unresolved-handler-info-by-param",
  ["../handler-info","router/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var HandlerInfo = __dependency1__["default"];
    var resolveHook = __dependency2__.resolveHook;
    var merge = __dependency2__.merge;
    var subclass = __dependency2__.subclass;
    var promiseLabel = __dependency2__.promiseLabel;

    // Generated by URL transitions and non-dynamic route segments in named Transitions.
    var UnresolvedHandlerInfoByParam = subclass (HandlerInfo, {
      initialize: function(props) {
        this.params = props.params || {};
      },

      getModel: function(payload) {
        var fullParams = this.params;
        if (payload && payload.queryParams) {
          fullParams = {};
          merge(fullParams, this.params);
          fullParams.queryParams = payload.queryParams;
        }

        var handler = this.handler;
        var hookName = resolveHook(handler, 'deserialize') ||
                       resolveHook(handler, 'model');

        return this.runSharedModelHook(payload, hookName, [fullParams]);
      }
    });

    __exports__["default"] = UnresolvedHandlerInfoByParam;
  });
define("router/router",
  ["route-recognizer","rsvp/promise","./utils","./transition-state","./transition","./transition-intent/named-transition-intent","./transition-intent/url-transition-intent","./handler-info","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var RouteRecognizer = __dependency1__["default"];
    var Promise = __dependency2__["default"];
    var trigger = __dependency3__.trigger;
    var log = __dependency3__.log;
    var slice = __dependency3__.slice;
    var forEach = __dependency3__.forEach;
    var merge = __dependency3__.merge;
    var serialize = __dependency3__.serialize;
    var extractQueryParams = __dependency3__.extractQueryParams;
    var getChangelist = __dependency3__.getChangelist;
    var promiseLabel = __dependency3__.promiseLabel;
    var callHook = __dependency3__.callHook;
    var TransitionState = __dependency4__["default"];
    var logAbort = __dependency5__.logAbort;
    var Transition = __dependency5__.Transition;
    var TransitionAborted = __dependency5__.TransitionAborted;
    var NamedTransitionIntent = __dependency6__["default"];
    var URLTransitionIntent = __dependency7__["default"];
    var ResolvedHandlerInfo = __dependency8__.ResolvedHandlerInfo;

    var pop = Array.prototype.pop;

    function Router() {
      this.recognizer = new RouteRecognizer();
      this.reset();
    }

    Router.prototype = {

      /**
        The main entry point into the router. The API is essentially
        the same as the `map` method in `route-recognizer`.

        This method extracts the String handler at the last `.to()`
        call and uses it as the name of the whole route.

        @param {Function} callback
      */
      map: function(callback) {
        this.recognizer.delegate = this.delegate;

        this.recognizer.map(callback, function(recognizer, routes) {
          for (var i = routes.length - 1, proceed = true; i >= 0 && proceed; --i) {
            var route = routes[i];
            recognizer.add(routes, { as: route.handler });
            proceed = route.path === '/' || route.path === '' || route.handler.slice(-6) === '.index';
          }
        });
      },

      hasRoute: function(route) {
        return this.recognizer.hasRoute(route);
      },

      queryParamsTransition: function(changelist, wasTransitioning, oldState, newState) {
        var router = this;

        fireQueryParamDidChange(this, newState, changelist);

        if (!wasTransitioning && this.activeTransition) {
          // One of the handlers in queryParamsDidChange
          // caused a transition. Just return that transition.
          return this.activeTransition;
        } else {
          // Running queryParamsDidChange didn't change anything.
          // Just update query params and be on our way.

          // We have to return a noop transition that will
          // perform a URL update at the end. This gives
          // the user the ability to set the url update
          // method (default is replaceState).
          var newTransition = new Transition(this);
          newTransition.queryParamsOnly = true;

          oldState.queryParams = finalizeQueryParamChange(this, newState.handlerInfos, newState.queryParams, newTransition);

          newTransition.promise = newTransition.promise.then(function(result) {
            updateURL(newTransition, oldState, true);
            if (router.didTransition) {
              router.didTransition(router.currentHandlerInfos);
            }
            return result;
          }, null, promiseLabel("Transition complete"));
          return newTransition;
        }
      },

      // NOTE: this doesn't really belong here, but here
      // it shall remain until our ES6 transpiler can
      // handle cyclical deps.
      transitionByIntent: function(intent, isIntermediate) {

        var wasTransitioning = !!this.activeTransition;
        var oldState = wasTransitioning ? this.activeTransition.state : this.state;
        var newTransition;
        var router = this;

        try {
          var newState = intent.applyToState(oldState, this.recognizer, this.getHandler, isIntermediate);
          var queryParamChangelist = getChangelist(oldState.queryParams, newState.queryParams);

          if (handlerInfosEqual(newState.handlerInfos, oldState.handlerInfos)) {

            // This is a no-op transition. See if query params changed.
            if (queryParamChangelist) {
              newTransition = this.queryParamsTransition(queryParamChangelist, wasTransitioning, oldState, newState);
              if (newTransition) {
                return newTransition;
              }
            }

            // No-op. No need to create a new transition.
            return new Transition(this);
          }

          if (isIntermediate) {
            setupContexts(this, newState);
            return;
          }

          // Create a new transition to the destination route.
          newTransition = new Transition(this, intent, newState);

          // Abort and usurp any previously active transition.
          if (this.activeTransition) {
            this.activeTransition.abort();
          }
          this.activeTransition = newTransition;

          // Transition promises by default resolve with resolved state.
          // For our purposes, swap out the promise to resolve
          // after the transition has been finalized.
          newTransition.promise = newTransition.promise.then(function(result) {
            return finalizeTransition(newTransition, result.state);
          }, null, promiseLabel("Settle transition promise when transition is finalized"));

          if (!wasTransitioning) {
            notifyExistingHandlers(this, newState, newTransition);
          }

          fireQueryParamDidChange(this, newState, queryParamChangelist);

          return newTransition;
        } catch(e) {
          return new Transition(this, intent, null, e);
        }
      },

      /**
        Clears the current and target route handlers and triggers exit
        on each of them starting at the leaf and traversing up through
        its ancestors.
      */
      reset: function() {
        if (this.state) {
          forEach(this.state.handlerInfos.slice().reverse(), function(handlerInfo) {
            var handler = handlerInfo.handler;
            callHook(handler, 'exit');
          });
        }

        this.state = new TransitionState();
        this.currentHandlerInfos = null;
      },

      activeTransition: null,

      /**
        var handler = handlerInfo.handler;
        The entry point for handling a change to the URL (usually
        via the back and forward button).

        Returns an Array of handlers and the parameters associated
        with those parameters.

        @param {String} url a URL to process

        @return {Array} an Array of `[handler, parameter]` tuples
      */
      handleURL: function(url) {
        // Perform a URL-based transition, but don't change
        // the URL afterward, since it already happened.
        var args = slice.call(arguments);
        if (url.charAt(0) !== '/') { args[0] = '/' + url; }

        return doTransition(this, args).method(null);
      },

      /**
        Hook point for updating the URL.

        @param {String} url a URL to update to
      */
      updateURL: function() {
        throw new Error("updateURL is not implemented");
      },

      /**
        Hook point for replacing the current URL, i.e. with replaceState

        By default this behaves the same as `updateURL`

        @param {String} url a URL to update to
      */
      replaceURL: function(url) {
        this.updateURL(url);
      },

      /**
        Transition into the specified named route.

        If necessary, trigger the exit callback on any handlers
        that are no longer represented by the target route.

        @param {String} name the name of the route
      */
      transitionTo: function(name) {
        return doTransition(this, arguments);
      },

      intermediateTransitionTo: function(name) {
        return doTransition(this, arguments, true);
      },

      refresh: function(pivotHandler) {
        var state = this.activeTransition ? this.activeTransition.state : this.state;
        var handlerInfos = state.handlerInfos;
        var params = {};
        for (var i = 0, len = handlerInfos.length; i < len; ++i) {
          var handlerInfo = handlerInfos[i];
          params[handlerInfo.name] = handlerInfo.params || {};
        }

        log(this, "Starting a refresh transition");
        var intent = new NamedTransitionIntent({
          name: handlerInfos[handlerInfos.length - 1].name,
          pivotHandler: pivotHandler || handlerInfos[0].handler,
          contexts: [], // TODO collect contexts...?
          queryParams: this._changedQueryParams || state.queryParams || {}
        });

        return this.transitionByIntent(intent, false);
      },

      /**
        Identical to `transitionTo` except that the current URL will be replaced
        if possible.

        This method is intended primarily for use with `replaceState`.

        @param {String} name the name of the route
      */
      replaceWith: function(name) {
        return doTransition(this, arguments).method('replace');
      },

      /**
        Take a named route and context objects and generate a
        URL.

        @param {String} name the name of the route to generate
          a URL for
        @param {...Object} objects a list of objects to serialize

        @return {String} a URL
      */
      generate: function(handlerName) {

        var partitionedArgs = extractQueryParams(slice.call(arguments, 1)),
          suppliedParams = partitionedArgs[0],
          queryParams = partitionedArgs[1];

        // Construct a TransitionIntent with the provided params
        // and apply it to the present state of the router.
        var intent = new NamedTransitionIntent({ name: handlerName, contexts: suppliedParams });
        var state = intent.applyToState(this.state, this.recognizer, this.getHandler);
        var params = {};

        for (var i = 0, len = state.handlerInfos.length; i < len; ++i) {
          var handlerInfo = state.handlerInfos[i];
          var handlerParams = handlerInfo.serialize();
          merge(params, handlerParams);
        }
        params.queryParams = queryParams;

        return this.recognizer.generate(handlerName, params);
      },

      applyIntent: function(handlerName, contexts) {
        var intent = new NamedTransitionIntent({
          name: handlerName,
          contexts: contexts
        });

        var state = this.activeTransition && this.activeTransition.state || this.state;
        return intent.applyToState(state, this.recognizer, this.getHandler);
      },

      isActiveIntent: function(handlerName, contexts, queryParams) {
        var targetHandlerInfos = this.state.handlerInfos,
            found = false, names, object, handlerInfo, handlerObj, i, len;

        if (!targetHandlerInfos.length) { return false; }

        var targetHandler = targetHandlerInfos[targetHandlerInfos.length - 1].name;
        var recogHandlers = this.recognizer.handlersFor(targetHandler);

        var index = 0;
        for (len = recogHandlers.length; index < len; ++index) {
          handlerInfo = targetHandlerInfos[index];
          if (handlerInfo.name === handlerName) { break; }
        }

        if (index === recogHandlers.length) {
          // The provided route name isn't even in the route hierarchy.
          return false;
        }

        var state = new TransitionState();
        state.handlerInfos = targetHandlerInfos.slice(0, index + 1);
        recogHandlers = recogHandlers.slice(0, index + 1);

        var intent = new NamedTransitionIntent({
          name: targetHandler,
          contexts: contexts
        });

        var newState = intent.applyToHandlers(state, recogHandlers, this.getHandler, targetHandler, true, true);

        var handlersEqual = handlerInfosEqual(newState.handlerInfos, state.handlerInfos);
        if (!queryParams || !handlersEqual) {
          return handlersEqual;
        }

        // Get a hash of QPs that will still be active on new route
        var activeQPsOnNewHandler = {};
        merge(activeQPsOnNewHandler, queryParams);

        var activeQueryParams  = this.state.queryParams;
        for (var key in activeQueryParams) {
          if (activeQueryParams.hasOwnProperty(key) &&
              activeQPsOnNewHandler.hasOwnProperty(key)) {
            activeQPsOnNewHandler[key] = activeQueryParams[key];
          }
        }

        return handlersEqual && !getChangelist(activeQPsOnNewHandler, queryParams);
      },

      isActive: function(handlerName) {
        var partitionedArgs = extractQueryParams(slice.call(arguments, 1));
        return this.isActiveIntent(handlerName, partitionedArgs[0], partitionedArgs[1]);
      },

      trigger: function(name) {
        var args = slice.call(arguments);
        trigger(this, this.currentHandlerInfos, false, args);
      },

      /**
        Hook point for logging transition status updates.

        @param {String} message The message to log.
      */
      log: null,

      _willChangeContextEvent: 'willChangeContext',
      _triggerWillChangeContext: function(handlerInfos, newTransition) {
        trigger(this, handlerInfos, true, [this._willChangeContextEvent, newTransition]);
      },

      _triggerWillLeave: function(handlerInfos, newTransition, leavingChecker) {
        trigger(this, handlerInfos, true, ['willLeave', newTransition, leavingChecker]);
      }
    };

    /**
      @private

      Fires queryParamsDidChange event
    */
    function fireQueryParamDidChange(router, newState, queryParamChangelist) {
      // If queryParams changed trigger event
      if (queryParamChangelist) {

        // This is a little hacky but we need some way of storing
        // changed query params given that no activeTransition
        // is guaranteed to have occurred.
        router._changedQueryParams = queryParamChangelist.all;
        trigger(router, newState.handlerInfos, true, ['queryParamsDidChange', queryParamChangelist.changed, queryParamChangelist.all, queryParamChangelist.removed]);
        router._changedQueryParams = null;
      }
    }

    /**
      @private

      Takes an Array of `HandlerInfo`s, figures out which ones are
      exiting, entering, or changing contexts, and calls the
      proper handler hooks.

      For example, consider the following tree of handlers. Each handler is
      followed by the URL segment it handles.

      ```
      |~index ("/")
      | |~posts ("/posts")
      | | |-showPost ("/:id")
      | | |-newPost ("/new")
      | | |-editPost ("/edit")
      | |~about ("/about/:id")
      ```

      Consider the following transitions:

      1. A URL transition to `/posts/1`.
         1. Triggers the `*model` callbacks on the
            `index`, `posts`, and `showPost` handlers
         2. Triggers the `enter` callback on the same
         3. Triggers the `setup` callback on the same
      2. A direct transition to `newPost`
         1. Triggers the `exit` callback on `showPost`
         2. Triggers the `enter` callback on `newPost`
         3. Triggers the `setup` callback on `newPost`
      3. A direct transition to `about` with a specified
         context object
         1. Triggers the `exit` callback on `newPost`
            and `posts`
         2. Triggers the `serialize` callback on `about`
         3. Triggers the `enter` callback on `about`
         4. Triggers the `setup` callback on `about`

      @param {Router} transition
      @param {TransitionState} newState
    */
    function setupContexts(router, newState, transition) {
      var partition = partitionHandlers(router.state, newState);

      forEach(partition.exited, function(handlerInfo) {
        var handler = handlerInfo.handler;
        delete handler.context;

        callHook(handler, 'reset', true, transition);
        callHook(handler, 'exit', transition);
      });

      var oldState = router.oldState = router.state;
      router.state = newState;
      var currentHandlerInfos = router.currentHandlerInfos = partition.unchanged.slice();

      try {
        forEach(partition.reset, function(handlerInfo) {
          var handler = handlerInfo.handler;
          callHook(handler, 'reset', false, transition);
        });

        forEach(partition.updatedContext, function(handlerInfo) {
          return handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, false, transition);
        });

        forEach(partition.entered, function(handlerInfo) {
          return handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, true, transition);
        });
      } catch(e) {
        router.state = oldState;
        router.currentHandlerInfos = oldState.handlerInfos;
        throw e;
      }

      router.state.queryParams = finalizeQueryParamChange(router, currentHandlerInfos, newState.queryParams, transition);
    }


    /**
      @private

      Helper method used by setupContexts. Handles errors or redirects
      that may happen in enter/setup.
    */
    function handlerEnteredOrUpdated(currentHandlerInfos, handlerInfo, enter, transition) {

      var handler = handlerInfo.handler,
          context = handlerInfo.context;

      callHook(handler, 'enter', transition);
      if (transition && transition.isAborted) {
        throw new TransitionAborted();
      }

      handler.context = context;
      callHook(handler, 'contextDidChange');

      callHook(handler, 'setup', context, transition);
      if (transition && transition.isAborted) {
        throw new TransitionAborted();
      }

      currentHandlerInfos.push(handlerInfo);

      return true;
    }


    /**
      @private

      This function is called when transitioning from one URL to
      another to determine which handlers are no longer active,
      which handlers are newly active, and which handlers remain
      active but have their context changed.

      Take a list of old handlers and new handlers and partition
      them into four buckets:

      * unchanged: the handler was active in both the old and
        new URL, and its context remains the same
      * updated context: the handler was active in both the
        old and new URL, but its context changed. The handler's
        `setup` method, if any, will be called with the new
        context.
      * exited: the handler was active in the old URL, but is
        no longer active.
      * entered: the handler was not active in the old URL, but
        is now active.

      The PartitionedHandlers structure has four fields:

      * `updatedContext`: a list of `HandlerInfo` objects that
        represent handlers that remain active but have a changed
        context
      * `entered`: a list of `HandlerInfo` objects that represent
        handlers that are newly active
      * `exited`: a list of `HandlerInfo` objects that are no
        longer active.
      * `unchanged`: a list of `HanderInfo` objects that remain active.

      @param {Array[HandlerInfo]} oldHandlers a list of the handler
        information for the previous URL (or `[]` if this is the
        first handled transition)
      @param {Array[HandlerInfo]} newHandlers a list of the handler
        information for the new URL

      @return {Partition}
    */
    function partitionHandlers(oldState, newState) {
      var oldHandlers = oldState.handlerInfos;
      var newHandlers = newState.handlerInfos;

      var handlers = {
            updatedContext: [],
            exited: [],
            entered: [],
            unchanged: []
          };

      var handlerChanged, contextChanged = false, i, l;

      for (i=0, l=newHandlers.length; i<l; i++) {
        var oldHandler = oldHandlers[i], newHandler = newHandlers[i];

        if (!oldHandler || oldHandler.handler !== newHandler.handler) {
          handlerChanged = true;
        }

        if (handlerChanged) {
          handlers.entered.push(newHandler);
          if (oldHandler) { handlers.exited.unshift(oldHandler); }
        } else if (contextChanged || oldHandler.context !== newHandler.context) {
          contextChanged = true;
          handlers.updatedContext.push(newHandler);
        } else {
          handlers.unchanged.push(oldHandler);
        }
      }

      for (i=newHandlers.length, l=oldHandlers.length; i<l; i++) {
        handlers.exited.unshift(oldHandlers[i]);
      }

      handlers.reset = handlers.updatedContext.slice();
      handlers.reset.reverse();

      return handlers;
    }

    function updateURL(transition, state, inputUrl) {
      var urlMethod = transition.urlMethod;

      if (!urlMethod) {
        return;
      }

      var router = transition.router,
          handlerInfos = state.handlerInfos,
          handlerName = handlerInfos[handlerInfos.length - 1].name,
          params = {};

      for (var i = handlerInfos.length - 1; i >= 0; --i) {
        var handlerInfo = handlerInfos[i];
        merge(params, handlerInfo.params);
        if (handlerInfo.handler.inaccessibleByURL) {
          urlMethod = null;
        }
      }

      if (urlMethod) {
        params.queryParams = transition._visibleQueryParams || state.queryParams;
        var url = router.recognizer.generate(handlerName, params);

        if (urlMethod === 'replace') {
          router.replaceURL(url);
        } else {
          router.updateURL(url);
        }
      }
    }

    /**
      @private

      Updates the URL (if necessary) and calls `setupContexts`
      to update the router's array of `currentHandlerInfos`.
     */
    function finalizeTransition(transition, newState) {

      try {
        log(transition.router, transition.sequence, "Resolved all models on destination route; finalizing transition.");

        var router = transition.router,
            handlerInfos = newState.handlerInfos,
            seq = transition.sequence;

        // Run all the necessary enter/setup/exit hooks
        setupContexts(router, newState, transition);

        // Check if a redirect occurred in enter/setup
        if (transition.isAborted) {
          // TODO: cleaner way? distinguish b/w targetHandlerInfos?
          router.state.handlerInfos = router.currentHandlerInfos;
          return Promise.reject(logAbort(transition));
        }

        updateURL(transition, newState, transition.intent.url);

        transition.isActive = false;
        router.activeTransition = null;

        trigger(router, router.currentHandlerInfos, true, ['didTransition']);

        if (router.didTransition) {
          router.didTransition(router.currentHandlerInfos);
        }

        log(router, transition.sequence, "TRANSITION COMPLETE.");

        // Resolve with the final handler.
        return handlerInfos[handlerInfos.length - 1].handler;
      } catch(e) {
        if (!(e instanceof TransitionAborted)) {
          //var erroneousHandler = handlerInfos.pop();
          var infos = transition.state.handlerInfos;
          transition.trigger(true, 'error', e, transition, infos[infos.length-1].handler);
          transition.abort();
        }

        throw e;
      }
    }

    /**
      @private

      Begins and returns a Transition based on the provided
      arguments. Accepts arguments in the form of both URL
      transitions and named transitions.

      @param {Router} router
      @param {Array[Object]} args arguments passed to transitionTo,
        replaceWith, or handleURL
    */
    function doTransition(router, args, isIntermediate) {
      // Normalize blank transitions to root URL transitions.
      var name = args[0] || '/';

      var lastArg = args[args.length-1];
      var queryParams = {};
      if (lastArg && lastArg.hasOwnProperty('queryParams')) {
        queryParams = pop.call(args).queryParams;
      }

      var intent;
      if (args.length === 0) {

        log(router, "Updating query params");

        // A query param update is really just a transition
        // into the route you're already on.
        var handlerInfos = router.state.handlerInfos;
        intent = new NamedTransitionIntent({
          name: handlerInfos[handlerInfos.length - 1].name,
          contexts: [],
          queryParams: queryParams
        });

      } else if (name.charAt(0) === '/') {

        log(router, "Attempting URL transition to " + name);
        intent = new URLTransitionIntent({ url: name });

      } else {

        log(router, "Attempting transition to " + name);
        intent = new NamedTransitionIntent({
          name: args[0],
          contexts: slice.call(args, 1),
          queryParams: queryParams
        });
      }

      return router.transitionByIntent(intent, isIntermediate);
    }

    function handlerInfosEqual(handlerInfos, otherHandlerInfos) {
      if (handlerInfos.length !== otherHandlerInfos.length) {
        return false;
      }

      for (var i = 0, len = handlerInfos.length; i < len; ++i) {
        if (handlerInfos[i] !== otherHandlerInfos[i]) {
          return false;
        }
      }
      return true;
    }

    function finalizeQueryParamChange(router, resolvedHandlers, newQueryParams, transition) {
      // We fire a finalizeQueryParamChange event which
      // gives the new route hierarchy a chance to tell
      // us which query params it's consuming and what
      // their final values are. If a query param is
      // no longer consumed in the final route hierarchy,
      // its serialized segment will be removed
      // from the URL.

      for (var k in newQueryParams) {
        if (newQueryParams.hasOwnProperty(k) &&
            newQueryParams[k] === null) {
          delete newQueryParams[k];
        }
      }

      var finalQueryParamsArray = [];
      trigger(router, resolvedHandlers, true, ['finalizeQueryParamChange', newQueryParams, finalQueryParamsArray, transition]);

      if (transition) {
        transition._visibleQueryParams = {};
      }

      var finalQueryParams = {};
      for (var i = 0, len = finalQueryParamsArray.length; i < len; ++i) {
        var qp = finalQueryParamsArray[i];
        finalQueryParams[qp.key] = qp.value;
        if (transition && qp.visible !== false) {
          transition._visibleQueryParams[qp.key] = qp.value;
        }
      }
      return finalQueryParams;
    }

    function notifyExistingHandlers(router, newState, newTransition) {
      var oldHandlers = router.state.handlerInfos,
          changing = [],
          leavingIndex = null,
          leaving, leavingChecker, i, oldHandlerLen, oldHandler, newHandler;

      oldHandlerLen = oldHandlers.length;
      for (i = 0; i < oldHandlerLen; i++) {
        oldHandler = oldHandlers[i];
        newHandler = newState.handlerInfos[i];

        if (!newHandler || oldHandler.name !== newHandler.name) {
          leavingIndex = i;
          break;
        }

        if (!newHandler.isResolved) {
          changing.push(oldHandler);
        }
      }

      if (leavingIndex !== null) {
        leaving = oldHandlers.slice(leavingIndex, oldHandlerLen);
        leavingChecker = function(name) {
          for (var h = 0, len = leaving.length; h < len; h++) {
            if (leaving[h].name === name) {
              return true;
            }
          }
          return false;
        };

        router._triggerWillLeave(leaving, newTransition, leavingChecker);
      }

      if (changing.length > 0) {
        router._triggerWillChangeContext(changing, newTransition);
      }

      trigger(router, oldHandlers, true, ['willTransition', newTransition]);
    }

    __exports__["default"] = Router;
  });
define("router/transition-intent",
  ["./utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var merge = __dependency1__.merge;

    function TransitionIntent(props) {
      this.initialize(props);

      // TODO: wat
      this.data = this.data || {};
    }

    TransitionIntent.prototype = {
      initialize: null,
      applyToState: null
    };

    __exports__["default"] = TransitionIntent;
  });
define("router/transition-intent/named-transition-intent",
  ["../transition-intent","../transition-state","../handler-info/factory","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var TransitionIntent = __dependency1__["default"];
    var TransitionState = __dependency2__["default"];
    var handlerInfoFactory = __dependency3__["default"];
    var isParam = __dependency4__.isParam;
    var extractQueryParams = __dependency4__.extractQueryParams;
    var merge = __dependency4__.merge;
    var subclass = __dependency4__.subclass;

    __exports__["default"] = subclass(TransitionIntent, {
      name: null,
      pivotHandler: null,
      contexts: null,
      queryParams: null,

      initialize: function(props) {
        this.name = props.name;
        this.pivotHandler = props.pivotHandler;
        this.contexts = props.contexts || [];
        this.queryParams = props.queryParams;
      },

      applyToState: function(oldState, recognizer, getHandler, isIntermediate) {

        var partitionedArgs     = extractQueryParams([this.name].concat(this.contexts)),
          pureArgs              = partitionedArgs[0],
          queryParams           = partitionedArgs[1],
          handlers              = recognizer.handlersFor(pureArgs[0]);

        var targetRouteName = handlers[handlers.length-1].handler;

        return this.applyToHandlers(oldState, handlers, getHandler, targetRouteName, isIntermediate);
      },

      applyToHandlers: function(oldState, handlers, getHandler, targetRouteName, isIntermediate, checkingIfActive) {

        var i, len;
        var newState = new TransitionState();
        var objects = this.contexts.slice(0);

        var invalidateIndex = handlers.length;

        // Pivot handlers are provided for refresh transitions
        if (this.pivotHandler) {
          for (i = 0, len = handlers.length; i < len; ++i) {
            if (getHandler(handlers[i].handler) === this.pivotHandler) {
              invalidateIndex = i;
              break;
            }
          }
        }

        var pivotHandlerFound = !this.pivotHandler;

        for (i = handlers.length - 1; i >= 0; --i) {
          var result = handlers[i];
          var name = result.handler;
          var handler = getHandler(name);

          var oldHandlerInfo = oldState.handlerInfos[i];
          var newHandlerInfo = null;

          if (result.names.length > 0) {
            if (i >= invalidateIndex) {
              newHandlerInfo = this.createParamHandlerInfo(name, handler, result.names, objects, oldHandlerInfo);
            } else {
              newHandlerInfo = this.getHandlerInfoForDynamicSegment(name, handler, result.names, objects, oldHandlerInfo, targetRouteName, i);
            }
          } else {
            // This route has no dynamic segment.
            // Therefore treat as a param-based handlerInfo
            // with empty params. This will cause the `model`
            // hook to be called with empty params, which is desirable.
            newHandlerInfo = this.createParamHandlerInfo(name, handler, result.names, objects, oldHandlerInfo);
          }

          if (checkingIfActive) {
            // If we're performing an isActive check, we want to
            // serialize URL params with the provided context, but
            // ignore mismatches between old and new context.
            newHandlerInfo = newHandlerInfo.becomeResolved(null, newHandlerInfo.context);
            var oldContext = oldHandlerInfo && oldHandlerInfo.context;
            if (result.names.length > 0 && newHandlerInfo.context === oldContext) {
              // If contexts match in isActive test, assume params also match.
              // This allows for flexibility in not requiring that every last
              // handler provide a `serialize` method
              newHandlerInfo.params = oldHandlerInfo && oldHandlerInfo.params;
            }
            newHandlerInfo.context = oldContext;
          }

          var handlerToUse = oldHandlerInfo;
          if (i >= invalidateIndex || newHandlerInfo.shouldSupercede(oldHandlerInfo)) {
            invalidateIndex = Math.min(i, invalidateIndex);
            handlerToUse = newHandlerInfo;
          }

          if (isIntermediate && !checkingIfActive) {
            handlerToUse = handlerToUse.becomeResolved(null, handlerToUse.context);
          }

          newState.handlerInfos.unshift(handlerToUse);
        }

        if (objects.length > 0) {
          throw new Error("More context objects were passed than there are dynamic segments for the route: " + targetRouteName);
        }

        if (!isIntermediate) {
          this.invalidateChildren(newState.handlerInfos, invalidateIndex);
        }

        merge(newState.queryParams, this.queryParams || {});

        return newState;
      },

      invalidateChildren: function(handlerInfos, invalidateIndex) {
        for (var i = invalidateIndex, l = handlerInfos.length; i < l; ++i) {
          var handlerInfo = handlerInfos[i];
          handlerInfos[i] = handlerInfos[i].getUnresolved();
        }
      },

      getHandlerInfoForDynamicSegment: function(name, handler, names, objects, oldHandlerInfo, targetRouteName, i) {

        var numNames = names.length;
        var objectToUse;
        if (objects.length > 0) {

          // Use the objects provided for this transition.
          objectToUse = objects[objects.length - 1];
          if (isParam(objectToUse)) {
            return this.createParamHandlerInfo(name, handler, names, objects, oldHandlerInfo);
          } else {
            objects.pop();
          }
        } else if (oldHandlerInfo && oldHandlerInfo.name === name) {
          // Reuse the matching oldHandlerInfo
          return oldHandlerInfo;
        } else {
          if (this.preTransitionState) {
            var preTransitionHandlerInfo = this.preTransitionState.handlerInfos[i];
            objectToUse = preTransitionHandlerInfo && preTransitionHandlerInfo.context;
          } else {
            // Ideally we should throw this error to provide maximal
            // information to the user that not enough context objects
            // were provided, but this proves too cumbersome in Ember
            // in cases where inner template helpers are evaluated
            // before parent helpers un-render, in which cases this
            // error somewhat prematurely fires.
            //throw new Error("Not enough context objects were provided to complete a transition to " + targetRouteName + ". Specifically, the " + name + " route needs an object that can be serialized into its dynamic URL segments [" + names.join(', ') + "]");
            return oldHandlerInfo;
          }
        }

        return handlerInfoFactory('object', {
          name: name,
          handler: handler,
          context: objectToUse,
          names: names
        });
      },

      createParamHandlerInfo: function(name, handler, names, objects, oldHandlerInfo) {
        var params = {};

        // Soak up all the provided string/numbers
        var numNames = names.length;
        while (numNames--) {

          // Only use old params if the names match with the new handler
          var oldParams = (oldHandlerInfo && name === oldHandlerInfo.name && oldHandlerInfo.params) || {};

          var peek = objects[objects.length - 1];
          var paramName = names[numNames];
          if (isParam(peek)) {
            params[paramName] = "" + objects.pop();
          } else {
            // If we're here, this means only some of the params
            // were string/number params, so try and use a param
            // value from a previous handler.
            if (oldParams.hasOwnProperty(paramName)) {
              params[paramName] = oldParams[paramName];
            } else {
              throw new Error("You didn't provide enough string/numeric parameters to satisfy all of the dynamic segments for route " + name);
            }
          }
        }

        return handlerInfoFactory('param', {
          name: name,
          handler: handler,
          params: params
        });
      }
    });
  });
define("router/transition-intent/url-transition-intent",
  ["../transition-intent","../transition-state","../handler-info/factory","../utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var TransitionIntent = __dependency1__["default"];
    var TransitionState = __dependency2__["default"];
    var handlerInfoFactory = __dependency3__["default"];
    var oCreate = __dependency4__.oCreate;
    var merge = __dependency4__.merge;
    var subclass = __dependency4__.subclass;

    __exports__["default"] = subclass(TransitionIntent, {
      url: null,

      initialize: function(props) {
        this.url = props.url;
      },

      applyToState: function(oldState, recognizer, getHandler) {
        var newState = new TransitionState();

        var results = recognizer.recognize(this.url),
            queryParams = {},
            i, len;

        if (!results) {
          throw new UnrecognizedURLError(this.url);
        }

        var statesDiffer = false;

        for (i = 0, len = results.length; i < len; ++i) {
          var result = results[i];
          var name = result.handler;
          var handler = getHandler(name);

          if (handler.inaccessibleByURL) {
            throw new UnrecognizedURLError(this.url);
          }

          var newHandlerInfo = handlerInfoFactory('param', {
            name: name,
            handler: handler,
            params: result.params
          });

          var oldHandlerInfo = oldState.handlerInfos[i];
          if (statesDiffer || newHandlerInfo.shouldSupercede(oldHandlerInfo)) {
            statesDiffer = true;
            newState.handlerInfos[i] = newHandlerInfo;
          } else {
            newState.handlerInfos[i] = oldHandlerInfo;
          }
        }

        merge(newState.queryParams, results.queryParams);

        return newState;
      }
    });

    /**
      Promise reject reasons passed to promise rejection
      handlers for failed transitions.
     */
    function UnrecognizedURLError(message) {
      this.message = (message || "UnrecognizedURLError");
      this.name = "UnrecognizedURLError";
    }
  });
define("router/transition-state",
  ["./handler-info","./utils","rsvp/promise","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var ResolvedHandlerInfo = __dependency1__.ResolvedHandlerInfo;
    var forEach = __dependency2__.forEach;
    var promiseLabel = __dependency2__.promiseLabel;
    var callHook = __dependency2__.callHook;
    var Promise = __dependency3__["default"];

    function TransitionState(other) {
      this.handlerInfos = [];
      this.queryParams = {};
      this.params = {};
    }

    TransitionState.prototype = {
      handlerInfos: null,
      queryParams: null,
      params: null,

      promiseLabel: function(label) {
        var targetName = '';
        forEach(this.handlerInfos, function(handlerInfo) {
          if (targetName !== '') {
            targetName += '.';
          }
          targetName += handlerInfo.name;
        });
        return promiseLabel("'" + targetName + "': " + label);
      },

      resolve: function(shouldContinue, payload) {
        var self = this;
        // First, calculate params for this state. This is useful
        // information to provide to the various route hooks.
        var params = this.params;
        forEach(this.handlerInfos, function(handlerInfo) {
          params[handlerInfo.name] = handlerInfo.params || {};
        });

        payload = payload || {};
        payload.resolveIndex = 0;

        var currentState = this;
        var wasAborted = false;

        // The prelude RSVP.resolve() asyncs us into the promise land.
        return Promise.resolve(null, this.promiseLabel("Start transition"))
        .then(resolveOneHandlerInfo, null, this.promiseLabel('Resolve handler'))['catch'](handleError, this.promiseLabel('Handle error'));

        function innerShouldContinue() {
          return Promise.resolve(shouldContinue(), currentState.promiseLabel("Check if should continue"))['catch'](function(reason) {
            // We distinguish between errors that occurred
            // during resolution (e.g. beforeModel/model/afterModel),
            // and aborts due to a rejecting promise from shouldContinue().
            wasAborted = true;
            return Promise.reject(reason);
          }, currentState.promiseLabel("Handle abort"));
        }

        function handleError(error) {
          // This is the only possible
          // reject value of TransitionState#resolve
          var handlerInfos = currentState.handlerInfos;
          var errorHandlerIndex = payload.resolveIndex >= handlerInfos.length ?
                                  handlerInfos.length - 1 : payload.resolveIndex;
          return Promise.reject({
            error: error,
            handlerWithError: currentState.handlerInfos[errorHandlerIndex].handler,
            wasAborted: wasAborted,
            state: currentState
          });
        }

        function proceed(resolvedHandlerInfo) {
          var wasAlreadyResolved = currentState.handlerInfos[payload.resolveIndex].isResolved;

          // Swap the previously unresolved handlerInfo with
          // the resolved handlerInfo
          currentState.handlerInfos[payload.resolveIndex++] = resolvedHandlerInfo;

          if (!wasAlreadyResolved) {
            // Call the redirect hook. The reason we call it here
            // vs. afterModel is so that redirects into child
            // routes don't re-run the model hooks for this
            // already-resolved route.
            var handler = resolvedHandlerInfo.handler;
            callHook(handler, 'redirect', resolvedHandlerInfo.context, payload);
          }

          // Proceed after ensuring that the redirect hook
          // didn't abort this transition by transitioning elsewhere.
          return innerShouldContinue().then(resolveOneHandlerInfo, null, currentState.promiseLabel('Resolve handler'));
        }

        function resolveOneHandlerInfo() {
          if (payload.resolveIndex === currentState.handlerInfos.length) {
            // This is is the only possible
            // fulfill value of TransitionState#resolve
            return {
              error: null,
              state: currentState
            };
          }

          var handlerInfo = currentState.handlerInfos[payload.resolveIndex];

          return handlerInfo.resolve(innerShouldContinue, payload)
                            .then(proceed, null, currentState.promiseLabel('Proceed'));
        }
      }
    };

    __exports__["default"] = TransitionState;
  });
define("router/transition",
  ["rsvp/promise","./handler-info","./utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];
    var ResolvedHandlerInfo = __dependency2__.ResolvedHandlerInfo;
    var trigger = __dependency3__.trigger;
    var slice = __dependency3__.slice;
    var log = __dependency3__.log;
    var promiseLabel = __dependency3__.promiseLabel;

    /**
      @private

      A Transition is a thennable (a promise-like object) that represents
      an attempt to transition to another route. It can be aborted, either
      explicitly via `abort` or by attempting another transition while a
      previous one is still underway. An aborted transition can also
      be `retry()`d later.
     */
    function Transition(router, intent, state, error) {
      var transition = this;
      this.state = state || router.state;
      this.intent = intent;
      this.router = router;
      this.data = this.intent && this.intent.data || {};
      this.resolvedModels = {};
      this.queryParams = {};

      if (error) {
        this.promise = Promise.reject(error);
        return;
      }

      if (state) {
        this.params = state.params;
        this.queryParams = state.queryParams;
        this.handlerInfos = state.handlerInfos;

        var len = state.handlerInfos.length;
        if (len) {
          this.targetName = state.handlerInfos[len-1].name;
        }

        for (var i = 0; i < len; ++i) {
          var handlerInfo = state.handlerInfos[i];

          // TODO: this all seems hacky
          if (!handlerInfo.isResolved) { break; }
          this.pivotHandler = handlerInfo.handler;
        }

        this.sequence = Transition.currentSequence++;
        this.promise = state.resolve(checkForAbort, this)['catch'](function(result) {
          if (result.wasAborted || transition.isAborted) {
            return Promise.reject(logAbort(transition));
          } else {
            transition.trigger('error', result.error, transition, result.handlerWithError);
            transition.abort();
            return Promise.reject(result.error);
          }
        }, promiseLabel('Handle Abort'));
      } else {
        this.promise = Promise.resolve(this.state);
        this.params = {};
      }

      function checkForAbort() {
        if (transition.isAborted) {
          return Promise.reject(undefined, promiseLabel("Transition aborted - reject"));
        }
      }
    }

    Transition.currentSequence = 0;

    Transition.prototype = {
      targetName: null,
      urlMethod: 'update',
      intent: null,
      params: null,
      pivotHandler: null,
      resolveIndex: 0,
      handlerInfos: null,
      resolvedModels: null,
      isActive: true,
      state: null,
      queryParamsOnly: false,

      isTransition: true,

      isExiting: function(handler) {
        var handlerInfos = this.handlerInfos;
        for (var i = 0, len = handlerInfos.length; i < len; ++i) {
          var handlerInfo = handlerInfos[i];
          if (handlerInfo.name === handler || handlerInfo.handler === handler) {
            return false;
          }
        }
        return true;
      },

      /**
        @public

        The Transition's internal promise. Calling `.then` on this property
        is that same as calling `.then` on the Transition object itself, but
        this property is exposed for when you want to pass around a
        Transition's promise, but not the Transition object itself, since
        Transition object can be externally `abort`ed, while the promise
        cannot.
       */
      promise: null,

      /**
        @public

        Custom state can be stored on a Transition's `data` object.
        This can be useful for decorating a Transition within an earlier
        hook and shared with a later hook. Properties set on `data` will
        be copied to new transitions generated by calling `retry` on this
        transition.
       */
      data: null,

      /**
        @public

        A standard promise hook that resolves if the transition
        succeeds and rejects if it fails/redirects/aborts.

        Forwards to the internal `promise` property which you can
        use in situations where you want to pass around a thennable,
        but not the Transition itself.

        @param {Function} success
        @param {Function} failure
       */
      then: function(success, failure) {
        return this.promise.then(success, failure);
      },

      /**
        @public

        Aborts the Transition. Note you can also implicitly abort a transition
        by initiating another transition while a previous one is underway.
       */
      abort: function() {
        if (this.isAborted) { return this; }
        log(this.router, this.sequence, this.targetName + ": transition was aborted");
        this.intent.preTransitionState = this.router.state;
        this.isAborted = true;
        this.isActive = false;
        this.router.activeTransition = null;
        return this;
      },

      /**
        @public

        Retries a previously-aborted transition (making sure to abort the
        transition if it's still active). Returns a new transition that
        represents the new attempt to transition.
       */
      retry: function() {
        // TODO: add tests for merged state retry()s
        this.abort();
        return this.router.transitionByIntent(this.intent, false);
      },

      /**
        @public

        Sets the URL-changing method to be employed at the end of a
        successful transition. By default, a new Transition will just
        use `updateURL`, but passing 'replace' to this method will
        cause the URL to update using 'replaceWith' instead. Omitting
        a parameter will disable the URL change, allowing for transitions
        that don't update the URL at completion (this is also used for
        handleURL, since the URL has already changed before the
        transition took place).

        @param {String} method the type of URL-changing method to use
          at the end of a transition. Accepted values are 'replace',
          falsy values, or any other non-falsy value (which is
          interpreted as an updateURL transition).

        @return {Transition} this transition
       */
      method: function(method) {
        this.urlMethod = method;
        return this;
      },

      /**
        @public

        Fires an event on the current list of resolved/resolving
        handlers within this transition. Useful for firing events
        on route hierarchies that haven't fully been entered yet.

        Note: This method is also aliased as `send`

        @param {Boolean} [ignoreFailure=false] a boolean specifying whether unhandled events throw an error
        @param {String} name the name of the event to fire
       */
      trigger: function (ignoreFailure) {
        var args = slice.call(arguments);
        if (typeof ignoreFailure === 'boolean') {
          args.shift();
        } else {
          // Throw errors on unhandled trigger events by default
          ignoreFailure = false;
        }
        trigger(this.router, this.state.handlerInfos.slice(0, this.resolveIndex + 1), ignoreFailure, args);
      },

      /**
        @public

        Transitions are aborted and their promises rejected
        when redirects occur; this method returns a promise
        that will follow any redirects that occur and fulfill
        with the value fulfilled by any redirecting transitions
        that occur.

        @return {Promise} a promise that fulfills with the same
          value that the final redirecting transition fulfills with
       */
      followRedirects: function() {
        var router = this.router;
        return this.promise['catch'](function(reason) {
          if (router.activeTransition) {
            return router.activeTransition.followRedirects();
          }
          return Promise.reject(reason);
        });
      },

      toString: function() {
        return "Transition (sequence " + this.sequence + ")";
      },

      /**
        @private
       */
      log: function(message) {
        log(this.router, this.sequence, message);
      }
    };

    // Alias 'trigger' as 'send'
    Transition.prototype.send = Transition.prototype.trigger;

    /**
      @private

      Logs and returns a TransitionAborted error.
     */
    function logAbort(transition) {
      log(transition.router, transition.sequence, "detected abort.");
      return new TransitionAborted();
    }

    function TransitionAborted(message) {
      this.message = (message || "TransitionAborted");
      this.name = "TransitionAborted";
    }

    __exports__.Transition = Transition;
    __exports__.logAbort = logAbort;
    __exports__.TransitionAborted = TransitionAborted;
  });
define("router/utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    var slice = Array.prototype.slice;

    var _isArray;
    if (!Array.isArray) {
      _isArray = function (x) {
        return Object.prototype.toString.call(x) === "[object Array]";
      };
    } else {
      _isArray = Array.isArray;
    }

    var isArray = _isArray;
    __exports__.isArray = isArray;
    function merge(hash, other) {
      for (var prop in other) {
        if (other.hasOwnProperty(prop)) { hash[prop] = other[prop]; }
      }
    }

    var oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };
    __exports__.oCreate = oCreate;
    /**
      @private

      Extracts query params from the end of an array
    **/
    function extractQueryParams(array) {
      var len = (array && array.length), head, queryParams;

      if(len && len > 0 && array[len - 1] && array[len - 1].hasOwnProperty('queryParams')) {
        queryParams = array[len - 1].queryParams;
        head = slice.call(array, 0, len - 1);
        return [head, queryParams];
      } else {
        return [array, null];
      }
    }

    __exports__.extractQueryParams = extractQueryParams;/**
      @private

      Coerces query param properties and array elements into strings.
    **/
    function coerceQueryParamsToString(queryParams) {
      for (var key in queryParams) {
        if (typeof queryParams[key] === 'number') {
          queryParams[key] = '' + queryParams[key];
        } else if (isArray(queryParams[key])) {
          for (var i = 0, l = queryParams[key].length; i < l; i++) {
            queryParams[key][i] = '' + queryParams[key][i];
          }
        }
      }
    }
    /**
      @private
     */
    function log(router, sequence, msg) {
      if (!router.log) { return; }

      if (arguments.length === 3) {
        router.log("Transition #" + sequence + ": " + msg);
      } else {
        msg = sequence;
        router.log(msg);
      }
    }

    __exports__.log = log;function bind(context, fn) {
      var boundArgs = arguments;
      return function(value) {
        var args = slice.call(boundArgs, 2);
        args.push(value);
        return fn.apply(context, args);
      };
    }

    __exports__.bind = bind;function isParam(object) {
      return (typeof object === "string" || object instanceof String || typeof object === "number" || object instanceof Number);
    }


    function forEach(array, callback) {
      for (var i=0, l=array.length; i<l && false !== callback(array[i]); i++) { }
    }

    __exports__.forEach = forEach;function trigger(router, handlerInfos, ignoreFailure, args) {
      if (router.triggerEvent) {
        router.triggerEvent(handlerInfos, ignoreFailure, args);
        return;
      }

      var name = args.shift();

      if (!handlerInfos) {
        if (ignoreFailure) { return; }
        throw new Error("Could not trigger event '" + name + "'. There are no active handlers");
      }

      var eventWasHandled = false;

      for (var i=handlerInfos.length-1; i>=0; i--) {
        var handlerInfo = handlerInfos[i],
            handler = handlerInfo.handler;

        if (handler.events && handler.events[name]) {
          if (handler.events[name].apply(handler, args) === true) {
            eventWasHandled = true;
          } else {
            return;
          }
        }
      }

      if (!eventWasHandled && !ignoreFailure) {
        throw new Error("Nothing handled the event '" + name + "'.");
      }
    }

    __exports__.trigger = trigger;function getChangelist(oldObject, newObject) {
      var key;
      var results = {
        all: {},
        changed: {},
        removed: {}
      };

      merge(results.all, newObject);

      var didChange = false;
      coerceQueryParamsToString(oldObject);
      coerceQueryParamsToString(newObject);

      // Calculate removals
      for (key in oldObject) {
        if (oldObject.hasOwnProperty(key)) {
          if (!newObject.hasOwnProperty(key)) {
            didChange = true;
            results.removed[key] = oldObject[key];
          }
        }
      }

      // Calculate changes
      for (key in newObject) {
        if (newObject.hasOwnProperty(key)) {
          if (isArray(oldObject[key]) && isArray(newObject[key])) {
            if (oldObject[key].length !== newObject[key].length) {
              results.changed[key] = newObject[key];
              didChange = true;
            } else {
              for (var i = 0, l = oldObject[key].length; i < l; i++) {
                if (oldObject[key][i] !== newObject[key][i]) {
                  results.changed[key] = newObject[key];
                  didChange = true;
                }
              }
            }
          }
          else {
            if (oldObject[key] !== newObject[key]) {
              results.changed[key] = newObject[key];
              didChange = true;
            }
          }
        }
      }

      return didChange && results;
    }

    __exports__.getChangelist = getChangelist;function promiseLabel(label) {
      return 'Router: ' + label;
    }

    __exports__.promiseLabel = promiseLabel;function subclass(parentConstructor, proto) {
      function C(props) {
        parentConstructor.call(this, props || {});
      }
      C.prototype = oCreate(parentConstructor.prototype);
      merge(C.prototype, proto);
      return C;
    }

    __exports__.subclass = subclass;function resolveHook(obj, hookName) {
      if (!obj) { return; }
      var underscored = "_" + hookName;
      return obj[underscored] && underscored ||
             obj[hookName] && hookName;
    }

    function callHook(obj, hookName) {
      var args = slice.call(arguments, 2);
      return applyHook(obj, hookName, args);
    }

    function applyHook(obj, _hookName, args) {
      var hookName = resolveHook(obj, _hookName);
      if (hookName) {
        return obj[hookName].apply(obj, args);
      }
    }

    __exports__.merge = merge;
    __exports__.slice = slice;
    __exports__.isParam = isParam;
    __exports__.coerceQueryParamsToString = coerceQueryParamsToString;
    __exports__.callHook = callHook;
    __exports__.resolveHook = resolveHook;
    __exports__.applyHook = applyHook;
  });
define("router",
  ["router/router","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Router = __dependency1__["default"];

    __exports__["default"] = Router;
  });

/**
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
function t(){function t(t,e,r,n){var i;if(n){var u=n.prototype;i=ne.create(u)}else i=t.prototype;return ne.keys(e).forEach(function(t){i[t]=e[t]}),ne.keys(r).forEach(function(e){t[e]=r[e]}),i.constructor=t,t.prototype=i,t}function e(t,e,r,n){return ne.getPrototypeOf(e)[r].apply(t,n)}function r(t,r,n){e(t,r,"constructor",n)}function n(){return Object.create(ae)}function i(t){var e=Object.create(ce);return e.__reversedIndices=t?t.__reversedIndices:!1,e}function u(t,e,r,n){var i=t.get?t.get(e[n],de):de;return i===de?r:++n===e.length?i:u(i,e,r,n)}function s(t,e,r){return(0===t||null!=r&&-r>=t)&&(null==e||null!=r&&e>=r)}function a(t,e){return 0>t?Math.max(0,e+t):e?Math.min(e,t):t}function h(t,e){return null==t?e:0>t?Math.max(0,e+t):e?Math.min(e,t):t}function o(t){return t}function c(t,e){return[e,t]}function f(){return!0}function l(){return this}function _(t){return(t||0)+1}function v(t,e,r,n,i){var u=t.__makeSequence();return u.__iterateUncached=function(u,s,a){var h=0,o=t.__iterate(function(t,i,s){if(e.call(r,t,i,s)){if(u(t,n?i:h,s)===!1)return!1;h++}},s,a);return i?o:h},u}function g(t){return function(){return!t.apply(this,arguments)}}function p(t){return"string"==typeof t?JSON.stringify(t):t}function m(t,e){for(var r="";e;)1&e&&(r+=t),(e>>=1)&&(t+=t);return r}function d(t,e){return t>e?1:e>t?-1:0}function y(t){I(1/0!==t,"Cannot perform this action with an infinite sequence.")}function w(t,e){return t===e?0!==t||0!==e||1/t===1/e:t!==t?e!==e:t instanceof ue?t.equals(e):!1}function I(t,e){if(!t)throw Error(e)}function D(t,e,r){var n=t._rootData.updateIn(t._keyPath,e),i=t._keyPath||[];return t._onChange&&t._onChange.call(void 0,n,t._rootData,r?i.concat(r):i),new _e(n,t._keyPath,t._onChange)}function O(){}function b(t){for(var e=t.length,r=Array(e),n=0;e>n;n++)r[n]=t[n];return r}function M(t){return Ae.value=t,Ae}function k(t,e,r){var n=Object.create(Ie);return n.length=t,n._root=e,n.__ownerID=r,n}function S(t,e,r){var n=M(),i=x(t._root,t.__ownerID,0,L(e),e,r,n),u=t.length+(n.value?r===de?-1:1:0);return t.__ownerID?(t.length=u,t._root=i,t):i?i===t._root?t:k(u,i):ye.empty()
}function x(t,e,r,n,i,u,s){return t?t.update(e,r,n,i,u,s):u===de?t:(s&&(s.value=!0),new xe(e,n,[i,u]))}function E(t){return t.constructor===xe||t.constructor===ke}function C(t,e,r,n,i){if(t.hash===n)return new ke(e,n,[t.entry,i]);var u,s=t.hash>>>r&me,a=n>>>r&me,h=s===a?[C(t,e,r+ge,n,i)]:(u=new xe(e,n,i),a>s?[t,u]:[u,t]);return new De(e,1<<s|1<<a,h)}function A(t,e,r,n){for(var i=0,u=0,s=Array(r),a=0,h=1,o=e.length;o>a;a++,h<<=1){var c=e[a];null!=c&&a!==n&&(i|=h,s[u++]=c)}return new De(t,i,s)}function q(t,e,r,n,i){for(var u=0,s=Array(pe),a=0;0!==r;a++,r>>>=1)s[a]=1&r?e[u++]:null;return s[n]=i,new be(t,u+1,s)}function j(t,e,r){for(var n=[],i=0;r.length>i;i++){var u=r[i];u&&n.push(Array.isArray(u)?ue(u).fromEntries():ue(u))}return z(t,e,n)}function U(t){return function(e,r){return e&&e.mergeDeepWith?e.mergeDeepWith(t,r):t?t(e,r):r}}function z(t,e,r){return 0===r.length?t:t.withMutations(function(t){for(var n=e?function(r,n){var i=t.get(n,de);t.set(n,i===de?r:e(i,r))}:function(e,r){t.set(r,e)},i=0;r.length>i;i++)r[i].forEach(n)})}function R(t,e,r,n){var i=e[n],u=t.get?t.get(i,de):de;return u===de&&(u=ye.empty()),I(t.set,"updateIn with invalid keyPath"),t.set(i,++n===e.length?r(u):R(u,e,r,n))}function P(t){return t-=t>>1&1431655765,t=(858993459&t)+(t>>2&858993459),t=t+(t>>4)&252645135,t+=t>>8,t+=t>>16,127&t}function W(t,e,r,n){var i=n?t:b(t);return i[e]=r,i}function J(t,e,r,n){var i=t.length+1;if(n&&e+1===i)return t[e]=r,t;for(var u=Array(i),s=0,a=0;i>a;a++)a===e?(u[a]=r,s=-1):u[a]=t[a+s];return u}function B(t,e,r){var n=t.length-1;if(r&&e===n)return t.pop(),t;for(var i=Array(n),u=0,s=0;n>s;s++)s===e&&(u=1),i[s]=t[s+u];return i}function L(t){if(!t)return 0;if(t===!0)return 1;var e=typeof t;if("number"===e){if((0|t)===t)return t&qe;t=""+t,e="string"}if("string"===e)return t.length>je?V(t):K(t);if(t.hashCode&&"function"==typeof t.hashCode)return t.hashCode();throw Error("Unable to hash: "+t)}function V(t){var e=Re[t];return null==e&&(e=K(t),ze===Ue&&(ze=0,Re={}),ze++,Re[t]=e),e}function K(t){for(var e=0,r=0;t.length>r;r++)e=31*e+t.charCodeAt(r)&qe;
return e}function N(t,e,r,n,i){return{array:t,level:e,offset:r,max:n,__prev:i}}function F(t,e,r,n,i,u){var s=Object.create(Le);return s.length=e-t,s._origin=t,s._size=e,s._level=r,s._root=n,s._tail=i,s.__ownerID=u,s}function G(t,e){if(e>=X(t._size))return t._tail;if(1<<t._level+ge>e){for(var r=t._root,n=t._level;r&&n>0;)r=r.array[e>>>n&me],n-=ge;return r}}function H(t,e,r){var n=t.__ownerID||new O,i=t._origin,u=t._size,s=i+e,a=null==r?u:0>r?u+r:i+r;if(s===i&&a===u)return t;if(s>=a)return t.clear();for(var h=t._level,o=t._root,c=0;0>s+c;)o=new Ve(o.array.length?[,o]:[],n),h+=ge,c+=1<<h;c&&(s+=c,i+=c,a+=c,u+=c);for(var f=X(u),l=X(a);l>=1<<h+ge;)o=new Ve(o.array.length?[o]:[],n),h+=ge;var _=t._tail,v=f>l?G(t,a-1):l>f?new Ve([],n):_;if(l>f&&u>s&&_.array.length){o=o.ensureOwner(n);for(var g=o,p=h;p>ge;p-=ge){var m=f>>>p&me;g=g.array[m]=g.array[m]?g.array[m].ensureOwner(n):new Ve([],n)}g.array[f>>>ge&me]=_}if(u>a&&(v=v.removeAfter(n,0,a)),s>=l)s-=l,a-=l,h=ge,o=Ge,v=v.removeBefore(n,0,s);else if(s>i||f>l){var d,y;c=0;do d=s>>>h&me,y=l-1>>>h&me,d===y&&(d&&(c+=(1<<h)*d),h-=ge,o=o&&o.array[d]);while(o&&d===y);o&&s>i&&(o=o.removeBefore(n,h,s-c)),o&&f>l&&(o=o.removeAfter(n,h,l-c)),c&&(s-=c,a-=c),o=o||Ge}return t.__ownerID?(t.length=a-s,t._origin=s,t._size=a,t._level=h,t._root=o,t._tail=v,t):F(s,a,h,o,v)}function Q(t,e,r){for(var n=[],i=0;r.length>i;i++){var u=r[i];u&&n.push(u.forEach?u:ue(u))}var s=Math.max.apply(null,n.map(function(t){return t.length||0}));return s>t.length&&(t=t.setLength(s)),z(t,e,n)}function T(t,e){return I(t>=0,"Index out of bounds"),t+e}function X(t){return pe>t?0:t-1>>>ge<<ge}function Y(t,e){var r=Object.create(Te);return r.length=t?t.length:0,r._map=t,r.__ownerID=e,r}function Z(t,e,r){var n=Object.create(Ye.prototype);return n.length=t?t.length:0,n._map=t,n._vector=e,n.__ownerID=r,n}function $(t,e,r){var n=Object.create(Object.getPrototypeOf(t));return n._map=e,n.__ownerID=r,n}function te(t,e){return e?ee(e,t,"",{"":t}):re(t)}function ee(t,e,r,n){return e&&(Array.isArray(e)||e.constructor===Object)?t.call(n,r,ue(e).map(function(r,n){return ee(t,r,n,e)
})):e}function re(t){if(t){if(Array.isArray(t))return ue(t).map(re).toVector();if(t.constructor===Object)return ue(t).map(re).toMap()}return t}var ne=Object,ie={};ie.createClass=t,ie.superCall=e,ie.defaultSuperCall=r;var ue=function(t){return se.from(1===arguments.length?t:Array.prototype.slice.call(arguments))},se=ue;ie.createClass(ue,{toString:function(){return this.__toString("Seq {","}")},__toString:function(t,e){return 0===this.length?t+e:t+" "+this.map(this.__toStringMapper).join(", ")+" "+e},__toStringMapper:function(t,e){return e+": "+p(t)},toJS:function(){return this.map(function(t){return t instanceof se?t.toJS():t}).__toJS()},toArray:function(){y(this.length);var t=Array(this.length||0);return this.values().forEach(function(e,r){t[r]=e}),t},toObject:function(){y(this.length);var t={};return this.forEach(function(e,r){t[r]=e}),t},toVector:function(){return y(this.length),Je.from(this)},toMap:function(){return y(this.length),ye.from(this)},toOrderedMap:function(){return y(this.length),Ye.from(this)},toSet:function(){return y(this.length),He.from(this)},equals:function(t){if(this===t)return!0;if(!(t instanceof se))return!1;if(null!=this.length&&null!=t.length){if(this.length!==t.length)return!1;if(0===this.length&&0===t.length)return!0}return this.__deepEquals(t)},__deepEquals:function(t){var e=this.cacheResult().entries().toArray(),r=0;return t.every(function(t,n){var i=e[r++];return w(n,i[0])&&w(t,i[1])})},join:function(t){t=t||",";var e="",r=!0;return this.forEach(function(n){r?(r=!1,e+=n):e+=t+n}),e},count:function(t,e){return t?this.filter(t,e).count():(null==this.length&&(this.length=this.forEach(f)),this.length)},countBy:function(t){var e=this;return Ye.empty().withMutations(function(r){e.forEach(function(e,n,i){r.update(t(e,n,i),_)})})},concat:function(){for(var t=[],e=0;arguments.length>e;e++)t[e]=arguments[e];var r=[this].concat(t.map(function(t){return se(t)})),n=this.__makeSequence();return n.length=r.reduce(function(t,e){return null!=t&&null!=e.length?t+e.length:void 0},0),n.__iterateUncached=function(t,e){for(var n,i=0,u=r.length-1,s=0;u>=s&&!n;s++){var a=r[e?u-s:s];
i+=a.__iterate(function(e,r,i){return t(e,r,i)===!1?(n=!0,!1):void 0},e)}return i},n},reverse:function(){var t=this,e=t.__makeSequence();return e.length=t.length,e.__iterateUncached=function(e,r){return t.__iterate(e,!r)},e.reverse=function(){return t},e},keys:function(){return this.flip().values()},values:function(){var t=this,e=i(t);return e.length=t.length,e.values=l,e.__iterateUncached=function(e,r,n){if(n&&null==this.length)return this.cacheResult().__iterate(e,r,n);var i,u=0;return n?(u=this.length-1,i=function(t,r,n){return e(t,u--,n)!==!1}):i=function(t,r,n){return e(t,u++,n)!==!1},t.__iterate(i,r),n?this.length:u},e},entries:function(){var t=this;if(t._cache)return se(t._cache);var e=t.map(c).values();return e.fromEntries=function(){return t},e},forEach:function(t,e){return this.__iterate(e?t.bind(e):t)},reduce:function(t,e,r){var n=e;return this.forEach(function(e,i,u){n=t.call(r,n,e,i,u)}),n},reduceRight:function(t,e,r){return this.reverse(!0).reduce(t,e,r)},every:function(t,e){var r=!0;return this.forEach(function(n,i,u){return t.call(e,n,i,u)?void 0:(r=!1,!1)}),r},some:function(t,e){return!this.every(g(t),e)},first:function(){return this.find(f)},last:function(){return this.findLast(f)},rest:function(){return this.slice(1)},butLast:function(){return this.slice(0,-1)},has:function(t){return this.get(t,de)!==de},get:function(t,e){return this.find(function(e,r){return w(r,t)},null,e)},getIn:function(t,e){return t&&0!==t.length?u(this,t,e,0):this},contains:function(t){return this.find(function(e){return w(e,t)},null,de)!==de},find:function(t,e,r){var n=r;return this.forEach(function(r,i,u){return t.call(e,r,i,u)?(n=r,!1):void 0}),n},findKey:function(t,e){var r;return this.forEach(function(n,i,u){return t.call(e,n,i,u)?(r=i,!1):void 0}),r},findLast:function(t,e,r){return this.reverse(!0).find(t,e,r)},findLastKey:function(t,e){return this.reverse(!0).findKey(t,e)},flip:function(){var t=this,e=n();return e.length=t.length,e.flip=function(){return t},e.__iterateUncached=function(e,r){return t.__iterate(function(t,r,n){return e(r,t,n)!==!1
},r)},e},map:function(t,e){var r=this,n=r.__makeSequence();return n.length=r.length,n.__iterateUncached=function(n,i){return r.__iterate(function(r,i,u){return n(t.call(e,r,i,u),i,u)!==!1},i)},n},mapKeys:function(t,e){var r=this,n=r.__makeSequence();return n.length=r.length,n.__iterateUncached=function(n,i){return r.__iterate(function(r,i,u){return n(r,t.call(e,i,r,u),u)!==!1},i)},n},filter:function(t,e){return v(this,t,e,!0,!1)},slice:function(t,e){if(s(t,e,this.length))return this;var r=a(t,this.length),n=h(e,this.length);if(r!==r||n!==n)return this.entries().slice(t,e).fromEntries();var i=0===r?this:this.skip(r);return null==n||n===this.length?i:i.take(n-r)},take:function(t){var e=0,r=this.takeWhile(function(){return e++<t});return r.length=this.length&&Math.min(this.length,t),r},takeLast:function(t,e){return this.reverse(e).take(t).reverse(e)},takeWhile:function(t,e){var r=this,n=r.__makeSequence();return n.__iterateUncached=function(n,i,u){if(i)return this.cacheResult().__iterate(n,i,u);var s=0;return r.__iterate(function(r,i,u){return t.call(e,r,i,u)&&n(r,i,u)!==!1?void s++:!1},i,u),s},n},takeUntil:function(t,e,r){return this.takeWhile(g(t),e,r)},skip:function(t,e){if(0===t)return this;var r=0,n=this.skipWhile(function(){return r++<t},null,e);return n.length=this.length&&Math.max(0,this.length-t),n},skipLast:function(t,e){return this.reverse(e).skip(t).reverse(e)},skipWhile:function(t,e){var r=this,n=r.__makeSequence();return n.__iterateUncached=function(n,i,u){if(i)return this.cacheResult().__iterate(n,i,u);var s=!0,a=0;return r.__iterate(function(r,i,u){if(!s||!(s=t.call(e,r,i,u))){if(n(r,i,u)===!1)return!1;a++}},i,u),a},n},skipUntil:function(t,e,r){return this.skipWhile(g(t),e,r)},groupBy:function(t){var e=this,r=Ye.empty().withMutations(function(r){e.forEach(function(e,n,i){var u=t(e,n,i),s=r.get(u,de);s===de&&(s=[],r.set(u,s)),s.push([n,e])})});return r.map(function(t){return se(t).fromEntries()})},sort:function(t,e){return this.sortBy(o,t,e)},sortBy:function(t,e){e=e||d;var r=this;return se(this.entries().entries().toArray().sort(function(n,i){return e(t(n[1][1],n[1][0],r),t(i[1][1],i[1][0],r))||n[0]-i[0]
})).fromEntries().values().fromEntries()},cacheResult:function(){return!this._cache&&this.__iterateUncached&&(y(this.length),this._cache=this.entries().toArray(),null==this.length&&(this.length=this._cache.length)),this},__iterate:function(t,e,r){if(!this._cache)return this.__iterateUncached(t,e,r);var n=this.length-1,i=this._cache,u=this;if(e)for(var s=i.length-1;s>=0;s--){var a=i[s];if(t(a[1],r?a[0]:n-a[0],u)===!1)break}else i.every(r?function(e){return t(e[1],n-e[0],u)!==!1}:function(e){return t(e[1],e[0],u)!==!1});return this.length},__makeSequence:function(){return n()}},{from:function(t){if(t instanceof se)return t;if(!Array.isArray(t)){if(t&&t.constructor===Object)return new fe(t);t=[t]}return new le(t)}});var ae=ue.prototype;ae.toJSON=ae.toJS,ae.__toJS=ae.toObject,ae.inspect=ae.toSource=function(){return""+this};var he=function(){ie.defaultSuperCall(this,oe.prototype,arguments)},oe=he;ie.createClass(he,{toString:function(){return this.__toString("Seq [","]")},toArray:function(){y(this.length);var t=Array(this.length||0);return t.length=this.forEach(function(e,r){t[r]=e}),t},fromEntries:function(){var t=this,e=n();return e.length=t.length,e.entries=function(){return t},e.__iterateUncached=function(e,r,n){return t.__iterate(function(t,r,n){return e(t[1],t[0],n)},r,n)},e},join:function(t){t=t||",";var e="",r=0;return this.forEach(function(n,i){var u=i-r;r=i,e+=(1===u?t:m(t,u))+n}),this.length&&this.length-1>r&&(e+=m(t,this.length-1-r)),e},concat:function(){for(var t=[],e=0;arguments.length>e;e++)t[e]=arguments[e];var r=[this].concat(t).map(function(t){return ue(t)}),n=this.__makeSequence();return n.length=r.reduce(function(t,e){return null!=t&&null!=e.length?t+e.length:void 0},0),n.__iterateUncached=function(t,e,n){if(n&&!this.length)return this.cacheResult().__iterate(t,e,n);for(var i,u=0,s=n&&this.length-1,a=r.length-1,h=0;a>=h&&!i;h++){var o=r[e?a-h:h];o instanceof oe||(o=o.values()),u+=o.__iterate(function(e,r,a){return r+=u,t(e,n?s-r:r,a)===!1?(i=!0,!1):void 0},e)}return u},n},reverse:function(t){var e=this,r=e.__makeSequence();
return r.length=e.length,r.__reversedIndices=!!(t^e.__reversedIndices),r.__iterateUncached=function(r,n,i){return e.__iterate(r,!n,i^t)},r.reverse=function(r){return t===r?e:ce.reverse.call(this,r)},r},values:function(){var t=ie.superCall(this,oe.prototype,"values",[]);return t.length=void 0,t},filter:function(t,e,r){var n=v(this,t,e,r,r);return r&&(n.length=this.length),n},indexOf:function(t){return this.findIndex(function(e){return w(e,t)})},lastIndexOf:function(t){return this.reverse(!0).indexOf(t)},findIndex:function(t,e){var r=this.findKey(t,e);return null==r?-1:r},findLastIndex:function(t,e){return this.reverse(!0).findIndex(t,e)},slice:function(t,e,r){var n=this;if(s(t,e,n.length))return n;var i=n.__makeSequence(),u=a(t,n.length),o=h(e,n.length);return i.length=n.length&&(r?n.length:o-u),i.__reversedIndices=n.__reversedIndices,i.__iterateUncached=function(i,s,c){if(s)return this.cacheResult().__iterate(i,s,c);var f=this.__reversedIndices^c;if(u!==u||o!==o||f&&null==n.length){var l=n.count();u=a(t,l),o=h(e,l)}var _=f?n.length-o:u,v=f?n.length-u:o,g=n.__iterate(function(t,e,n){return f?null!=v&&e>=v||e>=_&&i(t,r?e:e-_,n)!==!1:_>e||(null==v||v>e)&&i(t,r?e:e-_,n)!==!1},s,c);return null!=this.length?this.length:r?g:Math.max(0,g-_)},i},splice:function(t,e){for(var r=[],n=2;arguments.length>n;n++)r[n-2]=arguments[n];return 0===e&&0===r.length?this:this.slice(0,t).concat(r,this.slice(t+e))},takeWhile:function(t,e,r){var n=this,i=n.__makeSequence();return i.__iterateUncached=function(u,s,a){if(s)return this.cacheResult().__iterate(u,s,a);var h=0,o=!0,c=n.__iterate(function(r,n,i){return t.call(e,r,n,i)&&u(r,n,i)!==!1?void(h=n):(o=!1,!1)},s,a);return r?i.length:o?c:h+1},r&&(i.length=this.length),i},skipWhile:function(t,e,r){var n=this,i=n.__makeSequence();return r&&(i.length=this.length),i.__iterateUncached=function(i,u,s){if(u)return this.cacheResult().__iterate(i,u,s);var a=n.__reversedIndices^s,h=!0,o=0,c=n.__iterate(function(n,u,a){return h&&(h=t.call(e,n,u,a),h||(o=u)),h||i(n,s||r?u:u-o,a)!==!1},u,s);return r?c:a?o+1:c-o
},i},groupBy:function(t,e,r){var n=this,i=Ye.empty().withMutations(function(e){n.forEach(function(i,u,s){var a=t(i,u,s),h=e.get(a,de);h===de&&(h=Array(r?n.length:0),e.set(a,h)),r?h[u]=i:h.push(i)})});return i.map(function(t){return ue(t)})},sortBy:function(t,e,r){var n=ie.superCall(this,oe.prototype,"sortBy",[t,e]);return r||(n=n.values()),n.length=this.length,n},__makeSequence:function(){return i(this)}},{},ue);var ce=he.prototype;ce.__toJS=ce.toArray,ce.__toStringMapper=p;var fe=function(t){var e=Object.keys(t);this._object=t,this._keys=e,this.length=e.length};ie.createClass(fe,{toObject:function(){return this._object},get:function(t,e){return void 0===e||this.has(t)?this._object[t]:e},has:function(t){return this._object.hasOwnProperty(t)},__iterate:function(t,e){for(var r=this._object,n=this._keys,i=n.length-1,u=0;i>=u;u++){var s=e?i-u:u;if(t(r[n[s]],n[s],r)===!1)break}return u}},{},ue);var le=function(t){this._array=t,this.length=t.length};ie.createClass(le,{toArray:function(){return this._array},__iterate:function(t,e,r){var n=this._array,i=n.length-1,u=-1;if(e){for(var s=i;s>=0;s--){if(n.hasOwnProperty(s)&&t(n[s],r?s:i-s,n)===!1)return u+1;u=s}return n.length}var a=n.every(function(e,s){return t(e,r?i-s:s,n)===!1?!1:(u=s,!0)});return a?n.length:u+1}},{},he),le.prototype.get=fe.prototype.get,le.prototype.has=fe.prototype.has;var _e=function(t,e,r){this._rootData=t,this._keyPath=e,this._onChange=r},ve=_e;ie.createClass(_e,{get:function(t,e){var r=this._rootData.getIn(this._keyPath,ye.empty());return t?r.get(t,e):r},set:function(t,e){return D(this,function(r){return r.set(t,e)},t)},"delete":function(t){return D(this,function(e){return e.delete(t)},t)},update:function(t,e){var r;return"function"==typeof t?(r=t,t=void 0):r=function(r){return r.update(t,e)},D(this,r,t)},cursor:function(t){return t&&!Array.isArray(t)&&(t=[t]),t&&0!==t.length?new ve(this._rootData,this._keyPath?this._keyPath.concat(t):t,this._onChange):this}},{});var ge=5,pe=1<<ge,me=pe-1,de={},ye=function(t){var e=we.empty();return t?t.constructor===we?t:e.merge(t):e
},we=ye;ie.createClass(ye,{toString:function(){return this.__toString("Map {","}")},get:function(t,e){return this._root?this._root.get(0,L(t),t,e):e},set:function(t,e){return S(this,t,e)},"delete":function(t){return S(this,t,de)},update:function(t,e){return this.set(t,e(this.get(t)))},clear:function(){return this.__ownerID?(this.length=0,this._root=null,this):we.empty()},merge:function(){return j(this,null,arguments)},mergeWith:function(t){for(var e=[],r=1;arguments.length>r;r++)e[r-1]=arguments[r];return j(this,t,e)},mergeDeep:function(){return j(this,U(null),arguments)},mergeDeepWith:function(t){for(var e=[],r=1;arguments.length>r;r++)e[r-1]=arguments[r];return j(this,U(t),e)},updateIn:function(t,e){return t&&0!==t.length?R(this,t,e,0):e(this)},cursor:function(t,e){return e||"function"!=typeof t||(e=t,t=null),t&&!Array.isArray(t)&&(t=[t]),new _e(this,t,e)},withMutations:function(t){var e=this.asMutable();return t(e),e.__ensureOwner(this.__ownerID)},asMutable:function(){return this.__ownerID?this:this.__ensureOwner(new O)},asImmutable:function(){return this.__ensureOwner()},__iterate:function(t,e){var r=this;if(!r._root)return 0;var n=0;return this._root.iterate(function(e){return t(e[1],e[0],r)===!1?!1:void n++},e),n},__deepEqual:function(t){var e=this;return t.every(function(t,r){return w(e.get(r,de),t)})},__ensureOwner:function(t){return t===this.__ownerID?this:t?k(this.length,this._root,t):(this.__ownerID=t,this)}},{empty:function(){return Ce||(Ce=k(0))}},ue);var Ie=ye.prototype;ye.from=ye;var De=function(t,e,r){this.ownerID=t,this.bitmap=e,this.nodes=r},Oe=De;ie.createClass(De,{get:function(t,e,r,n){var i=1<<(e>>>t&me),u=this.bitmap;return 0===(u&i)?n:this.nodes[P(u&i-1)].get(t+ge,e,r,n)},update:function(t,e,r,n,i,u){var s=r>>>e&me,a=1<<s,h=this.bitmap,o=0!==(h&a);if(!o&&i===de)return this;var c=P(h&a-1),f=this.nodes,l=o?f[c]:null,_=x(l,t,e+ge,r,n,i,u);if(_===l)return this;if(!o&&_&&f.length>=Pe)return q(t,f,h,c,_);if(o&&!_&&2===f.length&&E(f[1^c]))return f[1^c];if(o&&_&&1===f.length&&E(_))return _;var v=t&&t===this.ownerID,g=o?_?h:h^a:h|a,p=o?_?W(f,c,_,v):B(f,c,v):J(f,c,_,v);
return v?(this.bitmap=g,this.nodes=p,this):new Oe(t,g,p)},iterate:function(t,e){for(var r=this.nodes,n=0,i=r.length-1;i>=n;n++)if(r[e?i-n:n].iterate(t,e)===!1)return!1}},{});var be=function(t,e,r){this.ownerID=t,this.count=e,this.nodes=r},Me=be;ie.createClass(be,{get:function(t,e,r,n){var i=e>>>t&me,u=this.nodes[i];return u?u.get(t+ge,e,r,n):n},update:function(t,e,r,n,i,u){var s=r>>>e&me,a=i===de,h=this.nodes,o=h[s];if(a&&!o)return this;var c=x(o,t,e+ge,r,n,i,u);if(c===o)return this;var f=this.count;if(o){if(!c&&(f--,We>f))return A(t,h,f,s)}else f++;var l=t&&t===this.ownerID,_=W(h,s,c,l);return l?(this.count=f,this.nodes=_,this):new Me(t,f,_)},iterate:function(t,e){for(var r=this.nodes,n=0,i=r.length-1;i>=n;n++){var u=r[e?i-n:n];if(u&&u.iterate(t,e)===!1)return!1}}},{});var ke=function(t,e,r){this.ownerID=t,this.hash=e,this.entries=r},Se=ke;ie.createClass(ke,{get:function(t,e,r,n){for(var i=this.entries,u=0,s=i.length;s>u;u++)if(w(r,i[u][0]))return i[u][1];return n},update:function(t,e,r,n,i,u){var s=i===de;if(r!==this.hash)return s?this:(u&&(u.value=!0),C(this,t,e,r,[n,i]));for(var a=this.entries,h=0,o=a.length;o>h&&!w(n,a[h][0]);h++);var c=o>h;if(s&&!c)return this;if((s||!c)&&u&&(u.value=!0),s&&2===o)return new xe(t,this.hash,a[1^h]);var f=t&&t===this.ownerID,l=f?a:b(a);return c?s?h===o-1?l.pop():l[h]=l.pop():l[h]=[n,i]:l.push([n,i]),f?(this.entries=l,this):new Se(t,this.hash,l)},iterate:function(t,e){for(var r=this.entries,n=0,i=r.length-1;i>=n;n++)if(t(r[e?i-n:n])===!1)return!1}},{});var xe=function(t,e,r){this.ownerID=t,this.hash=e,this.entry=r},Ee=xe;ie.createClass(xe,{get:function(t,e,r,n){return w(r,this.entry[0])?this.entry[1]:n},update:function(t,e,r,n,i,u){var s=w(n,this.entry[0]);return i===de?(s&&u&&(u.value=!0),s?null:this):s?i===this.entry[1]?this:t&&t===this.ownerID?(this.entry[1]=i,this):new Ee(t,r,[n,i]):(u&&(u.value=!0),C(this,t,e,r,[n,i]))},iterate:function(t){return t(this.entry)}},{});var Ce,Ae={value:!1},qe=2147483647,je=16,Ue=255,ze=0,Re={},Pe=pe/2,We=pe/4,Je=function(){for(var t=[],e=0;arguments.length>e;e++)t[e]=arguments[e];
return Be.from(t)},Be=Je;ie.createClass(Je,{toString:function(){return this.__toString("Vector [","]")},get:function(t,e){if(t=T(t,this._origin),t>=this._size)return e;var r=G(this,t),n=t&me;return r&&(void 0===e||r.array.hasOwnProperty(n))?r.array[n]:e},first:function(){return this.get(0)},last:function(){return this.get(this.length?this.length-1:0)},set:function(t,e){var r=X(this._size);if(t>=this.length)return this.withMutations(function(r){return H(r,0,t+1).set(t,e)});if(this.get(t,de)===e)return this;if(t=T(t,this._origin),t>=r){var n=this._tail.ensureOwner(this.__ownerID);n.array[t&me]=e;var i=t>=this._size?t+1:this._size;return this.__ownerID?(this.length=i-this._origin,this._size=i,this._tail=n,this):F(this._origin,i,this._level,this._root,n)}for(var u=this._root.ensureOwner(this.__ownerID),s=u,a=this._level;a>0;a-=ge){var h=t>>>a&me;s=s.array[h]=s.array[h]?s.array[h].ensureOwner(this.__ownerID):new Ve([],this.__ownerID)}return s.array[t&me]=e,this.__ownerID?(this._root=u,this):F(this._origin,this._size,this._level,u,this._tail)},"delete":function(t){if(!this.has(t))return this;var e=X(this._size);if(t=T(t,this._origin),t>=e){var r=this._tail.ensureOwner(this.__ownerID);return delete r.array[t&me],this.__ownerID?(this._tail=r,this):F(this._origin,this._size,this._level,this._root,r)}for(var n=this._root.ensureOwner(this.__ownerID),i=n,u=this._level;u>0;u-=ge){var s=t>>>u&me;i=i.array[s]=i.array[s].ensureOwner(this.__ownerID)}return delete i.array[t&me],this.__ownerID?(this._root=n,this):F(this._origin,this._size,this._level,n,this._tail)},clear:function(){return this.__ownerID?(this.length=this._origin=this._size=0,this._level=ge,this._root=this._tail=Ge,this):Be.empty()},push:function(){var t=arguments,e=this.length;return this.withMutations(function(r){H(r,0,e+t.length);for(var n=0;t.length>n;n++)r.set(e+n,t[n])})},pop:function(){return H(this,0,-1)},unshift:function(){var t=arguments;return this.withMutations(function(e){H(e,-t.length);for(var r=0;t.length>r;r++)e.set(r,t[r])})},shift:function(){return H(this,1)
},merge:function(){return Q(this,null,arguments)},mergeWith:function(t){for(var e=[],r=1;arguments.length>r;r++)e[r-1]=arguments[r];return Q(this,t,e)},mergeDeep:function(){return Q(this,U(null),arguments)},mergeDeepWith:function(t){for(var e=[],r=1;arguments.length>r;r++)e[r-1]=arguments[r];return Q(this,U(t),e)},setLength:function(t){return H(this,0,t)},slice:function(t,e,r){var n=ie.superCall(this,Be.prototype,"slice",[t,e,r]);if(!r&&n!==this){var i=this,u=i.length;n.toVector=function(){return H(i,0>t?Math.max(0,u+t):u?Math.min(u,t):t,null==e?u:0>e?Math.max(0,u+e):u?Math.min(u,e):e)}}return n},iterator:function(){return new Ne(this,this._origin,this._size,this._level,this._root,this._tail)},__iterate:function(t,e,r){var n=this,i=0,u=n.length-1;r^=e;var s,a=function(e,s){return t(e,r?u-s:s,n)===!1?!1:(i=s,!0)},h=X(this._size);return s=e?this._tail.iterate(0,h-this._origin,this._size-this._origin,a,e)&&this._root.iterate(this._level,-this._origin,h-this._origin,a,e):this._root.iterate(this._level,-this._origin,h-this._origin,a,e)&&this._tail.iterate(0,h-this._origin,this._size-this._origin,a,e),(s?u:e?u-i:i)+1},__deepEquals:function(t){var e=this.iterator();return t.every(function(t,r){var n=e.next().value;return n&&r===n[0]&&w(t,n[1])})},__ensureOwner:function(t){return t===this.__ownerID?this:t?F(this._origin,this._size,this._level,this._root,this._tail,t):(this.__ownerID=t,this)}},{empty:function(){return Fe||(Fe=F(0,0,ge,Ge,Ge))},from:function(t){if(!t||0===t.length)return Be.empty();if(t.constructor===Be)return t;var e=Array.isArray(t);return t.length>0&&pe>t.length?F(0,t.length,ge,Ge,new Ve(e?b(t):ue(t).toArray())):(e||(t=ue(t),t instanceof he||(t=t.values())),Be.empty().merge(t))}},he);var Le=Je.prototype;Le["@@iterator"]=Le.iterator,Le.update=Ie.update,Le.updateIn=Ie.updateIn,Le.cursor=Ie.cursor,Le.withMutations=Ie.withMutations,Le.asMutable=Ie.asMutable,Le.asImmutable=Ie.asImmutable;var Ve=function(t,e){this.array=t,this.ownerID=e},Ke=Ve;ie.createClass(Ve,{ensureOwner:function(t){return t&&t===this.ownerID?this:new Ke(this.array.slice(),t)
},removeBefore:function(t,e,r){if(r===e?1<<e:0||0===this.array.length)return this;var n=r>>>e&me;if(n>=this.array.length)return new Ke([],t);var i,u=0===n;if(e>0){var s=this.array[n];if(i=s&&s.removeBefore(t,e-ge,r),i===s&&u)return this}if(u&&!i)return this;var a=this.ensureOwner();if(!u)for(var h=0;n>h;h++)delete a.array[h];return i&&(a.array[n]=i),a},removeAfter:function(t,e,r){if(r===e?1<<e:0||0===this.array.length)return this;var n=r-1>>>e&me;if(n>=this.array.length)return this;var i,u=n===this.array.length-1;if(e>0){var s=this.array[n];if(i=s&&s.removeAfter(t,e-ge,r),i===s&&u)return this}if(u&&!i)return this;var a=this.ensureOwner();return u||(a.array.length=n+1),i&&(a.array[n]=i),a},iterate:function(t,e,r,n,i){var u,s=this.array,a=s.length-1;if(0===t)for(u=0;a>=u;u++){var h=i?a-u:u;if(s.hasOwnProperty(h)){var o=h+e;if(o>=0&&r>o&&n(s[h],o)===!1)return!1}}else{var c=1<<t,f=t-ge;for(u=0;a>=u;u++){var l=i?a-u:u,_=e+l*c;if(r>_&&_+c>0){var v=s[l];if(v&&!v.iterate(f,_,r,n,i))return!1}}}return!0}},{});var Ne=function(t,e,r,n,i,u){var s=X(r);this._stack=N(i.array,n,-e,s-e,N(u.array,0,s-e,r-e))};ie.createClass(Ne,{next:function(){var t=this._stack;t:for(;t;){if(0===t.level)for(t.rawIndex||(t.rawIndex=0);t.array.length>t.rawIndex;){var e=t.rawIndex+t.offset;if(e>=0&&t.max>e&&t.array.hasOwnProperty(t.rawIndex)){var r=t.array[t.rawIndex];return t.rawIndex++,{value:[e,r],done:!1}}t.rawIndex++}else{var n=1<<t.level;for(t.levelIndex||(t.levelIndex=0);t.array.length>t.levelIndex;){var i=t.offset+t.levelIndex*n;if(i+n>0&&t.max>i){var u=t.array[t.levelIndex];if(u){t.levelIndex++,t=this._stack=N(u.array,t.level-ge,i,t.max,t);continue t}}t.levelIndex++}}t=this._stack=this._stack.__prev}return{value:void 0,done:!0}}},{});var Fe,Ge=new Ve([]),He=function(){for(var t=[],e=0;arguments.length>e;e++)t[e]=arguments[e];return Qe.from(t)},Qe=He;ie.createClass(He,{toString:function(){return this.__toString("Set {","}")},has:function(t){return this._map?this._map.has(t):!1},get:function(t,e){return this.has(t)?t:e},add:function(t){var e=this._map;
return e||(e=ye.empty().__ensureOwner(this.__ownerID)),e=e.set(t,null),this.__ownerID?(this.length=e.length,this._map=e,this):e===this._map?this:Y(e)},"delete":function(t){if(null==this._map)return this;var e=this._map.delete(t);return 0===e.length?this.clear():this.__ownerID?(this.length=e.length,this._map=e,this):e===this._map?this:Y(e)},clear:function(){return this.__ownerID?(this.length=0,this._map=null,this):Qe.empty()},union:function(){var t=arguments;return 0===t.length?this:this.withMutations(function(e){for(var r=0;t.length>r;r++){var n=t[r];n=n.forEach?n:ue(n),n.forEach(function(t){return e.add(t)})}})},intersect:function(){for(var t=[],e=0;arguments.length>e;e++)t[e]=arguments[e];if(0===t.length)return this;t=t.map(function(t){return ue(t)});var r=this;return this.withMutations(function(e){r.forEach(function(r){t.every(function(t){return t.contains(r)})||e.delete(r)})})},subtract:function(){for(var t=[],e=0;arguments.length>e;e++)t[e]=arguments[e];if(0===t.length)return this;t=t.map(function(t){return ue(t)});var r=this;return this.withMutations(function(e){r.forEach(function(r){t.some(function(t){return t.contains(r)})&&e.delete(r)})})},isSubset:function(t){return t=ue(t),this.every(function(e){return t.contains(e)})},isSuperset:function(t){var e=this;return t=ue(t),t.every(function(t){return e.contains(t)})},__iterate:function(t,e){var r=this;return this._map?this._map.__iterate(function(e,n){return t(n,n,r)},e):0},__deepEquals:function(t){return!(this._map||t._map)||this._map.equals(t._map)},__ensureOwner:function(t){if(t===this.__ownerID)return this;var e=this._map&&this._map.__ensureOwner(t);return t?Y(e,t):(this.__ownerID=t,this._map=e,this)}},{empty:function(){return Xe||(Xe=Y())},from:function(t){var e=Qe.empty();return t?t.constructor===Qe?t:e.union(t):e},fromKeys:function(t){return Qe.from(ue(t).flip())}},ue);var Te=He.prototype;Te.contains=Te.has,Te.withMutations=ye.prototype.withMutations,Te.asMutable=ye.prototype.asMutable,Te.asImmutable=ye.prototype.asImmutable,Te.__toJS=he.prototype.__toJS,Te.__toStringMapper=he.prototype.__toStringMapper;
var Xe,Ye=function(t){var e=Ze.empty();return t?t.constructor===Ze?t:e.merge(t):e},Ze=Ye;ie.createClass(Ye,{toString:function(){return this.__toString("OrderedMap {","}")},get:function(t,e){if(null!=t&&this._map){var r=this._map.get(t);if(null!=r)return this._vector.get(r)[1]}return e},clear:function(){return this.__ownerID?(this.length=0,this._map=this._vector=null,this):Ze.empty()},set:function(t,e){if(null==t)return this;var r=this._map,n=this._vector;if(r){var i=r.get(t);null==i?(r=r.set(t,n.length),n=n.push([t,e])):n.get(i)[1]!==e&&(n=n.set(i,[t,e]))}else n=Je.empty().__ensureOwner(this.__ownerID).set(0,[t,e]),r=ye.empty().__ensureOwner(this.__ownerID).set(t,0);return this.__ownerID?(this.length=r.length,this._map=r,this._vector=n,this):n===this._vector?this:Z(r,n)},"delete":function(t){if(null==t||null==this._map)return this;var e=this._map.get(t);if(null==e)return this;var r=this._map.delete(t),n=this._vector.delete(e);return 0===r.length?this.clear():this.__ownerID?(this.length=r.length,this._map=r,this._vector=n,this):r===this._map?this:Z(r,n)},__iterate:function(t,e){return this._vector?this._vector.fromEntries().__iterate(t,e):0},__deepEqual:function(t){var e=this._vector.iterator();return t.every(function(t,r){var n=e.next().value;return n&&(n=n[1]),n&&w(r,n[0])&&w(t,n[1])})},__ensureOwner:function(t){if(t===this.__ownerID)return this;var e=this._map&&this._map.__ensureOwner(t),r=this._vector&&this._vector.__ensureOwner(t);return t?Z(e,r,t):(this.__ownerID=t,this._map=e,this._vector=r,this)}},{empty:function(){return $e||($e=Z())}},ye),Ye.from=Ye;var $e,tr=function(t,e){var r=function(t){this._map=ye(t)};t=ue(t);var n=r.prototype=Object.create(rr);n.constructor=r,n._name=e,n._defaultValues=t;var i=Object.keys(t);return r.prototype.length=i.length,Object.defineProperty&&t.forEach(function(t,e){Object.defineProperty(r.prototype,e,{get:function(){return this.get(e)},set:function(t){I(this.__ownerID,"Cannot set on an immutable record."),this.set(e,t)}})}),r},er=tr;ie.createClass(tr,{toString:function(){return this.__toString((this._name||"Record")+" {","}")
},has:function(t){return this._defaultValues.has(t)},get:function(t,e){return void 0===e||this.has(t)?this._map.get(t,this._defaultValues.get(t)):e},clear:function(){if(this.__ownerID)return this._map.clear(),this;Object.getPrototypeOf(this).constructor;return er._empty||(er._empty=$(this,ye.empty()))},set:function(t,e){if(null==t||!this.has(t))return this;var r=this._map.set(t,e);return this.__ownerID||r===this._map?this:$(this,r)},"delete":function(t){if(null==t||!this.has(t))return this;var e=this._map.delete(t);return this.__ownerID||e===this._map?this:$(this,e)},__iterate:function(t,e){var r=this;return this._defaultValues.map(function(t,e){return r.get(e)}).__iterate(t,e)},__ensureOwner:function(t){if(t===this.__ownerID)return this;var e=this._map&&this._map.__ensureOwner(t);return t?$(this,e,t):(this.__ownerID=t,this._map=e,this)}},{},ue);var rr=tr.prototype;rr.__deepEqual=Ie.__deepEqual,rr.merge=Ie.merge,rr.mergeWith=Ie.mergeWith,rr.mergeDeep=Ie.mergeDeep,rr.mergeDeepWith=Ie.mergeDeepWith,rr.update=Ie.update,rr.updateIn=Ie.updateIn,rr.cursor=Ie.cursor,rr.withMutations=Ie.withMutations,rr.asMutable=Ie.asMutable,rr.asImmutable=Ie.asImmutable;var nr=function(t,e,r){return this instanceof ir?(I(0!==r,"Cannot step a Range by 0"),t=t||0,null==e&&(e=1/0),t===e&&sr?sr:(r=null==r?1:Math.abs(r),t>e&&(r=-r),this._start=t,this._end=e,this._step=r,void(this.length=Math.max(0,Math.ceil((e-t)/r-1)+1)))):new ir(t,e,r)},ir=nr;ie.createClass(nr,{toString:function(){return 0===this.length?"Range []":"Range [ "+this._start+"..."+this._end+(this._step>1?" by "+this._step:"")+" ]"},has:function(t){return I(t>=0,"Index out of bounds"),this.length>t},get:function(t,e){return I(t>=0,"Index out of bounds"),1/0===this.length||this.length>t?this._start+t*this._step:e},contains:function(t){var e=(t-this._start)/this._step;return e>=0&&this.length>e&&e===Math.floor(e)},slice:function(t,e,r){return s(t,e,this.length)?this:r?ie.superCall(this,ir.prototype,"slice",[t,e,r]):(t=a(t,this.length),e=h(e,this.length),t>=e?sr:new ir(this.get(t,this._end),this.get(e,this._end),this._step))
},indexOf:function(t){var e=t-this._start;if(e%this._step===0){var r=e/this._step;if(r>=0&&this.length>r)return r}return-1},lastIndexOf:function(t){return this.indexOf(t)},take:function(t){return this.slice(0,t)},skip:function(t,e){return e?ie.superCall(this,ir.prototype,"skip",[t]):this.slice(t)},__iterate:function(t,e,r){for(var n=e^r,i=this.length-1,u=this._step,s=e?this._start+i*u:this._start,a=0;i>=a&&t(s,n?i-a:a,this)!==!1;a++)s+=e?-u:u;return n?this.length:a},__deepEquals:function(t){return this._start===t._start&&this._end===t._end&&this._step===t._step}},{},he);var ur=nr.prototype;ur.__toJS=ur.toArray,ur.first=Le.first,ur.last=Le.last;var sr=nr(0,0),ar=function(t,e){return 0===e&&cr?cr:this instanceof hr?(this._value=t,void(this.length=null==e?1/0:Math.max(0,e))):new hr(t,e)},hr=ar;ie.createClass(ar,{toString:function(){return 0===this.length?"Repeat []":"Repeat [ "+this._value+" "+this.length+" times ]"},get:function(t,e){return I(t>=0,"Index out of bounds"),1/0===this.length||this.length>t?this._value:e},first:function(){return this._value},contains:function(t){return w(this._value,t)},slice:function(t,e,r){if(r)return ie.superCall(this,hr.prototype,"slice",[t,e,r]);var n=this.length;return t=0>t?Math.max(0,n+t):Math.min(n,t),e=null==e?n:e>0?Math.min(n,e):Math.max(0,n+e),e>t?new hr(this._value,e-t):cr},reverse:function(t){return t?ie.superCall(this,hr.prototype,"reverse",[t]):this},indexOf:function(t){return w(this._value,t)?0:-1},lastIndexOf:function(t){return w(this._value,t)?this.length:-1},__iterate:function(t,e,r){var n=e^r;I(!n||1/0>this.length,"Cannot access end of infinite range.");for(var i=this.length-1,u=0;i>=u&&t(this._value,n?i-u:u,this)!==!1;u++);return n?this.length:u},__deepEquals:function(t){return w(this._value,t._value)}},{},he);var or=ar.prototype;or.last=or.first,or.has=ur.has,or.take=ur.take,or.skip=ur.skip,or.__toJS=ur.__toJS;var cr=new ar(void 0,0),fr={Sequence:ue,Map:ye,Vector:Je,Set:He,OrderedMap:Ye,Record:tr,Range:nr,Repeat:ar,is:w,fromJS:te};return fr}"object"==typeof exports?module.exports=t():"function"==typeof define&&define.amd?define(t):Immutable=t();

/*!
 * jQuery JavaScript Library v2.0.3 -sizzle,-wrap,-css,-event-alias,-effects,-offset,-dimensions,-deprecated
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-07T17:23Z
 */
(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//"use strict";
var
  // A central reference to the root jQuery(document)
  rootjQuery,

  // The deferred used on DOM ready
  readyList,

  // Support: IE9
  // For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
  core_strundefined = typeof undefined,

  // Use the correct document accordingly with window argument (sandbox)
  location = window.location,
  document = window.document,
  docElem = document.documentElement,

  // Map over jQuery in case of overwrite
  _jQuery = window.jQuery,

  // Map over the $ in case of overwrite
  _$ = window.$,

  // [[Class]] -> type pairs
  class2type = {},

  // List of deleted data cache ids, so we can reuse them
  core_deletedIds = [],

  core_version = "2.0.3 -sizzle,-wrap,-css,-event-alias,-effects,-offset,-dimensions,-deprecated",

  // Save a reference to some core methods
  core_concat = core_deletedIds.concat,
  core_push = core_deletedIds.push,
  core_slice = core_deletedIds.slice,
  core_indexOf = core_deletedIds.indexOf,
  core_toString = class2type.toString,
  core_hasOwn = class2type.hasOwnProperty,
  core_trim = core_version.trim,

  // Define a local copy of jQuery
  jQuery = function( selector, context ) {
    // The jQuery object is actually just the init constructor 'enhanced'
    return new jQuery.fn.init( selector, context, rootjQuery );
  },

  // Used for matching numbers
  core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

  // Used for splitting on whitespace
  core_rnotwhite = /\S+/g,

  // A simple way to check for HTML strings
  // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
  // Strict HTML recognition (#11290: must start with <)
  rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

  // Match a standalone tag
  rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

  // Matches dashed string for camelizing
  rmsPrefix = /^-ms-/,
  rdashAlpha = /-([\da-z])/gi,

  // Used by jQuery.camelCase as callback to replace()
  fcamelCase = function( all, letter ) {
    return letter.toUpperCase();
  },

  // The ready event handler and self cleanup method
  completed = function() {
    document.removeEventListener( "DOMContentLoaded", completed, false );
    window.removeEventListener( "load", completed, false );
    jQuery.ready();
  };

jQuery.fn = jQuery.prototype = {
  // The current version of jQuery being used
  jquery: core_version,

  constructor: jQuery,
  init: function( selector, context, rootjQuery ) {
    var match, elem;

    // HANDLE: $(""), $(null), $(undefined), $(false)
    if ( !selector ) {
      return this;
    }

    // Handle HTML strings
    if ( typeof selector === "string" ) {
      if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
        // Assume that strings that start and end with <> are HTML and skip the regex check
        match = [ null, selector, null ];

      } else {
        match = rquickExpr.exec( selector );
      }

      // Match html or make sure no context is specified for #id
      if ( match && (match[1] || !context) ) {

        // HANDLE: $(html) -> $(array)
        if ( match[1] ) {
          context = context instanceof jQuery ? context[0] : context;

          // scripts is true for back-compat
          jQuery.merge( this, jQuery.parseHTML(
            match[1],
            context && context.nodeType ? context.ownerDocument || context : document,
            true
          ) );

          // HANDLE: $(html, props)
          if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
            for ( match in context ) {
              // Properties of context are called as methods if possible
              if ( jQuery.isFunction( this[ match ] ) ) {
                this[ match ]( context[ match ] );

              // ...and otherwise set as attributes
              } else {
                this.attr( match, context[ match ] );
              }
            }
          }

          return this;

        // HANDLE: $(#id)
        } else {
          elem = document.getElementById( match[2] );

          // Check parentNode to catch when Blackberry 4.6 returns
          // nodes that are no longer in the document #6963
          if ( elem && elem.parentNode ) {
            // Inject the element directly into the jQuery object
            this.length = 1;
            this[0] = elem;
          }

          this.context = document;
          this.selector = selector;
          return this;
        }

      // HANDLE: $(expr, $(...))
      } else if ( !context || context.jquery ) {
        return ( context || rootjQuery ).find( selector );

      // HANDLE: $(expr, context)
      // (which is just equivalent to: $(context).find(expr)
      } else {
        return this.constructor( context ).find( selector );
      }

    // HANDLE: $(DOMElement)
    } else if ( selector.nodeType ) {
      this.context = this[0] = selector;
      this.length = 1;
      return this;

    // HANDLE: $(function)
    // Shortcut for document ready
    } else if ( jQuery.isFunction( selector ) ) {
      return rootjQuery.ready( selector );
    }

    if ( selector.selector !== undefined ) {
      this.selector = selector.selector;
      this.context = selector.context;
    }

    return jQuery.makeArray( selector, this );
  },

  // Start with an empty selector
  selector: "",

  // The default length of a jQuery object is 0
  length: 0,

  toArray: function() {
    return core_slice.call( this );
  },

  // Get the Nth element in the matched element set OR
  // Get the whole matched element set as a clean array
  get: function( num ) {
    return num == null ?

      // Return a 'clean' array
      this.toArray() :

      // Return just the object
      ( num < 0 ? this[ this.length + num ] : this[ num ] );
  },

  // Take an array of elements and push it onto the stack
  // (returning the new matched element set)
  pushStack: function( elems ) {

    // Build a new jQuery matched element set
    var ret = jQuery.merge( this.constructor(), elems );

    // Add the old object onto the stack (as a reference)
    ret.prevObject = this;
    ret.context = this.context;

    // Return the newly-formed element set
    return ret;
  },

  // Execute a callback for every element in the matched set.
  // (You can seed the arguments with an array of args, but this is
  // only used internally.)
  each: function( callback, args ) {
    return jQuery.each( this, callback, args );
  },

  ready: function( fn ) {
    // Add the callback
    jQuery.ready.promise().done( fn );

    return this;
  },

  slice: function() {
    return this.pushStack( core_slice.apply( this, arguments ) );
  },

  first: function() {
    return this.eq( 0 );
  },

  last: function() {
    return this.eq( -1 );
  },

  eq: function( i ) {
    var len = this.length,
      j = +i + ( i < 0 ? len : 0 );
    return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
  },

  map: function( callback ) {
    return this.pushStack( jQuery.map(this, function( elem, i ) {
      return callback.call( elem, i, elem );
    }));
  },

  end: function() {
    return this.prevObject || this.constructor(null);
  },

  // For internal use only.
  // Behaves like an Array's method, not like a jQuery method.
  push: core_push,
  sort: [].sort,
  splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
  var options, name, src, copy, copyIsArray, clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
    target = {};
  }

  // extend jQuery itself if only one argument is passed
  if ( length === i ) {
    target = this;
    --i;
  }

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ( (options = arguments[ i ]) != null ) {
      // Extend the base object
      for ( name in options ) {
        src = target[ name ];
        copy = options[ name ];

        // Prevent never-ending loop
        if ( target === copy ) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
          if ( copyIsArray ) {
            copyIsArray = false;
            clone = src && jQuery.isArray(src) ? src : [];

          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          target[ name ] = jQuery.extend( deep, clone, copy );

        // Don't bring in undefined values
        } else if ( copy !== undefined ) {
          target[ name ] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
};

jQuery.extend({
  // Unique for each copy of jQuery on the page
  expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

  noConflict: function( deep ) {
    if ( window.$ === jQuery ) {
      window.$ = _$;
    }

    if ( deep && window.jQuery === jQuery ) {
      window.jQuery = _jQuery;
    }

    return jQuery;
  },

  // Is the DOM ready to be used? Set to true once it occurs.
  isReady: false,

  // A counter to track how many items to wait for before
  // the ready event fires. See #6781
  readyWait: 1,

  // Hold (or release) the ready event
  holdReady: function( hold ) {
    if ( hold ) {
      jQuery.readyWait++;
    } else {
      jQuery.ready( true );
    }
  },

  // Handle when the DOM is ready
  ready: function( wait ) {

    // Abort if there are pending holds or we're already ready
    if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
      return;
    }

    // Remember that the DOM is ready
    jQuery.isReady = true;

    // If a normal DOM Ready event fired, decrement, and wait if need be
    if ( wait !== true && --jQuery.readyWait > 0 ) {
      return;
    }

    // If there are functions bound, to execute
    readyList.resolveWith( document, [ jQuery ] );

    // Trigger any bound ready events
    if ( jQuery.fn.trigger ) {
      jQuery( document ).trigger("ready").off("ready");
    }
  },

  // See test/unit/core.js for details concerning isFunction.
  // Since version 1.3, DOM methods and functions like alert
  // aren't supported. They return false on IE (#2968).
  isFunction: function( obj ) {
    return jQuery.type(obj) === "function";
  },

  isArray: Array.isArray,

  isWindow: function( obj ) {
    return obj != null && obj === obj.window;
  },

  isNumeric: function( obj ) {
    return !isNaN( parseFloat(obj) ) && isFinite( obj );
  },

  type: function( obj ) {
    if ( obj == null ) {
      return String( obj );
    }
    // Support: Safari <= 5.1 (functionish RegExp)
    return typeof obj === "object" || typeof obj === "function" ?
      class2type[ core_toString.call(obj) ] || "object" :
      typeof obj;
  },

  isPlainObject: function( obj ) {
    // Not plain objects:
    // - Any object or value whose internal [[Class]] property is not "[object Object]"
    // - DOM nodes
    // - window
    if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
      return false;
    }

    // Support: Firefox <20
    // The try/catch suppresses exceptions thrown when attempting to access
    // the "constructor" property of certain host objects, ie. |window.location|
    // https://bugzilla.mozilla.org/show_bug.cgi?id=814622
    try {
      if ( obj.constructor &&
          !core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
        return false;
      }
    } catch ( e ) {
      return false;
    }

    // If the function hasn't returned already, we're confident that
    // |obj| is a plain object, created by {} or constructed with new Object
    return true;
  },

  isEmptyObject: function( obj ) {
    var name;
    for ( name in obj ) {
      return false;
    }
    return true;
  },

  error: function( msg ) {
    throw new Error( msg );
  },

  // data: string of html
  // context (optional): If specified, the fragment will be created in this context, defaults to document
  // keepScripts (optional): If true, will include scripts passed in the html string
  parseHTML: function( data, context, keepScripts ) {
    if ( !data || typeof data !== "string" ) {
      return null;
    }
    if ( typeof context === "boolean" ) {
      keepScripts = context;
      context = false;
    }
    context = context || document;

    var parsed = rsingleTag.exec( data ),
      scripts = !keepScripts && [];

    // Single tag
    if ( parsed ) {
      return [ context.createElement( parsed[1] ) ];
    }

    parsed = jQuery.buildFragment( [ data ], context, scripts );

    if ( scripts ) {
      jQuery( scripts ).remove();
    }

    return jQuery.merge( [], parsed.childNodes );
  },

  parseJSON: JSON.parse,

  // Cross-browser xml parsing
  parseXML: function( data ) {
    var xml, tmp;
    if ( !data || typeof data !== "string" ) {
      return null;
    }

    // Support: IE9
    try {
      tmp = new DOMParser();
      xml = tmp.parseFromString( data , "text/xml" );
    } catch ( e ) {
      xml = undefined;
    }

    if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
      jQuery.error( "Invalid XML: " + data );
    }
    return xml;
  },

  noop: function() {},

  // Evaluates a script in a global context
  globalEval: function( code ) {
    var script,
        indirect = eval;

    code = jQuery.trim( code );

    if ( code ) {
      // If the code includes a valid, prologue position
      // strict mode pragma, execute code by injecting a
      // script tag into the document.
      if ( code.indexOf("use strict") === 1 ) {
        script = document.createElement("script");
        script.text = code;
        document.head.appendChild( script ).parentNode.removeChild( script );
      } else {
      // Otherwise, avoid the DOM node creation, insertion
      // and removal by using an indirect global eval
        indirect( code );
      }
    }
  },

  // Convert dashed to camelCase; used by the css and data modules
  // Microsoft forgot to hump their vendor prefix (#9572)
  camelCase: function( string ) {
    return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
  },

  nodeName: function( elem, name ) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  },

  // args is for internal usage only
  each: function( obj, callback, args ) {
    var value,
      i = 0,
      length = obj.length,
      isArray = isArraylike( obj );

    if ( args ) {
      if ( isArray ) {
        for ( ; i < length; i++ ) {
          value = callback.apply( obj[ i ], args );

          if ( value === false ) {
            break;
          }
        }
      } else {
        for ( i in obj ) {
          value = callback.apply( obj[ i ], args );

          if ( value === false ) {
            break;
          }
        }
      }

    // A special, fast, case for the most common use of each
    } else {
      if ( isArray ) {
        for ( ; i < length; i++ ) {
          value = callback.call( obj[ i ], i, obj[ i ] );

          if ( value === false ) {
            break;
          }
        }
      } else {
        for ( i in obj ) {
          value = callback.call( obj[ i ], i, obj[ i ] );

          if ( value === false ) {
            break;
          }
        }
      }
    }

    return obj;
  },

  trim: function( text ) {
    return text == null ? "" : core_trim.call( text );
  },

  // results is for internal usage only
  makeArray: function( arr, results ) {
    var ret = results || [];

    if ( arr != null ) {
      if ( isArraylike( Object(arr) ) ) {
        jQuery.merge( ret,
          typeof arr === "string" ?
          [ arr ] : arr
        );
      } else {
        core_push.call( ret, arr );
      }
    }

    return ret;
  },

  inArray: function( elem, arr, i ) {
    return arr == null ? -1 : core_indexOf.call( arr, elem, i );
  },

  merge: function( first, second ) {
    var l = second.length,
      i = first.length,
      j = 0;

    if ( typeof l === "number" ) {
      for ( ; j < l; j++ ) {
        first[ i++ ] = second[ j ];
      }
    } else {
      while ( second[j] !== undefined ) {
        first[ i++ ] = second[ j++ ];
      }
    }

    first.length = i;

    return first;
  },

  grep: function( elems, callback, inv ) {
    var retVal,
      ret = [],
      i = 0,
      length = elems.length;
    inv = !!inv;

    // Go through the array, only saving the items
    // that pass the validator function
    for ( ; i < length; i++ ) {
      retVal = !!callback( elems[ i ], i );
      if ( inv !== retVal ) {
        ret.push( elems[ i ] );
      }
    }

    return ret;
  },

  // arg is for internal usage only
  map: function( elems, callback, arg ) {
    var value,
      i = 0,
      length = elems.length,
      isArray = isArraylike( elems ),
      ret = [];

    // Go through the array, translating each of the items to their
    if ( isArray ) {
      for ( ; i < length; i++ ) {
        value = callback( elems[ i ], i, arg );

        if ( value != null ) {
          ret[ ret.length ] = value;
        }
      }

    // Go through every key on the object,
    } else {
      for ( i in elems ) {
        value = callback( elems[ i ], i, arg );

        if ( value != null ) {
          ret[ ret.length ] = value;
        }
      }
    }

    // Flatten any nested arrays
    return core_concat.apply( [], ret );
  },

  // A global GUID counter for objects
  guid: 1,

  // Bind a function to a context, optionally partially applying any
  // arguments.
  proxy: function( fn, context ) {
    var tmp, args, proxy;

    if ( typeof context === "string" ) {
      tmp = fn[ context ];
      context = fn;
      fn = tmp;
    }

    // Quick check to determine if target is callable, in the spec
    // this throws a TypeError, but we will just return undefined.
    if ( !jQuery.isFunction( fn ) ) {
      return undefined;
    }

    // Simulated bind
    args = core_slice.call( arguments, 2 );
    proxy = function() {
      return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
    };

    // Set the guid of unique handler to the same of original handler, so it can be removed
    proxy.guid = fn.guid = fn.guid || jQuery.guid++;

    return proxy;
  },

  // Multifunctional method to get and set values of a collection
  // The value/s can optionally be executed if it's a function
  access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
    var i = 0,
      length = elems.length,
      bulk = key == null;

    // Sets many values
    if ( jQuery.type( key ) === "object" ) {
      chainable = true;
      for ( i in key ) {
        jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
      }

    // Sets one value
    } else if ( value !== undefined ) {
      chainable = true;

      if ( !jQuery.isFunction( value ) ) {
        raw = true;
      }

      if ( bulk ) {
        // Bulk operations run against the entire set
        if ( raw ) {
          fn.call( elems, value );
          fn = null;

        // ...except when executing function values
        } else {
          bulk = fn;
          fn = function( elem, key, value ) {
            return bulk.call( jQuery( elem ), value );
          };
        }
      }

      if ( fn ) {
        for ( ; i < length; i++ ) {
          fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
        }
      }
    }

    return chainable ?
      elems :

      // Gets
      bulk ?
        fn.call( elems ) :
        length ? fn( elems[0], key ) : emptyGet;
  },

  now: Date.now,

  // A method for quickly swapping in/out CSS properties to get correct calculations.
  // Note: this method belongs to the css module but it's needed here for the support module.
  // If support gets modularized, this method should be moved back to the css module.
  swap: function( elem, options, callback, args ) {
    var ret, name,
      old = {};

    // Remember the old values, and insert the new ones
    for ( name in options ) {
      old[ name ] = elem.style[ name ];
      elem.style[ name ] = options[ name ];
    }

    ret = callback.apply( elem, args || [] );

    // Revert the old values
    for ( name in options ) {
      elem.style[ name ] = old[ name ];
    }

    return ret;
  }
});

jQuery.ready.promise = function( obj ) {
  if ( !readyList ) {

    readyList = jQuery.Deferred();

    // Catch cases where $(document).ready() is called after the browser event has already occurred.
    // we once tried to use readyState "interactive" here, but it caused issues like the one
    // discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
    if ( document.readyState === "complete" ) {
      // Handle it asynchronously to allow scripts the opportunity to delay ready
      setTimeout( jQuery.ready );

    } else {

      // Use the handy event callback
      document.addEventListener( "DOMContentLoaded", completed, false );

      // A fallback to window.onload, that will always work
      window.addEventListener( "load", completed, false );
    }
  }
  return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
  class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
  var length = obj.length,
    type = jQuery.type( obj );

  if ( jQuery.isWindow( obj ) ) {
    return false;
  }

  if ( obj.nodeType === 1 && length ) {
    return true;
  }

  return type === "array" || type !== "function" &&
    ( length === 0 ||
    typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
/*
 * Optional (non-Sizzle) selector module for custom builds.
 *
 * Note that this DOES NOT SUPPORT many documented jQuery
 * features in exchange for its smaller size:
 *
 * Attribute not equal selector
 * Positional selectors (:first; :eq(n); :odd; etc.)
 * Type selectors (:input; :checkbox; :button; etc.)
 * State-based selectors (:animated; :visible; :hidden; etc.)
 * :has(selector)
 * :not(complex selector)
 * custom selectors via Sizzle extensions
 * Leading combinators (e.g., $collection.find("> *"))
 * Reliable functionality on XML fragments
 * Requiring all parts of a selector to match elements under context
 *   (e.g., $div.find("div > *") now matches children of $div)
 * Matching against non-elements
 * Reliable sorting of disconnected nodes
 * querySelectorAll bug fixes (e.g., unreliable :focus on WebKit)
 *
 * If any of these are unacceptable tradeoffs, either use Sizzle or
 * customize this stub for the project's specific needs.
 */

var selector_hasDuplicate,
  matches = docElem.webkitMatchesSelector ||
    docElem.mozMatchesSelector ||
    docElem.oMatchesSelector ||
    docElem.msMatchesSelector,
  selector_sortOrder = function( a, b ) {
    // Flag for duplicate removal
    if ( a === b ) {
      selector_hasDuplicate = true;
      return 0;
    }

    var compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b );

    if ( compare ) {
      // Disconnected nodes
      if ( compare & 1 ) {

        // Choose the first element that is related to our document
        if ( a === document || jQuery.contains(document, a) ) {
          return -1;
        }
        if ( b === document || jQuery.contains(document, b) ) {
          return 1;
        }

        // Maintain original order
        return 0;
      }

      return compare & 4 ? -1 : 1;
    }

    // Not directly comparable, sort on existence of method
    return a.compareDocumentPosition ? -1 : 1;
  };

jQuery.extend({
  find: function( selector, context, results, seed ) {
    var elem, nodeType,
      i = 0;

    results = results || [];
    context = context || document;

    // Same basic safeguard as Sizzle
    if ( !selector || typeof selector !== "string" ) {
      return results;
    }

    // Early return if context is not an element or document
    if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
      return [];
    }

    if ( seed ) {
      while ( (elem = seed[i++]) ) {
        if ( jQuery.find.matchesSelector(elem, selector) ) {
          results.push( elem );
        }
      }
    } else {
      jQuery.merge( results, context.querySelectorAll(selector) );
    }

    return results;
  },
  unique: function( results ) {
    var elem,
      duplicates = [],
      i = 0,
      j = 0;

    selector_hasDuplicate = false;
    results.sort( selector_sortOrder );

    if ( selector_hasDuplicate ) {
      while ( (elem = results[i++]) ) {
        if ( elem === results[ i ] ) {
          j = duplicates.push( i );
        }
      }
      while ( j-- ) {
        results.splice( duplicates[ j ], 1 );
      }
    }

    return results;
  },
  text: function( elem ) {
    var node,
      ret = "",
      i = 0,
      nodeType = elem.nodeType;

    if ( !nodeType ) {
      // If no nodeType, this is expected to be an array
      while ( (node = elem[i++]) ) {
        // Do not traverse comment nodes
        ret += jQuery.text( node );
      }
    } else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
      // Use textContent for elements
      return elem.textContent;
    } else if ( nodeType === 3 || nodeType === 4 ) {
      return elem.nodeValue;
    }
    // Do not include comment or processing instruction nodes

    return ret;
  },
  contains: function( a, b ) {
    var adown = a.nodeType === 9 ? a.documentElement : a,
      bup = b && b.parentNode;
    return a === bup || !!( bup && bup.nodeType === 1 && adown.contains(bup) );
  },
  isXMLDoc: function( elem ) {
    return (elem.ownerDocument || elem).documentElement.nodeName !== "HTML";
  },
  expr: {
    attrHandle: {},
    match: {
      bool: /^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i,
      needsContext: /^[\x20\t\r\n\f]*[>+~]/
    }
  }
});

jQuery.extend( jQuery.find, {
  matches: function( expr, elements ) {
    return jQuery.find( expr, null, null, elements );
  },
  matchesSelector: function( elem, expr ) {
    return matches.call( elem, expr );
  },
  attr: function( elem, name ) {
    return elem.getAttribute( name );
  }
});
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
  var object = optionsCache[ options ] = {};
  jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
    object[ flag ] = true;
  });
  return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *  options: an optional list of space-separated options that will change how
 *      the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *  once:     will ensure the callback list can only be fired once (like a Deferred)
 *
 *  memory:     will keep track of previous values and will call any callback added
 *          after the list has been fired right away with the latest "memorized"
 *          values (like a Deferred)
 *
 *  unique:     will ensure a callback can only be added once (no duplicate in the list)
 *
 *  stopOnFalse:  interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

  // Convert options from String-formatted to Object-formatted if needed
  // (we check in cache first)
  options = typeof options === "string" ?
    ( optionsCache[ options ] || createOptions( options ) ) :
    jQuery.extend( {}, options );

  var // Last fire value (for non-forgettable lists)
    memory,
    // Flag to know if list was already fired
    fired,
    // Flag to know if list is currently firing
    firing,
    // First callback to fire (used internally by add and fireWith)
    firingStart,
    // End of the loop when firing
    firingLength,
    // Index of currently firing callback (modified by remove if needed)
    firingIndex,
    // Actual callback list
    list = [],
    // Stack of fire calls for repeatable lists
    stack = !options.once && [],
    // Fire callbacks
    fire = function( data ) {
      memory = options.memory && data;
      fired = true;
      firingIndex = firingStart || 0;
      firingStart = 0;
      firingLength = list.length;
      firing = true;
      for ( ; list && firingIndex < firingLength; firingIndex++ ) {
        if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
          memory = false; // To prevent further calls using add
          break;
        }
      }
      firing = false;
      if ( list ) {
        if ( stack ) {
          if ( stack.length ) {
            fire( stack.shift() );
          }
        } else if ( memory ) {
          list = [];
        } else {
          self.disable();
        }
      }
    },
    // Actual Callbacks object
    self = {
      // Add a callback or a collection of callbacks to the list
      add: function() {
        if ( list ) {
          // First, we save the current length
          var start = list.length;
          (function add( args ) {
            jQuery.each( args, function( _, arg ) {
              var type = jQuery.type( arg );
              if ( type === "function" ) {
                if ( !options.unique || !self.has( arg ) ) {
                  list.push( arg );
                }
              } else if ( arg && arg.length && type !== "string" ) {
                // Inspect recursively
                add( arg );
              }
            });
          })( arguments );
          // Do we need to add the callbacks to the
          // current firing batch?
          if ( firing ) {
            firingLength = list.length;
          // With memory, if we're not firing then
          // we should call right away
          } else if ( memory ) {
            firingStart = start;
            fire( memory );
          }
        }
        return this;
      },
      // Remove a callback from the list
      remove: function() {
        if ( list ) {
          jQuery.each( arguments, function( _, arg ) {
            var index;
            while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
              list.splice( index, 1 );
              // Handle firing indexes
              if ( firing ) {
                if ( index <= firingLength ) {
                  firingLength--;
                }
                if ( index <= firingIndex ) {
                  firingIndex--;
                }
              }
            }
          });
        }
        return this;
      },
      // Check if a given callback is in the list.
      // If no argument is given, return whether or not list has callbacks attached.
      has: function( fn ) {
        return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
      },
      // Remove all callbacks from the list
      empty: function() {
        list = [];
        firingLength = 0;
        return this;
      },
      // Have the list do nothing anymore
      disable: function() {
        list = stack = memory = undefined;
        return this;
      },
      // Is it disabled?
      disabled: function() {
        return !list;
      },
      // Lock the list in its current state
      lock: function() {
        stack = undefined;
        if ( !memory ) {
          self.disable();
        }
        return this;
      },
      // Is it locked?
      locked: function() {
        return !stack;
      },
      // Call all callbacks with the given context and arguments
      fireWith: function( context, args ) {
        if ( list && ( !fired || stack ) ) {
          args = args || [];
          args = [ context, args.slice ? args.slice() : args ];
          if ( firing ) {
            stack.push( args );
          } else {
            fire( args );
          }
        }
        return this;
      },
      // Call all the callbacks with the given arguments
      fire: function() {
        self.fireWith( this, arguments );
        return this;
      },
      // To know if the callbacks have already been called at least once
      fired: function() {
        return !!fired;
      }
    };

  return self;
};
jQuery.extend({

  Deferred: function( func ) {
    var tuples = [
        // action, add listener, listener list, final state
        [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
        [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
        [ "notify", "progress", jQuery.Callbacks("memory") ]
      ],
      state = "pending",
      promise = {
        state: function() {
          return state;
        },
        always: function() {
          deferred.done( arguments ).fail( arguments );
          return this;
        },
        then: function( /* fnDone, fnFail, fnProgress */ ) {
          var fns = arguments;
          return jQuery.Deferred(function( newDefer ) {
            jQuery.each( tuples, function( i, tuple ) {
              var action = tuple[ 0 ],
                fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
              // deferred[ done | fail | progress ] for forwarding actions to newDefer
              deferred[ tuple[1] ](function() {
                var returned = fn && fn.apply( this, arguments );
                if ( returned && jQuery.isFunction( returned.promise ) ) {
                  returned.promise()
                    .done( newDefer.resolve )
                    .fail( newDefer.reject )
                    .progress( newDefer.notify );
                } else {
                  newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
                }
              });
            });
            fns = null;
          }).promise();
        },
        // Get a promise for this deferred
        // If obj is provided, the promise aspect is added to the object
        promise: function( obj ) {
          return obj != null ? jQuery.extend( obj, promise ) : promise;
        }
      },
      deferred = {};

    // Keep pipe for back-compat
    promise.pipe = promise.then;

    // Add list-specific methods
    jQuery.each( tuples, function( i, tuple ) {
      var list = tuple[ 2 ],
        stateString = tuple[ 3 ];

      // promise[ done | fail | progress ] = list.add
      promise[ tuple[1] ] = list.add;

      // Handle state
      if ( stateString ) {
        list.add(function() {
          // state = [ resolved | rejected ]
          state = stateString;

        // [ reject_list | resolve_list ].disable; progress_list.lock
        }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
      }

      // deferred[ resolve | reject | notify ]
      deferred[ tuple[0] ] = function() {
        deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
        return this;
      };
      deferred[ tuple[0] + "With" ] = list.fireWith;
    });

    // Make the deferred a promise
    promise.promise( deferred );

    // Call given func if any
    if ( func ) {
      func.call( deferred, deferred );
    }

    // All done!
    return deferred;
  },

  // Deferred helper
  when: function( subordinate /* , ..., subordinateN */ ) {
    var i = 0,
      resolveValues = core_slice.call( arguments ),
      length = resolveValues.length,

      // the count of uncompleted subordinates
      remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

      // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
      deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

      // Update function for both resolve and progress values
      updateFunc = function( i, contexts, values ) {
        return function( value ) {
          contexts[ i ] = this;
          values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
          if( values === progressValues ) {
            deferred.notifyWith( contexts, values );
          } else if ( !( --remaining ) ) {
            deferred.resolveWith( contexts, values );
          }
        };
      },

      progressValues, progressContexts, resolveContexts;

    // add listeners to Deferred subordinates; treat others as resolved
    if ( length > 1 ) {
      progressValues = new Array( length );
      progressContexts = new Array( length );
      resolveContexts = new Array( length );
      for ( ; i < length; i++ ) {
        if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
          resolveValues[ i ].promise()
            .done( updateFunc( i, resolveContexts, resolveValues ) )
            .fail( deferred.reject )
            .progress( updateFunc( i, progressContexts, progressValues ) );
        } else {
          --remaining;
        }
      }
    }

    // if we're not waiting on anything, resolve the master
    if ( !remaining ) {
      deferred.resolveWith( resolveContexts, resolveValues );
    }

    return deferred.promise();
  }
});
jQuery.support = (function( support ) {
  var input = document.createElement("input"),
    fragment = document.createDocumentFragment(),
    div = document.createElement("div"),
    select = document.createElement("select"),
    opt = select.appendChild( document.createElement("option") );

  // Finish early in limited environments
  if ( !input.type ) {
    return support;
  }

  input.type = "checkbox";

  // Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
  // Check the default checkbox/radio value ("" on old WebKit; "on" elsewhere)
  support.checkOn = input.value !== "";

  // Must access the parent to make an option select properly
  // Support: IE9, IE10
  support.optSelected = opt.selected;

  // Will be defined later
  support.reliableMarginRight = true;
  support.boxSizingReliable = true;
  support.pixelPosition = false;

  // Make sure checked status is properly cloned
  // Support: IE9, IE10
  input.checked = true;
  support.noCloneChecked = input.cloneNode( true ).checked;

  // Make sure that the options inside disabled selects aren't marked as disabled
  // (WebKit marks them as disabled)
  select.disabled = true;
  support.optDisabled = !opt.disabled;

  // Check if an input maintains its value after becoming a radio
  // Support: IE9, IE10
  input = document.createElement("input");
  input.value = "t";
  input.type = "radio";
  support.radioValue = input.value === "t";

  // #11217 - WebKit loses check when the name is after the checked attribute
  input.setAttribute( "checked", "t" );
  input.setAttribute( "name", "t" );

  fragment.appendChild( input );

  // Support: Safari 5.1, Android 4.x, Android 2.3
  // old WebKit doesn't clone checked state correctly in fragments
  support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

  // Support: Firefox, Chrome, Safari
  // Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
  support.focusinBubbles = "onfocusin" in window;

  div.style.backgroundClip = "content-box";
  div.cloneNode( true ).style.backgroundClip = "";
  support.clearCloneStyle = div.style.backgroundClip === "content-box";

  // Run tests that need a body at doc ready
  jQuery(function() {
    var container, marginDiv,
      // Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
      divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",
      body = document.getElementsByTagName("body")[ 0 ];

    if ( !body ) {
      // Return for frameset docs that don't have a body
      return;
    }

    container = document.createElement("div");
    container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

    // Check box-sizing and margin behavior.
    body.appendChild( container ).appendChild( div );
    div.innerHTML = "";
    // Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
    div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%";

    // Workaround failing boxSizing test due to offsetWidth returning wrong value
    // with some non-1 values of body zoom, ticket #13543
    jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
      support.boxSizing = div.offsetWidth === 4;
    });

    // Use window.getComputedStyle because jsdom on node.js will break without it.
    if ( window.getComputedStyle ) {
      support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
      support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

      // Support: Android 2.3
      // Check if div with explicit width and no margin-right incorrectly
      // gets computed margin-right based on width of container. (#3333)
      // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
      marginDiv = div.appendChild( document.createElement("div") );
      marginDiv.style.cssText = div.style.cssText = divReset;
      marginDiv.style.marginRight = marginDiv.style.width = "0";
      div.style.width = "1px";

      support.reliableMarginRight =
        !parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
    }

    body.removeChild( container );
  });

  return support;
})( {} );

/*
  Implementation Summary

  1. Enforce API surface and semantic compatibility with 1.9.x branch
  2. Improve the module's maintainability by reducing the storage
    paths to a single mechanism.
  3. Use the same single mechanism to support "private" and "user" data.
  4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
  5. Avoid exposing implementation details on user objects (eg. expando properties)
  6. Provide a clear path for implementation upgrade to WeakMap in 2014
*/
var data_user, data_priv,
  rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
  rmultiDash = /([A-Z])/g;

function Data() {
  // Support: Android < 4,
  // Old WebKit does not have Object.preventExtensions/freeze method,
  // return new empty object instead with no [[set]] accessor
  Object.defineProperty( this.cache = {}, 0, {
    get: function() {
      return {};
    }
  });

  this.expando = jQuery.expando + Math.random();
}

Data.uid = 1;

Data.accepts = function( owner ) {
  // Accepts only:
  //  - Node
  //    - Node.ELEMENT_NODE
  //    - Node.DOCUMENT_NODE
  //  - Object
  //    - Any
  return owner.nodeType ?
    owner.nodeType === 1 || owner.nodeType === 9 : true;
};

Data.prototype = {
  key: function( owner ) {
    // We can accept data for non-element nodes in modern browsers,
    // but we should not, see #8335.
    // Always return the key for a frozen object.
    if ( !Data.accepts( owner ) ) {
      return 0;
    }

    var descriptor = {},
      // Check if the owner object already has a cache key
      unlock = owner[ this.expando ];

    // If not, create one
    if ( !unlock ) {
      unlock = Data.uid++;

      // Secure it in a non-enumerable, non-writable property
      try {
        descriptor[ this.expando ] = { value: unlock };
        Object.defineProperties( owner, descriptor );

      // Support: Android < 4
      // Fallback to a less secure definition
      } catch ( e ) {
        descriptor[ this.expando ] = unlock;
        jQuery.extend( owner, descriptor );
      }
    }

    // Ensure the cache object
    if ( !this.cache[ unlock ] ) {
      this.cache[ unlock ] = {};
    }

    return unlock;
  },
  set: function( owner, data, value ) {
    var prop,
      // There may be an unlock assigned to this node,
      // if there is no entry for this "owner", create one inline
      // and set the unlock as though an owner entry had always existed
      unlock = this.key( owner ),
      cache = this.cache[ unlock ];

    // Handle: [ owner, key, value ] args
    if ( typeof data === "string" ) {
      cache[ data ] = value;

    // Handle: [ owner, { properties } ] args
    } else {
      // Fresh assignments by object are shallow copied
      if ( jQuery.isEmptyObject( cache ) ) {
        jQuery.extend( this.cache[ unlock ], data );
      // Otherwise, copy the properties one-by-one to the cache object
      } else {
        for ( prop in data ) {
          cache[ prop ] = data[ prop ];
        }
      }
    }
    return cache;
  },
  get: function( owner, key ) {
    // Either a valid cache is found, or will be created.
    // New caches will be created and the unlock returned,
    // allowing direct access to the newly created
    // empty data object. A valid owner object must be provided.
    var cache = this.cache[ this.key( owner ) ];

    return key === undefined ?
      cache : cache[ key ];
  },
  access: function( owner, key, value ) {
    var stored;
    // In cases where either:
    //
    //   1. No key was specified
    //   2. A string key was specified, but no value provided
    //
    // Take the "read" path and allow the get method to determine
    // which value to return, respectively either:
    //
    //   1. The entire cache object
    //   2. The data stored at the key
    //
    if ( key === undefined ||
        ((key && typeof key === "string") && value === undefined) ) {

      stored = this.get( owner, key );

      return stored !== undefined ?
        stored : this.get( owner, jQuery.camelCase(key) );
    }

    // [*]When the key is not a string, or both a key and value
    // are specified, set or extend (existing objects) with either:
    //
    //   1. An object of properties
    //   2. A key and value
    //
    this.set( owner, key, value );

    // Since the "set" path can have two possible entry points
    // return the expected data based on which path was taken[*]
    return value !== undefined ? value : key;
  },
  remove: function( owner, key ) {
    var i, name, camel,
      unlock = this.key( owner ),
      cache = this.cache[ unlock ];

    if ( key === undefined ) {
      this.cache[ unlock ] = {};

    } else {
      // Support array or space separated string of keys
      if ( jQuery.isArray( key ) ) {
        // If "name" is an array of keys...
        // When data is initially created, via ("key", "val") signature,
        // keys will be converted to camelCase.
        // Since there is no way to tell _how_ a key was added, remove
        // both plain key and camelCase key. #12786
        // This will only penalize the array argument path.
        name = key.concat( key.map( jQuery.camelCase ) );
      } else {
        camel = jQuery.camelCase( key );
        // Try the string as a key before any manipulation
        if ( key in cache ) {
          name = [ key, camel ];
        } else {
          // If a key with the spaces exists, use it.
          // Otherwise, create an array by matching non-whitespace
          name = camel;
          name = name in cache ?
            [ name ] : ( name.match( core_rnotwhite ) || [] );
        }
      }

      i = name.length;
      while ( i-- ) {
        delete cache[ name[ i ] ];
      }
    }
  },
  hasData: function( owner ) {
    return !jQuery.isEmptyObject(
      this.cache[ owner[ this.expando ] ] || {}
    );
  },
  discard: function( owner ) {
    if ( owner[ this.expando ] ) {
      delete this.cache[ owner[ this.expando ] ];
    }
  }
};

// These may be used throughout the jQuery core codebase
data_user = new Data();
data_priv = new Data();


jQuery.extend({
  acceptData: Data.accepts,

  hasData: function( elem ) {
    return data_user.hasData( elem ) || data_priv.hasData( elem );
  },

  data: function( elem, name, data ) {
    return data_user.access( elem, name, data );
  },

  removeData: function( elem, name ) {
    data_user.remove( elem, name );
  },

  // TODO: Now that all calls to _data and _removeData have been replaced
  // with direct calls to data_priv methods, these can be deprecated.
  _data: function( elem, name, data ) {
    return data_priv.access( elem, name, data );
  },

  _removeData: function( elem, name ) {
    data_priv.remove( elem, name );
  }
});

jQuery.fn.extend({
  data: function( key, value ) {
    var attrs, name,
      elem = this[ 0 ],
      i = 0,
      data = null;

    // Gets all values
    if ( key === undefined ) {
      if ( this.length ) {
        data = data_user.get( elem );

        if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
          attrs = elem.attributes;
          for ( ; i < attrs.length; i++ ) {
            name = attrs[ i ].name;

            if ( name.indexOf( "data-" ) === 0 ) {
              name = jQuery.camelCase( name.slice(5) );
              dataAttr( elem, name, data[ name ] );
            }
          }
          data_priv.set( elem, "hasDataAttrs", true );
        }
      }

      return data;
    }

    // Sets multiple values
    if ( typeof key === "object" ) {
      return this.each(function() {
        data_user.set( this, key );
      });
    }

    return jQuery.access( this, function( value ) {
      var data,
        camelKey = jQuery.camelCase( key );

      // The calling jQuery object (element matches) is not empty
      // (and therefore has an element appears at this[ 0 ]) and the
      // `value` parameter was not undefined. An empty jQuery object
      // will result in `undefined` for elem = this[ 0 ] which will
      // throw an exception if an attempt to read a data cache is made.
      if ( elem && value === undefined ) {
        // Attempt to get data from the cache
        // with the key as-is
        data = data_user.get( elem, key );
        if ( data !== undefined ) {
          return data;
        }

        // Attempt to get data from the cache
        // with the key camelized
        data = data_user.get( elem, camelKey );
        if ( data !== undefined ) {
          return data;
        }

        // Attempt to "discover" the data in
        // HTML5 custom data-* attrs
        data = dataAttr( elem, camelKey, undefined );
        if ( data !== undefined ) {
          return data;
        }

        // We tried really hard, but the data doesn't exist.
        return;
      }

      // Set the data...
      this.each(function() {
        // First, attempt to store a copy or reference of any
        // data that might've been store with a camelCased key.
        var data = data_user.get( this, camelKey );

        // For HTML5 data-* attribute interop, we have to
        // store property names with dashes in a camelCase form.
        // This might not apply to all properties...*
        data_user.set( this, camelKey, value );

        // *... In the case of properties that might _actually_
        // have dashes, we need to also store a copy of that
        // unchanged property.
        if ( key.indexOf("-") !== -1 && data !== undefined ) {
          data_user.set( this, key, value );
        }
      });
    }, null, value, arguments.length > 1, null, true );
  },

  removeData: function( key ) {
    return this.each(function() {
      data_user.remove( this, key );
    });
  }
});

function dataAttr( elem, key, data ) {
  var name;

  // If nothing was found internally, try to fetch any
  // data from the HTML5 data-* attribute
  if ( data === undefined && elem.nodeType === 1 ) {
    name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
    data = elem.getAttribute( name );

    if ( typeof data === "string" ) {
      try {
        data = data === "true" ? true :
          data === "false" ? false :
          data === "null" ? null :
          // Only convert to a number if it doesn't change the string
          +data + "" === data ? +data :
          rbrace.test( data ) ? JSON.parse( data ) :
          data;
      } catch( e ) {}

      // Make sure we set the data so it isn't changed later
      data_user.set( elem, key, data );
    } else {
      data = undefined;
    }
  }
  return data;
}
jQuery.extend({
  queue: function( elem, type, data ) {
    var queue;

    if ( elem ) {
      type = ( type || "fx" ) + "queue";
      queue = data_priv.get( elem, type );

      // Speed up dequeue by getting out quickly if this is just a lookup
      if ( data ) {
        if ( !queue || jQuery.isArray( data ) ) {
          queue = data_priv.access( elem, type, jQuery.makeArray(data) );
        } else {
          queue.push( data );
        }
      }
      return queue || [];
    }
  },

  dequeue: function( elem, type ) {
    type = type || "fx";

    var queue = jQuery.queue( elem, type ),
      startLength = queue.length,
      fn = queue.shift(),
      hooks = jQuery._queueHooks( elem, type ),
      next = function() {
        jQuery.dequeue( elem, type );
      };

    // If the fx queue is dequeued, always remove the progress sentinel
    if ( fn === "inprogress" ) {
      fn = queue.shift();
      startLength--;
    }

    if ( fn ) {

      // Add a progress sentinel to prevent the fx queue from being
      // automatically dequeued
      if ( type === "fx" ) {
        queue.unshift( "inprogress" );
      }

      // clear up the last queue stop function
      delete hooks.stop;
      fn.call( elem, next, hooks );
    }

    if ( !startLength && hooks ) {
      hooks.empty.fire();
    }
  },

  // not intended for public consumption - generates a queueHooks object, or returns the current one
  _queueHooks: function( elem, type ) {
    var key = type + "queueHooks";
    return data_priv.get( elem, key ) || data_priv.access( elem, key, {
      empty: jQuery.Callbacks("once memory").add(function() {
        data_priv.remove( elem, [ type + "queue", key ] );
      })
    });
  }
});

jQuery.fn.extend({
  queue: function( type, data ) {
    var setter = 2;

    if ( typeof type !== "string" ) {
      data = type;
      type = "fx";
      setter--;
    }

    if ( arguments.length < setter ) {
      return jQuery.queue( this[0], type );
    }

    return data === undefined ?
      this :
      this.each(function() {
        var queue = jQuery.queue( this, type, data );

        // ensure a hooks for this queue
        jQuery._queueHooks( this, type );

        if ( type === "fx" && queue[0] !== "inprogress" ) {
          jQuery.dequeue( this, type );
        }
      });
  },
  dequeue: function( type ) {
    return this.each(function() {
      jQuery.dequeue( this, type );
    });
  },
  // Based off of the plugin by Clint Helfers, with permission.
  // http://blindsignals.com/index.php/2009/07/jquery-delay/
  delay: function( time, type ) {
    time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
    type = type || "fx";

    return this.queue( type, function( next, hooks ) {
      var timeout = setTimeout( next, time );
      hooks.stop = function() {
        clearTimeout( timeout );
      };
    });
  },
  clearQueue: function( type ) {
    return this.queue( type || "fx", [] );
  },
  // Get a promise resolved when queues of a certain type
  // are emptied (fx is the type by default)
  promise: function( type, obj ) {
    var tmp,
      count = 1,
      defer = jQuery.Deferred(),
      elements = this,
      i = this.length,
      resolve = function() {
        if ( !( --count ) ) {
          defer.resolveWith( elements, [ elements ] );
        }
      };

    if ( typeof type !== "string" ) {
      obj = type;
      type = undefined;
    }
    type = type || "fx";

    while( i-- ) {
      tmp = data_priv.get( elements[ i ], type + "queueHooks" );
      if ( tmp && tmp.empty ) {
        count++;
        tmp.empty.add( resolve );
      }
    }
    resolve();
    return defer.promise( obj );
  }
});
var nodeHook, boolHook,
  rclass = /[\t\r\n\f]/g,
  rreturn = /\r/g,
  rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
  attr: function( name, value ) {
    return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
  },

  removeAttr: function( name ) {
    return this.each(function() {
      jQuery.removeAttr( this, name );
    });
  },

  prop: function( name, value ) {
    return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
  },

  removeProp: function( name ) {
    return this.each(function() {
      delete this[ jQuery.propFix[ name ] || name ];
    });
  },

  addClass: function( value ) {
    var classes, elem, cur, clazz, j,
      i = 0,
      len = this.length,
      proceed = typeof value === "string" && value;

    if ( jQuery.isFunction( value ) ) {
      return this.each(function( j ) {
        jQuery( this ).addClass( value.call( this, j, this.className ) );
      });
    }

    if ( proceed ) {
      // The disjunction here is for better compressibility (see removeClass)
      classes = ( value || "" ).match( core_rnotwhite ) || [];

      for ( ; i < len; i++ ) {
        elem = this[ i ];
        cur = elem.nodeType === 1 && ( elem.className ?
          ( " " + elem.className + " " ).replace( rclass, " " ) :
          " "
        );

        if ( cur ) {
          j = 0;
          while ( (clazz = classes[j++]) ) {
            if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
              cur += clazz + " ";
            }
          }
          elem.className = jQuery.trim( cur );

        }
      }
    }

    return this;
  },

  removeClass: function( value ) {
    var classes, elem, cur, clazz, j,
      i = 0,
      len = this.length,
      proceed = arguments.length === 0 || typeof value === "string" && value;

    if ( jQuery.isFunction( value ) ) {
      return this.each(function( j ) {
        jQuery( this ).removeClass( value.call( this, j, this.className ) );
      });
    }
    if ( proceed ) {
      classes = ( value || "" ).match( core_rnotwhite ) || [];

      for ( ; i < len; i++ ) {
        elem = this[ i ];
        // This expression is here for better compressibility (see addClass)
        cur = elem.nodeType === 1 && ( elem.className ?
          ( " " + elem.className + " " ).replace( rclass, " " ) :
          ""
        );

        if ( cur ) {
          j = 0;
          while ( (clazz = classes[j++]) ) {
            // Remove *all* instances
            while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
              cur = cur.replace( " " + clazz + " ", " " );
            }
          }
          elem.className = value ? jQuery.trim( cur ) : "";
        }
      }
    }

    return this;
  },

  toggleClass: function( value, stateVal ) {
    var type = typeof value;

    if ( typeof stateVal === "boolean" && type === "string" ) {
      return stateVal ? this.addClass( value ) : this.removeClass( value );
    }

    if ( jQuery.isFunction( value ) ) {
      return this.each(function( i ) {
        jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
      });
    }

    return this.each(function() {
      if ( type === "string" ) {
        // toggle individual class names
        var className,
          i = 0,
          self = jQuery( this ),
          classNames = value.match( core_rnotwhite ) || [];

        while ( (className = classNames[ i++ ]) ) {
          // check each className given, space separated list
          if ( self.hasClass( className ) ) {
            self.removeClass( className );
          } else {
            self.addClass( className );
          }
        }

      // Toggle whole class name
      } else if ( type === core_strundefined || type === "boolean" ) {
        if ( this.className ) {
          // store className if set
          data_priv.set( this, "__className__", this.className );
        }

        // If the element has a class name or if we're passed "false",
        // then remove the whole classname (if there was one, the above saved it).
        // Otherwise bring back whatever was previously saved (if anything),
        // falling back to the empty string if nothing was stored.
        this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
      }
    });
  },

  hasClass: function( selector ) {
    var className = " " + selector + " ",
      i = 0,
      l = this.length;
    for ( ; i < l; i++ ) {
      if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
        return true;
      }
    }

    return false;
  },

  val: function( value ) {
    var hooks, ret, isFunction,
      elem = this[0];

    if ( !arguments.length ) {
      if ( elem ) {
        hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

        if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
          return ret;
        }

        ret = elem.value;

        return typeof ret === "string" ?
          // handle most common string cases
          ret.replace(rreturn, "") :
          // handle cases where value is null/undef or number
          ret == null ? "" : ret;
      }

      return;
    }

    isFunction = jQuery.isFunction( value );

    return this.each(function( i ) {
      var val;

      if ( this.nodeType !== 1 ) {
        return;
      }

      if ( isFunction ) {
        val = value.call( this, i, jQuery( this ).val() );
      } else {
        val = value;
      }

      // Treat null/undefined as ""; convert numbers to string
      if ( val == null ) {
        val = "";
      } else if ( typeof val === "number" ) {
        val += "";
      } else if ( jQuery.isArray( val ) ) {
        val = jQuery.map(val, function ( value ) {
          return value == null ? "" : value + "";
        });
      }

      hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

      // If set returns undefined, fall back to normal setting
      if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
        this.value = val;
      }
    });
  }
});

jQuery.extend({
  valHooks: {
    option: {
      get: function( elem ) {
        // attributes.value is undefined in Blackberry 4.7 but
        // uses .value. See #6932
        var val = elem.attributes.value;
        return !val || val.specified ? elem.value : elem.text;
      }
    },
    select: {
      get: function( elem ) {
        var value, option,
          options = elem.options,
          index = elem.selectedIndex,
          one = elem.type === "select-one" || index < 0,
          values = one ? null : [],
          max = one ? index + 1 : options.length,
          i = index < 0 ?
            max :
            one ? index : 0;

        // Loop through all the selected options
        for ( ; i < max; i++ ) {
          option = options[ i ];

          // IE6-9 doesn't update selected after form reset (#2551)
          if ( ( option.selected || i === index ) &&
              // Don't return options that are disabled or in a disabled optgroup
              ( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
              ( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

            // Get the specific value for the option
            value = jQuery( option ).val();

            // We don't need an array for one selects
            if ( one ) {
              return value;
            }

            // Multi-Selects return an array
            values.push( value );
          }
        }

        return values;
      },

      set: function( elem, value ) {
        var optionSet, option,
          options = elem.options,
          values = jQuery.makeArray( value ),
          i = options.length;

        while ( i-- ) {
          option = options[ i ];
          if ( (option.selected = jQuery.inArray( jQuery(option).val(), values ) >= 0) ) {
            optionSet = true;
          }
        }

        // force browsers to behave consistently when non-matching value is set
        if ( !optionSet ) {
          elem.selectedIndex = -1;
        }
        return values;
      }
    }
  },

  attr: function( elem, name, value ) {
    var hooks, ret,
      nType = elem.nodeType;

    // don't get/set attributes on text, comment and attribute nodes
    if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
      return;
    }

    // Fallback to prop when attributes are not supported
    if ( typeof elem.getAttribute === core_strundefined ) {
      return jQuery.prop( elem, name, value );
    }

    // All attributes are lowercase
    // Grab necessary hook if one is defined
    if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
      name = name.toLowerCase();
      hooks = jQuery.attrHooks[ name ] ||
        ( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
    }

    if ( value !== undefined ) {

      if ( value === null ) {
        jQuery.removeAttr( elem, name );

      } else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
        return ret;

      } else {
        elem.setAttribute( name, value + "" );
        return value;
      }

    } else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
      return ret;

    } else {
      ret = jQuery.find.attr( elem, name );

      // Non-existent attributes return null, we normalize to undefined
      return ret == null ?
        undefined :
        ret;
    }
  },

  removeAttr: function( elem, value ) {
    var name, propName,
      i = 0,
      attrNames = value && value.match( core_rnotwhite );

    if ( attrNames && elem.nodeType === 1 ) {
      while ( (name = attrNames[i++]) ) {
        propName = jQuery.propFix[ name ] || name;

        // Boolean attributes get special treatment (#10870)
        if ( jQuery.expr.match.bool.test( name ) ) {
          // Set corresponding property to false
          elem[ propName ] = false;
        }

        elem.removeAttribute( name );
      }
    }
  },

  attrHooks: {
    type: {
      set: function( elem, value ) {
        if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
          // Setting the type on a radio button after the value resets the value in IE6-9
          // Reset value to default in case type is set after value during creation
          var val = elem.value;
          elem.setAttribute( "type", value );
          if ( val ) {
            elem.value = val;
          }
          return value;
        }
      }
    }
  },

  propFix: {
    "for": "htmlFor",
    "class": "className"
  },

  prop: function( elem, name, value ) {
    var ret, hooks, notxml,
      nType = elem.nodeType;

    // don't get/set properties on text, comment and attribute nodes
    if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
      return;
    }

    notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

    if ( notxml ) {
      // Fix name and attach hooks
      name = jQuery.propFix[ name ] || name;
      hooks = jQuery.propHooks[ name ];
    }

    if ( value !== undefined ) {
      return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
        ret :
        ( elem[ name ] = value );

    } else {
      return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
        ret :
        elem[ name ];
    }
  },

  propHooks: {
    tabIndex: {
      get: function( elem ) {
        return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
          elem.tabIndex :
          -1;
      }
    }
  }
});

// Hooks for boolean attributes
boolHook = {
  set: function( elem, value, name ) {
    if ( value === false ) {
      // Remove boolean attributes when set to false
      jQuery.removeAttr( elem, name );
    } else {
      elem.setAttribute( name, name );
    }
    return name;
  }
};
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
  var getter = jQuery.expr.attrHandle[ name ] || jQuery.find.attr;

  jQuery.expr.attrHandle[ name ] = function( elem, name, isXML ) {
    var fn = jQuery.expr.attrHandle[ name ],
      ret = isXML ?
        undefined :
        /* jshint eqeqeq: false */
        // Temporarily disable this handler to check existence
        (jQuery.expr.attrHandle[ name ] = undefined) !=
          getter( elem, name, isXML ) ?

          name.toLowerCase() :
          null;

    // Restore handler
    jQuery.expr.attrHandle[ name ] = fn;

    return ret;
  };
});

// Support: IE9+
// Selectedness for an option in an optgroup can be inaccurate
if ( !jQuery.support.optSelected ) {
  jQuery.propHooks.selected = {
    get: function( elem ) {
      var parent = elem.parentNode;
      if ( parent && parent.parentNode ) {
        parent.parentNode.selectedIndex;
      }
      return null;
    }
  };
}

jQuery.each([
  "tabIndex",
  "readOnly",
  "maxLength",
  "cellSpacing",
  "cellPadding",
  "rowSpan",
  "colSpan",
  "useMap",
  "frameBorder",
  "contentEditable"
], function() {
  jQuery.propFix[ this.toLowerCase() ] = this;
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
  jQuery.valHooks[ this ] = {
    set: function( elem, value ) {
      if ( jQuery.isArray( value ) ) {
        return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
      }
    }
  };
  if ( !jQuery.support.checkOn ) {
    jQuery.valHooks[ this ].get = function( elem ) {
      // Support: Webkit
      // "" is returned instead of "on" if a value isn't specified
      return elem.getAttribute("value") === null ? "on" : elem.value;
    };
  }
});
var rkeyEvent = /^key/,
  rmouseEvent = /^(?:mouse|contextmenu)|click/,
  rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
  rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
  return true;
}

function returnFalse() {
  return false;
}

function safeActiveElement() {
  try {
    return document.activeElement;
  } catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

  global: {},

  add: function( elem, types, handler, data, selector ) {

    var handleObjIn, eventHandle, tmp,
      events, t, handleObj,
      special, handlers, type, namespaces, origType,
      elemData = data_priv.get( elem );

    // Don't attach events to noData or text/comment nodes (but allow plain objects)
    if ( !elemData ) {
      return;
    }

    // Caller can pass in an object of custom data in lieu of the handler
    if ( handler.handler ) {
      handleObjIn = handler;
      handler = handleObjIn.handler;
      selector = handleObjIn.selector;
    }

    // Make sure that the handler has a unique ID, used to find/remove it later
    if ( !handler.guid ) {
      handler.guid = jQuery.guid++;
    }

    // Init the element's event structure and main handler, if this is the first
    if ( !(events = elemData.events) ) {
      events = elemData.events = {};
    }
    if ( !(eventHandle = elemData.handle) ) {
      eventHandle = elemData.handle = function( e ) {
        // Discard the second event of a jQuery.event.trigger() and
        // when an event is called after a page has unloaded
        return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
          jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
          undefined;
      };
      // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
      eventHandle.elem = elem;
    }

    // Handle multiple events separated by a space
    types = ( types || "" ).match( core_rnotwhite ) || [""];
    t = types.length;
    while ( t-- ) {
      tmp = rtypenamespace.exec( types[t] ) || [];
      type = origType = tmp[1];
      namespaces = ( tmp[2] || "" ).split( "." ).sort();

      // There *must* be a type, no attaching namespace-only handlers
      if ( !type ) {
        continue;
      }

      // If event changes its type, use the special event handlers for the changed type
      special = jQuery.event.special[ type ] || {};

      // If selector defined, determine special event api type, otherwise given type
      type = ( selector ? special.delegateType : special.bindType ) || type;

      // Update special based on newly reset type
      special = jQuery.event.special[ type ] || {};

      // handleObj is passed to all event handlers
      handleObj = jQuery.extend({
        type: type,
        origType: origType,
        data: data,
        handler: handler,
        guid: handler.guid,
        selector: selector,
        needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
        namespace: namespaces.join(".")
      }, handleObjIn );

      // Init the event handler queue if we're the first
      if ( !(handlers = events[ type ]) ) {
        handlers = events[ type ] = [];
        handlers.delegateCount = 0;

        // Only use addEventListener if the special events handler returns false
        if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
          if ( elem.addEventListener ) {
            elem.addEventListener( type, eventHandle, false );
          }
        }
      }

      if ( special.add ) {
        special.add.call( elem, handleObj );

        if ( !handleObj.handler.guid ) {
          handleObj.handler.guid = handler.guid;
        }
      }

      // Add to the element's handler list, delegates in front
      if ( selector ) {
        handlers.splice( handlers.delegateCount++, 0, handleObj );
      } else {
        handlers.push( handleObj );
      }

      // Keep track of which events have ever been used, for event optimization
      jQuery.event.global[ type ] = true;
    }

    // Nullify elem to prevent memory leaks in IE
    elem = null;
  },

  // Detach an event or set of events from an element
  remove: function( elem, types, handler, selector, mappedTypes ) {

    var j, origCount, tmp,
      events, t, handleObj,
      special, handlers, type, namespaces, origType,
      elemData = data_priv.hasData( elem ) && data_priv.get( elem );

    if ( !elemData || !(events = elemData.events) ) {
      return;
    }

    // Once for each type.namespace in types; type may be omitted
    types = ( types || "" ).match( core_rnotwhite ) || [""];
    t = types.length;
    while ( t-- ) {
      tmp = rtypenamespace.exec( types[t] ) || [];
      type = origType = tmp[1];
      namespaces = ( tmp[2] || "" ).split( "." ).sort();

      // Unbind all events (on this namespace, if provided) for the element
      if ( !type ) {
        for ( type in events ) {
          jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
        }
        continue;
      }

      special = jQuery.event.special[ type ] || {};
      type = ( selector ? special.delegateType : special.bindType ) || type;
      handlers = events[ type ] || [];
      tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

      // Remove matching events
      origCount = j = handlers.length;
      while ( j-- ) {
        handleObj = handlers[ j ];

        if ( ( mappedTypes || origType === handleObj.origType ) &&
          ( !handler || handler.guid === handleObj.guid ) &&
          ( !tmp || tmp.test( handleObj.namespace ) ) &&
          ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
          handlers.splice( j, 1 );

          if ( handleObj.selector ) {
            handlers.delegateCount--;
          }
          if ( special.remove ) {
            special.remove.call( elem, handleObj );
          }
        }
      }

      // Remove generic event handler if we removed something and no more handlers exist
      // (avoids potential for endless recursion during removal of special event handlers)
      if ( origCount && !handlers.length ) {
        if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
          jQuery.removeEvent( elem, type, elemData.handle );
        }

        delete events[ type ];
      }
    }

    // Remove the expando if it's no longer used
    if ( jQuery.isEmptyObject( events ) ) {
      delete elemData.handle;
      data_priv.remove( elem, "events" );
    }
  },

  trigger: function( event, data, elem, onlyHandlers ) {

    var i, cur, tmp, bubbleType, ontype, handle, special,
      eventPath = [ elem || document ],
      type = core_hasOwn.call( event, "type" ) ? event.type : event,
      namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

    cur = tmp = elem = elem || document;

    // Don't do events on text and comment nodes
    if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
      return;
    }

    // focus/blur morphs to focusin/out; ensure we're not firing them right now
    if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
      return;
    }

    if ( type.indexOf(".") >= 0 ) {
      // Namespaced trigger; create a regexp to match event type in handle()
      namespaces = type.split(".");
      type = namespaces.shift();
      namespaces.sort();
    }
    ontype = type.indexOf(":") < 0 && "on" + type;

    // Caller can pass in a jQuery.Event object, Object, or just an event type string
    event = event[ jQuery.expando ] ?
      event :
      new jQuery.Event( type, typeof event === "object" && event );

    // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
    event.isTrigger = onlyHandlers ? 2 : 3;
    event.namespace = namespaces.join(".");
    event.namespace_re = event.namespace ?
      new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
      null;

    // Clean up the event in case it is being reused
    event.result = undefined;
    if ( !event.target ) {
      event.target = elem;
    }

    // Clone any incoming data and prepend the event, creating the handler arg list
    data = data == null ?
      [ event ] :
      jQuery.makeArray( data, [ event ] );

    // Allow special events to draw outside the lines
    special = jQuery.event.special[ type ] || {};
    if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
      return;
    }

    // Determine event propagation path in advance, per W3C events spec (#9951)
    // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
    if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

      bubbleType = special.delegateType || type;
      if ( !rfocusMorph.test( bubbleType + type ) ) {
        cur = cur.parentNode;
      }
      for ( ; cur; cur = cur.parentNode ) {
        eventPath.push( cur );
        tmp = cur;
      }

      // Only add window if we got to document (e.g., not plain obj or detached DOM)
      if ( tmp === (elem.ownerDocument || document) ) {
        eventPath.push( tmp.defaultView || tmp.parentWindow || window );
      }
    }

    // Fire handlers on the event path
    i = 0;
    while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

      event.type = i > 1 ?
        bubbleType :
        special.bindType || type;

      // jQuery handler
      handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
      if ( handle ) {
        handle.apply( cur, data );
      }

      // Native handler
      handle = ontype && cur[ ontype ];
      if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
        event.preventDefault();
      }
    }
    event.type = type;

    // If nobody prevented the default action, do it now
    if ( !onlyHandlers && !event.isDefaultPrevented() ) {

      if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
        jQuery.acceptData( elem ) ) {

        // Call a native DOM method on the target with the same name name as the event.
        // Don't do default actions on window, that's where global variables be (#6170)
        if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

          // Don't re-trigger an onFOO event when we call its FOO() method
          tmp = elem[ ontype ];

          if ( tmp ) {
            elem[ ontype ] = null;
          }

          // Prevent re-triggering of the same event, since we already bubbled it above
          jQuery.event.triggered = type;
          elem[ type ]();
          jQuery.event.triggered = undefined;

          if ( tmp ) {
            elem[ ontype ] = tmp;
          }
        }
      }
    }

    return event.result;
  },

  dispatch: function( event ) {

    // Make a writable jQuery.Event from the native event object
    event = jQuery.event.fix( event );

    var i, j, ret, matched, handleObj,
      handlerQueue = [],
      args = core_slice.call( arguments ),
      handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
      special = jQuery.event.special[ event.type ] || {};

    // Use the fix-ed jQuery.Event rather than the (read-only) native event
    args[0] = event;
    event.delegateTarget = this;

    // Call the preDispatch hook for the mapped type, and let it bail if desired
    if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
      return;
    }

    // Determine handlers
    handlerQueue = jQuery.event.handlers.call( this, event, handlers );

    // Run delegates first; they may want to stop propagation beneath us
    i = 0;
    while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
      event.currentTarget = matched.elem;

      j = 0;
      while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

        // Triggered event must either 1) have no namespace, or
        // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
        if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

          event.handleObj = handleObj;
          event.data = handleObj.data;

          ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
              .apply( matched.elem, args );

          if ( ret !== undefined ) {
            if ( (event.result = ret) === false ) {
              event.preventDefault();
              event.stopPropagation();
            }
          }
        }
      }
    }

    // Call the postDispatch hook for the mapped type
    if ( special.postDispatch ) {
      special.postDispatch.call( this, event );
    }

    return event.result;
  },

  handlers: function( event, handlers ) {
    var i, matches, sel, handleObj,
      handlerQueue = [],
      delegateCount = handlers.delegateCount,
      cur = event.target;

    // Find delegate handlers
    // Black-hole SVG <use> instance trees (#13180)
    // Avoid non-left-click bubbling in Firefox (#3861)
    if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

      for ( ; cur !== this; cur = cur.parentNode || this ) {

        // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
        if ( cur.disabled !== true || event.type !== "click" ) {
          matches = [];
          for ( i = 0; i < delegateCount; i++ ) {
            handleObj = handlers[ i ];

            // Don't conflict with Object.prototype properties (#13203)
            sel = handleObj.selector + " ";

            if ( matches[ sel ] === undefined ) {
              matches[ sel ] = handleObj.needsContext ?
                jQuery( sel, this ).index( cur ) >= 0 :
                jQuery.find( sel, this, null, [ cur ] ).length;
            }
            if ( matches[ sel ] ) {
              matches.push( handleObj );
            }
          }
          if ( matches.length ) {
            handlerQueue.push({ elem: cur, handlers: matches });
          }
        }
      }
    }

    // Add the remaining (directly-bound) handlers
    if ( delegateCount < handlers.length ) {
      handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
    }

    return handlerQueue;
  },

  // Includes some event props shared by KeyEvent and MouseEvent
  props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

  fixHooks: {},

  keyHooks: {
    props: "char charCode key keyCode".split(" "),
    filter: function( event, original ) {

      // Add which for key events
      if ( event.which == null ) {
        event.which = original.charCode != null ? original.charCode : original.keyCode;
      }

      return event;
    }
  },

  mouseHooks: {
    props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
    filter: function( event, original ) {
      var eventDoc, doc, body,
        button = original.button;

      // Calculate pageX/Y if missing and clientX/Y available
      if ( event.pageX == null && original.clientX != null ) {
        eventDoc = event.target.ownerDocument || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
        event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
      }

      // Add which for click: 1 === left; 2 === middle; 3 === right
      // Note: button is not normalized, so don't use it
      if ( !event.which && button !== undefined ) {
        event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
      }

      return event;
    }
  },

  fix: function( event ) {
    if ( event[ jQuery.expando ] ) {
      return event;
    }

    // Create a writable copy of the event object and normalize some properties
    var i, prop, copy,
      type = event.type,
      originalEvent = event,
      fixHook = this.fixHooks[ type ];

    if ( !fixHook ) {
      this.fixHooks[ type ] = fixHook =
        rmouseEvent.test( type ) ? this.mouseHooks :
        rkeyEvent.test( type ) ? this.keyHooks :
        {};
    }
    copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

    event = new jQuery.Event( originalEvent );

    i = copy.length;
    while ( i-- ) {
      prop = copy[ i ];
      event[ prop ] = originalEvent[ prop ];
    }

    // Support: Cordova 2.5 (WebKit) (#13255)
    // All events should have a target; Cordova deviceready doesn't
    if ( !event.target ) {
      event.target = document;
    }

    // Support: Safari 6.0+, Chrome < 28
    // Target should not be a text node (#504, #13143)
    if ( event.target.nodeType === 3 ) {
      event.target = event.target.parentNode;
    }

    return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
  },

  special: {
    load: {
      // Prevent triggered image.load events from bubbling to window.load
      noBubble: true
    },
    focus: {
      // Fire native event if possible so blur/focus sequence is correct
      trigger: function() {
        if ( this !== safeActiveElement() && this.focus ) {
          this.focus();
          return false;
        }
      },
      delegateType: "focusin"
    },
    blur: {
      trigger: function() {
        if ( this === safeActiveElement() && this.blur ) {
          this.blur();
          return false;
        }
      },
      delegateType: "focusout"
    },
    click: {
      // For checkbox, fire native event so checked state will be right
      trigger: function() {
        if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
          this.click();
          return false;
        }
      },

      // For cross-browser consistency, don't fire native .click() on links
      _default: function( event ) {
        return jQuery.nodeName( event.target, "a" );
      }
    },

    beforeunload: {
      postDispatch: function( event ) {

        // Support: Firefox 20+
        // Firefox doesn't alert if the returnValue field is not set.
        if ( event.result !== undefined ) {
          event.originalEvent.returnValue = event.result;
        }
      }
    }
  },

  simulate: function( type, elem, event, bubble ) {
    // Piggyback on a donor event to simulate a different one.
    // Fake originalEvent to avoid donor's stopPropagation, but if the
    // simulated event prevents default then we do the same on the donor.
    var e = jQuery.extend(
      new jQuery.Event(),
      event,
      {
        type: type,
        isSimulated: true,
        originalEvent: {}
      }
    );
    if ( bubble ) {
      jQuery.event.trigger( e, null, elem );
    } else {
      jQuery.event.dispatch.call( elem, e );
    }
    if ( e.isDefaultPrevented() ) {
      event.preventDefault();
    }
  }
};

jQuery.removeEvent = function( elem, type, handle ) {
  if ( elem.removeEventListener ) {
    elem.removeEventListener( type, handle, false );
  }
};

jQuery.Event = function( src, props ) {
  // Allow instantiation without the 'new' keyword
  if ( !(this instanceof jQuery.Event) ) {
    return new jQuery.Event( src, props );
  }

  // Event object
  if ( src && src.type ) {
    this.originalEvent = src;
    this.type = src.type;

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    this.isDefaultPrevented = ( src.defaultPrevented ||
      src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

  // Event type
  } else {
    this.type = src;
  }

  // Put explicitly provided properties onto the event object
  if ( props ) {
    jQuery.extend( this, props );
  }

  // Create a timestamp if incoming event doesn't have one
  this.timeStamp = src && src.timeStamp || jQuery.now();

  // Mark it as fixed
  this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
  isDefaultPrevented: returnFalse,
  isPropagationStopped: returnFalse,
  isImmediatePropagationStopped: returnFalse,

  preventDefault: function() {
    var e = this.originalEvent;

    this.isDefaultPrevented = returnTrue;

    if ( e && e.preventDefault ) {
      e.preventDefault();
    }
  },
  stopPropagation: function() {
    var e = this.originalEvent;

    this.isPropagationStopped = returnTrue;

    if ( e && e.stopPropagation ) {
      e.stopPropagation();
    }
  },
  stopImmediatePropagation: function() {
    this.isImmediatePropagationStopped = returnTrue;
    this.stopPropagation();
  }
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({
  mouseenter: "mouseover",
  mouseleave: "mouseout"
}, function( orig, fix ) {
  jQuery.event.special[ orig ] = {
    delegateType: fix,
    bindType: fix,

    handle: function( event ) {
      var ret,
        target = this,
        related = event.relatedTarget,
        handleObj = event.handleObj;

      // For mousenter/leave call the handler if related is outside the target.
      // NB: No relatedTarget if the mouse left/entered the browser window
      if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
        event.type = handleObj.origType;
        ret = handleObj.handler.apply( this, arguments );
        event.type = fix;
      }
      return ret;
    }
  };
});

// Create "bubbling" focus and blur events
// Support: Firefox, Chrome, Safari
if ( !jQuery.support.focusinBubbles ) {
  jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

    // Attach a single capturing handler while someone wants focusin/focusout
    var attaches = 0,
      handler = function( event ) {
        jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
      };

    jQuery.event.special[ fix ] = {
      setup: function() {
        if ( attaches++ === 0 ) {
          document.addEventListener( orig, handler, true );
        }
      },
      teardown: function() {
        if ( --attaches === 0 ) {
          document.removeEventListener( orig, handler, true );
        }
      }
    };
  });
}

jQuery.fn.extend({

  on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
    var origFn, type;

    // Types can be a map of types/handlers
    if ( typeof types === "object" ) {
      // ( types-Object, selector, data )
      if ( typeof selector !== "string" ) {
        // ( types-Object, data )
        data = data || selector;
        selector = undefined;
      }
      for ( type in types ) {
        this.on( type, selector, data, types[ type ], one );
      }
      return this;
    }

    if ( data == null && fn == null ) {
      // ( types, fn )
      fn = selector;
      data = selector = undefined;
    } else if ( fn == null ) {
      if ( typeof selector === "string" ) {
        // ( types, selector, fn )
        fn = data;
        data = undefined;
      } else {
        // ( types, data, fn )
        fn = data;
        data = selector;
        selector = undefined;
      }
    }
    if ( fn === false ) {
      fn = returnFalse;
    } else if ( !fn ) {
      return this;
    }

    if ( one === 1 ) {
      origFn = fn;
      fn = function( event ) {
        // Can use an empty set, since event contains the info
        jQuery().off( event );
        return origFn.apply( this, arguments );
      };
      // Use same guid so caller can remove using origFn
      fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
    }
    return this.each( function() {
      jQuery.event.add( this, types, fn, data, selector );
    });
  },
  one: function( types, selector, data, fn ) {
    return this.on( types, selector, data, fn, 1 );
  },
  off: function( types, selector, fn ) {
    var handleObj, type;
    if ( types && types.preventDefault && types.handleObj ) {
      // ( event )  dispatched jQuery.Event
      handleObj = types.handleObj;
      jQuery( types.delegateTarget ).off(
        handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
        handleObj.selector,
        handleObj.handler
      );
      return this;
    }
    if ( typeof types === "object" ) {
      // ( types-object [, selector] )
      for ( type in types ) {
        this.off( type, selector, types[ type ] );
      }
      return this;
    }
    if ( selector === false || typeof selector === "function" ) {
      // ( types [, fn] )
      fn = selector;
      selector = undefined;
    }
    if ( fn === false ) {
      fn = returnFalse;
    }
    return this.each(function() {
      jQuery.event.remove( this, types, fn, selector );
    });
  },

  trigger: function( type, data ) {
    return this.each(function() {
      jQuery.event.trigger( type, data, this );
    });
  },
  triggerHandler: function( type, data ) {
    var elem = this[0];
    if ( elem ) {
      return jQuery.event.trigger( type, data, elem, true );
    }
  }
});
var isSimple = /^.[^:#\[\.,]*$/,
  rparentsprev = /^(?:parents|prev(?:Until|All))/,
  rneedsContext = jQuery.expr.match.needsContext,
  // methods guaranteed to produce a unique set when starting from a unique set
  guaranteedUnique = {
    children: true,
    contents: true,
    next: true,
    prev: true
  };

jQuery.fn.extend({
  find: function( selector ) {
    var i,
      ret = [],
      self = this,
      len = self.length;

    if ( typeof selector !== "string" ) {
      return this.pushStack( jQuery( selector ).filter(function() {
        for ( i = 0; i < len; i++ ) {
          if ( jQuery.contains( self[ i ], this ) ) {
            return true;
          }
        }
      }) );
    }

    for ( i = 0; i < len; i++ ) {
      jQuery.find( selector, self[ i ], ret );
    }

    // Needed because $( selector, context ) becomes $( context ).find( selector )
    ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
    ret.selector = this.selector ? this.selector + " " + selector : selector;
    return ret;
  },

  has: function( target ) {
    var targets = jQuery( target, this ),
      l = targets.length;

    return this.filter(function() {
      var i = 0;
      for ( ; i < l; i++ ) {
        if ( jQuery.contains( this, targets[i] ) ) {
          return true;
        }
      }
    });
  },

  not: function( selector ) {
    return this.pushStack( winnow(this, selector || [], true) );
  },

  filter: function( selector ) {
    return this.pushStack( winnow(this, selector || [], false) );
  },

  is: function( selector ) {
    return !!winnow(
      this,

      // If this is a positional/relative selector, check membership in the returned set
      // so $("p:first").is("p:last") won't return true for a doc with two "p".
      typeof selector === "string" && rneedsContext.test( selector ) ?
        jQuery( selector ) :
        selector || [],
      false
    ).length;
  },

  closest: function( selectors, context ) {
    var cur,
      i = 0,
      l = this.length,
      matched = [],
      pos = ( rneedsContext.test( selectors ) || typeof selectors !== "string" ) ?
        jQuery( selectors, context || this.context ) :
        0;

    for ( ; i < l; i++ ) {
      for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
        // Always skip document fragments
        if ( cur.nodeType < 11 && (pos ?
          pos.index(cur) > -1 :

          // Don't pass non-elements to Sizzle
          cur.nodeType === 1 &&
            jQuery.find.matchesSelector(cur, selectors)) ) {

          cur = matched.push( cur );
          break;
        }
      }
    }

    return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
  },

  // Determine the position of an element within
  // the matched set of elements
  index: function( elem ) {

    // No argument, return index in parent
    if ( !elem ) {
      return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
    }

    // index in selector
    if ( typeof elem === "string" ) {
      return core_indexOf.call( jQuery( elem ), this[ 0 ] );
    }

    // Locate the position of the desired element
    return core_indexOf.call( this,

      // If it receives a jQuery object, the first element is used
      elem.jquery ? elem[ 0 ] : elem
    );
  },

  add: function( selector, context ) {
    var set = typeof selector === "string" ?
        jQuery( selector, context ) :
        jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
      all = jQuery.merge( this.get(), set );

    return this.pushStack( jQuery.unique(all) );
  },

  addBack: function( selector ) {
    return this.add( selector == null ?
      this.prevObject : this.prevObject.filter(selector)
    );
  }
});

function sibling( cur, dir ) {
  while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}

  return cur;
}

jQuery.each({
  parent: function( elem ) {
    var parent = elem.parentNode;
    return parent && parent.nodeType !== 11 ? parent : null;
  },
  parents: function( elem ) {
    return jQuery.dir( elem, "parentNode" );
  },
  parentsUntil: function( elem, i, until ) {
    return jQuery.dir( elem, "parentNode", until );
  },
  next: function( elem ) {
    return sibling( elem, "nextSibling" );
  },
  prev: function( elem ) {
    return sibling( elem, "previousSibling" );
  },
  nextAll: function( elem ) {
    return jQuery.dir( elem, "nextSibling" );
  },
  prevAll: function( elem ) {
    return jQuery.dir( elem, "previousSibling" );
  },
  nextUntil: function( elem, i, until ) {
    return jQuery.dir( elem, "nextSibling", until );
  },
  prevUntil: function( elem, i, until ) {
    return jQuery.dir( elem, "previousSibling", until );
  },
  siblings: function( elem ) {
    return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
  },
  children: function( elem ) {
    return jQuery.sibling( elem.firstChild );
  },
  contents: function( elem ) {
    return elem.contentDocument || jQuery.merge( [], elem.childNodes );
  }
}, function( name, fn ) {
  jQuery.fn[ name ] = function( until, selector ) {
    var matched = jQuery.map( this, fn, until );

    if ( name.slice( -5 ) !== "Until" ) {
      selector = until;
    }

    if ( selector && typeof selector === "string" ) {
      matched = jQuery.filter( selector, matched );
    }

    if ( this.length > 1 ) {
      // Remove duplicates
      if ( !guaranteedUnique[ name ] ) {
        jQuery.unique( matched );
      }

      // Reverse order for parents* and prev-derivatives
      if ( rparentsprev.test( name ) ) {
        matched.reverse();
      }
    }

    return this.pushStack( matched );
  };
});

jQuery.extend({
  filter: function( expr, elems, not ) {
    var elem = elems[ 0 ];

    if ( not ) {
      expr = ":not(" + expr + ")";
    }

    return elems.length === 1 && elem.nodeType === 1 ?
      jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
      jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
        return elem.nodeType === 1;
      }));
  },

  dir: function( elem, dir, until ) {
    var matched = [],
      truncate = until !== undefined;

    while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
      if ( elem.nodeType === 1 ) {
        if ( truncate && jQuery( elem ).is( until ) ) {
          break;
        }
        matched.push( elem );
      }
    }
    return matched;
  },

  sibling: function( n, elem ) {
    var matched = [];

    for ( ; n; n = n.nextSibling ) {
      if ( n.nodeType === 1 && n !== elem ) {
        matched.push( n );
      }
    }

    return matched;
  }
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
  if ( jQuery.isFunction( qualifier ) ) {
    return jQuery.grep( elements, function( elem, i ) {
      /* jshint -W018 */
      return !!qualifier.call( elem, i, elem ) !== not;
    });

  }

  if ( qualifier.nodeType ) {
    return jQuery.grep( elements, function( elem ) {
      return ( elem === qualifier ) !== not;
    });

  }

  if ( typeof qualifier === "string" ) {
    if ( isSimple.test( qualifier ) ) {
      return jQuery.filter( qualifier, elements, not );
    }

    qualifier = jQuery.filter( qualifier, elements );
  }

  return jQuery.grep( elements, function( elem ) {
    return ( core_indexOf.call( qualifier, elem ) >= 0 ) !== not;
  });
}
var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
  rtagName = /<([\w:]+)/,
  rhtml = /<|&#?\w+;/,
  rnoInnerhtml = /<(?:script|style|link)/i,
  manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
  // checked="checked" or checked
  rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
  rscriptType = /^$|\/(?:java|ecma)script/i,
  rscriptTypeMasked = /^true\/(.*)/,
  rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

  // We have to close these tags to support XHTML (#13200)
  wrapMap = {

    // Support: IE 9
    option: [ 1, "<select multiple='multiple'>", "</select>" ],

    thead: [ 1, "<table>", "</table>" ],
    col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
    tr: [ 2, "<table><tbody>", "</tbody></table>" ],
    td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

    _default: [ 0, "", "" ]
  };

// Support: IE 9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

jQuery.fn.extend({
  text: function( value ) {
    return jQuery.access( this, function( value ) {
      return value === undefined ?
        jQuery.text( this ) :
        this.empty().append( ( this[ 0 ] && this[ 0 ].ownerDocument || document ).createTextNode( value ) );
    }, null, value, arguments.length );
  },

  append: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.appendChild( elem );
      }
    });
  },

  prepend: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
        var target = manipulationTarget( this, elem );
        target.insertBefore( elem, target.firstChild );
      }
    });
  },

  before: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this );
      }
    });
  },

  after: function() {
    return this.domManip( arguments, function( elem ) {
      if ( this.parentNode ) {
        this.parentNode.insertBefore( elem, this.nextSibling );
      }
    });
  },

  // keepData is for internal use only--do not document
  remove: function( selector, keepData ) {
    var elem,
      elems = selector ? jQuery.filter( selector, this ) : this,
      i = 0;

    for ( ; (elem = elems[i]) != null; i++ ) {
      if ( !keepData && elem.nodeType === 1 ) {
        jQuery.cleanData( getAll( elem ) );
      }

      if ( elem.parentNode ) {
        if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
          setGlobalEval( getAll( elem, "script" ) );
        }
        elem.parentNode.removeChild( elem );
      }
    }

    return this;
  },

  empty: function() {
    var elem,
      i = 0;

    for ( ; (elem = this[i]) != null; i++ ) {
      if ( elem.nodeType === 1 ) {

        // Prevent memory leaks
        jQuery.cleanData( getAll( elem, false ) );

        // Remove any remaining nodes
        elem.textContent = "";
      }
    }

    return this;
  },

  clone: function( dataAndEvents, deepDataAndEvents ) {
    dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
    deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

    return this.map( function () {
      return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
    });
  },

  html: function( value ) {
    return jQuery.access( this, function( value ) {
      var elem = this[ 0 ] || {},
        i = 0,
        l = this.length;

      if ( value === undefined && elem.nodeType === 1 ) {
        return elem.innerHTML;
      }

      // See if we can take a shortcut and just use innerHTML
      if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
        !wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

        value = value.replace( rxhtmlTag, "<$1></$2>" );

        try {
          for ( ; i < l; i++ ) {
            elem = this[ i ] || {};

            // Remove element nodes and prevent memory leaks
            if ( elem.nodeType === 1 ) {
              jQuery.cleanData( getAll( elem, false ) );
              elem.innerHTML = value;
            }
          }

          elem = 0;

        // If using innerHTML throws an exception, use the fallback method
        } catch( e ) {}
      }

      if ( elem ) {
        this.empty().append( value );
      }
    }, null, value, arguments.length );
  },

  replaceWith: function() {
    var
      // Snapshot the DOM in case .domManip sweeps something relevant into its fragment
      args = jQuery.map( this, function( elem ) {
        return [ elem.nextSibling, elem.parentNode ];
      }),
      i = 0;

    // Make the changes, replacing each context element with the new content
    this.domManip( arguments, function( elem ) {
      var next = args[ i++ ],
        parent = args[ i++ ];

      if ( parent ) {
        // Don't use the snapshot next if it has moved (#13810)
        if ( next && next.parentNode !== parent ) {
          next = this.nextSibling;
        }
        jQuery( this ).remove();
        parent.insertBefore( elem, next );
      }
    // Allow new content to include elements from the context set
    }, true );

    // Force removal if there was no new content (e.g., from empty arguments)
    return i ? this : this.remove();
  },

  detach: function( selector ) {
    return this.remove( selector, true );
  },

  domManip: function( args, callback, allowIntersection ) {

    // Flatten any nested arrays
    args = core_concat.apply( [], args );

    var fragment, first, scripts, hasScripts, node, doc,
      i = 0,
      l = this.length,
      set = this,
      iNoClone = l - 1,
      value = args[ 0 ],
      isFunction = jQuery.isFunction( value );

    // We can't cloneNode fragments that contain checked, in WebKit
    if ( isFunction || !( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) ) {
      return this.each(function( index ) {
        var self = set.eq( index );
        if ( isFunction ) {
          args[ 0 ] = value.call( this, index, self.html() );
        }
        self.domManip( args, callback, allowIntersection );
      });
    }

    if ( l ) {
      fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, !allowIntersection && this );
      first = fragment.firstChild;

      if ( fragment.childNodes.length === 1 ) {
        fragment = first;
      }

      if ( first ) {
        scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
        hasScripts = scripts.length;

        // Use the original fragment for the last item instead of the first because it can end up
        // being emptied incorrectly in certain situations (#8070).
        for ( ; i < l; i++ ) {
          node = fragment;

          if ( i !== iNoClone ) {
            node = jQuery.clone( node, true, true );

            // Keep references to cloned scripts for later restoration
            if ( hasScripts ) {
              // Support: QtWebKit
              // jQuery.merge because core_push.apply(_, arraylike) throws
              jQuery.merge( scripts, getAll( node, "script" ) );
            }
          }

          callback.call( this[ i ], node, i );
        }

        if ( hasScripts ) {
          doc = scripts[ scripts.length - 1 ].ownerDocument;

          // Reenable scripts
          jQuery.map( scripts, restoreScript );

          // Evaluate executable scripts on first document insertion
          for ( i = 0; i < hasScripts; i++ ) {
            node = scripts[ i ];
            if ( rscriptType.test( node.type || "" ) &&
              !data_priv.access( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

              if ( node.src ) {
                // Hope ajax is available...
                jQuery._evalUrl( node.src );
              } else {
                jQuery.globalEval( node.textContent.replace( rcleanScript, "" ) );
              }
            }
          }
        }
      }
    }

    return this;
  }
});

jQuery.each({
  appendTo: "append",
  prependTo: "prepend",
  insertBefore: "before",
  insertAfter: "after",
  replaceAll: "replaceWith"
}, function( name, original ) {
  jQuery.fn[ name ] = function( selector ) {
    var elems,
      ret = [],
      insert = jQuery( selector ),
      last = insert.length - 1,
      i = 0;

    for ( ; i <= last; i++ ) {
      elems = i === last ? this : this.clone( true );
      jQuery( insert[ i ] )[ original ]( elems );

      // Support: QtWebKit
      // .get() because core_push.apply(_, arraylike) throws
      core_push.apply( ret, elems.get() );
    }

    return this.pushStack( ret );
  };
});

jQuery.extend({
  clone: function( elem, dataAndEvents, deepDataAndEvents ) {
    var i, l, srcElements, destElements,
      clone = elem.cloneNode( true ),
      inPage = jQuery.contains( elem.ownerDocument, elem );

    // Support: IE >= 9
    // Fix Cloning issues
    if ( !jQuery.support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) && !jQuery.isXMLDoc( elem ) ) {

      // We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
      destElements = getAll( clone );
      srcElements = getAll( elem );

      for ( i = 0, l = srcElements.length; i < l; i++ ) {
        fixInput( srcElements[ i ], destElements[ i ] );
      }
    }

    // Copy the events from the original to the clone
    if ( dataAndEvents ) {
      if ( deepDataAndEvents ) {
        srcElements = srcElements || getAll( elem );
        destElements = destElements || getAll( clone );

        for ( i = 0, l = srcElements.length; i < l; i++ ) {
          cloneCopyEvent( srcElements[ i ], destElements[ i ] );
        }
      } else {
        cloneCopyEvent( elem, clone );
      }
    }

    // Preserve script evaluation history
    destElements = getAll( clone, "script" );
    if ( destElements.length > 0 ) {
      setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
    }

    // Return the cloned set
    return clone;
  },

  buildFragment: function( elems, context, scripts, selection ) {
    var elem, tmp, tag, wrap, contains, j,
      i = 0,
      l = elems.length,
      fragment = context.createDocumentFragment(),
      nodes = [];

    for ( ; i < l; i++ ) {
      elem = elems[ i ];

      if ( elem || elem === 0 ) {

        // Add nodes directly
        if ( jQuery.type( elem ) === "object" ) {
          // Support: QtWebKit
          // jQuery.merge because core_push.apply(_, arraylike) throws
          jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

        // Convert non-html into a text node
        } else if ( !rhtml.test( elem ) ) {
          nodes.push( context.createTextNode( elem ) );

        // Convert html into DOM nodes
        } else {
          tmp = tmp || fragment.appendChild( context.createElement("div") );

          // Deserialize a standard representation
          tag = ( rtagName.exec( elem ) || ["", ""] )[ 1 ].toLowerCase();
          wrap = wrapMap[ tag ] || wrapMap._default;
          tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[ 2 ];

          // Descend through wrappers to the right content
          j = wrap[ 0 ];
          while ( j-- ) {
            tmp = tmp.lastChild;
          }

          // Support: QtWebKit
          // jQuery.merge because core_push.apply(_, arraylike) throws
          jQuery.merge( nodes, tmp.childNodes );

          // Remember the top-level container
          tmp = fragment.firstChild;

          // Fixes #12346
          // Support: Webkit, IE
          tmp.textContent = "";
        }
      }
    }

    // Remove wrapper from fragment
    fragment.textContent = "";

    i = 0;
    while ( (elem = nodes[ i++ ]) ) {

      // #4087 - If origin and destination elements are the same, and this is
      // that element, do not do anything
      if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
        continue;
      }

      contains = jQuery.contains( elem.ownerDocument, elem );

      // Append to fragment
      tmp = getAll( fragment.appendChild( elem ), "script" );

      // Preserve script evaluation history
      if ( contains ) {
        setGlobalEval( tmp );
      }

      // Capture executables
      if ( scripts ) {
        j = 0;
        while ( (elem = tmp[ j++ ]) ) {
          if ( rscriptType.test( elem.type || "" ) ) {
            scripts.push( elem );
          }
        }
      }
    }

    return fragment;
  },

  cleanData: function( elems ) {
    var data, elem, events, type, key, j,
      special = jQuery.event.special,
      i = 0;

    for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
      if ( Data.accepts( elem ) ) {
        key = elem[ data_priv.expando ];

        if ( key && (data = data_priv.cache[ key ]) ) {
          events = Object.keys( data.events || {} );
          if ( events.length ) {
            for ( j = 0; (type = events[j]) !== undefined; j++ ) {
              if ( special[ type ] ) {
                jQuery.event.remove( elem, type );

              // This is a shortcut to avoid jQuery.event.remove's overhead
              } else {
                jQuery.removeEvent( elem, type, data.handle );
              }
            }
          }
          if ( data_priv.cache[ key ] ) {
            // Discard any remaining `private` data
            delete data_priv.cache[ key ];
          }
        }
      }
      // Discard any remaining `user` data
      delete data_user.cache[ elem[ data_user.expando ] ];
    }
  },

  _evalUrl: function( url ) {
    return jQuery.ajax({
      url: url,
      type: "GET",
      dataType: "script",
      async: false,
      global: false,
      "throws": true
    });
  }
});

// Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
  return jQuery.nodeName( elem, "table" ) &&
    jQuery.nodeName( content.nodeType === 1 ? content : content.firstChild, "tr" ) ?

    elem.getElementsByTagName("tbody")[0] ||
      elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
    elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
  elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
  return elem;
}
function restoreScript( elem ) {
  var match = rscriptTypeMasked.exec( elem.type );

  if ( match ) {
    elem.type = match[ 1 ];
  } else {
    elem.removeAttribute("type");
  }

  return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
  var l = elems.length,
    i = 0;

  for ( ; i < l; i++ ) {
    data_priv.set(
      elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
    );
  }
}

function cloneCopyEvent( src, dest ) {
  var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

  if ( dest.nodeType !== 1 ) {
    return;
  }

  // 1. Copy private data: events, handlers, etc.
  if ( data_priv.hasData( src ) ) {
    pdataOld = data_priv.access( src );
    pdataCur = data_priv.set( dest, pdataOld );
    events = pdataOld.events;

    if ( events ) {
      delete pdataCur.handle;
      pdataCur.events = {};

      for ( type in events ) {
        for ( i = 0, l = events[ type ].length; i < l; i++ ) {
          jQuery.event.add( dest, type, events[ type ][ i ] );
        }
      }
    }
  }

  // 2. Copy user data
  if ( data_user.hasData( src ) ) {
    udataOld = data_user.access( src );
    udataCur = jQuery.extend( {}, udataOld );

    data_user.set( dest, udataCur );
  }
}


function getAll( context, tag ) {
  var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
      context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
      [];

  return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
    jQuery.merge( [ context ], ret ) :
    ret;
}

// Support: IE >= 9
function fixInput( src, dest ) {
  var nodeName = dest.nodeName.toLowerCase();

  // Fails to persist the checked state of a cloned checkbox or radio button.
  if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
    dest.checked = src.checked;

  // Fails to return the selected option to the default selected state when cloning options
  } else if ( nodeName === "input" || nodeName === "textarea" ) {
    dest.defaultValue = src.defaultValue;
  }
}
var r20 = /%20/g,
  rbracket = /\[\]$/,
  rCRLF = /\r?\n/g,
  rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
  rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
  serialize: function() {
    return jQuery.param( this.serializeArray() );
  },
  serializeArray: function() {
    return this.map(function(){
      // Can add propHook for "elements" to filter or add form elements
      var elements = jQuery.prop( this, "elements" );
      return elements ? jQuery.makeArray( elements ) : this;
    })
    .filter(function(){
      var type = this.type;
      // Use .is(":disabled") so that fieldset[disabled] works
      return this.name && !jQuery( this ).is( ":disabled" ) &&
        rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
        ( this.checked || !manipulation_rcheckableType.test( type ) );
    })
    .map(function( i, elem ){
      var val = jQuery( this ).val();

      return val == null ?
        null :
        jQuery.isArray( val ) ?
          jQuery.map( val, function( val ){
            return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
          }) :
          { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
    }).get();
  }
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
  var prefix,
    s = [],
    add = function( key, value ) {
      // If value is a function, invoke it and return its value
      value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
      s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
    };

  // Set traditional to true for jQuery <= 1.3.2 behavior.
  if ( traditional === undefined ) {
    traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
  }

  // If an array was passed in, assume that it is an array of form elements.
  if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
    // Serialize the form elements
    jQuery.each( a, function() {
      add( this.name, this.value );
    });

  } else {
    // If traditional, encode the "old" way (the way 1.3.2 or older
    // did it), otherwise encode params recursively.
    for ( prefix in a ) {
      buildParams( prefix, a[ prefix ], traditional, add );
    }
  }

  // Return the resulting serialization
  return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
  var name;

  if ( jQuery.isArray( obj ) ) {
    // Serialize array item.
    jQuery.each( obj, function( i, v ) {
      if ( traditional || rbracket.test( prefix ) ) {
        // Treat each array item as a scalar.
        add( prefix, v );

      } else {
        // Item is non-scalar (array or object), encode its numeric index.
        buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
      }
    });

  } else if ( !traditional && jQuery.type( obj ) === "object" ) {
    // Serialize object item.
    for ( name in obj ) {
      buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
    }

  } else {
    // Serialize scalar item.
    add( prefix, obj );
  }
}
var
  // Document location
  ajaxLocParts,
  ajaxLocation,

  ajax_nonce = jQuery.now(),

  ajax_rquery = /\?/,
  rhash = /#.*$/,
  rts = /([?&])_=[^&]*/,
  rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
  // #7653, #8125, #8152: local protocol detection
  rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
  rnoContent = /^(?:GET|HEAD)$/,
  rprotocol = /^\/\//,
  rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

  // Keep a copy of the old load method
  _load = jQuery.fn.load,

  /* Prefilters
   * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
   * 2) These are called:
   *    - BEFORE asking for a transport
   *    - AFTER param serialization (s.data is a string if s.processData is true)
   * 3) key is the dataType
   * 4) the catchall symbol "*" can be used
   * 5) execution will start with transport dataType and THEN continue down to "*" if needed
   */
  prefilters = {},

  /* Transports bindings
   * 1) key is the dataType
   * 2) the catchall symbol "*" can be used
   * 3) selection will start with transport dataType and THEN go to "*" if needed
   */
  transports = {},

  // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
  allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
  ajaxLocation = location.href;
} catch( e ) {
  // Use the href attribute of an A element
  // since IE will modify it given document.location
  ajaxLocation = document.createElement( "a" );
  ajaxLocation.href = "";
  ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

  // dataTypeExpression is optional and defaults to "*"
  return function( dataTypeExpression, func ) {

    if ( typeof dataTypeExpression !== "string" ) {
      func = dataTypeExpression;
      dataTypeExpression = "*";
    }

    var dataType,
      i = 0,
      dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

    if ( jQuery.isFunction( func ) ) {
      // For each dataType in the dataTypeExpression
      while ( (dataType = dataTypes[i++]) ) {
        // Prepend if requested
        if ( dataType[0] === "+" ) {
          dataType = dataType.slice( 1 ) || "*";
          (structure[ dataType ] = structure[ dataType ] || []).unshift( func );

        // Otherwise append
        } else {
          (structure[ dataType ] = structure[ dataType ] || []).push( func );
        }
      }
    }
  };
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

  var inspected = {},
    seekingTransport = ( structure === transports );

  function inspect( dataType ) {
    var selected;
    inspected[ dataType ] = true;
    jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
      var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
      if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
        options.dataTypes.unshift( dataTypeOrTransport );
        inspect( dataTypeOrTransport );
        return false;
      } else if ( seekingTransport ) {
        return !( selected = dataTypeOrTransport );
      }
    });
    return selected;
  }

  return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
  var key, deep,
    flatOptions = jQuery.ajaxSettings.flatOptions || {};

  for ( key in src ) {
    if ( src[ key ] !== undefined ) {
      ( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
    }
  }
  if ( deep ) {
    jQuery.extend( true, target, deep );
  }

  return target;
}

jQuery.fn.load = function( url, params, callback ) {
  if ( typeof url !== "string" && _load ) {
    return _load.apply( this, arguments );
  }

  var selector, type, response,
    self = this,
    off = url.indexOf(" ");

  if ( off >= 0 ) {
    selector = url.slice( off );
    url = url.slice( 0, off );
  }

  // If it's a function
  if ( jQuery.isFunction( params ) ) {

    // We assume that it's the callback
    callback = params;
    params = undefined;

  // Otherwise, build a param string
  } else if ( params && typeof params === "object" ) {
    type = "POST";
  }

  // If we have elements to modify, make the request
  if ( self.length > 0 ) {
    jQuery.ajax({
      url: url,

      // if "type" variable is undefined, then "GET" method will be used
      type: type,
      dataType: "html",
      data: params
    }).done(function( responseText ) {

      // Save response for use in complete callback
      response = arguments;

      self.html( selector ?

        // If a selector was specified, locate the right elements in a dummy div
        // Exclude scripts to avoid IE 'Permission Denied' errors
        jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

        // Otherwise use the full result
        responseText );

    }).complete( callback && function( jqXHR, status ) {
      self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
    });
  }

  return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
  jQuery.fn[ type ] = function( fn ){
    return this.on( type, fn );
  };
});

jQuery.extend({

  // Counter for holding the number of active queries
  active: 0,

  // Last-Modified header cache for next request
  lastModified: {},
  etag: {},

  ajaxSettings: {
    url: ajaxLocation,
    type: "GET",
    isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
    global: true,
    processData: true,
    async: true,
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    /*
    timeout: 0,
    data: null,
    dataType: null,
    username: null,
    password: null,
    cache: null,
    throws: false,
    traditional: false,
    headers: {},
    */

    accepts: {
      "*": allTypes,
      text: "text/plain",
      html: "text/html",
      xml: "application/xml, text/xml",
      json: "application/json, text/javascript"
    },

    contents: {
      xml: /xml/,
      html: /html/,
      json: /json/
    },

    responseFields: {
      xml: "responseXML",
      text: "responseText",
      json: "responseJSON"
    },

    // Data converters
    // Keys separate source (or catchall "*") and destination types with a single space
    converters: {

      // Convert anything to text
      "* text": String,

      // Text to html (true = no transformation)
      "text html": true,

      // Evaluate text as a json expression
      "text json": jQuery.parseJSON,

      // Parse text as xml
      "text xml": jQuery.parseXML
    },

    // For options that shouldn't be deep extended:
    // you can add your own custom options here if
    // and when you create one that shouldn't be
    // deep extended (see ajaxExtend)
    flatOptions: {
      url: true,
      context: true
    }
  },

  // Creates a full fledged settings object into target
  // with both ajaxSettings and settings fields.
  // If target is omitted, writes into ajaxSettings.
  ajaxSetup: function( target, settings ) {
    return settings ?

      // Building a settings object
      ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

      // Extending ajaxSettings
      ajaxExtend( jQuery.ajaxSettings, target );
  },

  ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
  ajaxTransport: addToPrefiltersOrTransports( transports ),

  // Main method
  ajax: function( url, options ) {

    // If url is an object, simulate pre-1.5 signature
    if ( typeof url === "object" ) {
      options = url;
      url = undefined;
    }

    // Force options to be an object
    options = options || {};

    var transport,
      // URL without anti-cache param
      cacheURL,
      // Response headers
      responseHeadersString,
      responseHeaders,
      // timeout handle
      timeoutTimer,
      // Cross-domain detection vars
      parts,
      // To know if global events are to be dispatched
      fireGlobals,
      // Loop variable
      i,
      // Create the final options object
      s = jQuery.ajaxSetup( {}, options ),
      // Callbacks context
      callbackContext = s.context || s,
      // Context for global events is callbackContext if it is a DOM node or jQuery collection
      globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
        jQuery( callbackContext ) :
        jQuery.event,
      // Deferreds
      deferred = jQuery.Deferred(),
      completeDeferred = jQuery.Callbacks("once memory"),
      // Status-dependent callbacks
      statusCode = s.statusCode || {},
      // Headers (they are sent all at once)
      requestHeaders = {},
      requestHeadersNames = {},
      // The jqXHR state
      state = 0,
      // Default abort message
      strAbort = "canceled",
      // Fake xhr
      jqXHR = {
        readyState: 0,

        // Builds headers hashtable if needed
        getResponseHeader: function( key ) {
          var match;
          if ( state === 2 ) {
            if ( !responseHeaders ) {
              responseHeaders = {};
              while ( (match = rheaders.exec( responseHeadersString )) ) {
                responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
              }
            }
            match = responseHeaders[ key.toLowerCase() ];
          }
          return match == null ? null : match;
        },

        // Raw string
        getAllResponseHeaders: function() {
          return state === 2 ? responseHeadersString : null;
        },

        // Caches the header
        setRequestHeader: function( name, value ) {
          var lname = name.toLowerCase();
          if ( !state ) {
            name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
            requestHeaders[ name ] = value;
          }
          return this;
        },

        // Overrides response content-type header
        overrideMimeType: function( type ) {
          if ( !state ) {
            s.mimeType = type;
          }
          return this;
        },

        // Status-dependent callbacks
        statusCode: function( map ) {
          var code;
          if ( map ) {
            if ( state < 2 ) {
              for ( code in map ) {
                // Lazy-add the new callback in a way that preserves old ones
                statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
              }
            } else {
              // Execute the appropriate callbacks
              jqXHR.always( map[ jqXHR.status ] );
            }
          }
          return this;
        },

        // Cancel the request
        abort: function( statusText ) {
          var finalText = statusText || strAbort;
          if ( transport ) {
            transport.abort( finalText );
          }
          done( 0, finalText );
          return this;
        }
      };

    // Attach deferreds
    deferred.promise( jqXHR ).complete = completeDeferred.add;
    jqXHR.success = jqXHR.done;
    jqXHR.error = jqXHR.fail;

    // Remove hash character (#7531: and string promotion)
    // Add protocol if not provided (prefilters might expect it)
    // Handle falsy url in the settings object (#10093: consistency with old signature)
    // We also use the url parameter if available
    s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
      .replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

    // Alias method option to type as per ticket #12004
    s.type = options.method || options.type || s.method || s.type;

    // Extract dataTypes list
    s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

    // A cross-domain request is in order when we have a protocol:host:port mismatch
    if ( s.crossDomain == null ) {
      parts = rurl.exec( s.url.toLowerCase() );
      s.crossDomain = !!( parts &&
        ( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
          ( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
            ( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
      );
    }

    // Convert data if not already a string
    if ( s.data && s.processData && typeof s.data !== "string" ) {
      s.data = jQuery.param( s.data, s.traditional );
    }

    // Apply prefilters
    inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

    // If request was aborted inside a prefilter, stop there
    if ( state === 2 ) {
      return jqXHR;
    }

    // We can fire global events as of now if asked to
    fireGlobals = s.global;

    // Watch for a new set of requests
    if ( fireGlobals && jQuery.active++ === 0 ) {
      jQuery.event.trigger("ajaxStart");
    }

    // Uppercase the type
    s.type = s.type.toUpperCase();

    // Determine if request has content
    s.hasContent = !rnoContent.test( s.type );

    // Save the URL in case we're toying with the If-Modified-Since
    // and/or If-None-Match header later on
    cacheURL = s.url;

    // More options handling for requests with no content
    if ( !s.hasContent ) {

      // If data is available, append data to url
      if ( s.data ) {
        cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
        // #9682: remove data so that it's not used in an eventual retry
        delete s.data;
      }

      // Add anti-cache in url if needed
      if ( s.cache === false ) {
        s.url = rts.test( cacheURL ) ?

          // If there is already a '_' parameter, set its value
          cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

          // Otherwise add one to the end
          cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
      }
    }

    // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
    if ( s.ifModified ) {
      if ( jQuery.lastModified[ cacheURL ] ) {
        jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
      }
      if ( jQuery.etag[ cacheURL ] ) {
        jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
      }
    }

    // Set the correct header, if data is being sent
    if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
      jqXHR.setRequestHeader( "Content-Type", s.contentType );
    }

    // Set the Accepts header for the server, depending on the dataType
    jqXHR.setRequestHeader(
      "Accept",
      s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
        s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
        s.accepts[ "*" ]
    );

    // Check for headers option
    for ( i in s.headers ) {
      jqXHR.setRequestHeader( i, s.headers[ i ] );
    }

    // Allow custom headers/mimetypes and early abort
    if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
      // Abort if not done already and return
      return jqXHR.abort();
    }

    // aborting is no longer a cancellation
    strAbort = "abort";

    // Install callbacks on deferreds
    for ( i in { success: 1, error: 1, complete: 1 } ) {
      jqXHR[ i ]( s[ i ] );
    }

    // Get transport
    transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

    // If no transport, we auto-abort
    if ( !transport ) {
      done( -1, "No Transport" );
    } else {
      jqXHR.readyState = 1;

      // Send global event
      if ( fireGlobals ) {
        globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
      }
      // Timeout
      if ( s.async && s.timeout > 0 ) {
        timeoutTimer = setTimeout(function() {
          jqXHR.abort("timeout");
        }, s.timeout );
      }

      try {
        state = 1;
        transport.send( requestHeaders, done );
      } catch ( e ) {
        // Propagate exception as error if not done
        if ( state < 2 ) {
          done( -1, e );
        // Simply rethrow otherwise
        } else {
          throw e;
        }
      }
    }

    // Callback for when everything is done
    function done( status, nativeStatusText, responses, headers ) {
      var isSuccess, success, error, response, modified,
        statusText = nativeStatusText;

      // Called once
      if ( state === 2 ) {
        return;
      }

      // State is "done" now
      state = 2;

      // Clear timeout if it exists
      if ( timeoutTimer ) {
        clearTimeout( timeoutTimer );
      }

      // Dereference transport for early garbage collection
      // (no matter how long the jqXHR object will be used)
      transport = undefined;

      // Cache response headers
      responseHeadersString = headers || "";

      // Set readyState
      jqXHR.readyState = status > 0 ? 4 : 0;

      // Determine if successful
      isSuccess = status >= 200 && status < 300 || status === 304;

      // Get response data
      if ( responses ) {
        response = ajaxHandleResponses( s, jqXHR, responses );
      }

      // Convert no matter what (that way responseXXX fields are always set)
      response = ajaxConvert( s, response, jqXHR, isSuccess );

      // If successful, handle type chaining
      if ( isSuccess ) {

        // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
        if ( s.ifModified ) {
          modified = jqXHR.getResponseHeader("Last-Modified");
          if ( modified ) {
            jQuery.lastModified[ cacheURL ] = modified;
          }
          modified = jqXHR.getResponseHeader("etag");
          if ( modified ) {
            jQuery.etag[ cacheURL ] = modified;
          }
        }

        // if no content
        if ( status === 204 || s.type === "HEAD" ) {
          statusText = "nocontent";

        // if not modified
        } else if ( status === 304 ) {
          statusText = "notmodified";

        // If we have data, let's convert it
        } else {
          statusText = response.state;
          success = response.data;
          error = response.error;
          isSuccess = !error;
        }
      } else {
        // We extract error from statusText
        // then normalize statusText and status for non-aborts
        error = statusText;
        if ( status || !statusText ) {
          statusText = "error";
          if ( status < 0 ) {
            status = 0;
          }
        }
      }

      // Set data for the fake xhr object
      jqXHR.status = status;
      jqXHR.statusText = ( nativeStatusText || statusText ) + "";

      // Success/Error
      if ( isSuccess ) {
        deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
      } else {
        deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
      }

      // Status-dependent callbacks
      jqXHR.statusCode( statusCode );
      statusCode = undefined;

      if ( fireGlobals ) {
        globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
          [ jqXHR, s, isSuccess ? success : error ] );
      }

      // Complete
      completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

      if ( fireGlobals ) {
        globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
        // Handle the global AJAX counter
        if ( !( --jQuery.active ) ) {
          jQuery.event.trigger("ajaxStop");
        }
      }
    }

    return jqXHR;
  },

  getJSON: function( url, data, callback ) {
    return jQuery.get( url, data, callback, "json" );
  },

  getScript: function( url, callback ) {
    return jQuery.get( url, undefined, callback, "script" );
  }
});

jQuery.each( [ "get", "post" ], function( i, method ) {
  jQuery[ method ] = function( url, data, callback, type ) {
    // shift arguments if data argument was omitted
    if ( jQuery.isFunction( data ) ) {
      type = type || callback;
      callback = data;
      data = undefined;
    }

    return jQuery.ajax({
      url: url,
      type: method,
      dataType: type,
      data: data,
      success: callback
    });
  };
});

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

  var ct, type, finalDataType, firstDataType,
    contents = s.contents,
    dataTypes = s.dataTypes;

  // Remove auto dataType and get content-type in the process
  while( dataTypes[ 0 ] === "*" ) {
    dataTypes.shift();
    if ( ct === undefined ) {
      ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
    }
  }

  // Check if we're dealing with a known content-type
  if ( ct ) {
    for ( type in contents ) {
      if ( contents[ type ] && contents[ type ].test( ct ) ) {
        dataTypes.unshift( type );
        break;
      }
    }
  }

  // Check to see if we have a response for the expected dataType
  if ( dataTypes[ 0 ] in responses ) {
    finalDataType = dataTypes[ 0 ];
  } else {
    // Try convertible dataTypes
    for ( type in responses ) {
      if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
        finalDataType = type;
        break;
      }
      if ( !firstDataType ) {
        firstDataType = type;
      }
    }
    // Or just use first one
    finalDataType = finalDataType || firstDataType;
  }

  // If we found a dataType
  // We add the dataType to the list if needed
  // and return the corresponding response
  if ( finalDataType ) {
    if ( finalDataType !== dataTypes[ 0 ] ) {
      dataTypes.unshift( finalDataType );
    }
    return responses[ finalDataType ];
  }
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
  var conv2, current, conv, tmp, prev,
    converters = {},
    // Work with a copy of dataTypes in case we need to modify it for conversion
    dataTypes = s.dataTypes.slice();

  // Create converters map with lowercased keys
  if ( dataTypes[ 1 ] ) {
    for ( conv in s.converters ) {
      converters[ conv.toLowerCase() ] = s.converters[ conv ];
    }
  }

  current = dataTypes.shift();

  // Convert to each sequential dataType
  while ( current ) {

    if ( s.responseFields[ current ] ) {
      jqXHR[ s.responseFields[ current ] ] = response;
    }

    // Apply the dataFilter if provided
    if ( !prev && isSuccess && s.dataFilter ) {
      response = s.dataFilter( response, s.dataType );
    }

    prev = current;
    current = dataTypes.shift();

    if ( current ) {

    // There's only work to do if current dataType is non-auto
      if ( current === "*" ) {

        current = prev;

      // Convert response if prev dataType is non-auto and differs from current
      } else if ( prev !== "*" && prev !== current ) {

        // Seek a direct converter
        conv = converters[ prev + " " + current ] || converters[ "* " + current ];

        // If none found, seek a pair
        if ( !conv ) {
          for ( conv2 in converters ) {

            // If conv2 outputs current
            tmp = conv2.split( " " );
            if ( tmp[ 1 ] === current ) {

              // If prev can be converted to accepted input
              conv = converters[ prev + " " + tmp[ 0 ] ] ||
                converters[ "* " + tmp[ 0 ] ];
              if ( conv ) {
                // Condense equivalence converters
                if ( conv === true ) {
                  conv = converters[ conv2 ];

                // Otherwise, insert the intermediate dataType
                } else if ( converters[ conv2 ] !== true ) {
                  current = tmp[ 0 ];
                  dataTypes.unshift( tmp[ 1 ] );
                }
                break;
              }
            }
          }
        }

        // Apply converter (if not an equivalence)
        if ( conv !== true ) {

          // Unless errors are allowed to bubble, catch and return them
          if ( conv && s[ "throws" ] ) {
            response = conv( response );
          } else {
            try {
              response = conv( response );
            } catch ( e ) {
              return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
            }
          }
        }
      }
    }
  }

  return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
  accepts: {
    script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
  },
  contents: {
    script: /(?:java|ecma)script/
  },
  converters: {
    "text script": function( text ) {
      jQuery.globalEval( text );
      return text;
    }
  }
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
  if ( s.cache === undefined ) {
    s.cache = false;
  }
  if ( s.crossDomain ) {
    s.type = "GET";
  }
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
  // This transport only deals with cross domain requests
  if ( s.crossDomain ) {
    var script, callback;
    return {
      send: function( _, complete ) {
        script = jQuery("<script>").prop({
          async: true,
          charset: s.scriptCharset,
          src: s.url
        }).on(
          "load error",
          callback = function( evt ) {
            script.remove();
            callback = null;
            if ( evt ) {
              complete( evt.type === "error" ? 404 : 200, evt.type );
            }
          }
        );
        document.head.appendChild( script[ 0 ] );
      },
      abort: function() {
        if ( callback ) {
          callback();
        }
      }
    };
  }
});
var oldCallbacks = [],
  rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
  jsonp: "callback",
  jsonpCallback: function() {
    var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
    this[ callback ] = true;
    return callback;
  }
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

  var callbackName, overwritten, responseContainer,
    jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
      "url" :
      typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
    );

  // Handle iff the expected data type is "jsonp" or we have a parameter to set
  if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

    // Get callback name, remembering preexisting value associated with it
    callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
      s.jsonpCallback() :
      s.jsonpCallback;

    // Insert callback into url or form data
    if ( jsonProp ) {
      s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
    } else if ( s.jsonp !== false ) {
      s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
    }

    // Use data converter to retrieve json after script execution
    s.converters["script json"] = function() {
      if ( !responseContainer ) {
        jQuery.error( callbackName + " was not called" );
      }
      return responseContainer[ 0 ];
    };

    // force json dataType
    s.dataTypes[ 0 ] = "json";

    // Install callback
    overwritten = window[ callbackName ];
    window[ callbackName ] = function() {
      responseContainer = arguments;
    };

    // Clean-up function (fires after converters)
    jqXHR.always(function() {
      // Restore preexisting value
      window[ callbackName ] = overwritten;

      // Save back as free
      if ( s[ callbackName ] ) {
        // make sure that re-using the options doesn't screw things around
        s.jsonpCallback = originalSettings.jsonpCallback;

        // save the callback name for future use
        oldCallbacks.push( callbackName );
      }

      // Call if it was a function and we have a response
      if ( responseContainer && jQuery.isFunction( overwritten ) ) {
        overwritten( responseContainer[ 0 ] );
      }

      responseContainer = overwritten = undefined;
    });

    // Delegate to script
    return "script";
  }
});
jQuery.ajaxSettings.xhr = function() {
  try {
    return new XMLHttpRequest();
  } catch( e ) {}
};

var xhrSupported = jQuery.ajaxSettings.xhr(),
  xhrSuccessStatus = {
    // file protocol always yields status code 0, assume 200
    0: 200,
    // Support: IE9
    // #1450: sometimes IE returns 1223 when it should be 204
    1223: 204
  },
  // Support: IE9
  // We need to keep track of outbound xhr and abort them manually
  // because IE is not smart enough to do it all by itself
  xhrId = 0,
  xhrCallbacks = {};

if ( window.ActiveXObject ) {
  jQuery( window ).on( "unload", function() {
    for( var key in xhrCallbacks ) {
      xhrCallbacks[ key ]();
    }
    xhrCallbacks = undefined;
  });
}

jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
jQuery.support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
  var callback;
  // Cross domain only allowed if supported through XMLHttpRequest
  if ( jQuery.support.cors || xhrSupported && !options.crossDomain ) {
    return {
      send: function( headers, complete ) {
        var i, id,
          xhr = options.xhr();
        xhr.open( options.type, options.url, options.async, options.username, options.password );
        // Apply custom fields if provided
        if ( options.xhrFields ) {
          for ( i in options.xhrFields ) {
            xhr[ i ] = options.xhrFields[ i ];
          }
        }
        // Override mime type if needed
        if ( options.mimeType && xhr.overrideMimeType ) {
          xhr.overrideMimeType( options.mimeType );
        }
        // X-Requested-With header
        // For cross-domain requests, seeing as conditions for a preflight are
        // akin to a jigsaw puzzle, we simply never set it to be sure.
        // (it can always be set on a per-request basis or even using ajaxSetup)
        // For same-domain requests, won't change header if already provided.
        if ( !options.crossDomain && !headers["X-Requested-With"] ) {
          headers["X-Requested-With"] = "XMLHttpRequest";
        }
        // Set headers
        for ( i in headers ) {
          xhr.setRequestHeader( i, headers[ i ] );
        }
        // Callback
        callback = function( type ) {
          return function() {
            if ( callback ) {
              delete xhrCallbacks[ id ];
              callback = xhr.onload = xhr.onerror = null;
              if ( type === "abort" ) {
                xhr.abort();
              } else if ( type === "error" ) {
                complete(
                  // file protocol always yields status 0, assume 404
                  xhr.status || 404,
                  xhr.statusText
                );
              } else {
                complete(
                  xhrSuccessStatus[ xhr.status ] || xhr.status,
                  xhr.statusText,
                  // Support: IE9
                  // #11426: When requesting binary data, IE9 will throw an exception
                  // on any attempt to access responseText
                  typeof xhr.responseText === "string" ? {
                    text: xhr.responseText
                  } : undefined,
                  xhr.getAllResponseHeaders()
                );
              }
            }
          };
        };
        // Listen to events
        xhr.onload = callback();
        xhr.onerror = callback("error");
        // Create the abort callback
        callback = xhrCallbacks[( id = xhrId++ )] = callback("abort");
        // Do send the request
        // This may raise an exception which is actually
        // handled in jQuery.ajax (so no try/catch here)
        xhr.send( options.hasContent && options.data || null );
      },
      abort: function() {
        if ( callback ) {
          callback();
        }
      }
    };
  }
});
if ( typeof module === "object" && module && typeof module.exports === "object" ) {
  // Expose jQuery as module.exports in loaders that implement the Node
  // module pattern (including browserify). Do not create the global, since
  // the user will be storing it themselves locally, and globals are frowned
  // upon in the Node module world.
  module.exports = jQuery;
} else {
  // Register as a named AMD module, since jQuery can be concatenated with other
  // files that may use define, but not via a proper concatenation script that
  // understands anonymous AMD modules. A named AMD is safest and most robust
  // way to register. Lowercase jquery is used because AMD module names are
  // derived from file names, and jQuery is normally delivered in a lowercase
  // file name. Do this after creating the global so that if an AMD module wants
  // to call noConflict to hide this version of jQuery, it will work.
  if ( typeof define === "function" && define.amd ) {
    define( "jquery", [], function () { return jQuery; } );
  }
}

// If there is a window object, that at least has a document property,
// define jQuery and $ identifiers
if ( typeof window === "object" && typeof window.document === "object" ) {
  window.jQuery = window.$ = jQuery;
}

})( window );

define("backburner", 
  ["backburner/deferred_action_queues","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var DeferredActionQueues = __dependency1__.DeferredActionQueues;

    var slice = [].slice,
        pop = [].pop,
        throttlers = [],
        debouncees = [],
        timers = [],
        autorun, laterTimer, laterTimerExpiresAt,
        global = this,
        NUMBER = /\d+/;

    function isCoercableNumber(number) {
      return typeof number === 'number' || NUMBER.test(number);
    }

    function Backburner(queueNames, options) {
      this.queueNames = queueNames;
      this.options = options || {};
      if (!this.options.defaultQueue) {
        this.options.defaultQueue = queueNames[0];
      }
      this.instanceStack = [];
    }

    Backburner.prototype = {
      queueNames: null,
      options: null,
      currentInstance: null,
      instanceStack: null,

      begin: function() {
        var onBegin = this.options && this.options.onBegin,
            previousInstance = this.currentInstance;

        if (previousInstance) {
          this.instanceStack.push(previousInstance);
        }

        this.currentInstance = new DeferredActionQueues(this.queueNames, this.options);
        if (onBegin) {
          onBegin(this.currentInstance, previousInstance);
        }
      },

      end: function() {
        var onEnd = this.options && this.options.onEnd,
            currentInstance = this.currentInstance,
            nextInstance = null;

        try {
          currentInstance.flush();
        } finally {
          this.currentInstance = null;

          if (this.instanceStack.length) {
            nextInstance = this.instanceStack.pop();
            this.currentInstance = nextInstance;
          }

          if (onEnd) {
            onEnd(currentInstance, nextInstance);
          }
        }
      },

      run: function(target, method /*, args */) {
        var ret;
        this.begin();

        if (!method) {
          method = target;
          target = null;
        }

        if (typeof method === 'string') {
          method = target[method];
        }

        // Prevent Safari double-finally.
        var finallyAlreadyCalled = false;
        try {
          if (arguments.length > 2) {
            ret = method.apply(target, slice.call(arguments, 2));
          } else {
            ret = method.call(target);
          }
        } finally {
          if (!finallyAlreadyCalled) {
            finallyAlreadyCalled = true;
            this.end();
          }
        }
        return ret;
      },

      defer: function(queueName, target, method /* , args */) {
        if (!method) {
          method = target;
          target = null;
        }

        if (typeof method === 'string') {
          method = target[method];
        }

        var stack = this.DEBUG ? new Error() : undefined,
            args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
        if (!this.currentInstance) { createAutorun(this); }
        return this.currentInstance.schedule(queueName, target, method, args, false, stack);
      },

      deferOnce: function(queueName, target, method /* , args */) {
        if (!method) {
          method = target;
          target = null;
        }

        if (typeof method === 'string') {
          method = target[method];
        }

        var stack = this.DEBUG ? new Error() : undefined,
            args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
        if (!this.currentInstance) { createAutorun(this); }
        return this.currentInstance.schedule(queueName, target, method, args, true, stack);
      },

      setTimeout: function() {
        var args = slice.call(arguments);
        var length = args.length;
        var method, wait, target;
        var self = this;
        var methodOrTarget, methodOrWait, methodOrArgs;

        if (length === 0) {
          return;
        } else if (length === 1) {
          method = args.shift();
          wait = 0;
        } else if (length === 2) {
          methodOrTarget = args[0];
          methodOrWait = args[1];

          if (typeof methodOrWait === 'function' || typeof  methodOrTarget[methodOrWait] === 'function') {
            target = args.shift();
            method = args.shift();
            wait = 0;
          } else if (isCoercableNumber(methodOrWait)) {
            method = args.shift();
            wait = args.shift();
          } else {
            method = args.shift();
            wait =  0;
          }
        } else {
          var last = args[args.length - 1];

          if (isCoercableNumber(last)) {
            wait = args.pop();
          } else {
            wait = 0;
          }

          methodOrTarget = args[0];
          methodOrArgs = args[1];

          if (typeof methodOrArgs === 'function' || (typeof methodOrArgs === 'string' &&
                                                     methodOrTarget !== null &&
                                                     methodOrArgs in methodOrTarget)) {
            target = args.shift();
            method = args.shift();
          } else {
            method = args.shift();
          }
        }

        var executeAt = (+new Date()) + parseInt(wait, 10);

        if (typeof method === 'string') {
          method = target[method];
        }

        function fn() {
          method.apply(target, args);
        }

        // find position to insert
        var i = searchTimer(executeAt, timers, 0, timers.length - 2);

        timers.splice(i, 0, executeAt, fn);

        updateLaterTimer(self, executeAt, wait);

        return fn;
      },

      throttle: function(target, method /* , args, wait, [immediate] */) {
        var self = this,
            args = arguments,
            immediate = pop.call(args),
            wait,
            throttler,
            index,
            timer;

        if (typeof immediate === "number" || typeof immediate === "string") {
          wait = immediate;
          immediate = true;
        } else {
          wait = pop.call(args);
        }

        wait = parseInt(wait, 10);

        index = findThrottler(target, method);
        if (index > -1) { return throttlers[index]; } // throttled

        timer = global.setTimeout(function() {
          if (!immediate) {
            self.run.apply(self, args);
          }
          var index = findThrottler(target, method);
          if (index > -1) { throttlers.splice(index, 1); }
        }, wait);

        if (immediate) {
          self.run.apply(self, args);
        }

        throttler = [target, method, timer];

        throttlers.push(throttler);

        return throttler;
      },

      debounce: function(target, method /* , args, wait, [immediate] */) {
        var self = this,
            args = arguments,
            immediate = pop.call(args),
            wait,
            index,
            debouncee,
            timer;

        if (typeof immediate === "number" || typeof immediate === "string") {
          wait = immediate;
          immediate = false;
        } else {
          wait = pop.call(args);
        }

        wait = parseInt(wait, 10);
        // Remove debouncee
        index = findDebouncee(target, method);

        if (index > -1) {
          debouncee = debouncees[index];
          debouncees.splice(index, 1);
          clearTimeout(debouncee[2]);
        }

        timer = global.setTimeout(function() {
          if (!immediate) {
            self.run.apply(self, args);
          }
          var index = findDebouncee(target, method);
          if (index > -1) {
            debouncees.splice(index, 1);
          }
        }, wait);

        if (immediate && index === -1) {
          self.run.apply(self, args);
        }

        debouncee = [target, method, timer];

        debouncees.push(debouncee);

        return debouncee;
      },

      cancelTimers: function() {
        var i, len;

        for (i = 0, len = throttlers.length; i < len; i++) {
          clearTimeout(throttlers[i][2]);
        }
        throttlers = [];

        for (i = 0, len = debouncees.length; i < len; i++) {
          clearTimeout(debouncees[i][2]);
        }
        debouncees = [];

        if (laterTimer) {
          clearTimeout(laterTimer);
          laterTimer = null;
        }
        timers = [];

        if (autorun) {
          clearTimeout(autorun);
          autorun = null;
        }
      },

      hasTimers: function() {
        return !!timers.length || autorun;
      },

      cancel: function(timer) {
        var timerType = typeof timer;

        if (timer && timerType === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
          return timer.queue.cancel(timer);
        } else if (timerType === 'function') { // we're cancelling a setTimeout
          for (var i = 0, l = timers.length; i < l; i += 2) {
            if (timers[i + 1] === timer) {
              timers.splice(i, 2); // remove the two elements
              return true;
            }
          }
        } else if (Object.prototype.toString.call(timer) === "[object Array]"){ // we're cancelling a throttle or debounce
          return this._cancelItem(findThrottler, throttlers, timer) ||
                   this._cancelItem(findDebouncee, debouncees, timer);
        } else {
          return; // timer was null or not a timer
        }
      },

      _cancelItem: function(findMethod, array, timer){
        var item,
            index;

        if (timer.length < 3) { return false; }

        index = findMethod(timer[0], timer[1]);

        if(index > -1) {

          item = array[index];

          if(item[2] === timer[2]){
            array.splice(index, 1);
            clearTimeout(timer[2]);
            return true;
          }
        }

        return false;
      }

    };

    Backburner.prototype.schedule = Backburner.prototype.defer;
    Backburner.prototype.scheduleOnce = Backburner.prototype.deferOnce;
    Backburner.prototype.later = Backburner.prototype.setTimeout;

    function createAutorun(backburner) {
      backburner.begin();
      autorun = global.setTimeout(function() {
        autorun = null;
        backburner.end();
      });
    }

    function updateLaterTimer(self, executeAt, wait) {
      if (!laterTimer || executeAt < laterTimerExpiresAt) {
        if (laterTimer) {
          clearTimeout(laterTimer);
        }
        laterTimer = global.setTimeout(function() {
          laterTimer = null;
          laterTimerExpiresAt = null;
          executeTimers(self);
        }, wait);
        laterTimerExpiresAt = executeAt;
      }
    }

    function executeTimers(self) {
      var now = +new Date(),
          time, fns, i, l;

      self.run(function() {
        i = searchTimer(now, timers, 0, timers.length - 2);

        fns = timers.splice(0, i);

        for (i = 1, l = fns.length; i < l; i += 2) {
          self.schedule(self.options.defaultQueue, null, fns[i]);
        }
      });

      if (timers.length) {
        updateLaterTimer(self, timers[0], timers[0] - now);
      }
    }

    function findDebouncee(target, method) {
      var debouncee,
          index = -1;

      for (var i = 0, l = debouncees.length; i < l; i++) {
        debouncee = debouncees[i];
        if (debouncee[0] === target && debouncee[1] === method) {
          index = i;
          break;
        }
      }

      return index;
    }

    function findThrottler(target, method) {
      var throttler,
          index = -1;

      for (var i = 0, l = throttlers.length; i < l; i++) {
        throttler = throttlers[i];
        if (throttler[0] === target && throttler[1] === method) {
          index = i;
          break;
        }
      }

      return index;
    }

    function searchTimer(time, timers, start, end) {
      var middle;

      while (start < end) {
        middle = start + Math.floor((end - start)/4);
        if (time >= timers[middle]) {
          start = middle + 2;
        } else {
          end = middle;
        }
      }

      if (timers[start] !== undefined && time > timers[start]) {
        return start + 2;
      } else {
        return start;
      }
    }

    __exports__.Backburner = Backburner;
  });
define("backburner/deferred_action_queues", 
  ["backburner/queue","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Queue = __dependency1__.Queue;

    function DeferredActionQueues(queueNames, options) {
      var queues = this.queues = {};
      this.queueNames = queueNames = queueNames || [];

      var queueName;
      for (var i = 0, l = queueNames.length; i < l; i++) {
        queueName = queueNames[i];
        queues[queueName] = new Queue(this, queueName, options[queueName]);
      }
    }

    DeferredActionQueues.prototype = {
      queueNames: null,
      queues: null,

      schedule: function(queueName, target, method, args, onceFlag, stack) {
        var queues = this.queues,
            queue = queues[queueName];

        if (!queue) { throw new Error("You attempted to schedule an action in a queue (" + queueName + ") that doesn't exist"); }

        if (onceFlag) {
          return queue.pushUnique(target, method, args, stack);
        } else {
          return queue.push(target, method, args, stack);
        }
      },

      flush: function() {
        var queues = this.queues,
            queueNames = this.queueNames,
            queueName, queue, queueItems, priorQueueNameIndex,
            queueNameIndex = 0, numberOfQueues = queueNames.length;

        outerloop:
        while (queueNameIndex < numberOfQueues) {
          queueName = queueNames[queueNameIndex];
          queue = queues[queueName];
          queueItems = queue._queueBeingFlushed = queue._queue.slice();
          queue._queue = [];

          var options = queue.options,
              before = options && options.before,
              after = options && options.after,
              target, method, args, stack,
              queueIndex = 0, numberOfQueueItems = queueItems.length;

          if (numberOfQueueItems && before) { before(); }
          while (queueIndex < numberOfQueueItems) {
            target = queueItems[queueIndex];
            method = queueItems[queueIndex+1];
            args   = queueItems[queueIndex+2];
            stack  = queueItems[queueIndex+3]; // Debugging assistance

            if (typeof method === 'string') { method = target[method]; }

            // method could have been nullified / canceled during flush
            if (method) {
              // TODO: error handling
              if (args && args.length > 0) {
                method.apply(target, args);
              } else {
                method.call(target);
              }
            }

            queueIndex += 4;
          }
          queue._queueBeingFlushed = null;
          if (numberOfQueueItems && after) { after(); }

          if ((priorQueueNameIndex = indexOfPriorQueueWithActions(this, queueNameIndex)) !== -1) {
            queueNameIndex = priorQueueNameIndex;
            continue outerloop;
          }

          queueNameIndex++;
        }
      }
    };

    function indexOfPriorQueueWithActions(daq, currentQueueIndex) {
      var queueName, queue;

      for (var i = 0, l = currentQueueIndex; i <= l; i++) {
        queueName = daq.queueNames[i];
        queue = daq.queues[queueName];
        if (queue._queue.length) { return i; }
      }

      return -1;
    }

    __exports__.DeferredActionQueues = DeferredActionQueues;
  });
define("backburner/queue", 
  ["exports"],
  function(__exports__) {
    "use strict";
    function Queue(daq, name, options) {
      this.daq = daq;
      this.name = name;
      this.options = options;
      this._queue = [];
    }

    Queue.prototype = {
      daq: null,
      name: null,
      options: null,
      _queue: null,

      push: function(target, method, args, stack) {
        var queue = this._queue;
        queue.push(target, method, args, stack);
        return {queue: this, target: target, method: method};
      },

      pushUnique: function(target, method, args, stack) {
        var queue = this._queue, currentTarget, currentMethod, i, l;

        for (i = 0, l = queue.length; i < l; i += 4) {
          currentTarget = queue[i];
          currentMethod = queue[i+1];

          if (currentTarget === target && currentMethod === method) {
            queue[i+2] = args; // replace args
            queue[i+3] = stack; // replace stack
            return {queue: this, target: target, method: method}; 
          }
        }

        this._queue.push(target, method, args, stack);
        return {queue: this, target: target, method: method};
      },

      // TODO: remove me, only being used for Ember.run.sync
      flush: function() {
        var queue = this._queue,
            options = this.options,
            before = options && options.before,
            after = options && options.after,
            target, method, args, stack, i, l = queue.length;

        if (l && before) { before(); }
        for (i = 0; i < l; i += 4) {
          target = queue[i];
          method = queue[i+1];
          args   = queue[i+2];
          stack  = queue[i+3]; // Debugging assistance

          // TODO: error handling
          if (args && args.length > 0) {
            method.apply(target, args);
          } else {
            method.call(target);
          }
        }
        if (l && after) { after(); }

        // check if new items have been added
        if (queue.length > l) {
          this._queue = queue.slice(l);
          this.flush();
        } else {
          this._queue.length = 0;
        }
      },

      cancel: function(actionToCancel) {
        var queue = this._queue, currentTarget, currentMethod, i, l;

        for (i = 0, l = queue.length; i < l; i += 4) {
          currentTarget = queue[i];
          currentMethod = queue[i+1];

          if (currentTarget === actionToCancel.target && currentMethod === actionToCancel.method) {
            queue.splice(i, 4);
            return true;
          }
        }

        // if not found in current queue
        // could be in the queue that is being flushed
        queue = this._queueBeingFlushed;
        if (!queue) {
          return;
        }
        for (i = 0, l = queue.length; i < l; i += 4) {
          currentTarget = queue[i];
          currentMethod = queue[i+1];

          if (currentTarget === actionToCancel.target && currentMethod === actionToCancel.method) {
            // don't mess with array during flush
            // just nullify the method
            queue[i+1] = null;
            return true;
          }
        }
      }
    };

    __exports__.Queue = Queue;
  });

(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/node_modules/global/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"window.js","browserify":{"min-document":false,"individual":false}}
});

require.define("/node_modules/global/window.js",function(require,module,exports,__dirname,__filename,process,global){if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else {
    module.exports = {};
}

});

require.define("/node_modules/virtual-dom/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/h.js",function(require,module,exports,__dirname,__filename,process,global){var h = require("./h/index.js")

module.exports = h

});

require.define("/node_modules/virtual-dom/h/index.js",function(require,module,exports,__dirname,__filename,process,global){var isArray = require("x-is-array")
var isString = require("x-is-string")

var VNode = require("vtree/vnode.js")
var VText = require("vtree/vtext.js")
var isVNode = require("vtree/is-vnode")
var isVText = require("vtree/is-vtext")
var isWidget = require("vtree/is-widget")

var parseTag = require("./parse-tag")

module.exports = h

function h(tagName, properties, children) {
    var tag, props, childNodes, key

    if (!children) {
        if (isChildren(properties)) {
            children = properties
            properties = undefined
        }
    }

    tag = parseTag(tagName, properties)

    if (!isString(tag)) {
        props = tag.properties
        tag = tag.tagName
    } else {
        props = properties
    }

    if (isArray(children)) {
        var len = children.length

        for (var i = 0; i < len; i++) {
            var child = children[i]
            if (isString(child)) {
                children[i] = new VText(child)
            }
        }

        childNodes = children
    } else if (isString(children)) {
        childNodes = [new VText(children)]
    } else if (isChild(children)) {
        childNodes = [children]
    }

    if (props && "key" in props) {
        key = props.key
        delete props.key
    }

    return new VNode(tag, props, childNodes, key)
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x)
}

function isChildren(x) {
    return isArray(x) || isString(x) || isChild(x)
}

});

require.define("/node_modules/virtual-dom/node_modules/x-is-array/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/node_modules/x-is-array/index.js",function(require,module,exports,__dirname,__filename,process,global){var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

});

require.define("/node_modules/virtual-dom/node_modules/x-is-string/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/node_modules/x-is-string/index.js",function(require,module,exports,__dirname,__filename,process,global){var toString = Object.prototype.toString

module.exports = isString

function isString(obj) {
    return toString.call(obj) === "[object String]"
}

});

require.define("/node_modules/virtual-dom/node_modules/vtree/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/node_modules/vtree/vnode.js",function(require,module,exports,__dirname,__filename,process,global){var version = require("./version")
var isVNode = require("./is-vnode")
var isWidget = require("./is-widget")
var isVHook = require("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property)) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

});

require.define("/node_modules/virtual-dom/node_modules/vtree/version.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = "1"

});

require.define("/node_modules/virtual-dom/node_modules/vtree/is-vnode.js",function(require,module,exports,__dirname,__filename,process,global){var version = require("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

});

require.define("/node_modules/virtual-dom/node_modules/vtree/is-widget.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

});

require.define("/node_modules/virtual-dom/node_modules/vtree/is-vhook.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = isHook

function isHook(hook) {
    return hook && typeof hook.hook === "function" &&
        !hook.hasOwnProperty("hook")
}

});

require.define("/node_modules/virtual-dom/node_modules/vtree/vtext.js",function(require,module,exports,__dirname,__filename,process,global){var version = require("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

});

require.define("/node_modules/virtual-dom/node_modules/vtree/is-vtext.js",function(require,module,exports,__dirname,__filename,process,global){var version = require("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

});

require.define("/node_modules/virtual-dom/h/parse-tag.js",function(require,module,exports,__dirname,__filename,process,global){var split = require("browser-split")

var classIdSplit = /([\.#]?[a-zA-Z0-9_:-]+)/
var notClassId = /^\.|#/

module.exports = parseTag

function parseTag(tag, props) {
    if (!tag) {
        return "div"
    }

    var noId = !props || !("id" in props)

    var tagParts = split(tag, classIdSplit)
    var tagName = null

    if(notClassId.test(tagParts[1])) {
        tagName = "div"
    }

    var id, classes, part, type, i
    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i]

        if (!part) {
            continue
        }

        type = part.charAt(0)

        if (!tagName) {
            tagName = part
        } else if (type === ".") {
            classes = classes || []
            classes.push(part.substring(1, part.length))
        } else if (type === "#" && noId) {
            id = part.substring(1, part.length)
        }
    }

    var parsedTags

    if (props) {
        if (id !== undefined && !("id" in props)) {
            props.id = id
        }

        if (classes) {
            if (props.className) {
                classes.push(props.className)
            }

            props.className = classes.join(" ")
        }

        parsedTags = tagName
    } else if (classes || id !== undefined) {
        var properties = {}

        if (id !== undefined) {
            properties.id = id
        }

        if (classes) {
            properties.className = classes.join(" ")
        }

        parsedTags = {
            tagName: tagName,
            properties: properties
        }
    } else {
        parsedTags = tagName
    }

    return parsedTags
}

});

require.define("/node_modules/virtual-dom/node_modules/browser-split/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index.js"}
});

require.define("/node_modules/virtual-dom/node_modules/browser-split/index.js",function(require,module,exports,__dirname,__filename,process,global){/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

});

require.define("/node_modules/virtual-dom/diff.js",function(require,module,exports,__dirname,__filename,process,global){var diff = require("vtree/diff")

module.exports = diff

});

require.define("/node_modules/virtual-dom/node_modules/vtree/diff.js",function(require,module,exports,__dirname,__filename,process,global){var isArray = require("x-is-array")
var isObject = require("is-object")

var VPatch = require("./vpatch")
var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")
var handleThunk = require("./handle-thunk")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        if (isThunk(a) || isThunk(b)) {
            thunks(a, b, patch, index)
        } else {
            hooks(b, patch, index)
        }
        return
    }

    var apply = patch[index]

    if (b == null) {
        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
        destroyWidgets(a, patch, index)
    } else if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties, b.hooks)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                destroyWidgets(a, patch, index)
            }

            apply = diffChildren(a, b, patch, apply, index)
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            destroyWidgets(a, patch, index)
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            destroyWidgets(a, patch, index)
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))

        if (!isWidget(a)) {
            destroyWidgets(a, patch, index)
        }
    }

    if (apply) {
        patch[index] = apply
    }
}

function diffProps(a, b, hooks) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (hooks && aKey in hooks) {
            diff = diff || {}
            diff[aKey] = bValue
        } else {
            if (isObject(aValue) && isObject(bValue)) {
                if (getPrototype(bValue) !== getPrototype(aValue)) {
                    diff = diff || {}
                    diff[aKey] = bValue
                } else {
                    var objectDiff = diffProps(aValue, bValue)
                    if (objectDiff) {
                        diff = diff || {}
                        diff[aKey] = objectDiff
                    }
                }
            } else if (aValue !== bValue) {
                diff = diff || {}
                diff[aKey] = bValue
            }
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var bChildren = reorder(aChildren, b.children)

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else if (!rightNode) {
            if (leftNode) {
                // Excess nodes in a need to be removed
                patch[index] = new VPatch(VPatch.REMOVE, leftNode, null)
                destroyWidgets(leftNode, patch, index)
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (bChildren.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(VPatch.ORDER, a, bChildren.moves))
    }

    return apply
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = new VPatch(VPatch.REMOVE, vNode, null)
        }
    } else if (isVNode(vNode) && vNode.hasWidgets) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b);
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true;
        }
    }

    return false;
}

// Execute hooks when two nodes are identical
function hooks(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = new VPatch(VPatch.PROPS, vNode.hooks, vNode.hooks)
        }

        if (vNode.descendantHooks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                hooks(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    }
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {

    var bKeys = keyIndex(bChildren)

    if (!bKeys) {
        return bChildren
    }

    var aKeys = keyIndex(aChildren)

    if (!aKeys) {
        return bChildren
    }

    var bMatch = {}, aMatch = {}

    for (var key in bKeys) {
        bMatch[bKeys[key]] = aKeys[key]
    }

    for (var key in aKeys) {
        aMatch[aKeys[key]] = bKeys[key]
    }

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen
    var shuffle = []
    var freeIndex = 0
    var i = 0
    var moveIndex = 0
    var moves = {}
    var removes = moves.removes = {}
    var reverse = moves.reverse = {}
    var hasMoves = false

    while (freeIndex < len) {
        var move = aMatch[i]
        if (move !== undefined) {
            shuffle[i] = bChildren[move]
            if (move !== moveIndex) {
                moves[move] = moveIndex
                reverse[moveIndex] = move
                hasMoves = true
            }
            moveIndex++
        } else if (i in aMatch) {
            shuffle[i] = undefined
            removes[i] = moveIndex++
            hasMoves = true
        } else {
            while (bMatch[freeIndex] !== undefined) {
                freeIndex++
            }

            if (freeIndex < len) {
                var freeChild = bChildren[freeIndex]
                if (freeChild) {
                    shuffle[i] = freeChild
                    if (freeIndex !== moveIndex) {
                        hasMoves = true
                        moves[freeIndex] = moveIndex
                        reverse[moveIndex] = freeIndex
                    }
                    moveIndex++
                }
                freeIndex++
            }
        }
        i++
    }

    if (hasMoves) {
        shuffle.moves = moves
    }

    return shuffle
}

function keyIndex(children) {
    var i, keys

    for (i = 0; i < children.length; i++) {
        var child = children[i]

        if (child.key !== undefined) {
            keys = keys || {}
            keys[child.key] = i
        }
    }

    return keys
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

});

require.define("/node_modules/virtual-dom/node_modules/is-object/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/node_modules/is-object/index.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = isObject

function isObject(x) {
    return typeof x === "object" && x !== null
}

});

require.define("/node_modules/virtual-dom/node_modules/vtree/vpatch.js",function(require,module,exports,__dirname,__filename,process,global){var version = require("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7
VirtualPatch.THUNK = 8

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version
VirtualPatch.prototype.type = "VirtualPatch"

});

require.define("/node_modules/virtual-dom/node_modules/vtree/is-thunk.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

});

require.define("/node_modules/virtual-dom/node_modules/vtree/handle-thunk.js",function(require,module,exports,__dirname,__filename,process,global){var isVNode = require("./is-vnode")
var isVText = require("./is-vtext")
var isWidget = require("./is-widget")
var isThunk = require("./is-thunk")

module.exports = handleThunk

function handleThunk(a, b) {
    var renderedA = a
    var renderedB = b

    if (isThunk(b)) {
        renderedB = renderThunk(b, a)
    }

    if (isThunk(a)) {
        renderedA = renderThunk(a, null)
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous)
    }

    if (!(isVNode(renderedThunk) ||
            isVText(renderedThunk) ||
            isWidget(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

});

require.define("/node_modules/virtual-dom/patch.js",function(require,module,exports,__dirname,__filename,process,global){var patch = require("vdom/patch")

module.exports = patch

});

require.define("/node_modules/virtual-dom/node_modules/vdom/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/node_modules/vdom/patch.js",function(require,module,exports,__dirname,__filename,process,global){var document = require("global/document")
var isArray = require("x-is-array")

var domIndex = require("./dom-index")
var patchOp = require("./patch-op")
module.exports = patch

function patch(rootNode, patches) {
    return patchRecursive(rootNode, patches)
}

function patchRecursive(rootNode, patches, renderOptions) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument

    if (!renderOptions) {
        renderOptions = { patch: patchRecursive }
        if (ownerDocument !== document) {
            renderOptions.document = ownerDocument
        }
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"window.js","browserify":{"min-document":false,"individual":false}}
});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/document.js",function(require,module,exports,__dirname,__filename,process,global){var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/index.js",function(require,module,exports,__dirname,__filename,process,global){var Document = require('./document.js');

module.exports = new Document();

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/document.js",function(require,module,exports,__dirname,__filename,process,global){var domWalk = require("dom-walk")

var DOMText = require("./dom-text.js")
var DOMElement = require("./dom-element.js")
var DocumentFragment = require("./dom-fragment.js")
var Event = require("./event.js")

module.exports = Document;

function Document() {
    if (!(this instanceof Document)) {
        return new Document();
    }

    this.body = this.createElement("body")
    this.documentElement = this.createElement("html")
    this.documentElement.appendChild(this.body)
}

var proto = Document.prototype;
proto.createTextNode = function createTextNode(value) {
    return new DOMText(value, this)
}

proto.createElementNS = function createElementNS(namespace, tagName) {
    var ns = namespace === null ? null : String(namespace)
    return new DOMElement(tagName, this, ns)
}

proto.createElement = function createElement(tagName) {
    return new DOMElement(tagName, this)
}

proto.createDocumentFragment = function createDocumentFragment() {
    return new DocumentFragment(this)
}

proto.createEvent = function createEvent(family) {
    return new Event(family)
}

proto.getElementById = function getElementById(id, parent) {
    if (!parent) {
        parent = this.body
    }

    if (String(parent.id) === String(id)) {
        return parent
    }

    var arr = parent.childNodes
    var result = null

    if (!arr) {
        return result
    }

    for (var i = 0, len = arr.length; !result && i < len; i++) {
        result = getElementById(id, arr[i])
    }

    return result
}

proto.getElementsByClassName = function getElementsByClassName(classNames, parent) {
    if (classNames.indexOf(" ") != -1) {
        throw new Error("Not yet implemented: getElementsByClassName for multiple class names");
    }

    if (!parent) {
        parent = this.body
    }

    var elems = []

    domWalk(parent, function (node) {
        var className = node.className || ""
        var classes = className.split(" ")

        if (classes.indexOf(classNames) !== -1) {
            elems.push(node)
        }
    })

    return elems
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/node_modules/dom-walk/package.json",function(require,module,exports,__dirname,__filename,process,global){module.exports = {"main":"index"}
});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/node_modules/dom-walk/index.js",function(require,module,exports,__dirname,__filename,process,global){var slice = Array.prototype.slice

module.exports = iterativelyWalk

function iterativelyWalk(nodes, cb) {
    if (!('length' in nodes)) {
        nodes = [nodes]
    }
    
    nodes = slice.call(nodes)

    while(nodes.length) {
        var node = nodes.shift(),
            ret = cb(node)

        if (ret) {
            return ret
        }

        if (node.childNodes && node.childNodes.length) {
            nodes = slice.call(node.childNodes).concat(nodes)
        }
    }
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/dom-text.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = DOMText

function DOMText(value, owner) {
    if (!(this instanceof DOMText)) {
        return new DOMText(value)
    }

    this.data = value || ""
    this.length = this.data.length
    this.ownerDocument = owner || null
}

DOMText.prototype.type = "DOMTextNode"
DOMText.prototype.nodeType = 3

DOMText.prototype.toString = function _Text_toString() {
    return this.data
}

DOMText.prototype.replaceData = function replaceData(index, length, value) {
    var current = this.data
    var left = current.substring(0, index)
    var right = current.substring(index + length, current.length)
    this.data = left + value + right
    this.length = this.data.length
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/dom-element.js",function(require,module,exports,__dirname,__filename,process,global){var dispatchEvent = require("./event/dispatch-event.js")
var addEventListener = require("./event/add-event-listener.js")
var removeEventListener = require("./event/remove-event-listener.js")
var serializeElement = require("./serialize.js")

var htmlns = "http://www.w3.org/1999/xhtml"

module.exports = DOMElement

function DOMElement(tagName, owner, namespace) {
    if (!(this instanceof DOMElement)) {
        return new DOMElement(tagName)
    }

    var ns = namespace === undefined ? htmlns : (namespace || null)

    this.tagName = ns === htmlns ? String(tagName).toUpperCase() : tagName
    this.className = ""
    this.dataset = {}
    this.childNodes = []
    this.parentNode = null
    this.style = {}
    this.ownerDocument = owner || null
    this.namespaceURI = ns
    this._attributes = {}

    if (this.tagName === 'INPUT') {
      this.type = 'text'
    }
}

DOMElement.prototype.type = "DOMElement"
DOMElement.prototype.nodeType = 1

DOMElement.prototype.appendChild = function _Element_appendChild(child) {
    if (child.parentNode) {
        child.parentNode.removeChild(child)
    }

    this.childNodes.push(child)
    child.parentNode = this

    return child
}

DOMElement.prototype.replaceChild =
    function _Element_replaceChild(elem, needle) {
        // TODO: Throw NotFoundError if needle.parentNode !== this

        if (elem.parentNode) {
            elem.parentNode.removeChild(elem)
        }

        var index = this.childNodes.indexOf(needle)

        needle.parentNode = null
        this.childNodes[index] = elem
        elem.parentNode = this

        return needle
    }

DOMElement.prototype.removeChild = function _Element_removeChild(elem) {
    // TODO: Throw NotFoundError if elem.parentNode !== this

    var index = this.childNodes.indexOf(elem)
    this.childNodes.splice(index, 1)

    elem.parentNode = null
    return elem
}

DOMElement.prototype.insertBefore =
    function _Element_insertBefore(elem, needle) {
        // TODO: Throw NotFoundError if referenceElement is a dom node
        // and parentNode !== this

        if (elem.parentNode) {
            elem.parentNode.removeChild(elem)
        }

        var index = needle === null || needle === undefined ?
            -1 :
            this.childNodes.indexOf(needle)

        if (index > -1) {
            this.childNodes.splice(index, 0, elem)
        } else {
            this.childNodes.push(elem)
        }

        elem.parentNode = this
        return elem
    }

DOMElement.prototype.setAttribute =
    function _Element_setAttribute(name, value) {
        this._attributes[name] = value
    }

DOMElement.prototype.getAttribute =
    function _Element_getAttribute(name) {
        if (typeof this._attributes[name] !== "string") {
            return null
        }

        return this._attributes[name]
    }

DOMElement.prototype.removeAttribute =
    function _Element_removeAttribute(name) {
        delete this._attributes[name]
    }

DOMElement.prototype.removeEventListener = removeEventListener
DOMElement.prototype.addEventListener = addEventListener
DOMElement.prototype.dispatchEvent = dispatchEvent

// Un-implemented
DOMElement.prototype.focus = function _Element_focus() {
    return void 0
}

DOMElement.prototype.toString = function _Element_toString() {
    return serializeElement(this)
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/event/dispatch-event.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = dispatchEvent

function dispatchEvent(ev) {
    var elem = this
    var type = ev.type

    if (!ev.target) {
        ev.target = elem
    }

    if (!elem.listeners) {
        elem.listeners = {}
    }

    var listeners = elem.listeners[type]

    if (listeners) {
        return listeners.forEach(function (listener) {
            ev.currentTarget = elem
            if (typeof listener === 'function') {
                listener(ev)
            } else {
                listener.handleEvent(ev)
            }
        })
    }

    if (elem.parentNode) {
        elem.parentNode.dispatchEvent(ev)
    }
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/event/add-event-listener.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = addEventListener

function addEventListener(type, listener) {
    var elem = this

    if (!elem.listeners) {
        elem.listeners = {}
    }

    if (!elem.listeners[type]) {
        elem.listeners[type] = []
    }

    if (elem.listeners[type].indexOf(listener) === -1) {
        elem.listeners[type].push(listener)
    }
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/event/remove-event-listener.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = removeEventListener

function removeEventListener(type, listener) {
    var elem = this

    if (!elem.listeners) {
        return
    }

    if (!elem.listeners[type]) {
        return
    }

    var list = elem.listeners[type]
    var index = list.indexOf(listener)
    if (index !== -1) {
        list.splice(index, 1)
    }
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/serialize.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = serializeElement

function serializeElement(elem) {
    var strings = []

    var tagname = elem.tagName

    if (elem.namespaceURI === "http://www.w3.org/1999/xhtml") {
        tagname = tagname.toLowerCase()
    }

    strings.push("<" + tagname +
        properties(elem) + datasetify(elem) + ">")

    if (elem.textContent) {
        strings.push(elem.textContent)
    }

    elem.childNodes.forEach(function (node) {
        strings.push(node.toString())
    })

    strings.push("</" + tagname + ">")

    return strings.join("")
}

function isProperty(elem, key) {
    var type = typeof elem[key]

    return elem.hasOwnProperty(key) &&
        (type === "string" || type === "boolean" || type === "number") &&
        key !== "nodeName" && key !== "className" && key !== "tagName" &&
        key !== "textContent" && key !== "namespaceURI"
}

function stylify(styles) {
    var attr = ""
    Object.keys(styles).forEach(function (key) {
        var value = styles[key]
        attr += key + ":" + value + ";"
    })
    return attr
}

function datasetify(elem) {
    var ds = elem.dataset
    var props = []

    for (var key in ds) {
        props.push({ name: "data-" + key, value: ds[key] })
    }

    return props.length ? stringify(props) : ""
}

function stringify(list) {
    var attributes = []
    list.forEach(function (tuple) {
        var name = tuple.name
        var value = tuple.value

        if (name === "style") {
            value = stylify(value)
        }

        attributes.push(name + "=" + "\"" + value + "\"")
    })

    return attributes.length ? " " + attributes.join(" ") : ""
}

function properties(elem) {
    var props = []
    for (var key in elem) {
        if (isProperty(elem, key)) {
            props.push({ name: key, value: elem[key] })
        }
    }

    if (elem.className) {
        props.push({ name: "class", value: elem.className })
    }

    return props.length ? stringify(props) : ""
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/dom-fragment.js",function(require,module,exports,__dirname,__filename,process,global){var DOMElement = require("./dom-element.js")

module.exports = DocumentFragment

function DocumentFragment(owner) {
    if (!(this instanceof DocumentFragment)) {
        return new DocumentFragment()
    }

    this.childNodes = []
    this.parentNode = null
    this.ownerDocument = owner || null
}

DocumentFragment.prototype.type = "DocumentFragment"
DocumentFragment.prototype.nodeType = 11
DocumentFragment.prototype.nodeName = "#document-fragment"

DocumentFragment.prototype.appendChild  = DOMElement.prototype.appendChild
DocumentFragment.prototype.replaceChild = DOMElement.prototype.replaceChild
DocumentFragment.prototype.removeChild  = DOMElement.prototype.removeChild

DocumentFragment.prototype.toString =
    function _DocumentFragment_toString() {
        return this.childNodes.map(function (node) {
            return String(node)
        }).join("")
    }

});

require.define("/node_modules/virtual-dom/node_modules/vdom/node_modules/global/node_modules/min-document/event.js",function(require,module,exports,__dirname,__filename,process,global){module.exports = Event

function Event(family) {}

Event.prototype.initEvent = function _Event_initEvent(type, bubbles, cancelable) {
    this.type = type
    this.bubbles = bubbles
    this.cancelable = cancelable
}

Event.prototype.preventDefault = function _Event_preventDefault() {
    
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/dom-index.js",function(require,module,exports,__dirname,__filename,process,global){// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/patch-op.js",function(require,module,exports,__dirname,__filename,process,global){var applyProperties = require("./apply-properties")

var isWidget = require("vtree/is-widget")
var VPatch = require("vtree/vpatch")

var render = require("./create-element")
var updateWidget = require("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties)
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = render(vText, renderOptions)

        if (parentNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    destroyWidget(domNode, leftVNode)

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    if (updateWidget(leftVNode, widget)) {
        return widget.update(leftVNode, domNode) || domNode
    }

    var parentNode = domNode.parentNode
    var newWidget = render(widget, renderOptions)

    if (parentNode) {
        parentNode.replaceChild(newWidget, domNode)
    }

    destroyWidget(domNode, leftVNode)

    return newWidget
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    destroyWidget(domNode, leftVNode)

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, bIndex) {
    var children = []
    var childNodes = domNode.childNodes
    var len = childNodes.length
    var i
    var reverseIndex = bIndex.reverse

    for (i = 0; i < len; i++) {
        children.push(domNode.childNodes[i])
    }

    var insertOffset = 0
    var move
    var node
    var insertNode
    for (i = 0; i < len; i++) {
        move = bIndex[i]
        if (move !== undefined && move !== i) {
            // the element currently at this index will be moved later so increase the insert offset
            if (reverseIndex[i] > i) {
                insertOffset++
            }

            node = children[move]
            insertNode = childNodes[i + insertOffset]
            if (node !== insertNode) {
                domNode.insertBefore(node, insertNode)
            }

            // the moved element came from the front of the array so reduce the insert offset
            if (move < i) {
                insertOffset--
            }
        }

        // element at this index is scheduled to be removed so increase insert offset
        if (i in bIndex.removes) {
            insertOffset++
        }
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        console.log(oldRoot)
        oldRoot.parentNode.replaceChild(newRoot, oldRoot)
    }

    return newRoot;
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/apply-properties.js",function(require,module,exports,__dirname,__filename,process,global){var isObject = require("is-object")
var isHook = require("vtree/is-vhook")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (propValue === undefined) {
            removeProperty(node, props, previous, propName);
        } else if (isHook(propValue)) {
            propValue.hook(node,
                propName,
                previous ? previous[propName] : undefined)
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else if (propValue !== undefined) {
                node[propName] = propValue
            }
        }
    }
}

function removeProperty(node, props, previous, propName) {
    if (previous) {
        var previousValue = previous[propName]

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName)
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = ""
                }
            } else if (typeof previousValue === "string") {
                node[propName] = ""
            } else {
                node[propName] = null
            }
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName]

            if (attrValue === undefined) {
                node.removeAttribute(attrName)
            } else {
                node.setAttribute(attrName, attrValue)
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {}
    }

    var replacer = propName === "style" ? "" : undefined

    for (var k in propValue) {
        var value = propValue[k]
        node[propName][k] = (value === undefined) ? replacer : value
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/create-element.js",function(require,module,exports,__dirname,__filename,process,global){var document = require("global/document")

var applyProperties = require("./apply-properties")

var isVNode = require("vtree/is-vnode")
var isVText = require("vtree/is-vtext")
var isWidget = require("vtree/is-widget")
var handleThunk = require("vtree/handle-thunk")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    vnode = handleThunk(vnode).a

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

});

require.define("/node_modules/virtual-dom/node_modules/vdom/update-widget.js",function(require,module,exports,__dirname,__filename,process,global){var isWidget = require("vtree/is-widget")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

});

require.define("/node_modules/virtual-dom/create-element.js",function(require,module,exports,__dirname,__filename,process,global){var createElement = require("vdom/create-element")

module.exports = createElement

});

require.define("/src/vdom.amd.js",function(require,module,exports,__dirname,__filename,process,global){require('global').define('vdom', ['exports'], function(__exports__) {

__exports__.h              = require('virtual-dom/h');
__exports__.diff           = require('virtual-dom/diff');
__exports__.patch          = require('virtual-dom/patch');
__exports__.createElement  = require('virtual-dom/create-element');

});

});
require("/src/vdom.amd.js");
})();

define("rsvp/promise",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = window.RSVP.Promise;
  });
define("rsvp/reject",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = window.RSVP.reject;
  });
define("rsvp/resolve",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = window.RSVP.resolve;
  });
define("rsvp",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = window.RSVP;
  });
define("groot/ajax",
  ["rsvp/promise","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var promise = __dependency1__["default"];

    function ajax() {
      var args = arguments;

      return new promise(function(resolve, reject) {
        $.ajax.apply($, args).then(success(resolve), error(reject));
      });
    }

    function success(resolve) {
      return function success(data, status, xhr) {
        resolve({
          data: data,
          status: xhr.status
        });
      };
    }

    function error(reject) {
      return function error(xhr, status) {
        reject({
          data: xhr.responseText,
          status: xhr.status
        });
      };
    }

    __exports__["default"] = ajax;
  });
define("groot/component",
  ["rsvp/resolve","groot/utils","groot/helper","groot/template","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var resolve = __dependency1__["default"];
    var uid = __dependency2__.uid;
    var mixin = __dependency2__.mixin;

    var helper = __dependency3__.helper;
    var template = __dependency4__["default"];

    function defineComponent(properties) {
      var Component = function(app, templateName) {
        if (!(this instanceof Component)) {
          return new Component(app, templateName);
        }

        this.app = app;
        this.templateName = templateName;
        this.events = {};
      };
      Component.prototype = Object.create(componentProto);
      properties = properties || {};
      var attributes = properties.attributes || [];
      properties.attributes = defaultAttributes.concat(attributes);
      mixin(Component.prototype, properties);

      return Component;
    }

    var defaultAttributes = ['elementId:id', 'className'];

    var componentProto = {
      tagName: null,
      templateName: null,
      attributes: null,

      load: function(params) {},
      up: function(data) { return data; },

      serialize: function(data) {},
      activate: function() {},
      deactivate: function() {},

      model: function(params) {
        return resolve(this.load(params))
          .then(Immutable.fromJS);
      },
      setup: function(data) {
        this.app.render(true);
      },
      enter: function() {
        this.activate();
      },
      exit: function() {
        this.deactivate();
      },

      getAttributesForRender: function(data) {
        var attributes = data.get('attributes');
        if (attributes) {
          attributes = this.attributes.concat(attributes.toArray());
        } else {
          attributes = this.attributes;
        }

        var attrs = {};

        attributes.forEach(function(attributeName) {
          attributeName = attributeName.split(':');
          var attribute = attributeName[0];
          attributeName = attributeName[1] || attribute;
          var attributeValue = data.get(attribute) || this[attribute];
          if (attributeValue) {
            attrs[attributeName] = attributeValue;
          }
        }, this);

        return attrs;
      },

      shouldRender: function(data, breadcrumb) {
        if (!this.tree) { return true; }
        if (this.breadcrumb !== breadcrumb) {
          this.breadcrumb = breadcrumb;
          return true;
        }
        if (!Immutable.is(this.data, data)) {
          this.data = data;
          return true;
        }
      },

      render: function(data, outlet, breadcrumb) {
        data = this.up(data) || Immutable.Map.empty();
        data = Immutable.fromJS(data);

        if (this.shouldRender(data, breadcrumb)) {
          this.tree = [template(this.app, this.templateName, data, outlet)];

          var tagName;
          if (data instanceof Immutable.Map) {
            tagName = data.get('tagName');
          }
          tagName = tagName || this.tagName;

          if (tagName) {
            var attrs = this.getAttributesForRender(data);
            this.tree = helper(this.app, 'tag', tagName, attrs, this.tree);
          } else if (this.isRoute) {
            this.tree = this.tree[0];
          }
        }

        return this.tree;
      }
    };

    __exports__["default"] = defineComponent;
  });
define("groot/components/input",
  ["groot/component","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var defineComponent = __dependency1__["default"];

    function valueDidChange(evt, data) {
      var elem = $(evt.currentTarget);
      var value;
      if (elem.attr('type') === 'checkbox') {
        value = elem.prop('checked');
      } else {
        value = elem.val();
      }

      var update = data.get('onChange') || function() {};
      update(value);
    }

    __exports__["default"] = defineComponent({
      tagName: 'input',
      type: 'text',
      attributes: ['type', 'placeholder', 'value:checked', 'value'],

      change: valueDidChange,
      keyUp: valueDidChange
    });
  });
define("groot/components/link-to",
  ["groot/component","groot/router","groot/utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var defineComponent = __dependency1__["default"];
    var transitionTo = __dependency2__.transitionTo;
    var generate = __dependency2__.generate;
    var apply = __dependency3__.apply;

    __exports__["default"] = defineComponent({
      tagName: 'a',
      attributes: ['href'],

      up: function(data) {
        var args = data.get('href').toArray();
        args.unshift(this.app);

        var href = apply(null, generate, args);
        data = data.set('href', href);

        return data;
      },

      click: function(evt, data) {
        var args = data.get('href').toArray();
        args.unshift(this.app);

        apply(null, transitionTo, args);

        evt.preventDefault();
      }
    });
  });
define("groot/container",
  ["groot/logger","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var logger = __dependency1__["default"];

    function normalize(name) {
      if (!this.normalizedNameCache[name]) {
        var tokens = name.split(':');

        this.normalizedNameCache[name] = [
          tokens[0]+'s',
          tokens[1].replace(/\./g, '/')
        ].join('/');
      }

      return this.normalizedNameCache[name];
    }

    function resolve(name) {
      var module;

      try {
        module = requireModule([this.namespace, name].join('/'));
      } catch (e) {
        try {
          module = requireModule(['groot', name].join('/'));
        } catch (e) {}
      }

      if (module && module['default']) {
        module = module['default'];
      }

      return module;
    }

    function lookup(name) {
      name = this.normalize(name);

      if (this.cache.hasOwnProperty(name)) {
        return this.cache[name];
      }

      var module = this.resolve(name);

      this.cache[name] = module;

      var padding;
      if (name.length > 60) {
        padding = '.';
      } else {
        padding = new Array(60 - name.length).join('.');
      }

      if (module) {
        logger.debug(name, padding, '[✓]');
      } else {
        logger.debug(name, padding, '[ ]');
      }

      return module;
    }

    function has(name) {
      name = this.normalize(name);

      if (this.cache.hasOwnProperty(name)) {
        return !!this.cache[name];
      }

      var module = this.resolve(name);

      this.cache[name] = module;

      return !!module;
    }

    function register(name, module) {
      name = this.normalize(name);
      name = [this.namespace, name].join('/');

      define(name, ['exports'], function(__exports__) {
        __exports__['default'] = module;
      });
    }

    var Container = function(namespace) {
      this.namespace = namespace || 'app';
      this.cache = {};
      this.normalizedNameCache = {};
    };

    Container.prototype = {
      normalize:  normalize,
      register:   register,
      lookup:     lookup,
      resolve:    resolve
    };

    __exports__["default"] = Container;
  });
define("groot/event_dispatcher",
  ["groot/utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var uid = __dependency1__.uid;
    var flatten = __dependency1__.flatten;
    var compact = __dependency1__.compact;
    var mixin = __dependency1__.mixin;

    var events = {
      'touchstart':   'touchStart',
      'touchmove':    'touchMove',
      'touchend':     'touchEnd',
      'touchcancel':  'touchCancel',
      'keydown':      'keyDown',
      'keyup':        'keyUp',
      'keypress':     'keyPress',
      'mousedown':    'mouseDown',
      'mouseup':      'mouseUp',
      'contextmenu':  'contextMenu',
      'click':        'click',
      'dblclick':     'doubleClick',
      'mousemove':    'mouseMove',
      'focusin':      'focusIn',
      'focusout':     'focusOut',
      'mouseenter':   'mouseEnter',
      'mouseleave':   'mouseLeave',
      'submit':       'submit',
      'input':        'input',
      'change':       'change',
      'dragstart':    'dragStart',
      'drag':         'drag',
      'dragenter':    'dragEnter',
      'dragleave':    'dragLeave',
      'dragover':     'dragOver',
      'drop':         'drop',
      'dragend':      'dragEnd'
    };

    function eventDispatcher(app) {
      app.eventHandlers   = {};
      app._eventHandlers  = {};

      Object.keys(events).forEach(function(type) {
        $(document).on(type + '.groot', '.groot-component', function(evt) {
          var id = this.id;
          var eventName = events[type];
          var handler = getHandler(app, id);

          if (handler) {
            handler = handler(eventName);

            if (typeof handler === 'function') {
              var result = handler(evt);

              if (!result) {
                app.render();
                evt.stopPropagation();
              }
            }
          }
        });
      });
    }

    function getHandler(app, id) {
      return app.eventHandlers[id];
    }

    function updateComponentId(app, oldId, newId) {
      app.eventHandlers[oldId] = app._eventHandlers[newId];
      delete app._eventHandlers[newId];
    }

    function removeComponentId(app, id) {
      delete app.eventHandlers[id];
    }

    function finalizeEventHandlers(app) {
      mixin(app.eventHandlers, app._eventHandlers);
      app._eventHandlers = {};
    }

    function updateComponentIds(app, ids, removedIds) {
      removedIds.forEach(function(id) {
        removeComponentId(app, id);
      });
      for (var i = 0, len = ids.length; i < len; i++) {
        updateComponentId(app, ids[i][0], ids[i][1]);
      }
      finalizeEventHandlers(app);
    }

    function collectRemovedIds(vNode) {
      var ids = [];
      ids.push(vNode.properties && vNode.properties.id);
      ids.push(vNode.children && vNode.children.map(collectRemovedIds));
      return compact(flatten(ids));
    }

    function isEmptyPatch(patch) {
      return patch.patch &&
        Object.keys(patch.patch).length === 0;
    }

    function updateEventHandlers(app, patches) {
      if (!patches) { return finalizeEventHandlers(app); }

      var removedIds = [];
      var ids = Object.keys(patches).map(function(id) {
        var patch = patches[id];
        var oldId, newId;

        if (patch.type === 4 && patch.patch.id) {
          oldId = patch.vNode.properties.id;
          newId = patch.patch.id;
          delete patch.patch.id;
        }
        if (patch.type === 7) {
          removedIds = removedIds.concat(collectRemovedIds(patch.vNode));
        }
        if (isEmptyPatch(patch)) {
          delete patches[id];
        }
        if (oldId) {
          return [oldId, newId];
        } else {
          return null;
        }
      });

      ids = compact(ids);
      removedIds = flatten(removedIds);

      updateComponentIds(app, ids, removedIds);

      return patches;
    }

    function registerAction(app, eventName, action) {
      var id = uid();
      //actions = assoc(actions, id, [eventName, action]);
      return id;
    }

    function registerEventHandler(app, id, handler) {
      app._eventHandlers[id] = handler;
    }

    __exports__.registerAction = registerAction;
    __exports__.registerEventHandler = registerEventHandler;
    __exports__.updateEventHandlers = updateEventHandlers;
    __exports__["default"] = eventDispatcher;
  });
define("groot/groot",
  ["rsvp/promise","rsvp","groot/router","groot/container","groot/logger","groot/component","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Promise = __dependency1__["default"];
    var RSVP = __dependency2__["default"];

    var map = __dependency3__.map;
    var setup = __dependency3__.setup;
    var Container = __dependency4__["default"];
    var logger = __dependency5__["default"];
    var defineComponent = __dependency6__["default"];

    function groot(options) {
      options = options || {};

      var app = Object.create(null);
      app.container = new Container(options.namespace);

      app.map = function(block) {
        return map(app, block);
      };

      app.__matchers__ = [];

        $(function() {
          setup(app, options);
        });

      return app;
    }

    groot.defineComponent = defineComponent;

    RSVP.on('error', function(reason) {
      logger.error(reason);
    });

    __exports__["default"] = groot;
  });
define("groot/helper",
  ["groot/utils","groot/event_dispatcher","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var apply = __dependency1__.apply;
    var uid = __dependency1__.uid;
    var registerEventHandler = __dependency2__.registerEventHandler;

    var slice = [].slice;

    function helper(app, name) {
      var helperFn = app.container.lookup('helper:' + name);

      if (helperFn) {
        var args = slice.call(arguments, 2);
        args.unshift(app);
        return apply(null, helperFn, args) || [];
      }
    }

    function component(app, name, data, children) {
      var comp = app.container.lookup('component:'+name);
      if (!comp) { return; }

      var templateName = 'components/'+name;

      comp = comp(app, templateName);

      data = Immutable.fromJS(data);

      function outlet() { return children; }

      var id  = data.get('elementId') || 'groot-' + uid();
      var className = data.get('className') || '';
      className += ' groot-component';

      data = data.merge({
        elementId: id,
        className: className
      });

      function handler(eventName) {
        var fn = comp[eventName];
        if (typeof fn === 'function') {
          return function(evt) { return fn.call(comp, evt, data); };
        }
      }

      registerEventHandler(app, id, handler);

      return comp.render(data, outlet);
    }

    __exports__.component = component;
    __exports__.helper = helper;
  });
define("groot/helpers/>",
  ["groot/template","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var template = __dependency1__["default"];

    __exports__["default"] = function (app, name, data, outlet) {
      return template(app, name, data, outlet);
    }
  });
define("groot/helpers/checkbox",
  ["groot/helpers/input","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var input = __dependency1__["default"];

    __exports__["default"] = function (app, value, data, children) {
      data = data || {};
      data.type = 'checkbox';
      return input(app, value, data, children);
    }
  });
define("groot/helpers/each",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = function (app, collection, block, elseBlock) {
      if (collection && collection.count()) {
        return collection.map(block);
      } else if (elseBlock) {
        return elseBlock();
      }
    }
  });
define("groot/helpers/if",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = function (app, condition, block, elseBlock) {
      if (condition) {
        return block();
      } else if (elseBlock) {
        return elseBlock();
      }
      return [];
    }
  });
define("groot/helpers/input",
  ["groot/helper","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var component = __dependency1__.component;

    __exports__["default"] = function (app, value, data, children) {
      data = data || {};
      data.value = value;
      return component(app, 'input', data, children);
    }
  });
define("groot/helpers/link-to",
  ["groot/helper","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var component = __dependency1__.component;

    __exports__["default"] = function (app, route, data, children) {
      data = data || {};
      data.href = route;
      return component(app, 'link-to', data, children);
    }
  });
define("groot/helpers/tag",
  ["vdom","groot/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var h = __dependency1__.h;

    var flatten = __dependency2__.flatten;
    var compact = __dependency2__.compact;

    //import { registerAction } from 'groot/event_dispatcher';

    function applyActionAttribute(app, attrs) {
      attrs = attrs || {};

      if (attrs.action) {
        var type = attrs.action['on'] || 'click';
        var action = attrs.action['name'] || attrs.action;
        //attrs['data-groot-action'] = registerAction(app, type, action);
        delete attrs.action;
      }

      return attrs;
    }

    function castNumbers(a) {
      if (typeof a === 'number') {
        return String(a);
      }
      return a;
    }

    __exports__["default"] = function (app, tagName, attrs, children) {
      if (typeof children === 'number') {
        children = String(children);
      } else if (typeof children !== 'string') {
        children = Immutable.Vector.from(children)
          .flatten()
          .compact()
          .map(castNumbers)
          .toArray();
        // if (typeof children.toArray === 'function') {
        //   children = children.toArray();
        // }
        // children = compact(flatten(children)).map(castNumbers);
      }

      //attrs = applyActionAttribute(app, attrs);

      return h(tagName, attrs, children);
    }
  });
define("groot/hyperscript",
  ["groot/utils","groot/helper","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var apply = __dependency1__.apply;

    //import { component } from 'groot/component';
    var helper = __dependency2__.helper;
    var component = __dependency2__.component;

    var tagRegExp = /#|\./;

    function hyperscript(app, tagName, attrs, children) {
      if (!tagRegExp.test(tagName)) {
        var result = apply(null, helper, arguments) ||
          apply(null, component, arguments);

        if (result) { return result; }
      }

      return helper(app, 'tag', tagName, attrs, children);
    }

    __exports__["default"] = hyperscript;
  });
define("groot/logger",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = console;
  });
define("groot/render",
  ["vdom","groot/utils","groot/logger","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var diff = __dependency1__.diff;
    var patch = __dependency1__.patch;
    var createElement = __dependency1__.createElement;

    var flatten = __dependency2__.flatten;
    var logger = __dependency3__["default"];

    function render(app, updateEventHandlers) {
      logger.time('TOTAL');
      var handlers = flatten(app.router.currentHandlerInfos);
      logger.time('BUILD');

      var breadcrumb = handlers.map(function(handler) {
        return handler.name;
      }).join('/');

      var tree = renderNextHandler(handlers, null, breadcrumb);
      logger.timeEnd('BUILD');

      renderRootElement(app, tree);

      if (app.rootTree) {
        var patches = diff(app.rootTree, tree);
        patches = updateEventHandlers(app, patches);

        var count = Object.keys(patches).length;
        if (count > 1) {
          logger.time('PATCH');
          patch(app.rootElement, patches);
          logger.timeEnd('PATCH');
        }
      } else {
        updateEventHandlers(app);
      }

      app.rootTree = tree;
      logger.timeEnd('TOTAL');
    }

    function renderRootElement(app, tree, selector) {
      if (tree && !app.rootElement) {
        logger.time('RENDER');
        app.rootElement = createElement(tree);
        logger.timeEnd('RENDER');
        document.body.appendChild(app.rootElement);
      }
    }

    function renderNextHandler(handlers, context, breadcrumb) {
      var handler = handlers.shift();

      function outlet() {
        return renderNextHandler(handlers, handler.context, breadcrumb);
      }

      return handler && renderHandler(handler, context, outlet, breadcrumb);
    }

    function renderHandler(handler, context, outlet, breadcrumb) {
      var data = handler.context || context;
      return handler.handler.render(data, outlet, breadcrumb);
    }

    __exports__["default"] = render;
  });
define("groot/router",
  ["rsvp/resolve","router","groot/utils","groot/logger","groot/component","groot/render","groot/event_dispatcher","groot/run_loop","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var resolve = __dependency1__["default"];
    var Router = __dependency2__["default"];

    var apply = __dependency3__.apply;
    var logger = __dependency4__["default"];

    var defineComponent = __dependency5__["default"];
    var render = __dependency6__["default"];
    var updateEventHandlers = __dependency7__.updateEventHandlers;
    var eventDispatcher = __dependency7__["default"];
    var run = __dependency8__["default"];

    var slice = [].slice;

    function handlerName(handler, name) {
      return handler ?
        handler.name === 'application' ?
          name : [handler.name, name].join('.') : name;
    }

    function onError(reason) {
      logger.error(reason);
    }

    function createMatcher(app, match, handler) {
      return function matcher(name, options, block) {
        if (typeof options === 'function') {
          block = options;
          options = null;
        }

        options = options || {};

        var path = options.path || name;
        name = handlerName(handler, name);

        var roule = match(path);
        var args = [name];
        var component = app.container.lookup('component:'+name) || defineComponent();

        component = component(app, name);
        component.name = name;
        component.isRoute = true;
        component.events.error = onError;

        setHandler(app, name, component);

        if (block) {
          args.push(function(match) {
            (function(matcher) {
              matcher('index', { path: '/' });
              block(matcher);
            })(createMatcher(app, match, component));
          });
        }

        roule.to.apply(roule, args);
      };
    }

    function createRouter(app) {
      var router = new Router();

      router.getHandler = function(name) {
        return getHandler(app, name);
      };

      router.updateURL = function(url) {
        window.history.pushState(null, '', url);
      };

      return router;
    }

    function getHandler(app, name) {
      return app.routeHandlers[name];
    }

    function setHandler(app, name, handler) {
      app.routeHandlers[name] = handler;
    }

    function setup(app, options) {
      app.router = createRouter(app, options);

      app.routeHandlers = {};

      app.render = function(later) {
        if (later) {
          renderLater(app);
        } else {
          renderNow(app);
        }
      };

      var __matchers__ = app.__matchers__;

      app.router.map(function(match) {
        var matcher = createMatcher(app, match);
        matcher('application', { path: '/' }, function(matcher) {
          var block = __matchers__.shift();
          while (block) {
            block(matcher);
            block = __matchers__.shift();
          }
        });
      });

      eventDispatcher(app);
      run(app.router, 'handleURL', location.pathname);
    }

    function renderNow(app) {
      run(null, scheduleRender, app);
    }

    function renderLater(app) {
      run.next(null, scheduleRender, app);
    }

    function scheduleRender(app) {
      run.scheduleOnce('render', function() {
        render(app, updateEventHandlers);
      });
    }

    function map(app, block) {
      app.__matchers__.push(block);
    }

    function transitionTo(app) {
      var args = slice.call(arguments, 1);
      return apply(app.router, app.router.transitionTo, args);
    }

    function generate(app) {
      var args = slice.call(arguments, 1);
      //return apply(app.router, app.router.generate, args);
      return '/toto';
    }

    function sendAction(app, action) {
      return app.router.send(action);
    }

    __exports__.setup = setup;
    __exports__.map = map;
    __exports__.transitionTo = transitionTo;
    __exports__.generate = generate;
    __exports__.sendAction = sendAction;
  });
define("groot/run_loop",
  ["backburner","groot/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Backburner = __dependency1__.Backburner;

    var apply = __dependency2__.apply;

    var onBegin = function(current) {
      run.currentRunLoop = current;
    };

    var onEnd = function(current, next) {
      run.currentRunLoop = next;
    };

    var backburner = new Backburner(['actions', 'render'], {
      onBegin: onBegin,
      onEnd: onEnd,
      defaultQueue: 'actions'
    });

    var slice = [].slice;

    var run = function() {
      return apply(backburner, backburner.run, arguments);
    };

    run.backburner = backburner;
    run.currentRunLoop = null;
    run.queues = backburner.queueNames;

    run.join = function(target, method /* args */) {
      if (!run.currentRunLoop) {
        return apply(null, run, arguments);
      }
      var args = slice.call(arguments);
      args.unshift('actions');
      apply(run, run.schedule, args);
    };

    run.schedule = function(queue, target, method) {
      apply(backburner, backburner.schedule, arguments);
    };

    run.scheduleOnce = function(queue, target, method) {
      apply(backburner, backburner.scheduleOnce, arguments);
    };

    run.once = function(target, method) {
      var args = slice.call(arguments);
      args.unshift('actions');
      return apply(backburner, backburner.scheduleOnce, args);
    };

    run.later = function(target, method) {
      return apply(backburner, backburner.later, arguments);
    };

    run.next = function() {
      var args = slice.call(arguments);
      args.push(1);
      return apply(backburner, backburner.later, args);
    };

    __exports__["default"] = run;
  });
define("groot/template",
  ["groot/utils","groot/hyperscript","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var apply = __dependency1__.apply;
    var hyperscript = __dependency2__["default"];

    var slice = [].slice;

    function empty() { return null; }

    function template(app, name, data, outlet) {
      outlet = outlet || empty;
      var fn = app.container.lookup('template:' + name) || outlet;

      function h() {
        var args = slice.call(arguments);
        args.unshift(app);
        return apply(null, hyperscript, args);
      }

      return fn(h, data, outlet);
    }

    __exports__["default"] = template;
  });
define("groot/utils",
  ["groot/container","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var lookup = __dependency1__.lookup;

    var slice = [].slice;
    var hop = {}.hasOwnProperty;
    var __uid__ = 0;

    function apply(t /* target */, m /* method */, a /* args */) {
      var l = a && a.length;
      if (!a || !l) { return m.call(t); }
      switch (l) {
        case 1: return m.call(t, a[0]);
        case 2: return m.call(t, a[0], a[1]);
        case 3: return m.call(t, a[0], a[1], a[2]);
        case 4: return m.call(t, a[0], a[1], a[2], a[3]);
        case 5: return m.call(t, a[0], a[1], a[2], a[3], a[4]);
        default: return m.apply(t, a);
      }
    }

    function isNone(a) {
      return a === null || a === undefined;
    }

    function uid() {
      return __uid__++;
    }

    function mixin(obj) {
      var key, properties, len = arguments.length;
      for (var i = 1; i < len; i++) {
        properties = arguments[i];
        if (properties) {
          for (key in properties) {
            if (hop.call(properties, key)) {
              obj[key] = properties[key];
            }
          }
        }
      }
      return obj;
    }

    function clone(obj) {
      return mixin({}, obj);
    }

    function isArray(a) {
      return Array.isArray(a) || isSequence(a);
    }

    function isSequence(a) {
      return a instanceof Immutable.Sequence;
    }

    function flatten(arr) {
      return arr.reduce(function(flat, toFlatten) {
        // See if this index is an array that itself needs to be flattened.
        if (!isArray(toFlatten)) {
          return flat.concat([toFlatten]);
        } else if (toFlatten.some(isArray)) {
          return flat.concat(flatten(toFlatten));
        // Otherwise just add the current index to the end of the flattened array.
        } else {
          return flat.concat(toFlatten);
        }
      }, []);
    }

    Immutable.Sequence.prototype.flatten = function() {
      return this.reduce(function(flat, toFlatten) {
        if (!isArray(toFlatten)) {
          return flat.concat([toFlatten]);
        // See if this index is an array that itself needs to be flattened.
        } else if (toFlatten.some(isArray)) {
          return flat.concat(Immutable.Vector.from(toFlatten).flatten());
        // Otherwise just add the current index to the end of the flattened array.
        } else {
          return flat.concat(toFlatten);
        }
      }, Immutable.Vector.empty());
    };

    Immutable.Sequence.prototype.compact = function() {
      return this.filter(function(a) { return !isNone(a); });
    };

    function compact(arr) {
      return arr.filter(function(a) { return !isNone(a); });
    }

    __exports__.uid = uid;
    __exports__.apply = apply;
    __exports__.isNone = isNone;
    __exports__.mixin = mixin;
    __exports__.clone = clone;
    __exports__.flatten = flatten;
    __exports__.compact = compact;
  });
define("groot",
  ["groot/groot","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var groot = __dependency1__["default"];

    __exports__["default"] = groot;
  });window.groot = requireModule('groot')['default'];