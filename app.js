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

        //5.1.1 RECEIVING MESSAGE EVENT FROM CLIENT
        socketFromClient.on(
            "New Message Event",
            function(newMessage, callback)
            {
                console.log("New Message Received from Client: " + newMessage);
                newMessage = newMessage.trim();
                if (newMessage.substr(0,1) === "@") //if raw msg contains @, its a private
                {
                    //IF ITS PRIVATE, WE HAVE TO COMMUNICATE TO SENDER AND RECIPIENT ONLY..
                    newMessage = newMessage.substr(1);
                    var delimiter = newMessage.indexOf(" ");    //detect 1st space occurance
                    
                    if (delimiter !== -1)    //there is a 1st space occurance
                    {

                        var intendedReceiverName = newMessage.substr(0,delimiter);  
                        var intendedPrivateMessage = newMessage.substr(delimiter+1);
                        console.log("Intended Receiver Name: " + intendedReceiverName);
                        if (intendedReceiverName in usersArray)
                        {
                            //Whisper to intended receiver via his socket from usersArray
                            var intendedReceiverSocket = usersArray[intendedReceiverName];
                            intendedReceiverSocket.emit("Whisper Event", 
                                {   
                                    
                                    senderName: socketFromClient.userName , 
                                    senderPrivateMessage: intendedPrivateMessage
                                }
                            );

                            //Notify Sender in his chat box alone instead of broadcast
                            socketFromClient.emit("Private Event",
                                {
                                    receiverName: intendedReceiverName,
                                    senderPrivateMessage: intendedPrivateMessage
                                }
                            );

                            console.log("Whispered");

                        }
                        else
                        {
                            callback("Server: Ahem Ahem. Intended receiver not online");
                        }

                    }
                    else
                    {
                        callback("Server: Ahem, you forgot to write private message");
                    }

                }
                else
                {
                    //5.1.2 BROADCAST BACK TO ALL CLIENTS INCL ONE THAT SENT IT
                    socketServer.emit("Broadcast Event", { senderName: socketFromClient.userName, message: newMessage});           
                }

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
