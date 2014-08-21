import defineComponent from 'groot/component';
import { transitionTo, generate } from 'groot/router';
import { apply } from 'groot/utils';

export default defineComponent({
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
