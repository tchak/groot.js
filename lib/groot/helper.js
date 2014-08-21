import { apply, uid } from 'groot/utils';
import { registerEventHandler } from 'groot/event_dispatcher';

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

export { component, helper };
