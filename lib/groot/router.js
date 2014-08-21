import resolve from 'rsvp/resolve';
import Router from 'router';

import { apply } from 'groot/utils';
import logger from 'groot/logger';

import defineComponent from 'groot/component';
import render from 'groot/render';
import { updateEventHandlers } from 'groot/event_dispatcher';
import eventDispatcher from 'groot/event_dispatcher';
import run from 'groot/run_loop';

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

export { setup, map, transitionTo, generate, sendAction };
