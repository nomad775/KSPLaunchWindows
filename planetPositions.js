const secondsPerMinute = 60;
const secondsPerHour = 60 * secondsPerMinute;
const secondsPerDay = 6 * secondsPerHour;
const secondsPerYear = 426 * secondsPerDay;

var r = 20;

var originPlanet;
var destinationPlanet;
var txOrbit;

var timer;
var inMotion;
var showMean;

var scaleFactor;

var svgDestinationOrbit;

var svgOriginPlanet;
var svgDestinationPlanet;
var svgTxOrbit;
var svgDestinationPlanet_future;

var svgDestTOF;
var svgTxTOF;

class svgMeanOrbit{
    
    constructor(id, cx, cy, r){
        
        this.jqOrbit = $(id);
        this.cx = cx;
        this.cy = cy;
        this.r = r;
        
        this.jqOrbit.attr("cx", cx);
        this.jqOrbit.attr("cy", cy);
        this.jqOrbit.attr("r", Math.round(r));
        
        this.jqOrbit.attr("stroke", "blue");
       
    }
    
    toggle(){
        this.jqOrbit.toggle();
    }
    
    update(position){
        this.jqOrbit.attr("cx", position.x);
        this.jqOrbit.attr("cy", position.y);
    }
}

class svgEllipiticalOrbit{

    constructor(id, object1){
        
        this.jqOrbit = $(id);
        this.definingObject = object1;
        this.update(0);
    }
    
    update(t){
        
        if( this.definingObject instanceof Planet){
            
            var thePlanet = this.definingObject;
            
            var Ln0 = thePlanet.Ln0;
            var Ln1 = Ln0 + pi;
            
            var r0 = thePlanet.rAtLn(Ln0) * scaleFactor;
            var r1 = thePlanet.rAtLn(Ln1) * scaleFactor;
            
            var Ln = Ln1;
            
        }else if( this.definingObject instanceof TransferOrbit)
        {
            
            this.definingObject.update(t);
            
            var theTxOrbit = this.definingObject
            
            var Ln = theTxOrbit.Ln_o + pi;
            
            var r0 = theTxOrbit.ro * scaleFactor;
            var r1 = theTxOrbit.rd * scaleFactor;
        }
        
        this.a = (r0+r1)/2;
        this.b = Math.sqrt(r0*r1);
        
        var ox = r0 * Math.cos(Ln+pi);
        var oy = -r0 * Math.sin(Ln+pi);
        
        var dx = r1 * Math.cos(Ln);
        var dy = -r1 * Math.sin(Ln);
        
        this.ang = -Ln * 180/pi;
        
        var data = `M ${ox} ${oy} A ${this.a} ${this.b} ${this.ang} 0 0 ${dx} ${dy} A ${this.a} ${this.b} ${this.ang} 0 0 ${ox} ${oy}`
        
        this.jqOrbit.attr("d", data);
        
        // txOrbit decorations
        $("#line1").attr("x1", ox);
        $("#line1").attr("y1", oy);
        $("#line1").attr("x2", dx);
        $("#line1").attr("y2", dy);
        
        $("#txMarker").attr("cx", dx);
        $("#txMarker").attr("cy", dy);
    }
}

class svgPartialArc{

    constructor(id, orbit, startObj, endObj){
        
        this.jqOrbit = $(id);
        
        this.orbit = orbit;
        this.startObj = startObj;
        this.endObj = endObj;
        
        this.update();
    }
    
    update(){
        
        var a = this.orbit.a;
        var b = this.orbit.b;
        var ang = this.orbit.ang;
        
        var ox = this.startObj.attr("cx");
        var oy = this.startObj.attr("cy");
        
        var dx = this.endObj.attr("cx");
        var dy = this.endObj.attr("cy");
        
        var data = `M ${ox} ${oy} A ${a} ${b} ${ang} 0 0 ${dx} ${dy}`
        
        this.jqOrbit.attr("d", data);
    }
}

class svgPlanet{
    
    constructor(id, planet, t){
        
        this.jqPlanet = $(id);
        this.planet = planet;
        
        this.update(t);
    }
    
    update(t){
        
        var Ln = this.planet.LnAtTimeT(t);
        var r = this.planet.rAtLn(Ln) * scaleFactor;
        
        var x = r * Math.cos(Ln);
        var y = -r * Math.sin(Ln);
        
        this.jqPlanet.attr("cx", x);
        this.jqPlanet.attr("cy", y);
    }
    
    
}

