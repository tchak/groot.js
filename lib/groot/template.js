import { apply } from 'groot/utils';
import hyperscript from 'groot/hyperscript';

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

export default template;
