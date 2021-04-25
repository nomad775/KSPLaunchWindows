//<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>

const pi = Math.atan(1)*4;
const mu_sun = 1172332800000000000;

var planets = {};
var transferWindows = [];

var currentTime;

function modRev(angle, places){
    var a = (angle * 10**places).toFixed(0);
    var rev = ((2*pi)*10**places).toFixed(0);
    var rem = a % rev;
    rem = rem/(10**places);
    if(rem<0) rem+=2*pi;
    
    return rem;
}

class Planet{
    
    name="theName";

    sma = 0;
    ecc = 0;
    LnPe = 0;
    mean0 = 0;

    r = 0;
    mu = 0;
    soi = 0;

    period=0;
    
    c = 0;
    cx = 0;
    cy = 0;

    constructor(name, sma, ecc, inc, LnPe, mean0, mu, soi, r){
        this.name = name;
        this.sma = sma;
        this.ecc = ecc;
        this.inc = inc;

        this.LnPe = LnPe;
        this.mean0 = mean0;
        this.mu = mu;
        this.r = r;
        this.soi = soi
        
        this.period = 2*pi*Math.sqrt(this.sma**3/mu_sun); //secondsPerDay;
        this.theta0 = this.trueAnomaly(mean0);
        this.Ln0 = this.LnPe + this.theta0;
        
        this.c = ecc * sma;
        this.cx = this.c * Math.cos(LnPe);
        this.cy = this.c * Math.sin(LnPe);
    }

    trueAnomaly(M){
        
        // eccentric anomaly
        var E = M;
        
        for(var i=0;i<7;i++){
            E = M + this.ecc * Math.sin(E);
        }
        
        // true anomaly
        var theta = 2*Math.atan(Math.sqrt((1+this.ecc)/(1-this.ecc))*Math.tan(E/2))
        
        return modRev(theta, 4);
    }
    
    MeanLnAtTimeT(t){
        var percent = t/this.period;
        var M = percent * 2*pi + this.mean0;
        var Ln = M + this.LnPe;
        
        return modRev(Ln, 4);
    }
    
    LnAtTimeT(t){
        
        var percent = t/this.period;
        
        //mean anomaly relative to Pe
        var M = percent * 2*pi + this.mean0;
        
        // true anomaly
        var theta = this.trueAnomaly(M);
        var Ln = this.LnPe + theta
        
        return modRev(Ln, 4);
    }

    rAtLn(Ln){
        var r = this.sma * (1 - this.ecc**2 )/(1+this.ecc * Math.cos(Ln-this.LnPe))
        return r;        
    }

     
    v(r){
        return Math.sqrt(mu_sun * (2 / r - 1 / this.sma))
        //Math.sqrt(mu_sun * (2 / this.ro - 2 / (this.ro + this.rd)))
        //math.sqrt(mu_sun / r);

        //v^2 = k(2/r-1/a)
        //v^2 = [k/p](1+e^2+2*e*cos(?))
    }
    
}

class TransferOrbit{
   
    constructor(originPlanet, destinationPlanet){
        
        this.originPlanet = originPlanet;
        this.destinationPlanet = destinationPlanet;
        
        var r_i = this.originPlanet.sma;
        var r_o = this.destinationPlanet.sma;
        
        this.ap_mean = (r_i > r_o) ? r_i : r_o;
        this.pe_mean = (r_i < r_o) ? r_i : r_o;
        
        this.sma_mean = (this.ap_mean + this.pe_mean)/2
        
        this.TOF_mean = pi * Math.sqrt(this.sma_mean**3/mu_sun);
        
        this.update(0)
    }
    
    update(t){
        
        this.Ln_rdv_mean = (this.originPlanet.MeanLnAtTimeT(t) + pi) % (2*pi);
        
        this.Ln_o = this.originPlanet.LnAtTimeT(t);
        this.Ln_d = this.Ln_o - pi;
        
        this.ro = this.originPlanet.rAtLn(this.Ln_o);
        this.rd = this.destinationPlanet.rAtLn(this.Ln_d);
        
        /*this.ap = (ro > rd) ? ro : rd;
        this.pe = (ro < rd) ? ro : rd;*/
        
        this.a = (this.ro + this.rd)/2;
        this.b = Math.sqrt(this.ro * this.rd);
       
        this.TOF = pi * Math.sqrt(this.a**3/mu_sun);

        this.v_depart = Math.sqrt(mu_sun * (2 / this.ro - 2 / (this.ro + this.rd)));
        this.v_origin = Math.sqrt(mu_sun/this.ro);

        this.v_arrive = math.sqrt(mu_sun * (2 / this.rd - 2 / (this.ro + this.rd)));
        this.v_destination = Math.sqrt(mu_sun / this.rd);
    }
}

