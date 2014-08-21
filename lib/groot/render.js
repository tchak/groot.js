import { diff, patch, createElement } from 'vdom';

import { flatten } from 'groot/utils';
import logger from 'groot/logger';

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

export default render;