function setViewBox(planet1, planet2){

    var planetO;
    
    if(planet1.sma > planet2.sma){
        planetO = planet1;
    }else{
        planetO = planet2;
    }
    
    var a = planetO.sma * scaleFactor + r;
    var cx = planetO.cx * scaleFactor;
    var cy = planetO.cy * scaleFactor;
    
    
    $("#scaleCircle1").attr("r", a);
    
    $("#scaleCircle2").attr("r", a);
    $("#scaleCircle2").attr("cx", -cx);
    $("#scaleCircle2").attr("cy", cy);
    
    var left = (-a-cx).toFixed(3);
    var top = (-a+cy).toFixed(3);
    
    var width = 2*a;
    var height = 2*a;
    
    var box = left + " " + top + " " + width + " " + height
    
    $("#transferOrbit").attr("viewBox", box);
    
   /* var rMax_o = planet2.sma + 2*planet2.c;
    var rMax_d = planet1.sma + 2*planet1.c;
    
    if(rMax_o > rMax_d){
        rMax = rMax_o;
    }else{
        rMax = rMax_d;
    }

    scaleFactor = 1/(1e8)*svgWidth/(rMax/1e8);*/
}


function initialize(){

    params = new URLSearchParams(location.search);
    var origin = params.get("originPlanet");
    var destination = params.get("destinationPlanet");
    
    originPlanet = planets[origin];
    destinationPlanet = planets[destination];
    
    scaleFactor = 1/1e8;
    setViewBox(originPlanet, destinationPlanet);
    //scalePlanets(originPlanet, destinationPlanet);
    
    // orbits
    var svgOrginOrbit = new svgEllipiticalOrbit("#orbit_origin", originPlanet);
    svgDestinationOrbit = new svgEllipiticalOrbit("#orbit_destination", destinationPlanet);
    
    // planets
    svgOriginPlanet = new svgPlanet("#planet_origin", originPlanet, 0);
    svgDestinationPlanet = new svgPlanet("#planet_destination", destinationPlanet, 0);
    
    // tx orbit
    txOrbit = new TransferOrbit(originPlanet, destinationPlanet);
    
    svgTxOrbit = new svgEllipiticalOrbit("#txOrbit", txOrbit);svgTxOrbit = new svgEllipiticalOrbit("#txOrbit", txOrbit);
    
    svgDestinationPlanet_future = new svgPlanet("#planet_destination_future", destinationPlanet, txOrbit.TOF);
    
    svgDestTOF = new svgPartialArc("#destTOF", svgDestinationOrbit, svgDestinationPlanet.jqPlanet, svgDestinationPlanet_future.jqPlanet);    
    svgTxTOF = new svgPartialArc("#txTOF", svgTxOrbit, svgOriginPlanet.jqPlanet, $("#txMarker") );

    $("#originPlanetData p").text(origin);
    $("#destinationPlanetData p").text(destination);
    
    /*onStepButton(1);*/
    onDateChange();
}

function onStepButton(tstep){
    if(inMotion){ 
        toggleAnim(0,0);
        return;
    }
    
    stepT(tstep);
}

function toggleAnim(delay,delta){
    
    if (inMotion){
        clearInterval(timer);
    }
    else
    {
        timer = setInterval(stepT,delay,delta);
    }
    
    inMotion=!inMotion;
}

function stepT(delta){
    
    d = Number($("input[name='day']").val());
    d += Number(delta);
    $("input[name='day']").val(d);
    
    onDateChange();
}

function onDateChange(){
    
    var t = getCurrentTime();
    
    svgOriginPlanet.update(t);
    svgDestinationPlanet.update(t);
    svgTxOrbit.update(t);
    svgDestinationPlanet_future.update(t+txOrbit.TOF);
    
    svgDestTOF.update();
    svgTxTOF.update();
    
    updateTables(t);
    
    y = Math.trunc(t/secondsPerYear);
    var secondsRemaining = t % secondsPerYear;
    
    d = Math.round(secondsRemaining/secondsPerDay*1000)/1000;
    
    $("input[name='year']").val(y+1);
    $("input[name='day']").val(d+1); 
}

function getCurrentTime(){
      
    var y = $("input[name='year']").val()-1;
    var d = $("input[name='day']").val()-1;   
    
    return convertDateToSeconds(y, d, 0, 0);
  
}

function convertDateToSeconds(year, day, hour, minute){

    var seconds = year * secondsPerYear;
    seconds += day * secondsPerDay;
    seconds += hour * secondsPerHour;
    seconds += minute * secondsPerMinute;
    
    seconds = seconds>0 ? seconds: 0;
    return seconds;
}

function convertSecondsToDate(seconds){

    var year = Math.trunc(seconds/secondsPerYear);
    var secondsRemaining = seconds % secondsPerYear;
    
    var day = Math.trunc(secondsRemaining/secondsPerDay);
    secondsRemaining = secondsRemaining % secondsPerDay;
    
    var hour = Math.trunc(secondsRemaining / secondsPerHour);
    secondsRemaining = secondsRemaining % secondsPerHour;
    
    var minute = Math.trunc(secondsRemaining / secondsPerMinute);
    var second = secondsRemaining;
    
    return year + "y " + day + "d ";  //+ hour + ":" + minute;
}


