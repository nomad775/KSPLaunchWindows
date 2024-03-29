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

        let transform = `translate(${dx},${dy})`
        $("#txMarker").attr("transform", transform);
        //$("#txMarker").attr("cy", dy);
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
        
        let a = this.orbit.a;
        let b = this.orbit.b;
        let ang = this.orbit.ang;
        
        let ox = this.startObj.attr("cx");
        let oy = this.startObj.attr("cy");
        
        let dx = this.endObj.attr("cx");
        let dy = this.endObj.attr("cy");

        let ang1 = Math.atan2(-oy, ox);
        let ang2 = Math.atan2(-dy, dx);

        let f = 0;
        //console.log(this.jqOrbit.attr("id"));

        if (this.jqOrbit.attr("id") == "destTOF") {
            f=1
            let cross = ox * dy - dx * oy;
            if (cross < 0) f = 0;
        }

        var data = `M ${ox} ${oy} A ${a} ${b} ${ang} ${f} 0 ${dx} ${dy}`
        
        this.jqOrbit.attr("d", data);
    }
}

class svgPlanet{
    
    constructor(id, planet, t, soi){
        
        this.jqPlanet = $(id);
        this.jqSOI = $(soi);

        this.planet = planet;

        let r_soi = planet.soi * scaleFactor;
        this.jqSOI.attr("r", r_soi);
        
        this.update(t);
    }
    
    update(t){
        
        var Ln = this.planet.LnAtTimeT(t);
        var r = this.planet.rAtLn(Ln) * scaleFactor;
        
        var x = r * Math.cos(Ln);
        var y = -r * Math.sin(Ln);
        
        this.jqPlanet.attr("cx", x);
        this.jqPlanet.attr("cy", y);

        this.jqSOI.attr("cx", x);
        this.jqSOI.attr("cy", y);

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
    
    $("#mfdScreen").attr("viewBox", box);
    
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
    var t = Number(params.get("t"));
    
    originPlanet = planets[origin];
    destinationPlanet = planets[destination];

    txOrbit = new TransferOrbit(originPlanet, destinationPlanet);

    // SET AT MEAN ESTIMATE
    txOrbit.meanEstimate(t);

    t = txOrbit.t;
    date = convertSecondsToUT(t);

    console.log("mean estimate " + date.toString());
    $("input[name='UT_y']").val(date.y);
    $("input[name='UT_d']").val(date.d);
    $("input[name='UT_h']").val(date.h);
    $("input[name='UT_m']").val(date.m);


    //    INITIALIZE SVG
    scaleFactor = 1/1e8;
    setViewBox(originPlanet, destinationPlanet);
    //scalePlanets(originPlanet, destinationPlanet);
    
    // orbits
    var svgOrginOrbit = new svgEllipiticalOrbit("#orbit_origin", originPlanet);
    svgDestinationOrbit = new svgEllipiticalOrbit("#orbit_destination", destinationPlanet);
    
    // planets
    svgOriginPlanet = new svgPlanet("#planet_origin", originPlanet, 0, "#planetSOI_origin");
    svgDestinationPlanet = new svgPlanet("#planet_destination", destinationPlanet, 0, "#planetSOI_destination");
    
    // tx orbit
    svgTxOrbit = new svgEllipiticalOrbit("#txOrbit", txOrbit);
    //svgTxOrbit = new svgEllipiticalOrbit("#txOrbit", txOrbit);
    
    svgDestinationPlanet_future = new svgPlanet("#planet_destination_future", destinationPlanet, txOrbit.TOF);
    
    svgDestTOF = new svgPartialArc("#destTOF", svgDestinationOrbit, svgDestinationPlanet.jqPlanet, svgDestinationPlanet_future.jqPlanet);    
    svgTxTOF = new svgPartialArc("#txTOF", svgTxOrbit, svgOriginPlanet.jqPlanet, $("#txMarker") );

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
    
    d = Number($("input[name='UT_d']").val());
    d += Number(delta);
    $("input[name='UT_d']").val(d);
    
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
    
    updateDisplay(t);
    
    y = Math.trunc(t/secondsPerYear);
    var secondsRemaining = t % secondsPerYear;
    
    d = Math.round(secondsRemaining/secondsPerDay*1000)/1000;
    
    $("input[name='UT_y']").val(y+1);
    $("input[name='UT_d']").val(d+1); 
}

function getCurrentTime(){
      
    var y = $("input[name='UT_y']").val()-1;
    var d = $("input[name='UT_d']").val()-1;   
    
    return convertDateToSeconds(y, d, 0, 0);
  
}



function updateDisplay(t) {

    let t1 = t + txOrbit.TOF
    let ln_rdv = (modRev(originPlanet.LnAtTimeT(t) + pi,2) * 180/pi).toFixed(1);
    let ln_dt1 = (modRev(destinationPlanet.LnAtTimeT(t1),2) * 180/pi).toFixed(1);
    let ln_dif = (ln_rdv - ln_dt1).toFixed(1);

    $("#lnRdv").text(ln_rdv);
    $("#lnDt1").text(ln_dt1);
    $("#lnDif").text(ln_dif);

    let tof = convertSecondsToDateObj(txOrbit.TOF);
    $("#tofY").text(tof.y);
    $("#tofD").text(tof.d);
    $("#tofH").text(tof.h);
    $("#tofM").text(tof.M);

    let dvEject = HyperbolicOrbit(originPlanet, 100000, txOrbit.v_soi_o).deltaV;
    let dvPlaneChange = txOrbit.planeChangeDv();
    let dvCapture = HyperbolicOrbit(destinationPlanet, 100000, txOrbit.v_soi_d).deltaV;

    $("#deltaV").text((dvEject + dvPlaneChange + dvCapture).toFixed(0));

}


$(document).ready(function(){
    console.log("document ready");
    getPlanetsXML(initialize)
});
