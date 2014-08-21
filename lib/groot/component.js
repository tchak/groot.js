import resolve from 'rsvp/resolve';
import { uid, mixin } from 'groot/utils';

import { helper } from 'groot/helper';
import template from 'groot/template';

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

export default defineComponent;
