// set up persistent location check
var counter=0;
var timer;
var timer_is_on=0;

// set up local db
var db = openDatabase('bikedb', '1.0', 'bikedb', 2 * 1024);
db.transaction(function (tx) {
  tx.executeSql('CREATE TABLE IF NOT EXISTS bikedb (dbkey INTEGER PRIMARY KEY, count TEXT, lati TEXT, longi TEXT)');  
  
});


function iotbike() {
    //*** js below
        dbWrite();
        //dbDrop();
        toggleUI();
        gpsTimer();
        check_net_connection();

    //*** js in main.js
        // toggleAccel(); 
        // toggleCompass();   
}

function gpsTimer() {
    if (!timer_is_on) {
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
        data.style.display = "none";
        hardware.style.display = "block";
        
        }
    else {
        startbutton.style.display = "none";
        stopbutton.style.display = "block";        
        data.style.display = "block";
        hardware.style.display = "none";
        
    }
    
}



function fakeLocation() {
    
    var lati = Math.random();
    var longi = Math.random();

    dbWrite(counter,lati,longi);
    dbStatus();
    document.getElementById('lati').innerHTML = lati;
    document.getElementById('longi').innerHTML = longi;
    document.getElementById('counter').innerHTML=counter;

    counter=counter+1;    
    timer=setTimeout("fakeLocation()",5000);    
    
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
