var app = require("./app/app-server.js");

app.initServer().then(function () {
  console.log('ready');
	app.startServer();
});
