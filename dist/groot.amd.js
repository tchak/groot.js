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
  });