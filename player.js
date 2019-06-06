
// const nodeshout = require("nodeshout-master");
const Writable = require('stream').Writable;
const EventEmitter = require('events');
const fs = require("fs");
const request = require('request')
const url = require('url')
var youtubedl = require('@microlink/youtube-dl');
var ytdl = require('@microlink/youtube-dl').ytdl;

var database = require('./database');

database.clearPlaylist();
database.createDummyValues();

// database.getPlaylist(function(playlist){
//     console.log(playlist);
// })
// database.setupNextSong(function(){
//     //database.getData();
//     database.getDBState();

// })
// database.clearPlaylist();
// database.createDummyValues();

// database.getDBState();

// database.setupNextSong(function(){
//     //database.getData();
//     console.log("SETTING UP NEXT SONG")
//     database.getDBState();
//     database.setActiveSong(function(){
//         console.log("SETTING UP ACTIVE SONG")

//         // database.getDBState();
//     })
// })

function step(){
    
    database.getDBState(function(){
        console.log("___STEP BEGINNING____")
        database.setupNextSong(function(){
            database.getDBState(function(){
                console.log("___STEP MIDDLE____")
                database.setActiveSong(function(){
                    database.getDBState(function(){
                        console.log("___STEP END1___")
                        database.setupNextSong(function(){
                            database.getDBState(function(){
                                console.log("___STEP END2___")



                            })
                        })

                    })
                })
            })
        })

        
    });
}
// setTimeout(step,500);








function getYoutubeMP3(url, callback){
    let name = "";
    let duration = 0;
    console.log("url:",url)
    youtubedl.getInfo(url, function(err, info){
        console.log(info._duration_hms)
        console.log("duration")
        durationHMS = info._duration_hms.split(":");

        //get duration in millis
        duration = (( Number(durationHMS[0]) * 60 + Number(durationHMS[1])) * 60 + Number(durationHMS[2])) * 1000
        //dissallow videos over 10 minutes
        if( duration > 600000 ){
            return;
        }

        let timestamp = (new Date().getTime())
        youtubedl.exec("https://www.youtube.com/watch?v=" + url, ['-x','--audio-format', 'mp3', '-o', 'songs/%(title)s' + timestamp + '.%(ext)s'], {}, 
            function exec (err, outputs) {
                if (err) {
                    throw err
                }
                console.log(outputs.join('\n'))
                for(output of outputs){
                    if(output.indexOf("Deleting") == 0){
                        if(name != ""){
                            callback(name, duration);
                        }
                        else{
                            throw "bad video name"
                        }
                        
                    }
                    else if(output.indexOf("[ffmpeg] Destination: ") == 0){
                        name = output.substring(22);
                        console.log()

                    }
                } 
                
        })
    })
}

class Player {
    constructor(database){
        this.songs = []
        this.prevSong;
        this.activeSong;
        this.database = database;
        this.database.setPlayer(this)
        this.stopped = true;

        //this.blank = new SongStream(this.shout, "songs/Green 10 Second Countdown with Male Voice.mp3")

        //this.blank.events.on("finish", this.playNext);

        //this.blank.beginStream();
        console.log("in player")
        this.database.setupNextSong(()=>{
            setTimeout(()=>{this.start()},2000)
            //this.start();
        })
        
    }

    start(){
        // console.log(this)
        console.log("start:")
        this.playNextUp();
        this.database.setActiveSong();
    }

    //on
    playNextUp(){
        let self = player;
        
        
        if(this.activeSong !== undefined){
            console.log(1)
            this.removeSong(this.prevSong);
            this.prevSong = this.activeSong
            this.activeSong = undefined;
        }

        //if another song is ready to go, set it as the active song
        if(this.songs.length){

            this.activeSong = this.songs.shift();
           
            setTimeout(this.database.setupNextSong, this.activeSong.duration/2);
            
            setTimeout(this.start, this.activeSong.duration);


            // setTimeout(()=>{this.database.setupNextSong(()=>{this.start()})}, 2500);
            
            // setTimeout(()=>{this.start}, 5000);

        }
        else{
            console.log("the player stopped")
            this.stopped = true;
            //attempt to load another song 
            //setTimeout(this.database.setupNextSong, 1000);
        }
        

    }
    

    createSong(song, callback){


        console.log("creating a song: " + song.url)
        console.log(song)
        
        getYoutubeMP3(song.url,(filepath, duration)=>{
            song.filepath = filepath;
            song.duration = duration;
            // song.events.on("finish", self.playNext);
            this.songs.push(song);
            callback();
            // if(this.activeSong == undefined){
            //     self.playNext();
            // }
 
        });
    }

    getSongPlaylist(hostname){
        //
        //
        // playlistFile+=hostname+"Green%2010%20Second%20Countdown%20with%20Male%20Voice.mp3" + "\n"
        // playlistFile+=hostname+"blank.mp3" + "\n"

        let playlistFile = ""

        if(this.activeSong !== undefined){
            playlistFile += hostname + encodeURIComponent(this.activeSong.filepath);
        }
        else{
            playlistFile += hostname + encodeURIComponent("emptySong" + (new Date().getTime()));
        }

        return playlistFile;



    }

    //TODO: make work with database type song
    removeSong(song){
        if(song !== undefined){
            //just to be extra sure no ones reading the song
            setTimeout(()=>{
                fs.unlink( "./" + song.filepath, (err)=>{
                    if(err){
                        console.error(err);
                    }
                });
            }, song.duration)
            
        }
        
    }


}


class SongStream {

    constructor(filepath, duration, url){
        
        this.filepath = filepath
        this.duration = duration
        this.url = url


    }

    beginStream(){
        console.log('Starting to play', this.filepath);


        
    }

    endStream(){
        console.log('Ending playing', this.filepath);
       
    }


    

   

    
};


let player = new Player(database);



module.exports = player