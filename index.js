const server = require('http').createServer();
const io = require('socket.io')(server);
var mqtt = require('mqtt')
var mqttClient  = mqtt.connect('mqtt://io.adafruit.com',{
    username:"rak3sh",
    password:"b1afa57b561044958a1ad364ea6d105a"
});

io.on('connection', client => {
    console.log("client connected")
	client.on('disconnect', () => { 
		console.log("socket.io")
    });

    client.on("nfc", data=>{
        console.log(data);
        // mqttClient.publish(`rak3sh/feeds/unlock`, "1", ()=>{
        //     console.log("unlock sent")
        // });
        io.emit(`nfc/${data.merchant_id}`, data);
    });

    client.on("location", data=>{
        console.log(data);
        io.emit(`location/${data.imei}/${data.merchant_id}`, data);
        io.emit(`location/${data.merchant_id}`, data);
    });

    client.on("status", data=>{
        console.log(data);
        io.emit(`status/${data.imei}/${data.merchant_id}`, data);
        io.emit(`status/${data.merchant_id}`, data);
    })

});

var port = process.env.PORT || 4200;

server.listen(port);