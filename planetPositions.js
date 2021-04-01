var r = 20;

var originPlanet;
var destinationPlanet;
var txOrbit;

var timer;
var inMotion;
var showMean;

function scalePlanets(planet1, planet2){

    var rMax_o = planet2.sma + 2*planet2.c;
    var rMax_d = planet1.sma + 2* planet1.c;

    if(rMax_o > rMax_d){
        rMax = rMax_o;
    }else{
        rMax = rMax_d;
    }

    scaleFactor = 1/(1e8)*250/(rMax/1e8);

    planet1.scaleFactor = scaleFactor;
    planet2.scaleFactor = scaleFactor;

}

function drawOrbits(){

    params = new URLSearchParams(location.search);
    var origin = params.get("originPlanet");
    var destination = params.get("destinationPlanet");
    
    originPlanet = planets[origin];
    destinationPlanet = planets[destination];
    
    scalePlanets(originPlanet, destinationPlanet);
    
    txOrbit = new TransferOrbit(originPlanet, destinationPlanet);
    
    // set jQuery objects
    originPlanet.jqOrbit = $("#orbit_i");
    originPlanet.jqOrbit_meanConcentric = $("#orbit_meanConcentric_i");
    originPlanet.jqOrbit_meanEccentric = $("#orbit_meanEccentric_i")

    originPlanet.jqEllipticalGroup = $("#ellipticalGroup_i");

    originPlanet.jqPlanet = $("#planet_i");
    originPlanet.jqPlanet_meanConcentric = $("#planet_meanConcentric_i");
    originPlanet.jqPlanet_meanEccentric = $("#planet_meanEccentric_i");

    drawOrbit(originPlanet);
    updatePosition(originPlanet, 0);

    destinationPlanet.jqOrbit = $("#orbit_o");
    destinationPlanet.jqOrbit_meanConcentric = $("#orbit_meanConcentric_o");
    destinationPlanet.jqOrbit_meanEccentric = $("#orbit_meanEccentric_o")

    destinationPlanet.jqEllipticalGroup = $("#ellipticalGroup_o");

    destinationPlanet.jqPlanet = $("#planet_o");
    destinationPlanet.jqPlanet_meanConcentric = $("#planet_meanConcentric_o");
    destinationPlanet.jqPlanet_meanEccentric = $("#planet_meanEccentric_o");

    drawOrbit(destinationPlanet);
    updatePosition(destinationPlanet, 0);
    
    updateTime()
}

function drawOrbit(planet){

    var sma = planet.sma;
    var ecc = planet.ecc;
    var b = sma * Math.sqrt(1-ecc**2);
    var c = planet.c;
    var LnPe_deg = planet.LnPe * 180/pi;

    planet.jqOrbit_meanConcentric.attr("r", sma);
    planet.jqOrbit_meanEccentric.attr("r", sma);
    planet.jqOrbit.attr("rx", sma);
    planet.jqOrbit.attr("ry", b);

    planet.jqEllipticalGroup.children(".focusPoint").attr("cx", c);

    var transformStr = "translate(-cx, 0) rotate(d, cx, 0) ";

    transformStr = transformStr.replaceAll("cx", c);                
    transformStr = transformStr.replace("d", -LnPe_deg);

    planet.jqEllipticalGroup.attr("transform", transformStr);

}

function toggleAnim(delay,delta){
    if (inMotion){
        clearInterval(timer);
    }
    else
    {
        timer = setInterval(deltaT,delay,delta);
    }
    inMotion=!inMotion;
}

function deltaT(delta){
    
    d = Number($("input[name='day']").val());
    d += Number(delta);
    $("input[name='day']").val(d);
    
    updateTime();
}

function updateTime(){
    
    var y = $("input[name='year']").val()-1;
    var d = $("input[name='day']").val()-1;

    var t = validateTime(y, d);
    
    updatePosition(originPlanet, t);
    updatePosition(destinationPlanet, t);
    
    txOrbit.update(t);
    var tdest_mean = t + txOrbit.TOF_mean;
    var tdest_actual = t + txOrbit.TOF;
    
    //updateMeanTransferOrbit(t);
    updateTransferOrbit();
    updateDestinationPlanet_future(tdest_mean, tdest_actual);
    updateTables(t);
   
}

function validateTime(y, d){
    
    /*if(d<0){
        if(y==0){
            $("input[name='year']").val(1);
            $("input[name='day']").val(1);
            return;
        }

        d=426
        y=y-1
        $("input[name='day']").val(d);
        $("input[name='year']").val(y);
    }

    if(y<0){
            $("input[name='year']").val(1);
            $("input[name='day']").val(1);
            return;
        }

    if(d>=426){
        y=y+2;
        d=1;

        $("input[name='year']").val(y);
        $("input[name='day']").val(d);
    }
    */
    
    return convertDateToSeconds(y,d,0,0);
}

