//Jackson Wheeler 
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var bodyParser = require('body-parser')
var fs = require('fs')
const path = require('path');
const Writable = require('stream').Writable;
const EventEmitter = require('events');

//testing...
var countDownUrl = "https://www.youtube.com/watch?v=EIpBgNtUYQE";

const directory = 'songs';

//start by clearing the songs directory, removing things not properly deleted in last shutdown
fs.readdir(directory, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.unlink(path.join(directory, file), err => {
      if (err) throw err;
    });
  }
});



//essentially the main for DJQueue service
var player = require('./player');


function start() {

	let port = 8081;
	let hostname = "http://localhost:8081/";
	if(process.platform === "linux"){
		port = 8081;
		hostname = "http://play.jacksonwheelers.space/";
	}
	
	
	
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	}));
	
	app.use(bodyParser.json());

	app.use('/static', express.static('node_modules'));
	app.use(express.static(__dirname + '/public/html'));
	app.use(express.static(__dirname + '/public/js'));
	app.use(express.static(__dirname + '/public/css'));
	app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));


	//expose the songs directory so that the ESP32 can request them
	app.use('/songs', express.static(__dirname + '/songs'));

	
	app.get('/', function (req, res) {
		res.sendFile(__dirname + '/html/index.html')
	});


	//the ESP32 calls this to get the song url it should play
	app.get('/getCurrentSong', function(req, res){
		res.send({'uri':player.getSongURI(hostname)});

	})



	/* These calls were used in developement and debugging, they are useful for future dev */
	app.get('/emptySong.mp3', function(req, res){
		
		res.sendFile(__dirname + '/blank.mp3')
	})
	app.get('/ready.mp3', function(req, res){
		
		res.sendFile(__dirname + '/ready.mp3')
	})

	// was useful when one of the libraries prevented playing of songs with the same name
	// so appended a timestamp to songs
	app.get('/countdown*.mp3', function(req, res){
		res.sendFile(__dirname + '/countdown.mp3')
	})

	app.get('/getQueue',function(req, res){
		res.send({"songs":player.songs});
	})

	app.get('/playCountDown', function(req, res){
		player.createSong(countDownUrl);

		res.send({"data":"added countdown to the queue!"})
	})

	app.get('/playCustomSong', function(req, res){
		console.log(JSON.stringify(req.query.songURL));
		player.createSong("https://www.youtube.com/watch?v=" + req.query.songURL);
		res.send({"info":"added song: " + req.songURL + " to the queue"})
	});



	
	// These could be used to create an actual internet radio stream from the songs
	// It doesnt have the exact syntax expected though, check the Apple M3U standards
	// I used this early on in dev because i thought i would be using the ESP32's capability
	// To play internet radio streams. But it turns out this capability was extremely buggy
	// And it was hard to make a radio stream because you had to chop songs up into constant lengths
	app.get('/getStream.m3u', function(req, res){
		
		let playlistFile = "#EXTM3U\n";
		playlistFile += player.getSongPlaylist(hostname)

		res.header({ 'Content-Disposition': 'attachment; filename=stream.m3u' }).send(playlistFile);

	})
	app.get('/getStream.json', function(req, res){
		let playlistFile = "#EXTM3U\n";
		playlistFile += player.getSongPlaylist(hostname)
		res.send({ "m3u": playlistFile });

	})


	server.listen(port);

	
	console.log("Server has started on port:" + port);
}

exports.start = start;
