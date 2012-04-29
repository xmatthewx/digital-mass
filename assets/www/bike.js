/******************************* 
 * Development Options
 */

var write_to_carto = false;
var write_local_db = false;
var dropadd_local_db = true; // clear local DB
var reset_rideNum = false; // clear localStorage
var use_dummy_data = false; // true for off-phone browser dev


/******************************* 
 * Setup Variables & Local DB
 */

// setup  CartoDB
var urlBase = "https://ideapublic.cartodb.com/api/v1/sql?api_key=";
var cartoKey = "d1003f790f91855f9a72363ac887e14010974332"; 

// setup ride vars
var gpsInterval = 3000; // milliseconds
var startLat, startLong, endLat, endLong; // used for rough distance
var userID = 17;
var rideID; // localStorage.rideNum
var counter=0;
var startTime, endTime;
var timer;
var timer_is_on=0;


// set up local storage
if (reset_rideNum) { 
    console.log("clear localStorage"); 
    localStorage.removeItem('rideNum'); 
}
if ( !localStorage.getItem('rideNum') ) { 
    console.log("init localStorage"); 
    localStorage.setItem('rideNum',0);
}
localStorage.setItem('userID',userID);
rideID = Number(localStorage.rideNum); // convert, stored as string.


// set up local db
var db = openDatabase('bikedb', '1.0', 'bikedb', 2 * 1024);
if (dropadd_local_db) { dbDrop(); }
else { init_db(); }



function initmap() {
    
    var mapurl = "https://ideapublic.cartodb.com/tables/rides/embed_map?sql=SELECT%20*%20FROM%20rides%20where%20user_id%3D"+userID;
    
    document.getElementById('mapframe').src = mapurl;
    
}

/******************************* 
 * User Actions
 */

// start ride: triggered by user
function iotbike() {

    if (timer_is_on == 0) {
        timer_is_on=1;
        toggleUI();

        rideID = rideID + 1;

        startTime = new Date();
        startTimer();
        console.log("rideID " + rideID +" started at " + startTime.toLocaleTimeString() );

        localStorage.setItem('rideNum',rideID);
        feedback(); // could be run on CartoDB xmlHttp.responseText

        if (!use_dummy_data) { bikeLocation(); }
        else { fakeLocation(); }  

        //*** js in main.js
            // toggleAccel(); 
            // toggleCompass();   
            // check_net_connection();

    }

}

// stop ride: triggered by user
function iotOff() {
    timer_is_on=0;
    toggleUI();
    endTime = new Date();
    var elapsed = Math.round( (endTime - startTime)/1000 );
    
    var startMinutes = startTime.getMinutes();
    var endMinutes = endTime.getMinutes();
    
    console.log("rideID " + rideID +" complete with " + counter +" points in " + elapsed + " seconds.");
    
    cartodbLine(rideID);
    // could clear local DB if cartodbLine returns ok

    alert("Ride #" + rideID + " is complete with " + counter + " points.");
    counter = 0;
    //rideCheck();
}


/******************************* 
 * Interface
 */


function toggleUI() {
    var startbutton = document.getElementById('start');
    var stopbutton = document.getElementById('stop');
    var data = document.getElementById('ridedata');
    var hardware = document.getElementById('hardware');
    var clock = document.getElementById('time');
    var maplink = document.getElementById('maplink');

    if ( startbutton.style.display == "none" ) { 
        startbutton.style.display = "block";
        stopbutton.style.display = "none";  
        maplink.style.display = "block";
        clock.style.color = "#aaa";
    }
    else {
        startbutton.style.display = "none";
        stopbutton.style.display = "block";        
        data.style.display = "block";
        hardware.style.display = "none";    
        maplink.style.display = "none";
        clock.style.color = "#fff";
    }
    
}

// data to UI
// could be run on CartoDB xmlHttp.responseText
function feedback() {    
    document.getElementById('ride-number').innerHTML = "Ride #" + rideID;
    document.getElementById('background').innerHTML = "Data transmission log. User: " + userID + ". Ride: " + rideID + ". ";
    
}

/******************************* 
 * User & Ride Data
 */