function updatePosition(planet, t){

    var cx_meanC = planet.meanPosition(t).x;
    var cy_meanC = -planet.meanPosition(t).y;
    
    planet.jqPlanet_meanConcentric.attr("cx", cx_meanC);
    planet.jqPlanet_meanConcentric.attr("cy", cy_meanC);

    var cx_meanE = cx_meanC - planet.cx;
    var cy_meanE = cy_meanC + planet.cy;

    planet.jqPlanet_meanEccentric.attr("cx", cx_meanE);
    planet.jqPlanet_meanEccentric.attr("cy", cy_meanE);

    var cx_ellip = planet.truePosition(t).x;
    var cy_ellip = -planet.truePosition(t).y;

    planet.jqPlanet.attr("cx", cx_ellip);
    planet.jqPlanet.attr("cy", cy_ellip);

}

function updateMeanTransferOrbit(t){

    var r_i = originPlanet.sma;
    var Ln_i = originPlanet.MeanLnAtTimeT(t)

    var x_meanC_i = r_i * Math.cos(Ln_i);
    var y_meanC_i = -r_i * Math.sin(Ln_i);

    // outer planet mean concentric orbit at rdv
    var r_o = destinationPlanet.sma;
    var Ln_rdv = Ln_i - pi;

    var x_meanC_o = r_o * Math.cos(Ln_rdv);
    var y_meanC_o = -r_o * Math.sin(Ln_rdv);

    
    $("#circle1").attr("cx", x_meanC_o);
    $("#circle1").attr("cy", y_meanC_o);
    $("#circle1").attr("stroke", "black");

    // transfer line
    $("#line1").attr("x1", x_meanC_i);
    $("#line1").attr("y1", y_meanC_i);

    $("#line1").attr("x2", x_meanC_o);
    $("#line1").attr("y2", y_meanC_o);

    $("#line1").attr("stroke", "black");
    
}

function updateTransferOrbit(){
    
    var data = "M ox oy A rx ry ang 0 0 dx dy A rx ry ang 0 0 ox oy"
    
    var ox = txOrbit.ro * Math.cos(txOrbit.Ln_o);
    var oy = -txOrbit.ro * Math.sin(txOrbit.Ln_o);
    var ang = -txOrbit.Ln_d * 180/pi;
    var rx = txOrbit.a;
    var ry = txOrbit.b;
    var dx = txOrbit.rd * Math.cos(txOrbit.Ln_d);
    var dy = -txOrbit.rd * Math.sin(txOrbit.Ln_d);
    
    data = data.replaceAll("ox", ox);
    data = data.replaceAll("oy", oy);
    data = data.replaceAll("ang", ang)
    data = data.replaceAll("rx", rx);
    data = data.replaceAll("ry", ry);
    data = data.replaceAll("dx", dx);
    data = data.replaceAll("dy", dy);
    
    $("#txOrbit").attr("d", data);
    
     // transfer line
    $("#line1").attr("x1", ox);
    $("#line1").attr("y1", oy);

    $("#line1").attr("x2", dx);
    $("#line1").attr("y2", dy);

    $("#line1").attr("stroke", "gray");
}

function updateDestinationPlanet_future(t_mean, t_actual){
      
    var cx_meanC = destinationPlanet.meanPosition(t_mean).x;
    var cy_meanC = -destinationPlanet.meanPosition(t_mean).y;
    
    $("#circle2").attr("cx", cx_meanC);
    $("#circle2").attr("cy", cy_meanC);
    $("#circle2").attr("stroke", "fuchsia");
    $("#circle2").hide();
    
   /* var cx_meanE = destinationPlanet.meanPosition(t_actual).x - destinationPlanet.cx;
    var cy_meanE = -destinationPlanet.meanPosition(t_actual).y+destinationPlanet.cy;

    $("#circle3").attr("cx", cx_meanE);
    $("#circle3").attr("cy", cy_meanE);
    $("#circle3").attr("stroke", "cyan");
*/
    
    var cx_ellip = destinationPlanet.truePosition(t_actual).x;
    var cy_ellip = -destinationPlanet.truePosition(t_actual).y;

    $("#circle4").attr("cx", cx_ellip);
    $("#circle4").attr("cy", cy_ellip);
    $("#circle4").attr("stroke", "purple");
    
    
}

