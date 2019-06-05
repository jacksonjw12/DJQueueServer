// based on https://gist.github.com/Cretezy/3623fecb1418e21b5d1f77db50fc7e07

const nodeshout = require("nodeshout-master");
const Writable = require('stream').Writable;
const EventEmitter = require('events');
const fs = require("fs");
const request = require('request')
const url = require('url')
var youtubedl = require('@microlink/youtube-dl');
var ytdl = require('@microlink/youtube-dl').ytdl;



nodeshout.init();



function getYoutubeMP3(url, callback){
    let name = "";
    console.log("blah")
    youtubedl.getInfo(url, function(err, info){
        console.log(info._duration_hms)
    })
    youtubedl.exec(url, ['-x','--audio-format', 'mp3', '-o', 'songs/%(title)s.%(ext)s'], {}, 
        function exec (err, outputs) {
            if (err) {
                throw err
            }
            console.log(outputs.join('\n'))
            for(output of outputs){
                if(output.indexOf("Deleting") == 0){
                    if(name != ""){
                        callback(name);
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
}
function deleteSong(filepath){
    fs.unlink(filepath, (err)=>{
        if(err){
            console.error(err);
        }
    });
}
class Player {
    constructor(){
        this.songs = []
        this.oldSongs = []
        

        this.shout = nodeshout.create();

        this.shout.setHost('play.jacksonwheelers.space');
        this.shout.setPort(8000);
        this.shout.setUser('source');
        this.shout.setPassword('jackson123');
        this.shout.setMount('stream');
        this.shout.setFormat(1); // 0=ogg, 1=mp3
        this.shout.setAudioInfo('bitrate', '192');
        this.shout.setAudioInfo('samplerate', '44100');
        this.shout.setAudioInfo('channels', '2');
        this.shout.open();


        this.blank = new SongStream(this.shout, "songs/Green 10 Second Countdown with Male Voice.mp3")

        this.blank.events.on("finish", this.playNext);

        this.blank.beginStream();

    }

    playNext(){
        let self = player;
        console.log("finished song")
        // setTimeout(()=>{console.log("-----should be done---"),13000})
        if(self.songs.length){
            let currentSong = self.songs.shift();
            currentSong.beginStream();
        }
        else{
            self.blank.replay();
        }
      
        

    }

    createSong(url){
        
        let self = player
        getYoutubeMP3(url,function(filepath){
            let song = new SongStream(self.shout, filepath, url)
            song.events.on("finish", self.playNext);
            self.songs.push(song);
 
        });
    }


}


class SongStream {

    constructor(shout, filepath, url){
        this.shout = shout
        this.filepath = filepath
        this.url = url//keep track of initial url used to make 

        this.events = new EventEmitter();
        

        this.events.on("error", (error)=>{
          console.warn(error,"filepath");
        });

        this.playing = false;

    }

    beginStream(){
        console.log('Starting to play', this.filepath);
        this.playing = true;


        this.shoutStream = new Writable();
        this.shoutStream._write = (chunk, encoding, next) => {
            if (this.playing) {
                const sent = this.shout.send(chunk, chunk.length);
                if (sent !== nodeshout.ErrorTypes.SUCCESS) {
                    const errorMessage = `Error sending to shout: ${getShoutErrorCode(sent)} (code ${sent})`;
                    this.events.emit("error", new Error(errorMessage))
                }

                setTimeout(next, Math.abs(this.shout.delay()));
            }
        };
        this.shoutStream.on("finish", () => {
            if (this.playing) {
                this.endStream();
                this.events.emit("finish");
            }
        });


        this.fileStream = fs.createReadStream(this.filepath);
        this.fileStream.pipe(this.shoutStream);
        this.fileStream.on('error', (error) => {
            events.emit("error", error)
        });
    }

    endStream(){
        console.log('Ending playing', this.filepath);
        
        try {
            this.fileStream.unpipe(this.shoutStream);
            this.fileStream.destroy();
            this.fileStream.close();
            this.shoutStream.destroy()
            this.shoutStream = undefined
            this.fileStream = undefined;
            this.playing = false;
        } catch (e) {
            console.log('Error ending stream')
        }
    }

    replay(){
        if(this.playing){
            this.endStream();
        }
        
        this.beginStream();
    }
    

    

   

    
};

// Get error code title
function getShoutErrorCode(code) {
    return Object.keys(nodeshout.ErrorTypes).find((key) => {
        return code === nodeshout.ErrorTypes[key]
    })
}

let player = new Player();



module.exports = player