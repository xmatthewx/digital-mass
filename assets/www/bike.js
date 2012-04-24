/******************************* 
 * Development Options
 */

var write_to_carto = false;
var write_local_db = true;
var dropadd_local_db = true; // clear local DB
var reset_rideNum = false; // clear localStorage
var use_dummy_data = true; // true for off-phone browser dev


/******************************* 
 * Setup Variables & Local DB
 */

// setup  CartoDB
var urlBase = "https://ideapublic.cartodb.com/api/v1/sql?api_key=";
var cartoKey = "d1003f790f91855f9a72363ac887e14010974332"; 

// setup ride vars
var gpsInterval = 3500; // milliseconds
var userID = 17;
var rideID; // localStorage.rideNum
var counter=0;
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
rideID = Number(localStorage.rideNum); // convert, stored as string.
console.log("previous ride: " + rideID ); 


// set up local db
var db = openDatabase('bikedb', '1.0', 'bikedb', 2 * 1024);
if (dropadd_local_db) { dbDrop(); }
else { init_db(); }


/******************************* 
 * User Actions
 */

// start ride: triggered by user
function iotbike() {

    rideID = rideID + 1;
    localStorage.setItem('rideNum',rideID);
    console.log("rideNum: " + rideID);

    toggleUI();

    if (timer_is_on == 0) {
        timer_is_on=1;
        console.log("rideID " + rideID +" started.");
        if (!use_dummy_data) { bikeLocation(); }
        else { fakeLocation(); }  
    }

    //*** js in main.js
        // toggleAccel(); 
        // toggleCompass();   
        // check_net_connection();
}

// stop ride: triggered by user
function iotOff() {
    toggleUI();
    timer_is_on=0;
    console.log("rideID " + rideID +" complete with " + counter +" points.");
    cartodbLine(rideID);
    // could clear local DB if cartodbLine returns ok


    alert("Ride #" + rideID + " is complete with " + counter + " points.");
    counter = 0;

}



/******************************* 
 * Interface
 */


function toggleUI() {
    var startbutton = document.getElementById('start');
    var stopbutton = document.getElementById('stop');
    var data = document.getElementById('ridedata');
    var hardware = document.getElementById('hardware');

    if ( startbutton.style.display == "none" ) { 
        startbutton.style.display = "block";
        stopbutton.style.display = "none";        
        //data.style.display = "none";
        //hardware.style.display = "block";
    }
    else {
        startbutton.style.display = "none";
        stopbutton.style.display = "block";        
        data.style.display = "block";
        hardware.style.display = "none";    
    }
    
}


function feedback( rideID,counter ) {
    
    document.getElementById('ride-number').innerHTML = rideID;
    document.getElementById('point-count').innerHTML = counter;

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
        // -77.5, 40.8 PA
        // -74.0, 40.7 NYC

        dbWrite(rideID,counter,lati,longi);
        cartodbTrace(rideID,counter,lati,longi);
        feedback(rideID,counter);
    
        document.getElementById('lati').innerHTML = lati;
        document.getElementById('longi').innerHTML = longi;
        document.getElementById('counter').innerHTML=counter;

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
                
                document.getElementById('lati').innerHTML = lati;
                document.getElementById('longi').innerHTML = longi;
                document.getElementById('counter').innerHTML=counter;
        
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
    //var theUrl = "https://ideapublic.cartodb.com/api/v1/sql?api_key=d1003f790f91855f9a72363ac887e14010974332&q=INSERT INTO gps_traces(gps_timestamp,ride_id,user_id,the_geom) VALUES(now(),8,34,ST_SetSrid(st_makepoint(-74.06212,46.675573),4326))"

    if (write_to_carto) { // if write_to_carto AND timer_is_on ??

        traceID = count;
        var gpsTimestamp ="now()";
        var sqlInsert ="&q=INSERT INTO gps_traces(gps_timestamp,ride_id,trace_id,user_id,the_geom) VALUES("+ gpsTimestamp +","+ rideID +","+ traceID +","+ userID +",ST_SetSrid(st_makepoint("+ longi +","+ lati +"),4326))";
        var theUrl = urlBase + cartoKey + sqlInsert;

        var xmlHttp = null;
        xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", theUrl, false );
        xmlHttp.send( null );
        if (xmlHttp.responseText) { 
            console.log("rideID:" + rideID + ", trace:" + counter); 
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

        var sqlInsert = "&q=INSERT INTO rides(the_geom,user_id) SELECT ST_Multi(ST_MakeLine(traces.the_geom)) as the_geom,1 as user_id FROM (SELECT the_geom FROM gps_traces WHERE user_id="+ userID +" AND ride_id="+ rideID +") as traces";
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
        var userid = userID;
        db.transaction(function (tx) {
            //tx.executeSql('INSERT INTO bikedb (count, lati, longi) VALUES ("'+ counter + '", "'+ lati +'", "'+ longi +'")' );
            tx.executeSql('INSERT INTO bikedb (userid, rideid, count, lati, longi) VALUES (?,?,?,?,?);',[userid,rideid,thecount,lati,longi] );
        });
        dbStatus();
    }
}

// check ride data
// could be used to confirm localStorage.rideNum
// could be used to estimate elapsed time & ride distance
function rideCheck() {
    db.transaction(function (tx) {
        tx.executeSql('SELECT rideid FROM bikedb ORDER BY rideid DESC', [], function (tx, results) {
            var themax = results.rows.item(0).rideid;
            console.log("last ride: ",themax);
        }, function (tx, err) {
            console.log( "rideCheck Error: " + err.message );
        });
    });
}