// smartly random for fakeLocation()
    var randA = Math.random()/100;
    var randB = Math.random()/100;
    var randX = Math.round( Math.random() * 10 ) / 10 ;
    var randY = Math.round( Math.random() * 10 ) / 10 ;

function fakeLocation() {

    if (timer_is_on==1) {
    
        var lati = 40.3 + randX + (randA * counter) - (Math.random()/200);
        var longi = -74.5 + randY + (randB * counter) - (Math.random()/200);
        // -74.0, 40.7 NYC

        dbWrite(rideID,counter,lati,longi);
        cartodbTrace(rideID,counter,lati,longi);

        document.getElementById('background').innerHTML += "Point: " + counter + ". ";
        document.getElementById('background').innerHTML += "Lat: " + lati + ". ";
        document.getElementById('background').innerHTML += "Long: " + longi + ". ";


        // grab location to calc distance
        if ( counter == 0 ) { 
            startLat = lati;
            startLong = longi;
            // console.log(startLat,startLong);
            }
        // rideDistance(startLat,startLong,lati,longi);
    
        // console.log("point #" + counter + " lati:" + lati + " longi:" + longi );

        counter=counter+1;
        timer=setTimeout("fakeLocation()",gpsInterval);    
    }
    else { ; }
}

// location by GPS
function bikeLocation() {
    
    if (timer_is_on==1) {
        var getBikeLocation = function() {
            var geoSuccess = function(p) {
        
                var lati = p.coords.latitude;
                var longi = p.coords.longitude;
            
                dbWrite(counter,lati,longi);
                cartodbTrace(rideID,counter,lati,longi);
                        
            };
            var geoFail = function() {
                // write failure to cartoDB ??
            };
            navigator.geolocation.getCurrentPosition(geoSuccess, geoFail);
        };

        getBikeLocation();    
        counter=counter+1; // increment here or on success?
        timer=setTimeout("bikeLocation()",5000);    

    }
}

// mobile connect status
function check_net_connection() {
    var networkState = navigator.network.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown';
    states[Connection.ETHERNET] = 'Ethernet';
    states[Connection.WIFI]     = 'WiFi';
    states[Connection.CELL_2G]  = '2G';
    states[Connection.CELL_3G]  = '3G';
    states[Connection.CELL_4G]  = '4G';
    states[Connection.NONE]     = 'No connection';

    var net_connect = states[networkState];
    document.getElementById('connection').innerHTML = net_connect; 
}


/******************************* 
 * CartoDB
 */

// add point to CartoDB
function cartodbTrace(rideID,count,lati,longi) {
    //INSERT A GPS TRACE
    //var theUrl = "https://ideapublic.cartodb.com/api/v1/sql?api_key=123123123123&q=INSERT INTO gps_traces(gps_timestamp,ride_id,user_id,the_geom) VALUES(now(),8,34,ST_SetSrid(st_makepoint(-74.06212,46.675573),4326))"

    if (write_to_carto) { // if write_to_carto AND timer_is_on ??

        var gpsTimestamp ="now()";
        var sqlInsert ="&q=INSERT INTO gps_traces(gps_timestamp,ride_id,trace_id,user_id,the_geom) VALUES("+ gpsTimestamp +","+ rideID +","+ count +","+ userID +",ST_SetSrid(st_makepoint("+ longi +","+ lati +"),4326))";
        var theUrl = urlBase + cartoKey + sqlInsert;

        var xmlHttp = null;
        xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false );
        xmlHttp.send( null );
        if (xmlHttp.responseText) { 
            // console.log("rideID:" + rideID + ", trace:" + counter); 
            }
        else { console.log("Trace to Carto failed: " + counter); }
        // console.log("cartoDB response: " + xmlHttp.responseText);
        // return xmlHttp.responseText;

    }
}

