var Dashboard = React.createClass({
    getInitialState: function() {
        return {page: "dashboard", query: "", error: null, selected: null, loading: false, willUpdate: true}
    },
    /*
     * For large dashboards, maintaining a websocket/socket.io connection for each row is expensive. Instead,
     * we use the shouldComponentUpdate method to do an intelligent update. If a query has not yet been
     * submitted, we return the default value of true. If a query *has* been submitted, then at the bottom of
     * the submitQuery method, a timer is executed that sets the value of shouldComponentUpdate to true
     * every second, so the entire component will only be updated then.
     */
    shouldComponentUpdate: function(nextState, nextProps) {
        if (this.state.query == null) { return true; }
        if (this.state.willUpdate) {
            this.setState({willUpdate: false});
            return true;
        }
        return false;
    },
    /*
     * Here we use React's immutable updates to give it some hints on how to update the full DOM
     */
    updateFromRepublish: function(newdata) {
        var self = this;
        _.each(_.values(newdata), function(obj) {
            self.setState(React.addons.update(self.state, {
                data: makeProp(obj.uuid, {
                    latestValue: {$set : obj.Readings[obj.Readings.length-1][1] },
                    latestTime:  {$set : moment.unix(obj.Readings[obj.Readings.length-1][0]) }
                })
            }));
        });
    },
    componentDidMount: function() {
        this.submitQuery({});
    },
    /*
     * When a query is submitted we submit it to the archiver, and render any error that we receive.
     * If there is no error, then we set our internal state to a mapping of UUID -> timeseries object.
     * Each timeseries object contains the top level keys Metadata, Properties, Path, uuid and Readings
     */
    submitQuery: function(e) {
        // fetch metadata query
        var query = this.refs.queryInput.getValue();
        this.setState({query: query, error: null, loading: true});
        var self = this;
        run_query(query,
            function(data) {
                var newstate = {};
                _.each(data, function(obj) {
                    newstate[obj.uuid] = obj;
                });
                self.setState({data: newstate, loading: false});
            },
            function(xhr,status,err) {
                self.setState({error: xhr.responseText, loading:false});
                console.error(xhr.responseText);
            }
        );

        // fetch most recent data point query
        run_dataquery(query,
            function(data) {
                var newstate = self.state.data;
                _.each(data, function(obj) {
                    if (obj.Readings == null) { return; }
                    newstate[obj.uuid].latestValue = obj.Readings[obj.Readings.length-1][1];
                    newstate[obj.uuid].latestTime = moment.unix(obj.Readings[obj.Readings.length-1][0]);
                });
                self.setState({data: newstate, loading: false});
            },
            function(xhr,status,err) {
                self.setState({error: xhr.responseText, loading:false});
                console.error(xhr.responseText);
            }
        );

        // set up realtime data updates
        console.log("subscribe", query);
        var socket = io.connect();
        socket.emit('new subscribe', query);
        socket.on(query, function(data) {
            if (self.isMounted()) {
                self.updateFromRepublish(data);
            }
        });
        this.setState({socket: socket});
        setInterval(function () {
            self.setState({willUpdate: true});
        }, 250);
    },
    showDetail: function(point) {
        this.setState({selected: point});
    },
    render: function() {
        var self = this;

        // render error if one occurs during any query
        var error = (<span></span>);
        if (this.state.error != null) {
            error = (
                <Panel header="Query Error" bsStyle="danger">
                    {this.state.error}
                </Panel>
            );
        }

        // set up the point detail pane on the right
        var detail = (<span></span>);
        if (this.state.selected != null) {
           detail =  <PointDetail {...this.state.selected} />
        }

        // create the rows resulting from the points
        // thresholds is built off of the global threshold/color values
        var rows = _.map(this.state.data, function(point) {
            return (
                <PointRow key={point.uuid} thresholds={_.sortBy(this.props.valueLink.value, function(o) { return -o.time})} onClick={this.showDetail.bind(this, point)} {...point} />
            )
        }, this);

        return (
            <div className="dashboard">
                <div className="row">
                    <div className="col-md-10">
                        <Input
                            type='text'
                            placeholder="where clause"
                            ref="queryInput"
                            hasFeedback
                        />
                    </div>
                    <div className="col-md-2">
                        <Button onClick={this.submitQuery} disabled={this.state.loading} bsStyle='success'>
                            {this.state.loading ? "Loading..." : "Query"}
                        </Button>
                    </div>
                </div>
                {error}
                <div className="row">
                    <div className="col-md-8">
                        <ListGroup>
                            <ListGroupItem>
                            <div className="row">
                                <div className="col-md-4"><b>Path</b></div>
                                <div className="col-md-2"><b>Latest Value</b></div>
                                <div className="col-md-2"><b>Latest Time</b></div>
                            </div>
                            </ListGroupItem>
                            {rows}
                        </ListGroup>
                    </div>
                    <div className="col-md-4">
                        {detail}
                    </div>
                </div>
            </div>
        );
    }
});


var PointRow = React.createClass({
    render: function() {
        //console.log("props", this.props);
        var color = 'danger';
        if (this.props.latestTime != null) {
            var difference = moment().diff(this.props.latestTime, 'seconds');
            _.each(this.props.thresholds, function(t) {
                if (difference < t.time) {
                    color = t.color;
                }
            });
        }
        return (
        <ListGroupItem href="#" onClick={this.props.onClick} bsStyle={color}>
            <div className="pointRow">
                <div className="row">
                    <div className="col-md-4">
                        {this.props.Path}
                    </div>
                    <div className="col-md-2">
                        {this.props.latestValue}
                    </div>
                    <div className="col-md-2">
                        {this.props.latestTime == null ? null : this.props.latestTime.format("dddd, MMMM Do YYYY, h:mm:ss a")}
                    </div>
                    <div className="col-md-2">
                        {this.props.latestTime == null ? null : this.props.latestTime.from(moment()) }
                    </div>
                </div>
            </div>
        </ListGroupItem>
        );
    }
});

var PointDetail = React.createClass({
    render: function() {
        return (
            <div className="pointDetail">
                <h2>Detail</h2>
                <pre>{JSON.stringify(this.props, null, 2) }</pre>
            </div>
        );
    }
});
