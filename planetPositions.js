var r = 10;

var originPlanet;
var destinationPlanet;
var txOrbit;

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

    originPlanet = planets[4];
    destinationPlanet = planets[3];
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

function updateTime(){
    var y = $("input[name='year']").val()-1;
    var d = $("input[name='day']").val()-1;

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
    var t = convertDateToSeconds(y,d,0,0);

    updatePosition(originPlanet, t);
    updatePosition(destinationPlanet, t);
    
    updateTransferOrbit(t);
    
    txOrbit.update(t);
    var tdest_mean = t + txOrbit.TOF_mean;
    var tdest_actual = t + txOrbit.TOF;
    
    updateDestinationPlanet_future(tdest_mean, tdest_actual);

   /* var LnMean_i = (innerPlanet.MeanLnAtTimeT(t)*180/pi).toFixed(2);
    var Ln_i = -(innerPlanet.LnAtTimeT(t) * 180/pi).toFixed(2);

    var LnMean_o = (destinationPlanet.MeanLnAtTimeT(t)*180/pi).toFixed(2);
    var Ln_o = -(destinationPlanet.LnAtTimeT(t)*180/pi).toFixed(2);

    var phi_mean = LnMean_o - LnMean_i;
    var phi = Ln_o-Ln_i;

    $("#innerPlanetData td:eq(1)").text(LnMean_i);
    $("#innerPlanetData td:eq(2)").text(Ln_i);
    $("#innerPlanetData td:eq(3)").text(LnMean_i-Ln_i);

    $("#destinationPlanetData td:eq(1)").text(LnMean_o);
    $("#destinationPlanetData td:eq(2)").text(Ln_o);
    $("#destinationPlanetData td:eq(3)").text(LnMean_o-Ln_o);*/
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

function updateTransferOrbit(t){

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

function updateDestinationPlanet_future(t_mean, t_actual){
      
    var cx_meanC = destinationPlanet.meanPosition(t_mean).x;
    var cy_meanC = -destinationPlanet.meanPosition(t_mean).y;
    
    $("#circle2").attr("cx", cx_meanC);
    $("#circle2").attr("cy", cy_meanC);
    $("#circle2").attr("stroke", "fuchsia");
    
    var cx_meanE = destinationPlanet.meanPosition(t_actual).x - destinationPlanet.cx;
    var cy_meanE = -destinationPlanet.meanPosition(t_actual).y+destinationPlanet.cy;

    $("#circle3").attr("cx", cx_meanE);
    $("#circle3").attr("cy", cy_meanE);
    $("#circle3").attr("stroke", "cyan");

    
    var cx_ellip = destinationPlanet.truePosition(t_actual).x;
    var cy_ellip = -destinationPlanet.truePosition(t_actual).y;

    $("#circle4").attr("cx", cx_ellip);
    $("#circle4").attr("cy", cy_ellip);
    $("#circle4").attr("stroke", "purple");
}

$(document).ready(function(){
    console.log("document ready");
    getPlanetsXML(drawOrbits)
});
