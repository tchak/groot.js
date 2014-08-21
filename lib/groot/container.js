import logger from 'groot/logger';

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

export default Container;
