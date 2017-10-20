//1. Import
var express = require("express");
var http = require("http");
var routes = require("./routes/route.js");

//2. Initialize
var app = express();
var server = http.createServer(app);
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));


//3. Route - Paged(GET)/Pageless(POST)
app.get("/", routes.index);

//4. Create port and listen to server
var port = process.env.port || 8080;
server.listen(
    port,
    function(request, response)
    {
        console.log("Catch action at http://localhost: " + port);
    }
);