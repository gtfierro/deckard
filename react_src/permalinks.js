var Deckard = React.createClass({
    mixins: [React.addons.LinkedStateMixin],
    componentDidMount: function() {
    },
    render: function() {
        return (
            <div className="deckard">
            <h1>Status Dashboard</h1>
            <div className="row">
                <div className='col-md-2'>
                    <ReactBootstrap.Nav bsStyle='pills' stacked activeKey={this.props.page}>
                        <ReactBootstrap.NavItem eventKey={"dashboard"} href="/">Dashboard</ReactBootstrap.NavItem>
                        <ReactBootstrap.NavItem eventKey={"permalinks"} href="/permalinks">Permalinks</ReactBootstrap.NavItem>
                        <ReactBootstrap.NavItem eventKey={"config"} href="/config">Config</ReactBootstrap.NavItem>
                    </ReactBootstrap.Nav>
                    <br />
                    <Panel header="Welcome to Deckard" bsStyle="info">
                        <p>Deckard is a real-time status dashboard</p>

                        <p>
                        Rows are generated from a "view", which is a server-configured Metadata query against
                        the archiver. You can refine this query by typing in the query bar at the top and hitting "Query".
                        The contents of the query bar should be formatted as a "where-clause", and will be added
                        to the server-configured query. Syntax for the query language and where-clause can be
                        found <a href="https://gtfierro.github.io/giles/interface/#querylang">here</a>.
                        </p>

                        <p>
                        Click on any row to view the Metadata for that timeseries. Clicking "Plot" will open a new window
                        on the BtrDB plotter.
                        </p>

                        <p>
                        Rows are sorted by latest time by default, but you can click on the headers multiple times to sort ascending
                        or descending by that column.
                        </p>

                    </Panel>
                </div>
                <div className='col-md-10'>
                    <PermalinkList />
                </div>
            </div>
            </div>
        );
    }
});

var PermalinkList = React.createClass({
    getInitialState: function() {
        return {list: []}
    },
    componentWillMount: function() {
        var self = this;
        list_dash_permalinks(
            function(result) {
                self.setState({list: result});
            },
            function(err) {
                console.error(err);
            }
        )
    },
    render: function() {
        var rows = _.map(this.state.list, function(item) {
            return (
                <ListGroupItem href={"/index#"+item._id} key={item._id}>
                    <p><Glyphicon glyph="chevron-right" /> {item.query}</p>
                </ListGroupItem>
            )
        });
        return (
            <div className="permalinkList">
                <h2>Permalinks</h2>
                <ListGroup>
                {rows}
                </ListGroup>
            </div>
        );
    }
});

React.render(
    <Deckard page="permalinks" />,
    document.getElementById('content')
);
