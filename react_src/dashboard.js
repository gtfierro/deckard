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
        console.log(point);
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
                <p>{this.state.query}</p>
                <div className="row">
                    <div className="col-md-8">
                        <ListGroup>
                            {rows}
                        </ListGroup>
                    </div>
                    <div classname="col-md-4">
                        {detail}
                    </div>
                </div>
            </div>
        );
    }
});


var PointRow = React.createClass({
    render: function() {
        return (
        <ListGroupItem href="#" onClick={this.props.onClick}>
            <div className="pointRow">
                {this.props.Path}
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
