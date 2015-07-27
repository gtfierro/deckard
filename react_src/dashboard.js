var Dashboard = React.createClass({
    getInitialState: function() {
        return {page: "dashboard", query: "", error: null, selected: null, loading: false, willUpdate: true};
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
    /*
     * When a query is submitted we submit it to the archiver, and render any error that we receive.
     * If there is no error, then we set our internal state to a mapping of UUID -> timeseries object.
     * Each timeseries object contains the top level keys Metadata, Properties, Path, uuid and Readings
     */
    submitQuery: function(e) {
        var query = "select * where " + this.refs.queryInput.getValue();
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
        console.log("subscribe", this.refs.queryInput.getValue());
        var subscribeQuery = this.refs.queryInput.getValue();
        var socket = io.connect();
        socket.emit('new subscribe', subscribeQuery);
        socket.on(subscribeQuery, function(data) {
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
        var error = (<span></span>);
        if (this.state.error != null) {
            error = (
                <Panel header="Query Error" bsStyle="danger">
                    {this.state.error}
                </Panel>
            );
        }
        var detail = (<span></span>);
        if (this.state.selected != null) {
           detail =  <PointDetail {...this.state.selected} />
        }
        var rows = _.map(this.state.data, function(point) {
            return (
                <PointRow key={point.uuid} onClick={this.showDetail.bind(this, point)} {...point} />
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
    getInitialState: function() {
        return {latestValue: null, latestTime: null}
    },
    render: function() {
        //console.log("props", this.props);
        return (
        <ListGroupItem href="#" onClick={this.props.onClick}>
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