// ride complete. make line in CartoDB from points.
function cartodbLine(rideID) {
    //CREATE THE RIDE LINE (WHEN DONE)

    if (write_to_carto) { 

        var sqlInsert = "&q=INSERT INTO rides(the_geom,user_id,ride_id) SELECT ST_Multi(ST_MakeLine(traces.the_geom)) as the_geom,"+ userID +" as user_id,"+ rideID +" as ride_id FROM (SELECT the_geom, user_id FROM gps_traces WHERE user_id="+ userID +" AND ride_id="+ rideID +") as traces";
        var theUrl = urlBase + cartoKey + sqlInsert;

        var xmlHttp = null;
        xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false );
        xmlHttp.send( null );
        
        if (xmlHttp.responseText) { 
            console.log("Line written to Carto for RideID: " + rideID ); 
            // dbDrop(); // clear localDB
            }
        else { console.log("Line in Carto failed for rideID: " + rideID ); }
        // console.log(theUrl);
        // console.log("cartoDB line response: " + xmlHttp.responseText);
        
        // return xmlHttp.responseText;        
    }
}




/******************************* 
 * Local DB
 */

function dbStatus() {
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM bikedb', [], function (tx, results) {
            var dbtotal = results.rows.length;            
        }, function (tx, err) {
            console.log("Error: "+ err.message);
        });
    });
}

function dbDrop() {
    db.transaction(function (tx) {
        tx.executeSql('DROP TABLE bikedb');
        console.log("db dropped");
        init_db(); 
    }, function (err) {
        console.log( "Drop error: " + err.message);
        init_db(); 
    });
}

function init_db() {
    db.transaction(function (tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS bikedb (dbkey INTEGER PRIMARY KEY, userid INTEGER, rideid INTEGER, count INTEGER, lati INTEGER, longi INTEGER)');  
        console.log("db init");
    });
}

function dbWrite(rideid,thecount,lati,longi) {
    if (write_local_db) {
        //console.log("write to localDB");
        var userid = userID;
        db.transaction(function (tx) {
            //tx.executeSql('INSERT INTO bikedb (count, lati, longi) VALUES ("'+ counter + '", "'+ lati +'", "'+ longi +'")' );
            tx.executeSql('INSERT INTO bikedb (userid, rideid, count, lati, longi) VALUES (?,?,?,?,?);',[userid,rideid,thecount,lati,longi] );
        });
        dbStatus();
    }
}

// check ride data
// not currently in use
// could be used to confirm localStorage.rideNum
// could be used to estimate elapsed time & ride distance
function rideCheck() {
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM bikedb ORDER BY rideid DESC', [], function (tx, results) {
            var themax = results.rows.item(0).rideid;
            console.log("last ride: ",themax);
        }, function (tx, err) {
            console.log( "rideCheck Error: " + err.message );
        });
    });
}



/******************************* 
 * Distance
 * http://www.movable-type.co.uk/scripts/latlong.html
 */

function rideDistance(lat1,lon1,lat2,lon2) {    



    function CalcDistanceBetween(lat1, lon1, lat2, lon2) {
        //Radius of the earth in:  1.609344 miles,  6371 km  | var R = (6371 / 1.609344);
        var R = 3958.7558657440545; // Radius of earth in Miles 
        var dLat = toRad(lat2-lat1);
        var dLon = toRad(lon2-lon1); 
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                Math.sin(dLon/2) * Math.sin(dLon/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c;
        return d;
    }

    function toRad(Value) {
        /** Converts numeric degrees to radians */
        return Value * Math.PI / 180;
    }   

    //var R = 6371; // km
    //var d = Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2) * Math.cos(lon2-lon1)) * R;
    console.log("distance: " + d);

}

/******************************* 
 * Elapsed Timer
 */


function startTimer() {
    var today=new Date();
    var elapsed = (today - startTime)/1000;

    var days = 0;
    var hours = Math.floor((elapsed - (days * 86400 ))/3600);
    var minutes = Math.floor((elapsed - (days * 86400 ) - (hours *3600 ))/60);
    var secs = Math.floor((elapsed - (days * 86400 ) - (hours *3600 ) - (minutes*60)));

    // add a zero in front of numbers<10
    minutes=checkTimer(minutes);
    secs=checkTimer(secs);

    if (timer_is_on==1) {
        document.getElementById('time').innerHTML=hours+":"+minutes+":"+secs;
        t=setTimeout('startTimer()',500);
    }
}

function checkTimer(i) {
    if (i<10) {
        i="0" + i;
    }
    return i;
}
