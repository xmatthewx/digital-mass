
function iotbike() {

    // js below
    toggleUI();
    check_net_connection();
    bikeLocation();

    // js in main.js
    toggleAccel(); 
    //toggleCompass();

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
    
    /*
    // not currently in use
    function updateLocation(p) {
        document.getElementById('lati').innerHTML = roundNumber(p.lati);
        document.getElementById('longi').innerHTML = roundNumber(p.longi);
    }
    */

    var getBikeLocation = function() {
        
        var suc = function(p) {
        
            var lati = p.coords.latitude;
            var longi = p.coords.longitude;
            // alert(lati  + " " +  longi);
            
            document.getElementById('lati').innerHTML = lati;
            document.getElementById('longi').innerHTML = longi;
            /*
                // instead, pass values along
                updateLocation({
                    lati : "",
                    longi : ""
                });
            */
        
        };
        var locFail = function() {
        };
        navigator.geolocation.getCurrentPosition(suc, locFail);
    };

    getBikeLocation();
    
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

    // confirm('Connection type:\n ' + states[networkState]);
    var net_connect = states[networkState];
    document.getElementById('connection').innerHTML = net_connect;
    
}
