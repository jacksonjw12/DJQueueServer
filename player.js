//Jackson Wheeler
const Writable = require('stream').Writable;
const EventEmitter = require('events');
const fs = require("fs");
const request = require('request')
const url = require('url')
var youtubedl = require('@microlink/youtube-dl');
var ytdl = require('@microlink/youtube-dl').ytdl;

const spawn = require('child_process').spawn;
var database = require('./database');


database.clearPlaylist();


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
            
            //During demo we werent updating the db when we dont like a song
            //so the db thought everything was all good, and was still displaying that song as active
            //this statement should work, but is untested
            database.setActiveAsLastPlayed();
            return;
            
        }

        let timestamp = (new Date().getTime())
        let nameIdentifier = 'songs/' + timestamp;
        //download the video into the songs folder, and use ffmpeg to convert to mp3
        youtubedl.exec("https://www.youtube.com/watch?v=" + url, ['-x','--audio-format', 'mp3', '-o', nameIdentifier + '-u.%(ext)s'], {}, 
            function exec (err, outputs) {
                if (err) {
                    throw err
                }
                console.log(outputs.join('\n'))
                for(output of outputs){
                    if(output.indexOf("Deleting") == 0){
                        if(name != ""){
                            //spawn an ffmpeg process to set the correct bitrate (if we dont do this songs are either sped up or slowed down by the ESP32 MP3 decoder)
                            let ffmpeg = spawn('ffmpeg', ['-i', name, '-hide_banner','-loglevel','panic','-ar', '44100','-b:a','120K' , nameIdentifier+'.mp3']);
                            ffmpeg.on('exit', (statusCode) => {
                              if (statusCode === 0) {
                                 console.log('conversion successful')
                                 player.removeSong({"filepath":name})
                                 callback(nameIdentifier + '.mp3', duration);
                              }
                            })

                            ffmpeg
                              .stderr
                              .on('data', (err) => {
                                console.log('err:', new String(err))
                                throw "bad ffmpeg conversion"
                              })
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

        
        this.database.setupNextSong()
        
    }

    start(){
        if(this.songs.length === 0){
            console.log("START: no song in nextup")
            this.stopped = true;
            return;
        }

        this.stopped = false;
        // console.log(this)
        console.log("START: playing next up")
        this.playNextUp();
        this.database.setActiveSong();
    }
    finishPlaying(){
        if(this.activeSong !== undefined){


            console.log("FINISH PLAYING: song is done")

            this.removeSong(this.prevSong);
            this.prevSong = this.activeSong
            this.activeSong = undefined;

            this.database.setActiveAsLastPlayed();


            this.start();
        }
        else{
            console.log("FINISH PLAYING: somehow a song finished that did not exist")
        }
    }

    
    playNextUp(){
        let self = player;
        
        //if another song is ready to go, set it as the active song
        if(this.songs.length){

            this.activeSong = this.songs.shift();
            console.log("PLAY NEXT UP: setting timeoutes: ", this.activeSong.duration)
            setTimeout(()=>{this.database.setupNextSong(()=>{})},  this.activeSong.duration/2);
            
            setTimeout(()=>{this.finishPlaying()}, this.activeSong.duration);



        }
        else{
            console.log("PLAY NEXT UP: the player stopped")
            this.stopped = true;
            
        }

    }

    createSong(song, callback){


        console.log("creating a song: " + song.url)
        console.log(song)
        
        //if this fails, we have not implemented a way to report that to the db
        getYoutubeMP3(song.url,(filepath, duration)=>{
            song.filepath = filepath;
            song.duration = duration;
            // song.events.on("finish", self.playNext);
            this.songs.push(song);
            if(this.stopped){
                this.start();
            }
            callback();
            // if(this.activeSong == undefined){
            //     self.playNext();
            // }
 
        });
    }
    //helper function for API calls
    //if no songs active, play countdown, you can change this to blank for silence instead of counting down
    getSongURI(hostname){
       
        if(this.activeSong !== undefined){

            return hostname + this.activeSong.filepath;
        }
        else{
            console.log(hostname + encodeURIComponent("countdown" + (new Date().getTime())+ ".mp3"))
            return hostname + encodeURIComponent("countdown" + (new Date().getTime())+ ".mp3");// + (new Date().getTime()));
        }

    }

    getSongPlaylist(hostname){
        
        let playlistFile = ""

        if(this.activeSong !== undefined){

            playlistFile += hostname + this.activeSong.filepath;
        }
        else{
            playlistFile += hostname + encodeURIComponent("countdown.mp3");// + (new Date().getTime()));
        }

        return playlistFile;



    }

    removeSong(song){
        if(song !== undefined){
            //just to be extra sure no ones reading the song, wait a bit more
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



let player = new Player(database);


module.exports = player