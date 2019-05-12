const server = require('http').createServer();
const io = require('socket.io')(server);

var port = process.env.PORT || 4200;

server.listen(port);

require("socketio-auth")(io, {
    authenticate:authenticate,
    postAuthenticate:postAuthenticate,
    timeout:"none"
});
var jwt = require('jsonwebtoken');
const mysql = require('mysql');
const dotenv=require("dotenv");
const fs=require("fs");
var isSQLReady=false;

dotenv.config();

const sqlConnection = mysql.createConnection({
    host     : process.env.RDS_HOSTNAME,
    user     : process.env.RDS_USER,
    password : process.env.RDS_PASSWORD,
    port     : process.env.RDS_PORT,
    ssl	   : {
        ca : fs.readFileSync(__dirname + process.env.RDS_SSL)
    },
    database : process.env.RDS_DB_NAME,
    supportBigNumbers : true,
    bigNumberStrings : true
});

sqlConnection.connect(err => {
	if (err) {
	  console.error('Database connection failed: ' + err.stack);
	  return;
	}
	isSQLReady = true;
	console.log('Connected to SQL database.');
});

function authenticate(socket, data, callback){

	console.log(typeof data);
	if(typeof data === "string"){
		data=JSON.parse(data);
	}

    if(!data.isServer){
        const merchantId=data.merchant_id;
        const token=data.secret_key;
	console.log(merchantId+" "+token);
        if(isSQLReady){
            sqlConnection.query("SELECT secret_key FROM users WHERE merchant_id = ?", [merchantId], (err, results, fields)=>{
                if(err){
                    throw err;
                }
    
                if(results.length>0){
    
                    jwt.verify(token, results[0].secret_key, (err, decoded)=>{
                        if(err){
                            return callback(new Error("There was some error"))
                        }
    
                        if(decoded===merchantId){
                            return callback(null, true)
                        }else{
                            return callback(new Error("Incorrect API key"));
                        }
    
                    })
    
                }
    
            })
        }else{
            callback(new Error("DB not ready yet"))
        }
    }else{
        callback(null, true);
    }

}

function postAuthenticate(socket, data){

    let client=socket;

    console.log("authenticated")

    client.on("nfc", data=>{
        console.log(data);
        // mqttClient.publish(`rak3sh/feeds/unlock`, "1", ()=>{
        //     console.log("unlock sent")
        // });
        io.emit(`nfc/${data.merchant_id}`, data);
    });

    client.on("location", data=>{
        console.log(data);
        const merchantId=data.merchant_id;
        delete data.merchant_id;
        io.emit(`location/${data.imei}/${merchantId}`, data);
        // io.emit(`location/${data.merchant_id}`, data);
    });

    client.on("locations", data=>{
        console.log(data);

        io.emit(`locations/${data.merchant_id}`, data.data);
    })

    client.on("status", data=>{
        console.log(data);
        io.emit(`status/${data.imei}/${data.merchant_id}`, data);
    });

    client.on("statuses", data=>{
        console.log(data);
        io.emit(`statuses/${data.merchant_id}`, data.data);
    });

	client.on("individual-status", data=>{
		console.log(data);
		io.emit(`individual-status/${data.merchant_id}`, data);
	});

    client.on("battery", data=>{
        console.log(data);
        io.emit(`battery_status/${data.merchant_id}`)
    });

}

io.on('connection', client => {
    console.log("client connected");

    client.on('disconnect', () => { 
		console.log("socket.io")
    });

});