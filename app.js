//1. Import
var express = require("express");
var http = require("http");
var routes = require("./routes/route.js");

//1.1 IMPORT SOCKET
var socket = require("socket.io");

//2. Initialize
var app = express();
var server = http.createServer(app);
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));

//2.1 HOOKUP SOCKET TO SERVER
var socketServer = socket.listen(server); 


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

//5. SERVER SIDE SOCKET OPERATIONS

//5.1 Inform when a socket connects
socketServer.on(
    "connection",
    function(socketFromClient)
    {
        console.log("A new socket connected");

        //5.1.1 RECEIVING EVENT FROM CLIENT
        socketFromClient.on(
            "New Message Event",
            function(newMessage)
            {
                console.log("New Message Received from Client: " + newMessage);
            }
        );

        //5.2 If that user disconnects..
        socketFromClient.on(
            "disconnect",
            function()
            {
                console.log("Socket disconnected");
            }
        );
    }
);
