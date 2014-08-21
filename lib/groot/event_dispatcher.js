import { uid, flatten, compact, mixin } from 'groot/utils';

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

export { registerAction, registerEventHandler, updateEventHandlers };
export default eventDispatcher;
