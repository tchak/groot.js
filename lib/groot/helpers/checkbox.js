import input from 'groot/helpers/input';

export default function (app, value, data, children) {
  data = data || {};
  data.type = 'checkbox';
  return input(app, value, data, children);
}
