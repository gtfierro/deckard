var queryURL = 'http://localhost:8079/api/query';

var Dashboard = React.createClass({
    getInitialState: function() {
        return {page: "dashboard", query: "", error: null, selected: null};
    },
    componentDidMount: function() {
    },
    submitQuery: function(e) {
        var query = "select * where " + this.refs.queryInput.getValue();
        this.setState({query: query, error: null});
        var self = this;
        run_query(query,
            function(data) {
                console.log(data);
                self.setState({data: data});
            },
            function(xhr,status,err) {
                self.setState({error: xhr.responseText});
                console.error(xhr.responseText);
            }
        )
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
                        <Button onClick={this.submitQuery} bsStyle='success'>Query</Button>
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
    componentWillMount: function() {
        var self = this;
        run_query('select data before now as s where uuid = "'+this.props.uuid+'"',
            function(data) {
                if (data.length > 0 && data[0].Readings.length > 0) {
                    console.log(data);
                    var rdg = data[0].Readings[data[0].Readings.length-1];
                    self.setState({latestValue: rdg[1], latestTime: moment.unix(rdg[0])});
                    console.log(moment.unix(rdg[0]));
                }
            },
            function(xhr) {
                console.err(xhr.responseText);
            }
        );
    },
    render: function() {
        return (
        <ListGroupItem href="#" onClick={this.props.onClick}>
            <div className="pointRow">
                <div className="row">
                    <div className="col-md-4">
                        {this.props.Path}
                    </div>
                    <div className="col-md-2">
                        {this.state.latestValue}
                    </div>
                    <div className="col-md-2">
                        {this.state.latestTime == null ? null : this.state.latestTime.format("dddd, MMMM Do YYYY, h:mm:ss a")}
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
