import { Backburner } from 'backburner';

import { apply } from 'groot/utils';

var onBegin = function(current) {
  run.currentRunLoop = current;
};

var onEnd = function(current, next) {
  run.currentRunLoop = next;
};

var backburner = new Backburner(['actions', 'render'], {
  onBegin: onBegin,
  onEnd: onEnd,
  defaultQueue: 'actions'
});

var slice = [].slice;

var run = function() {
  return apply(backburner, backburner.run, arguments);
};

run.backburner = backburner;
run.currentRunLoop = null;
run.queues = backburner.queueNames;

run.join = function(target, method /* args */) {
  if (!run.currentRunLoop) {
    return apply(null, run, arguments);
  }
  var args = slice.call(arguments);
  args.unshift('actions');
  apply(run, run.schedule, args);
};

run.schedule = function(queue, target, method) {
  apply(backburner, backburner.schedule, arguments);
};

run.scheduleOnce = function(queue, target, method) {
  apply(backburner, backburner.scheduleOnce, arguments);
};

run.once = function(target, method) {
  var args = slice.call(arguments);
  args.unshift('actions');
  return apply(backburner, backburner.scheduleOnce, args);
};

run.later = function(target, method) {
  return apply(backburner, backburner.later, arguments);
};

run.next = function() {
  var args = slice.call(arguments);
  args.push(1);
  return apply(backburner, backburner.later, args);
};

export default run;
