// set up persistent location check
var counter=0;
var timer;
var timer_is_on=0;

var theUrl, urlBase, cartoKey, userID, rideID, sqlInsert, gpsTimestamp;
urlBase = "https://ideapublic.cartodb.com/api/v1/sql?api_key=";
cartoKey = "d1003f790f91855f9a72363ac887e14010974332"; 
userID = "9";
rideID = "100"; // read from local storage


// set up local db
var db = openDatabase('bikedb', '1.0', 'bikedb', 2 * 1024);
db.transaction(function (tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS bikedb (dbkey INTEGER PRIMARY KEY, count TEXT, lati TEXT, longi TEXT)');  
  
});


function iotbike() {
    
    //dbDrop(); // clear local storage
    
    rideID += 1; // should be read from carto or local storage
    
    dbWrite();
    toggleUI();
    gpsTimer();

    //*** js in main.js
        // toggleAccel(); 
        // toggleCompass();   
        // check_net_connection();
}


function iotOff() {

    toggleUI();
    timer_is_on=0;
    var thiscount = counter + 1;
    alert("Ride #" + rideID + " is complete with " + thiscount + " points.");
    counter = 0;

}


function gpsTimer() {
    if (timer_is_on ==0) {
      timer_is_on=1;
      //bikeLocation();
      fakeLocation(); // use for off-phone browser dev
    }
}


function dbWrite(thecount,lati,longi) {
    db.transaction(function (tx) {
        //tx.executeSql('INSERT INTO bikedb (count, lati, longi) VALUES ("'+ counter + '", "'+ lati +'", "'+ longi +'")' );
        tx.executeSql('INSERT INTO bikedb (count, lati, longi) VALUES (?,?,?);',[thecount,lati,longi] );
    });
}

function cartodbTrace(rideID,count,lati,longi) {
    //INSERT A GPS TRACE
    //var theUrl = "https://ideapublic.cartodb.com/api/v1/sql?api_key=d1003f790f91855f9a72363ac887e14010974332&q=INSERT INTO gps_traces(gps_timestamp,ride_id,user_id,the_geom) VALUES(now(),8,34,ST_SetSrid(st_makepoint(-74.06212,46.675573),4326))"

    traceID = count;
    gpsTimestamp ="now()";
    sqlInsert ="&q=INSERT INTO gps_traces(gps_timestamp,ride_id,user_id,the_geom) VALUES("+ gpsTimestamp +","+ rideID +","+ userID +",ST_SetSrid(st_makepoint("+ longi +","+ lati +"),4326))";
    theUrl = urlBase + cartoKey + sqlInsert;

    // alert("Ride.Point: " + rideID + "." + counter);
    
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false );
    xmlHttp.send( null );
    console.log(xmlHttp.responseText);
    // return xmlHttp.responseText;
}

function cartodbLine(thecount,lati,longi) {
/*
    //CREATE THE RIDE LINE (WHEN DONE)

    //INSERT INTO rides(the_geom,user_id)
    //SELECT ST_Multi(ST_MakeLine(traces.the_geom)) as the_geom,1 as user_id FROM (SELECT the_geom FROM gps_traces WHERE ride_id=1) as traces
*/
}

function dbStatus() {
    db.transaction(function (tx) {
        tx.executeSql('SELECT * FROM bikedb', [], function (tx, results) {
            var dbtotal = results.rows.length;            
            document.querySelector('#dbstatus').innerHTML = 'Entries: ' + dbtotal; 
            // document.querySelector('#dbstatus').innerHTML = 'Entries: ' + results.rows.item(results.rows.length).data(row.id); 
        }, function (tx, err) {
            document.querySelector('#dbstatus').innerHTML += 'Error: <em>' + err.message + '</em>';
            document.querySelector('#dbstatus').className = 'error';
        });
    });
}

function dbDrop() {
    db.transaction(function (tx) {
      tx.executeSql('DROP TABLE bikedb');
    }, function (err) {
      document.querySelector('#dbstatus').innerHTML += 'Error: ' + err.message;
    });
}




function toggleUI() {
    
    var startbutton = document.getElementById('start');
    var stopbutton = document.getElementById('stop');
    var data = document.getElementById('ridedata');
    var hardware = document.getElementById('hardware');

    if ( startbutton.style.display == "none" )
    { 
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


// smartly random for fakeLocation()
    var randA = Math.random()/100;
    var randB = Math.random()/100;
    var randX = Math.round( Math.random() * 10 ) / 10 ;
    var randY = Math.round( Math.random() * 10 ) / 10 ;

function fakeLocation() {

    if (timer_is_on==1) {
    
        var lati = 40 + randX + (randA * counter) - (Math.random()/200);
        var longi = -77 + randY + (randB * counter) - (Math.random()/200);
        // 40.879533 PA
        //-77.547233 PA

        dbWrite(counter,lati,longi);
        dbStatus();
        cartodbTrace(rideID,counter,lati,longi)
    
        document.getElementById('lati').innerHTML = lati;
        document.getElementById('longi').innerHTML = longi;
        document.getElementById('counter').innerHTML=counter;

        counter=counter+1;
        timer=setTimeout("fakeLocation()",2000);    
    }
    else { ; }
}

function bikeLocation() {
    
    var getBikeLocation = function() {
        
        var suc = function(p) {
        
            var lati = p.coords.latitude;
            var longi = p.coords.longitude;
            
            dbWrite(counter,lati,longi);
            document.getElementById('lati').innerHTML = lati;
            document.getElementById('longi').innerHTML = longi;
        
        };
        var locFail = function() {
        };
        navigator.geolocation.getCurrentPosition(suc, locFail);
    };

    getBikeLocation();    
    document.getElementById('counter').innerHTML=counter;
    counter=counter+1;
    timer=setTimeout("bikeLocation()",5000);    
    
}

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
