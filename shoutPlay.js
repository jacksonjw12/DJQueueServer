
// const nodeshout = require("nodeshout-master");
const Writable = require('stream').Writable;
const EventEmitter = require('events');
const fs = require("fs");
const request = require('request')
const url = require('url')
var youtubedl = require('@microlink/youtube-dl');
var ytdl = require('@microlink/youtube-dl').ytdl;



try {
    var firebaseConfig = require('./firebaseConfig');
}catch(e){
    console.log("You need to create a 'firebaseConfig.js' file, its not in the repo");
    process.exit(1);
}

var firebase = require('firebase');
var firebaseApp = firebase.initializeApp(firebaseConfig);

function sortPlaylist(a, b) {
    var diffVotes = b.count - a.count;
    if (diffVotes !== 0) {
        return diffVotes;
    }

    return a.addedAt - b.addedAt;
}

class Database {
    constructor(){
        this.db = firebase.database();
        this.playlistRef = this.db.ref('playlist/');
        this.upNext = this.db.ref('upNext');
        this.activeSong = this.db.ref('nowplaying');
        this.lastPlayed = this.db.ref('lastPlayed');

        this.upNext.set({});
        this.activeSong.set({});
        this.lastPlayed.set({});


      

        
    }
    getPlaylist(callback){
        let playlist = [];
        this.playlistRef.once('value', function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                var childKey = childSnapshot.key;
                var childData = childSnapshot.val();
                childData._key = childKey;
                playlist.push(childData);

            })
            //sort by highest votes, and then oldest
            playlist.sort(sortPlaylist);
            
            callback(playlist)
        });
        
    }
    getPrevSong(callback){
        this.lastPlayed.once('value', function(snapshot){
            callback(snapshot.val());
        })
    }
    getActiveSong(callback){
        this.activeSong.once('value', function(snapshot){
            callback(snapshot.val());
        })
    }
    getUpNext(callback){
        this.upNext.once('value', function(snapshot){
            callback(snapshot.val());
        })
    }


    setupNextSong(callback, skipUpNext=false){
        let self = database
        this.getPlaylist(function(playlist){
            if(playlist.length){
                let key = playlist[0]._key;
                self.db.ref('playlist/' + key).remove();
                if(skipUpNext){
                    self.activeSong.set(playlist[0]);
                    self.upNext.set({});
                }
                else{
                    self.upNext.set(playlist[0]);

                }
                

            }
            callback();
        });
    }
    
    
    setActiveSong(callback=()=>{}){

        //set prev = active if exists
        //set active = upnext
        //set upnext = undefined
        let self = database;
        this.getData(function(activeSong, upNext, prevSong, playlist=[]){
            // console.log(activeSong, upNext, prevSong, playlist)
            console.log("______________")
            console.log(activeSong)
            console.log("______________")
            if(activeSong !== undefined ){
                self.lastPlayed.set(activeSong);
                self.activeSong.set({});
            }

            if(upNext === undefined && playlist.length){
                self.setupNextSong(function(){
                    callback();
                },true);

            }
            else if(upNext !== undefined){
                self.activeSong.set(upNext);
                self.upNext.set({})
                
            }
            callback();

            //this.getUpNext()


        })
    }

    getDBState(callback=()=>{}){
        this.db.ref().once('value', function(snapshot){
            // console.log(snapshot.key);
            // console.log(snapshot.value)
            // console.log(snapshot);
            snapshot.forEach(function(childSnapshot) {
                var childKey = childSnapshot.key;
                var childData = childSnapshot.val();
                console.log(childKey)
                
                childSnapshot.forEach(function(subChildSnapshot) {
                    var subChildKey = subChildSnapshot.key;
                    var subChildData = subChildSnapshot.val();
                    console.log("\t" + subChildKey)
                    console.log("\t\t", subChildData)
                    

                })
                
            })
            callback();
        })
    }

    getData(callback){
        
        this.db.ref().once('value', function(snapshot){
            let activeSong, upNext, prevSong, playlist;
            // console.log(snapshot.key);
            // console.log(snapshot.value)
            // console.log(snapshot);
            snapshot.forEach(function(childSnapshot) {
                
                var childKey = childSnapshot.key;
                var childData = childSnapshot.val();
                if(childKey == "nowplaying"){
                    activeSong = childData;
                }
                else if(childKey == "upNext"){
                    upNext = childData;
                } 
                else if(childKey == "prevSong"){
                    prevSong = childData;
                }
                else if(childKey == "playlist"){
                    playlist = [];
                    childSnapshot.forEach(function(subChildSnapshot) {
                        var subChildKey = subChildSnapshot.key;
                        var subChildData = subChildSnapshot.val();
                        subChildData._key = subChildKey;
                        playlist.push(subChildData);
                    })
                }

               

                
            
            })
            if(playlist !== undefined){
                playlist.sort(sortPlaylist);
            }
            callback(activeSong, upNext, prevSong, playlist)

        })
       
    }


    createDummyValues(){
        // this.clearPlaylist();
        console.log("creating dummy values")
        //console.log(this.playlistRef)
        this.playlistRef.push({
            title: "Travis Scott - SICKO MODE ft. Drake",
            url: "6ONRf7h3Mdk",
            count: 3,
            image: "https://i.ytimg.com/vi/6ONRf7h3Mdk/hqdefault.jpg",
            addedAt: (new Date().getTime())
        })
        this.playlistRef.push({
            title: "J-Cut &amp; Kolt Siewerts - The Flute Tune (Soulpride Remix)",
            url: "IwLSrNu1ppI",
            count: 4,
            image: "https://i.ytimg.com/vi/IwLSrNu1ppI/hqdefault.jpg",
            addedAt: (new Date().getTime()-1000)
        })
        this.playlistRef.push({
            title: "Lupe Fiasco - The Show Goes On",
            url: "Rmp6zIr5y4U",
            count: 2,
            image: "https://i.ytimg.com/vi/Rmp6zIr5y4U/hqdefault.jpg",
            addedAt: (new Date().getTime()-1000)
        })
        this.playlistRef.push({
            title: "Young Thug - The London (ft. J. Cole &amp; Travis Scott) [Official Audio]",
            url: "OKhT_6XtD7I",
            count: 0,
            image: "https://i.ytimg.com/vi/OKhT_6XtD7I/hqdefault.jpg",
            addedAt: (new Date().getTime()-1000)
        })
    }
    clearPlaylist(){
        this.playlistRef.remove();
        this.upNext.set({});
        this.activeSong.set({});
        this.lastPlayed.set({});

    }

}
const database = new Database();
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
setTimeout(step,500);








