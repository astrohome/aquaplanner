require('jquery');
require('bootstrap');

module.exports = {
  show: function() {
    $('#loading').modal({
        backdrop: 'static'
    });
  },
  hide: function() {
    $('#loading').modal('hide');
  }
}
