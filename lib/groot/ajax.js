import promise from 'rsvp/promise';

function ajax() {
  var args = arguments;

  return new promise(function(resolve, reject) {
    $.ajax.apply($, args).then(success(resolve), error(reject));
  });
}

function success(resolve) {
  return function success(data, status, xhr) {
    resolve({
      data: data,
      status: xhr.status
    });
  };
}

function error(reject) {
  return function error(xhr, status) {
    reject({
      data: xhr.responseText,
      status: xhr.status
    });
  };
}

export default ajax;