function getYoutubeMP3(url, callback){
    let name = "";
    let duration = 0;
    
    youtubedl.getInfo(url, function(err, info){
        console.log(info._duration_hms)
        durationHMS = info._duration_hms.split(":");

        //get duration in millis
        duration = (( durationHMS[0] * 60 + durationHMS[1]) * 60 + durationHMS[2]) * 1000
        
        //dissallow videos over 10 minutes
        if( duration > 600000 ){
            return;
        }


        youtubedl.exec(url, ['-x','--audio-format', 'mp3', '-o', 'songs/%(title)s' + (new Date().getTime()) + '.%(ext)s'], {}, 
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
    constructor(){
        this.songs = []
        this.prevSong;
        this.activeSong;


        //this.blank = new SongStream(this.shout, "songs/Green 10 Second Countdown with Male Voice.mp3")

        //this.blank.events.on("finish", this.playNext);

        //this.blank.beginStream();

    }

    playNext(){
        let self = player;
        console.log("finished song")
        // setTimeout(()=>{console.log("-----should be done---"),13000})

        //if a song was just playing, mark it as the previous song, and delete the song before it
        if(this.activeSong !== undefined){
            this.removeSong(this.prevSong);
            this.prevSong = this.activeSong
            this.activeSong = undefined;
        }

        //if another song is ready to go, set it as the active song
        if(this.songs.length){
            this.activeSong = this.songs.shift();
            this.activeSong.beginStream();
            setTimeout(database.setupNextSong, this.activeSong.duration/2);
            setTimeout(database.setActiveSong, this.activeSong.duration);

        }
        

    }
    

    createSong(url){
        
        let self = player
        getYoutubeMP3(url,function(filepath, duration){
            let song = new SongStream(filepath, duration, url)
            // song.events.on("finish", self.playNext);
            self.songs.push(song);
            if(self.activeSong == undefined){
                self.playNext();
            }
 
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
    removeSong(song){
        if(song !== undefined){
            //just to be extra sure no ones reading the song
            setTimeOut(()=>{
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


let player = new Player();



module.exports = player