import { component } from 'groot/helper';

export default function (app, route, data, children) {
  data = data || {};
  data.href = route;
  return component(app, 'link-to', data, children);
}