function updateTables(t){
    
    var planet = originPlanet;
    var name = planet.name;
    var sma = (planet.sma/1e9).toFixed(2);
    var ecc = planet.ecc.toFixed(3);
    var r_mean = sma;
    var Ln_mean = (planet.MeanLnAtTimeT(t) * 180/pi).toFixed(1);
    
    var Ln = planet.LnAtTimeT(t);
    var r = (planet.rAtLn(Ln)/1e9).toFixed(2);
    
    var Ln_deg = (Ln*180/pi).toFixed(1);
    
    var d_r = (r_mean - r).toFixed(2);
    var d_Ln = (Ln_mean - Ln_deg).toFixed(1);
    
    
    $("#originPlanetData p").eq(1).text(name);
    
    var rows = $("#originPlanetData tr");
    
    rows.eq(0).children("td").eq(1).text(sma);
    rows.eq(1).children("td").eq(1).text(ecc);
    rows.eq(2).children("td").eq(1).text(r);
    rows.eq(3).children("td").eq(1).text(Ln_deg);
    
    planet = destinationPlanet;
    
    name = planet.name;
    sma = (planet.sma/1e9).toFixed(2);
    ecc = planet.ecc;
    r_mean = sma;
    Ln_mean = (planet.MeanLnAtTimeT(t) * 180/pi).toFixed(1);
    
    Ln = planet.LnAtTimeT(t);
    r = (planet.rAtLn(Ln)/1e9).toFixed(2);
    
    Ln_deg = (Ln*180/pi).toFixed(1);
    d_r = (r_mean - r).toFixed(2);
    d_Ln = (Ln_mean - Ln_deg).toFixed(1);
    
    
    $("#destinationPlanetData p").eq(1).text(name);
    
    var rows = $("#destinationPlanetData tr");
    
    rows.eq(0).children("td").eq(1).text(sma);
    rows.eq(1).children("td").eq(1).text(ecc);
    rows.eq(2).children("td").eq(1).text(r);
    rows.eq(3).children("td").eq(1).text(Ln_deg);
    
    var rows =$("#txOrbitData tr");
    
    var pe_mean = (txOrbit.pe_mean/1e9).toFixed(2);
    var ap_mean = (txOrbit.ap_mean/1e9).toFixed(2);
    var Ln_mean = (txOrbit.Ln_rdv_mean * 180/pi).toFixed(1);
    var TOF_mean = (txOrbit.TOF_mean/secondsPerDay).toFixed(1);
    
    var sma = (txOrbit.a/1e9).toFixed(2);
    var Ln = (modRev(txOrbit.Ln_d, 4)*180/pi).toFixed(1);
    var tof = txOrbit.TOF
    var Ln_dest_rdv = (planet.LnAtTimeT(t+tof)*180/pi).toFixed(1);
    
    tof = (tof/secondsPerDay).toFixed(1);
    var phaseAngle = destinationPlanet.LnAtTimeT(t)-originPlanet.LnAtTimeT(t);
    phaseAngle = (phaseAngle * 180/pi).toFixed(1);
    var deltaLn = (Ln-Ln_dest_rdv).toFixed(2);
    
    rows.eq(0).children("td").eq(1).text(sma);
    rows.eq(1).children("td").eq(1).text(Ln);
    rows.eq(2).children("td").eq(1).text(tof);
    rows.eq(3).children("td").eq(1).text(Ln_dest_rdv);
    rows.eq(4).children("td").eq(1).text(deltaLn);
}

function calcEject(){
    
    var origin = originPlanet.name;
    var destination = destinationPlanet.name;
    var t = getCurrentTime();
    var vSOI = 1384;

    var qryStr = `?origin=${origin}&destination=${destination}&vSOI=${vSOI}&t=${t}`;
    location = "ejectionAngle.html" + qryStr;
    
    /*var park={r:700000, v:2810}
    var eject = EjectionOrbit(txOrbit,park)
    var dv = eject.deltaV;
    var theta=eject.ejectionAngle;
    
    var ejectAngleStr = "<p>ejection angle: 1</p>".replace("1", theta);
    var dvStr = "<p>delta V: 1</p>".replace("1", dv);
    
    $("#ejectionOutput").html(ejectAngleStr).after(dvStr);
    */
}

function toggleMean(){
    $(".mean").toggle();   
}

$(document).ready(function(){
    console.log("document ready");
    getPlanetsXML(initialize)
});
