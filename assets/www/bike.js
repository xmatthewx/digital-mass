var counter=0;
var timer;
var timer_is_on=0;


function iotbike() {
    //*** js below
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
      bikeLocation();
    }
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



function bikeLocation() {
    
    var getBikeLocation = function() {
        
        var suc = function(p) {
        
            var lati = p.coords.latitude;
            var longi = p.coords.longitude;
            
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
