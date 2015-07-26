var Input = ReactBootstrap.Input;
var Nav = ReactBootstrap.Nav;
var NavItem = ReactBootstrap.NavItem;
var Button = ReactBootstrap.Button;
var Panel = ReactBootstrap.Panel;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;
var ListGroup = ReactBootstrap.ListGroup;
var ListGroupItem = ReactBootstrap.ListGroupItem;

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// convenience method for running AJAX POST
var run_query = function(q, succ, err) {
    $.ajax({
        url: queryURL,
        datatype: 'json',
        type: 'POST',
        data: q,
        success: succ.bind(this),
        error: err.bind(this)
    });
};
