var Dashboard = React.createClass({
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
        return {page: "dashboard", query: "", error: null, selected: null, loading: false, willUpdate: true,
                animateOnUpdate: false, sortRowsLabel: "Time", sortRowsAscending: false,
                dashPermalink: null,
                thresholds: {
                    "warning": 60,
                    "danger": 600
                }}
    },
    /*
     * Here we use React's immutable updates to give it some hints on how to update the full DOM
     */
    updateFromRepublish: function(newdata) {
        var self = this;
        _.each(_.values(newdata), function(obj) {
            if (obj == null || obj.Readings == null || obj.uuid == null ) { return; }
            if (self.state.data == null) {return; }
            if (self.state.data[obj.uuid] == null) { return; }
            self.setState(React.addons.update(self.state, {
                data: makeProp(obj.uuid, {
                    latestValue: {$set : obj.Readings[obj.Readings.length-1][1] },
                    latestTime:  {$set : moment.unix(obj.Readings[obj.Readings.length-1][0]) }
                })
            }));
        });
    },
    componentWillMount: function() {
        var permalink = window.location.hash;
        var self= this;
        if (!permalink) { return; }
        permalink = permalink.slice(1,permalink.length);
        console.log("permalink?", permalink);
        get_dash_permalink(permalink,
            function(res) {
                console.log("got permalink!", res);
                //self.refs.queryInput.setValue(res.query);
                self.setState({query: res});
                self.submitQuery();
            },
            function (xhr) {
                self.setState({error: xhr.responseText});
                console.error(xhr.responseText);
            }
        );
        this.submitQuery({});
    },
    handleQueryChange: function(c) {
        this.setChange({query: c});
    },
    /*
     * When a query is submitted we submit it to the archiver, and render any error that we receive.
     * If there is no error, then we set our internal state to a mapping of UUID -> timeseries object.
     * Each timeseries object contains the top level keys Metadata, Properties, Path, uuid and Readings
     */
    submitQuery: function(e) {
        // fetch metadata query
        var query = this.state.query;
        this.setState({error: null, loading: true});
        var self = this;
        run_query(query,
            function(data) {
                var newstate = {};
                _.each(data, function(obj) {
                    newstate[obj.uuid] = obj;
                });
                self.setState({data: newstate});
            },
            function(xhr,status,err) {
                self.setState({error: xhr.responseText});
                console.error(xhr.responseText);
            }
        );

        // fetch most recent data point query
        run_dataquery(query,
            function(data) {
                var newstate = self.state.data;
                if (newstate == null) { return; }
                _.each(data, function(obj) {
                    if (obj == null || obj.Readings == null || obj.uuid == null ) { return; }
                    if (newstate[obj.uuid] == null) { return; }
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
    },
    showDetail: function(point) {
        this.setState({selected: point});
    },
    changeThreshold: function(e) {
        e.preventDefault();
        var thresholds = this.state.thresholds;
        thresholds.warning = parseInt(this.refs.warningThreshold.getValue());
        thresholds.danger = parseInt(this.refs.dangerThreshold.getValue());
        console.log("new thresholds", thresholds);
        this.setState({thresholds: thresholds});
    },
    savePermalink: function(e) {
        e.preventDefault();
        var self = this;
        save_dash_permalink(this.state.query,
            function (permalink) {
                self.setState({dashPermalink: format_permalink(permalink)});
            },
            function (xhr) {
                self.setState({error: xhr.responseText});
                console.error(xhr.responseText);
            }
        );
    },
    sortRows: function(label) {
        console.log("sort by", label);
        this.setState({sortRowsLabel: label});
        if (this.state.sortRowsAscending == null) {
            this.setState({sortRowsAscending: false});
        } else if (!this.state.sortRowsAscending) {
            this.setState({sortRowsAscending: true});
        } else {
            this.setState({sortRowsAscending: null});
        }
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
        // Have a new selement specifically for this list and optimize that shouldComponentUpdate

        var savePermalinkButton = (
            <Button bsStyle="info" onClick={this.savePermalink}>Get Permalink!</Button>
        );

       //<div className="row">
       //    <div className="col-md-2">
       //        <Input type='checkbox' label='Flash on Update' ref="animateOnUpdate" onChange={this.toggleAnimateOnUpdate} />
       //    </div>
       //</div>
        return (
            <div className="dashboard">
                <div className="row">
                    <form onSubmit={this.submitQueryForm}>
                        <div className="col-md-10">
                            <Input
                                type='text'
                                valueLink={this.linkState("query")}
                                hasFeedback
                            />
                        </div>
                        <div className="col-md-2">
                            <Button type="submit" onClick={this.submitQuery} disabled={this.state.loading} bsStyle='success'>
                                {this.state.loading ? "Loading..." : "Query"}
                            </Button>
                        </div>
                    </form>
                </div>
                {error}
                <div className="row">
                    <form onSubmit={this.changeThreshold}>
                        <div className="col-md-2">
                            <Button type="submit" >Change Thresholds</Button>
                        </div>
                        <div className="col-md-2">
                            <Input type='text' maxLength="7" size="4" addonBefore="Warning" bsStyle="warning" defaultValue={this.state.thresholds.warning} ref="warningThreshold" />
                        </div>
                        <div className="col-md-2">
                            <Input type='text' maxLength="7" size="4" addonBefore="Danger" bsStyle="error" defaultValue={this.state.thresholds.danger} ref="dangerThreshold" />
                        </div>
                        <div className="col-md-4">
                            <Input type='text' maxLength="6" size="6" buttonBefore={savePermalinkButton} value={this.state.dashPermalink} />
                        </div>
                    </form>
                </div>
                <div className="row">
                    <div className="col-md-8">
                        <ListGroup>
                            <ListGroupItem>
                            <div className="row">
                                <div className="col-md-4 hover" onClick={this.sortRows.bind(this, "Path")}>
                                    <b>Path</b>
                                </div>
                                <div className="col-md-2 hover" onClick={this.sortRows.bind(this, "Value")}>
                                    <b>Latest Value</b>
                                </div>
                                <div className="col-md-4 hover" onClick={this.sortRows.bind(this, "Time")}>
                                    <b>Latest Time</b>
                                </div>
                                <div className="col-md-2"></div>
                            </div>
                            </ListGroupItem>
                            <PointList data={this.state.data}
                                       showDetail={this.showDetail}
                                       sortRowsLabel={this.state.sortRowsLabel}
                                       sortRowsAscending={this.state.sortRowsAscending}
                                       thresholds={this.state.thresholds} />
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


var PointList = React.createClass({
    getInitialState: function() {
        return {willUpdate: true};
    },
    /*
     * For large dashboards, maintaining a websocket/socket.io connection for each row is expensive. Instead,
     * we use the shouldComponentUpdate method to do an intelligent update. If a query has not yet been
     * submitted, we return the default value of true. If a query *has* been submitted, then at the bottom of
     * the submitQuery method, a timer is executed that sets the value of shouldComponentUpdate to true
     * every second, so the entire component will only be updated then.
     */
    componentDidMount: function() {
        console.log("POINT LIST", this.props);
        var self = this;
        setInterval(function () {
            self.setState({willUpdate: true});
        }, 1000);
    },
    shouldComponentUpdate: function(nextState, nextProps) {
        //if (this.state.query == null) { return true; }
        if (this.state.willUpdate) {
            this.setState({willUpdate: false});
            return true;
        }
        return false;
    },
    showDetail: function(point) {
        this.props.showDetail(point);
    },
    render: function() {
        var self = this;
        var rows = _.map(this.props.data, function(point) {
            return (
                <PointRow key={point.uuid} thresholds={self.props.thresholds} onClick={this.showDetail.bind(this, point) } {...point} />
            )
        }, this);
        if (this.props.sortRowsLabel != null) {
            rows = _.sortBy(rows, function(r) {
                switch (self.props.sortRowsLabel) {
                case "Path":
                    return r.props.Path == null ? -Number.MIN_VALUE : r.props.Path
                case "Value":
                    return r.props.latestValue == null ? -Number.MIN_VALUE : r.props.latestValue
                case "Time":
                    return r.props.latestTime == null ? -Number.MIN_VALUE : r.props.latestTime
                }
            });
            if (!this.props.sortRowsAscending) {
                rows.reverse();
            }
        }


        return (
            <div className="pointList">
                {rows}
            </div>
        );
    }
});


var PointRow = React.createClass({
    getInitialState: function() {
        return {loading: false, plotDuration: 'hour', color: "danger"} // default 1 hour
    },
    goToPlot: function() {
        console.log("get permalink for", this.props.uuid);
        var self = this;
        this.setState({loading: true});
        console.log("duration", durationLookup[this.state.plotDuration]);
        get_permalink(this.props.uuid, parseInt(durationLookup[this.state.plotDuration]),
            function(url) {
                console.log(url);
                self.setState({loading: false});
                window.open(url, '_blank');
            },
            function(xhr) {
            }
        );
    },
    changeDuration: function(e) {
        this.setState({plotDuration: this.refs.plotDuration.getValue()});
    },
    componentDidUpdate: function(prevProps) {
        if ((this.props.latestTime != prevProps.latestTime) && (this.props.latestTime != null)) {
            var difference = moment().diff(this.props.latestTime, 'seconds');

            if (difference < this.props.thresholds.warning) {
                this.setState({color: "success"});
            } else if (difference < this.props.thresholds.danger) {
                this.setState({color: "warning"});
            } else {
                this.setState({color: "danger"});
            }
        }
    },
    componentDidMount: function() {
        if (this.props.latestTime != null) {
            var difference = moment().diff(this.props.latestTime, 'seconds');

            if (difference < this.props.thresholds.warning) {
                this.setState({color: "success"});
            } else if (difference < this.props.thresholds.danger) {
                this.setState({color: "warning"});
            } else {
                this.setState({color: "danger"});
            }
        }
    },
    render: function() {
        //console.log("props", this.props);
        return (
        <ListGroupItem href="#" onClick={this.props.onClick} bsStyle={this.state.color}>
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
                    <div className="col-md-2">
                        <div className="row">
                          <div className="col-md-5">
                            <Button onClick={this.goToPlot}
                                    bsStyle="info"
                                    disabled={this.state.loading}>
                                {this.state.loading ? "Fetching" : "Plot last"}
                            </Button>
                          </div>
                          <div className="col-md-7">
                            <Input type='select' onChange={this.changeDuration} ref="plotDuration" value={this.state.plotDuration}>
                              <option value='sec'>sec</option>
                              <option value='min'>min</option>
                              <option value='hour'>hour</option>
                              <option value='day'>day</option>
                            </Input>
                          </div>
                        </div>
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
