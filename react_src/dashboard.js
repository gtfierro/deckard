var queryURL = 'http://localhost:8079/api/query';

var Dashboard = React.createClass({
    getInitialState: function() {
        return {page: "dashboard", query: "", error: null};
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
            },
            function(xhr,status,err) {
                self.setState({error: xhr.responseText});
                console.error(xhr.responseText);
            }
        )
    },
    render: function() {
        var error = (<span></span>);
        if (this.state.error != null) {
            error = (
                <Panel header="Query Error" bsStyle="danger">
                    {this.state.error}
                </Panel>
            );
        }
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
            </div>
        );
    }
});
