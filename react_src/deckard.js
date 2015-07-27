var queryURL = 'http://localhost:8079/api/query';

var Deckard = React.createClass({
    mixins: [React.addons.LinkedStateMixin],
    getInitialState: function() {
        return {page: "dashboard", thresholds: [
            {time: 30, color: "success"}, 
            {time: 600, color: "warning"}, 
            {time: 3600, color: "danger"}
        ]}
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
                <Dashboard valueLink={this.linkState('thresholds')}/>
            );
            break;
        case "config":
            contents = (
                <ConfigDashboard />
            );
            break;
        }

        return (
            <div className="deckard">
            <h1>Status Dashboard</h1>
            <div className="row">
                <div className='col-md-2'>
                    <ReactBootstrap.Nav bsStyle='pills' stacked activeKey={this.state.page} onSelect={this.handleSelect}>
                        <ReactBootstrap.NavItem eventKey={"dashboard"}>Dashboard</ReactBootstrap.NavItem>
                        <ReactBootstrap.NavItem eventKey={"config"}>Config</ReactBootstrap.NavItem>
                    </ReactBootstrap.Nav>
                </div>
                <div className='col-md-10'>
                    {contents}
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
