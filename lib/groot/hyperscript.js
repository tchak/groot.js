import { apply } from 'groot/utils';

//import { component } from 'groot/component';
import { helper, component } from 'groot/helper';

var tagRegExp = /#|\./;

function hyperscript(app, tagName, attrs, children) {
  if (!tagRegExp.test(tagName)) {
    var result = apply(null, helper, arguments) ||
      apply(null, component, arguments);

    if (result) { return result; }
  }

  return helper(app, 'tag', tagName, attrs, children);
}

export default hyperscript;
