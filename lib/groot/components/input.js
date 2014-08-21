import defineComponent from 'groot/component';

function valueDidChange(evt, data) {
  var elem = $(evt.currentTarget);
  var value;
  if (elem.attr('type') === 'checkbox') {
    value = elem.prop('checked');
  } else {
    value = elem.val();
  }

  var update = data.get('onChange') || function() {};
  update(value);
}

export default defineComponent({
  tagName: 'input',
  type: 'text',
  attributes: ['type', 'placeholder', 'value:checked', 'value'],

  change: valueDidChange,
  keyUp: valueDidChange
});
