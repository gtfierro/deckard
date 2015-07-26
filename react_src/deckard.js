var queryURL = 'http://localhost:8079/api/query';

var Deckard = React.createClass({
    getInitialState: function() {
        return {page: "dashboard"};
    },
    componentDidMount: function() {
    },
    handleSelect(selectedKey) {
        console.log('selected ' + selectedKey);
        this.setState({page: selectedKey});
    },
    render: function() {
        var contents = (<p>Loading...</p>);
        switch (this.state.page) {
        case "dashboard":
            contents = (
                <Dashboard />
            );
            break;
        }

        return (
            <div className="deckard">
            <h1>OpenBAS</h1>
            <div className="row">
                <div className='col-md-2'>
                    <ReactBootstrap.Nav bsStyle='pills' stacked activeKey={this.state.page} onSelect={this.handleSelect}>
                        <ReactBootstrap.NavItem eventKey={"dashboard"}>Dashboard</ReactBootstrap.NavItem>
                    </ReactBootstrap.Nav>
                </div>
                <div className='col-md-6'>
                    {contents}
                </div>
                <div className='col-md-3'>
                </div>
            </div>
            </div>
        );
    }
});

React.render(
    <Deckard />,
    document.getElementById('content')
);
