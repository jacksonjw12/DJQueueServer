//Jackson Wheeler
//Controller for the Firebase Database
//Pairs with Player
//must set up database, and pass to player during construction
//after this, Player calls setupPlayer function to give the db a reference to the player referencing it
try {
    var firebaseConfig = require('./firebaseConfig');
}catch(e){
    console.log("You need to create a 'firebaseConfig.js' file, its not in the repo");
    process.exit(1);
}

var firebase = require('firebase');
var firebaseApp = firebase.initializeApp(firebaseConfig);

//sort by upvotes, and by seniority
function sortPlaylist(a, b) {
    var diffVotes = b.count - a.count;
    if (diffVotes !== 0) {
        return diffVotes;
    }

    return a.addedAt - b.addedAt;
}

class Database {//firebase database controller
    constructor(){
        this.db = firebase.database();
        this.playlistRef = this.db.ref('playlist/');
        this.upNext = this.db.ref('upNext');
        this.activeSong = this.db.ref('nowplaying');
        this.lastPlayed = this.db.ref('lastPlayed');

        this.upNext.set({});
        this.activeSong.set({});
        this.lastPlayed.set({});

        //if the player has stopped, restart it when a new song is added
        this.playlistRef.on('child_added', (data) => {
            
            if(this.player !== undefined){

                this.getData((activeSong, upNext, prevSong, playlist=[])=>{

                    if(this.player.stopped && upNext === undefined){
                        //init as upNext
                        this.setupNextSong(()=>{
                        })
                    }
                })
            }
        })
        
    }
    setPlayer(player){
        this.player = player;

    }

    getPlaylist(callback){
        let playlist = [];
        this.playlistRef.once('value', (snapshot)=> {
            snapshot.forEach((childSnapshot)=> {

                var childKey = childSnapshot.key;
                var childData = childSnapshot.val();
                childData._key = childKey;
                console.log(childData)
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

    //calls player.createsong to actually download the song
    setupNextSong(callback=()=>{}, skipUpNext=false){
        if(this.player === undefined){
            console.log("setupNextSong: player not set")
            return;
        }
        
        this.getPlaylist((playlist) =>{
            console.log(playlist)
            if(playlist.length){
                let key = playlist[0]._key;
                this.db.ref('playlist/' + key).remove();

                this.upNext.set(playlist[0]);
                this.player.createSong(playlist[0],()=>{
                    if(skipUpNext){
                        this.activeSong.set(playlist[0]);
                        this.upNext.set({});
                    }
                    callback();
                })
                

            }
            
        });
    }
    
    setActiveAsLastPlayed(callback=()=>{}){
        this.getData((activeSong, upNext, prevSong, playlist=[])=>{
            if(activeSong !== undefined ){
                this.lastPlayed.set(activeSong);
                this.activeSong.set({})

            }
            callback();
        })
    }
    setActiveSong(callback=()=>{}){
        console.log("setting active song")
        if(this.player === undefined){
            console.log("setActiveSong: player not set")
            return;
        }
        //set prev = active if exists
        //set active = upnext
        //set upnext = undefined
        this.getData((activeSong, upNext, prevSong, playlist=[])=>{
            console.log(activeSong, upNext, prevSong, playlist)
            
            if(activeSong !== undefined ){
                
                this.setActiveAsLastPlayed(()=>{
                    if(upNext !== undefined){
                        this.activeSong.set(upNext);
                    }
                    this.upNext.set({})

                    callback();
                    })
            }
            else{
                if(upNext !== undefined){
                    this.activeSong.set(upNext);
                }
                this.upNext.set({})

                callback();

            }


        })
    }
    //for debugging
    //It was shrujans firebase, so i couldnt log in to view it
    getDBState(callback=()=>{}){
        this.db.ref().once('value', function(snapshot){
            
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
        // this.playlistRef.push({
        //     title: "Lupe Fiasco - The Show Goes On",
        //     url: "Rmp6zIr5y4U",
        //     count: 2,
        //     image: "https://i.ytimg.com/vi/Rmp6zIr5y4U/hqdefault.jpg",
        //     addedAt: (new Date().getTime()-1000)
        // })
        // this.playlistRef.push({
        //     title: "Young Thug - The London (ft. J. Cole &amp; Travis Scott) [Official Audio]",
        //     url: "OKhT_6XtD7I",
        //     count: 0,
        //     image: "https://i.ytimg.com/vi/OKhT_6XtD7I/hqdefault.jpg",
        //     addedAt: (new Date().getTime()-1000)
        // })
    }
    clearPlaylist(){
        this.playlistRef.remove();
        this.upNext.set({});
        this.activeSong.set({});
        this.lastPlayed.set({});

    }

}



const database = new Database();
module.exports = database;

