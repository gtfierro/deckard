var Input = ReactBootstrap.Input;
var Panel = ReactBootstrap.Panel;
var Glyphicon = ReactBootstrap.Glyphicon;

var Nav = ReactBootstrap.Nav;
var NavItem = ReactBootstrap.NavItem;

var ListGroup = ReactBootstrap.ListGroup;
var ListGroupItem = ReactBootstrap.ListGroupItem;

var Button = ReactBootstrap.Button;
var ButtonToolbar = ReactBootstrap.ButtonToolbar;
var ButtonGroup = ReactBootstrap.ButtonGroup;
var DropdownButton = ReactBootstrap.DropdownButton;
var MenuItem = ReactBootstrap.MenuItem;

String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// convenience method for running AJAX POST
var run_query = function(q, succ, err) {
    $.ajax({
        url: '/query',
        datatype: 'json',
        type: 'POST',
        data: {query: q},
        success: succ.bind(this),
        error: err.bind(this)
    });
}

var run_dataquery = function(q, succ, err) {
    $.ajax({
        url: '/dataquery',
        datatype: 'json',
        type: 'POST',
        data: {query: q},
        success: succ.bind(this),
        error: err.bind(this)
    });
};

function makeProp(prop, value) {
  var obj = {}
  obj[prop] = value
  return obj
}

function get_permalink(uuid, duration, succ, err) {
    $.ajax({
        url: '/permalink',
        datatype: 'json',
        type: 'POST',
        data: {uuid: uuid, duration: duration},
        success: succ.bind(this),
        error: err.bind(this)
    });
}

var durationLookup = {
    'sec': 1e9,
    'min': 6e10,
    'hour': 3.6e12,
    'day': 8.64e13
}
