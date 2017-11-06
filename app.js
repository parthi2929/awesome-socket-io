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
var port = process.env.PORT || 8080;
server.listen(
    port,
    function(request, response)
    {
        console.log("Catch action at http://localhost: " + port);
    }
);

//5. SERVER SIDE SOCKET OPERATIONS

// Array to store users' details (his/her sockets?!)
var usersArray ={};

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

                //5.1.2 BROADCAST BACK TO ALL CLIENTS INCL ONE THAT SENT IT
                socketServer.emit("Broadcast Event", socketFromClient.userName + " : " + newMessage);

            }
        );

        //5.1.2 USER NAME VALIDATION
        socketFromClient.on(
            "New User Validation Event",
            function(data,callback) //callback because we need to notify response accordingly
            {
                if (data in usersArray)
                {
                    console.log("ERROR: Received user name available already");
                    callback(false);    //already existing name, so error
                }
                else
                {          
                    callback(true);     //new name, registerd, good to go..          
                    socketFromClient.userName = data;   //yeah, you could create a new property like this by assigning value along.
                    usersArray[socketFromClient.userName]=socketFromClient; 
                    console.log("SUCCESS: Received user name registered => " + Object.keys(usersArray));
                    updateOnlineUsers();    //notify client about updated list..                    
                }
            }
        );

        //5.2 If that user disconnects..
        socketFromClient.on(
            "disconnect",
            function()
            {
                console.log("Socket disconnected");
                if (!socketFromClient.userName) return; //May be user quit before entering userName
                delete usersArray[socketFromClient.userName];
                updateOnlineUsers();    //notify client about updated list..
            }
        );

        function updateOnlineUsers()
        {
            socketServer.emit(
                "Online Users Listing Event",   //some name for this event from server
                Object.keys(usersArray)
            );
        }
    }
);