function updateTables(t){
    
    var planet = originPlanet;
    var name = planet.name;
    var sma = (planet.sma/planet.scaleFactor/1e9).toFixed(4);
    var ecc = planet.ecc;
    var r_mean = sma;
    var Ln_mean = (planet.MeanLnAtTimeT(t) * 180/pi).toFixed(1);
    
    var Ln = planet.LnAtTimeT(t);
    var r = (planet.rAtLn(Ln)/planet.scaleFactor/1e9).toFixed(4);
    
    var Ln_deg = (Ln*180/pi).toFixed(1);
    
    var d_r = (r_mean - r).toFixed(4);
    var d_Ln = (Ln_mean - Ln_deg).toFixed(1);
    
    
    $("#originPlanetData p").eq(1).text(name);
    
    var rows = $("#originPlanetData tr");
    
    rows.eq(0).children("td").eq(1).text(sma);
    rows.eq(1).children("td").eq(1).text(ecc);
    rows.eq(2).children("td").eq(1).text(r_mean);
    rows.eq(3).children("td").eq(1).text(Ln_mean);
    rows.eq(4).children("td").eq(1).text(r);
    rows.eq(5).children("td").eq(1).text(Ln_deg);
    rows.eq(6).children("td").eq(1).text(d_r);
    rows.eq(7).children("td").eq(1).text(d_Ln);
    
    
    planet = destinationPlanet;
    
    name = planet.name;
    sma = (planet.sma/planet.scaleFactor/1e9).toFixed(4);
    ecc = planet.ecc;
    r_mean = sma;
    Ln_mean = (planet.MeanLnAtTimeT(t) * 180/pi).toFixed(1);
    
    Ln = planet.LnAtTimeT(t);
    r = (planet.rAtLn(Ln)/planet.scaleFactor/1e9).toFixed(4);
    
    Ln_deg = (Ln*180/pi).toFixed(3);
    d_r = (r_mean - r).toFixed(4);
    d_Ln = (Ln_mean - Ln_deg).toFixed(1);
    
    
    $("#destinationPlanetData p").eq(1).text(name);
    
    var rows = $("#destinationPlanetData tr");
    
    rows.eq(0).children("td").eq(1).text(sma);
    rows.eq(1).children("td").eq(1).text(ecc);
    rows.eq(2).children("td").eq(1).text(r_mean);
    rows.eq(3).children("td").eq(1).text(Ln_mean);
    rows.eq(4).children("td").eq(1).text(r);
    rows.eq(5).children("td").eq(1).text(Ln_deg);
    rows.eq(6).children("td").eq(1).text(d_r);
    rows.eq(7).children("td").eq(1).text(d_Ln);
    
    var rows =$("#txOrbitData tr");
    
    var pe_mean = (txOrbit.pe_mean/txOrbit.scaleFactor/1e9).toFixed(4);
    var ap_mean = (txOrbit.ap_mean/txOrbit.scaleFactor/1e9).toFixed(4);
    var Ln_mean = (txOrbit.Ln_rdv_mean * 180/pi).toFixed(1);
    var TOF_mean = (txOrbit.TOF_mean/secondsPerDay).toFixed(1);
    
    var sma = (txOrbit.a/txOrbit.scaleFactor/1e9).toFixed(4);
    var Ln = (modRev(txOrbit.Ln_d, 4)*180/pi).toFixed(1);
    var tof = txOrbit.TOF
    var Ln_dest_rdv = (planet.LnAtTimeT(t+tof)*180/pi).toFixed(1);
    
    tof = (tof/secondsPerDay).toFixed(1);
    var phaseAngle = destinationPlanet.LnAtTimeT(t)-originPlanet.LnAtTimeT(t);
    phaseAngle = (phaseAngle * 180/pi).toFixed(1);
    var deltaLn = (Ln-Ln_dest_rdv).toFixed(2);
    
    rows.eq(0).children("td").eq(1).text(pe_mean);
    rows.eq(1).children("td").eq(1).text(ap_mean);
    rows.eq(2).children("td").eq(1).text(Ln_mean);
    rows.eq(3).children("td").eq(1).text(TOF_mean);
    
    rows.eq(4).children("td").eq(1).text(sma);
    rows.eq(5).children("td").eq(1).text(Ln);
    rows.eq(6).children("td").eq(1).text(tof);
    rows.eq(7).children("td").eq(1).text(Ln_dest_rdv);
    rows.eq(8).children("td").eq(1).text(deltaLn);
}

function calcEject(){
    var park={r:80000, v:2810}
    var eject = EjectionOrbit(txOrbit,park)
    var dv = eject.deltaV;
    var theta=eject.ejectionAngle;
    
    var ejectAngleStr = "<p>ejection angle: 1</p>".replace("1", theta);
    var dvStr = "<p>delta V: 1</p>".replace("1", dv);
    
    $("#ejectionOutput").html(ejectAngleStr).after(dvStr);
    //$("#ejectionOutput").html(dvStr);
}

function toggleMean(){
    $(".mean").toggle();   
}

$(document).ready(function(){
    console.log("document ready");
    getPlanetsXML(drawOrbits)
});
