import Promise from 'rsvp/promise';
import RSVP from 'rsvp';

import { map, setup } from 'groot/router';
import Container from 'groot/container';
import logger from 'groot/logger';
import defineComponent from 'groot/component';

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

export default groot;
