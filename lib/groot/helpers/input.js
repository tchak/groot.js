import { component } from 'groot/helper';

export default function (app, value, data, children) {
  data = data || {};
  data.value = value;
  return component(app, 'input', data, children);
}