function HyperbolicOrbit(body, pe, v_soi){


    // v0 - velocity of pe (e.g. parking orbit)
    // v1 - velocity at Pe, after dV applied, required to obtain v2 at SOI
    // v2 - velocity at SOI, relative to planet
    // v3 - velocity just past SOI, relative to sun, required for tx orbit
    
    //let v3 = txOrbit.v_depart;
    //let v2 = v3 - txOrbit.v_origin;
    let v2 = v_soi;

    // calculate sma of hyperbolic orbit
    // using v_r = sqrt(mu * (2/r - 1/a)) for r=SOI
    // v_r is the known required velocity for the transfer orbit
    // the required value for a can be calucated
    // v_r^2/mu = 2/r - 1/a => 2/r - v^2/mu = 1/a
    let soi = body.soi;
    let mu = body.mu;
    let a_hyp = Math.abs(1/(2/soi - v2**2/mu));
    
    // calculate v1 from vis-viva eqn
    let v1 = Math.sqrt(mu*(2/pe + 1/a_hyp));
    let v0 = body.v(pe);
    let deltaV = v1-v0;

    let theta = Math.acos(a_hyp / (a_hyp + pe));
    let halfAngle = (pi - theta) * 180/pi;

    console.log(deltaV);
    console.log(halfAngle);

    return {deltaV: deltaV, halfAngle: halfAngle};
}

/*class TransferWindow {

    constructor(originPlanet, destinationPlanet) {

        this.originPlanet = originPlanet;
        this.destinationPlanet = destinationPlanet;

        this.origin = originPlanet.name;
        this.destination = destinationPlanet.name;

        // estimate from mean anomaly
        var t = this.meanEstimate(currentTime);

        this.Tmean = (t / secondsPerDay).toFixed(1);

        console.log(this.originPlanet.name + " to " + this.destinationPlanet.name + " mean estimate " + t);

        // iterate using true anomaly
        for (var i = 0; i < 7; i++) {
            t = this.ellipticalEstimate(currentTime, t);
        }

        this.T = Math.round(t / secondsPerDay);
        this.date = convertSecondsToDate(t);

    }


    calculatePhaseAngleForTransfer(txSMA) {
        var txTOF = pi * Math.sqrt(txSMA ** 3 / mu_sun); // /secondsPerDay;
        var destinationDeltaTheta = txTOF / this.destinationPlanet.period * 2 * pi;
        return pi - destinationDeltaTheta;
    }

    calculateDeltaT(epsilon) {

        var relAngV = (2 * pi) / this.destinationPlanet.period - (2 * pi) / this.originPlanet.period;
        var t = -epsilon / relAngV;

        //var relativePeriod =/(1/this.destinationPlanet.period - 1/this.originPlanet.period);

        var relativePeriod = Math.abs(2 * pi / relAngV);

        var margin = -20; //-.1 * Math.abs(relativePeriod);


        if (t < 0) t += relativePeriod;

        return t;
    }


    meanEstimate(t) {

        var LnOrigin = (t / this.originPlanet.period * 2 * pi + this.originPlanet.mean0) % (2 * pi);
        var LnDest = (t / this.destinationPlanet.period * 2 * pi + this.destinationPlanet.mean0) % (2 * pi);

        //var LnOrigin = this.originPlanet.LnAtTimeT(t);
        //var LnDest = this.destinationPlanet.LnAtTimeT(t);

        var phi_current = LnDest - LnOrigin;


        var txSMA = (this.destinationPlanet.sma + this.originPlanet.sma) / 2;
        var phi_transfer = this.calculatePhaseAngleForTransfer(txSMA);

        var epsilon = phi_current - phi_transfer;

        var deltaT = this.calculateDeltaT(epsilon);

        return deltaT;
    }

    ellipticalEstimate(t, tEst) {

        var Ln_origin_current = this.originPlanet.LnAtTimeT(t);
        var Ln_destination_current = this.destinationPlanet.LnAtTimeT(t);

        var phi_current = Ln_destination_current - Ln_origin_current;

        // calculate position at estimated time of departure
        var Ln_origin = this.originPlanet.LnAtTimeT(tEst);
        var Ln_destination = Ln_origin + pi;

        // calculate transfer orbit sma at estimated departure time/position
        var pe = this.originPlanet.rAtLn(Ln_origin);
        var ap = this.destinationPlanet.rAtLn(Ln_destination);
        var sma = (ap + pe) / 2;

        var phi_transfer = this.calculatePhaseAngleForTransfer(sma);
        var epsilon = phi_current - phi_transfer;
        var timeUntilTransfer = this.calculateDeltaT(epsilon);

        return Math.round(timeUntilTransfer, 1);
    }
}*/

function createPlanetObject(){
    
    let name;

    $(this).attr("name", function(index, curValue){
        name = curValue;
    });

    let sma = Number($(this).find("orbit sma").text());
    let ecc = Number($(this).find("orbit ecc").text());
    let argPe = Number($(this).find("orbit argPe").text() );
    let LAN = Number($(this).find("orbit lan").text());
    let theta0 = Number($(this).find("orbit mean0").text());
    let inc = Number($(this).find("orbit inc").text());

    let soi = Number($(this).find("soi").text());
    let mu = Number($(this).find("mu").text());
    let r = Number($(this).find("radius").text());

    var LnPe = (argPe + LAN) * pi/180;
    LnPe %= (2*pi);
    planet = new Planet(name, sma, ecc, inc, LnPe, theta0, mu, soi, r);
    
    planets[name] = planet;
 
    index = planets.length-1;
   
}

function getPlanetsXML(callback){
    
    console.log("get xml file");
    
    var fileName = "kspPlanets.xml";
    var ajax = $.get(fileName);
    
    ajax.done( 
        function(data) { 
            $("planets",data).children().each( createPlanetObject )
            callback()
        } 
    );
}