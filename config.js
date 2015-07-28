var config = {};

// dashboard view
config.view = '';

// deployment information for Giles
config.archiverHost = 'localhost';
config.httpArchiverPort = 8079;
config.httpArchiverUrl = 'http://'+config.archiverHost+":"+config.httpArchiverPort;
config.wsArchiverPort = 8078;
config.wsArchiverUrl = 'ws://'+config.archiverHost+":"+config.wsArchiverPort;
config.plotterURL = 'http://'+config.archiverHost;

module.exports = config;
