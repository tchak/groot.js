import { h } from 'vdom';

import { flatten, compact } from 'groot/utils';

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

export default function (app, tagName, attrs, children) {
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
