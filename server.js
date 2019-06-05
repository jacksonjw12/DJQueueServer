// var url = require("url");
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var bodyParser = require('body-parser')
//var requestHandlers = require("./requestHandlers");
// const {Howl, Howler} = require('howler');
var player = require('./shoutPlay');

var nodeshout = require('nodeshout-master'),
	FileReadStream = require('nodeshout-master').FileReadStream,
    ShoutStream = require('nodeshout-master').ShoutStream,
    fs = require('fs')
const Writable = require('stream').Writable;
const EventEmitter = require('events');

//testing...
var countDownUrl = "https://www.youtube.com/watch?v=EIpBgNtUYQE";






// function playCountdown(name){
// 	var shout = nodeshout.create();
// 	shout.setHost('play.jacksonwheelers.space');
// 	shout.setPort(8000);
// 	shout.setUser('source');
// 	shout.setPassword('jackson123');
// 	shout.setMount('stream');
// 	shout.setFormat(1); // 0=ogg, 1=mp3
// 	shout.setAudioInfo('bitrate', '192');
// 	shout.setAudioInfo('samplerate', '44100');
// 	shout.setAudioInfo('channels', '2');
// 	shout.open();

// 	let done = false;
	
// 	let player = new Player(shout, name);
// 	player.events.on("finish", ()=>{
// 	  // Do something (e.g.: play next song)
// 	  console.log("finished")
// 	  player.replay();
	  

// 	});
// 	player.events.on("error", (error)=>{
// 	  // An error happened, oh no
// 	  console.warn(error);
// 	});

// 	player.beginStream();

	
	
// }

// let player = new Player();

function start() {

	
	
	
	//app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	}));
	//var json = require('express-json');
	app.use(bodyParser.json());

	app.use('/static', express.static('node_modules'));
	app.use(express.static(__dirname + '/public/html'));
	app.use(express.static(__dirname + '/public/js'));
	app.use(express.static(__dirname + '/public/css'));

	app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));


	
	


	app.get('/', function (req, res) {
		res.sendFile(__dirname + '/html/index.html')
	});

	
	app.get('/sendInfo',function(req,res){
		console.log(JSON.stringify(req.query));
		sentInfo.push(req.query);
		res.send({})
	})

	let sentInfo = [];
	app.get('/getInfo',function(req, res){
		//testData.push({"dataNum":testData.length})
		res.send({"data":sentInfo});
	})

	app.get('/playCountDown', function(req, res){
		player.createSong(countDownUrl);

		res.send({"data":"added countdown to the queue!"})
	})

	app.get('/playCustomSong', function(req, res){
		console.log(JSON.stringify(req.query.songURL));
		player.createSong("https://www.youtube.com/watch?v=" + req.query.songURL);


		res.send({"info":"added song: " + req.songURL + " to the queue"})
	})

	

	var port = 8081;
	if(process.platform === "linux"){
		port = 8081
	}

	server.listen(port);

	//requestHandlers.initializeSockets(io);



	

	//console.log('Libshout version: ' + nodeshout.getVersion());



	//getYoutubeMP3(url, playCountdown)
	
	

	
		

	// 	shout.open();
	// 	var fileStream = new FileReadStream('nodeshout-master/music/test.ogg', 65536),
	//     shoutStream = fileStream.pipe(new ShoutStream(shout));

	//      fileStream.on('data', function(chunk) {
	// 	    console.log('Read %d bytes of data', chunk.length);
	// 	});

	// 	shoutStream.on('finish', function() {
	// 	    console.log('Finished playing...');
	// 	    play2();
	// 	});
	// }



		

	   

	
	
	

	// Create file read stream and shout stream
	

	



	console.log("Server has started on port:" + port);
}

exports.start = start;
