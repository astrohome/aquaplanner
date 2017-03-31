require('jquery');
require('bootstrap');

module.exports = {
  show: function(id) {
    $('#'+ id).modal({
        backdrop: 'static'
    });
  },
  showWithDetails: function(id, messageId, message) {
    $('#'+ id).modal({
        backdrop: 'static'
    });
    $('#' + messageId).text(message);
  },
  hide: function() {
    $('#loading').modal('hide');
  }
}
