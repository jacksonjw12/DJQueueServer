# DJQueueServer

## The backend server in charge of handling requests from DJQueue-WebApp and DJQueue Esp32
## Sibling repos
- [DJQueue-WebApp](https://github.com/kshrujan/DJQueue-WebApp)
- [DJQueueESP32](https://github.com/jacksonjw12/DJQueueESP32)

### To configure, you must create a firebaseConfig.js file of the form
<pre>
module.exports = {
    apiKey: "",
    authDomain: "blah.firebaseapp.com",
    databaseURL: "https://blah.firebaseio.com",
    projectId: "blah",
    storageBucket: "blah.appspot.com",
    messagingSenderId: "abc",
    appId: "1:abc:def:123"
  };
</pre>

#### Then run 'npm i' and 'npm start'
