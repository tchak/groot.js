import { lookup } from 'groot/container';

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

export { uid, apply, isNone, mixin, clone, flatten, compact };
