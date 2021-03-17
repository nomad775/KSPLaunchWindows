//<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>

const pi = Math.atan(1)*4;
const mu_sun = 1172332800000000000;

const secondsPerMinute = 60;
const secondsPerHour = 60 * secondsPerMinute;
const secondsPerDay = 6 * secondsPerHour;
const secondsPerYear = 426 * secondsPerDay;

var planets = [];
var transferWindows = [];

var currentTime;

function convertSecondsToDate(seconds){

    var year = Math.trunc(seconds/secondsPerYear);
    var secondsRemaining = seconds % secondsPerYear;
    
    var day = Math.trunc(secondsRemaining/secondsPerDay);
    secondsRemaining = secondsRemaining % secondsPerDay;
    
    var hour = Math.trunc(secondsRemaining / secondsPerHour);
    secondsRemaining = secondsRemaining % secondsPerHour;
    
    var minute = Math.trunc(secondsRemaining / secondsPerMinute);
    var second = secondsRemaining;
    
    //console.log("UT seconds : " + seconds, "  output: y" + year + " d" + day + " T: " + hour + ":" + minute);
    
    return year + "y " + day + "d " + hour + ":" + minute;
}

function convertDateToSeconds(year, day, hour, minute){
    //var daysPerYear = 426;
    //var days = year * daysPerYear;
    //days +=day;
    
    var seconds = year * secondsPerYear;
    seconds+= day * secondsPerDay;
    seconds += hour * secondsPerHour;
    seconds += minute * secondsPerMinute;
    
    return seconds;
}


class Planet{
    
    name="theName";
    
    scaleFactor=1;
    
    #sma = 0;
    ecc = 0;
    LnPe = 0;
    mean0 = 0;
    mu = 0;
    soi =0;

    period=0;
    
    #c = 0;
    #cx = 0;
    #cy = 0;

    jqPlanet = "";
    jqPlanet_meanConcentric = "";
    jqPlanet_meanEccentric = "";
    
    jqOrbit = "";
    jqOrbit_meanConcentric = "";
    jqOrbit_meanEccentric = "";

    jqEllipticalGroup = "";

    constructor(name, sma, ecc, LnPe, mean0, mu, soi){
        this.name = name;
        this.#sma = sma;
        this.ecc = ecc;
        this.LnPe = LnPe;
        this.mean0 = mean0;
        this.mu = mu;
        this.soi = soi
        
        this.period = 2*pi*Math.sqrt(this.sma**3/mu_sun); //secondsPerDay;
        this.theta0 = this.trueAnomaly(mean0);
        
        this.#c = ecc * sma;
        this.#cx = this.#c * Math.cos(LnPe);
        this.#cy = this.#c * Math.sin(LnPe);
    }

    get name(){return this.name};
    get sma(){return this.#sma * this.scaleFactor};
    get c(){return this.#c * this.scaleFactor};
    get cx(){return this.#cx * this.scaleFactor};
    get cy(){return this.#cy * this.scaleFactor};
    
    trueAnomaly(M){
        
        // eccentric anomaly
        var E = M;
        
        for(var i=0;i<7;i++){
            E = M + this.ecc * Math.sin(E);
        }
        
        // true anomaly
        var theta = 2*Math.atan(Math.sqrt((1+this.ecc)/(1-this.ecc))*Math.tan(E/2))
        theta = theta % (2*pi);
        
        return theta;
        
    }
    
    MeanLnAtTimeT(t){
        var percent = t/this.period;
        var M = percent * 2*pi + this.mean0;
        var Ln = M + this.LnPe;
        
        return Ln % (2*pi);
    }
    
    LnAtTimeT(t){
        
        var percent = t/this.period;
        
        //mean anomaly relative to Pe
        var M = percent * 2*pi;
        
        M=M+this.mean0;
        
        // true anomaly
        var theta = this.trueAnomaly(M);
        
        return (this.LnPe + theta) % (2*pi)
    }

    rAtLn(Ln){
        var r = this.#sma * (1 - this.ecc**2 )/(1+this.ecc * Math.cos(Ln-this.LnPe))
        return r * this.scaleFactor;        
    }

     
    v(r){
        return math.sqrt(mu_sun /r);
    }
}

class TransferWindow{
     
    constructor(originPlanet, destinationPlanet){
        
        this.originPlanet = originPlanet;
        this.destinationPlanet = destinationPlanet;
        
        this.origin = originPlanet.name;
        this.destination = destinationPlanet.name;
        
        // estimate from mean anomaly
        var t = this.meanEstimate(currentTime);
        
        this.Tmean = (t/secondsPerDay).toFixed(1);
        
        console.log(this.originPlanet.name + " to " + this.destinationPlanet.name + " mean estimate " + t);
        
        // iterate using true anomaly
        for(var i=0;i<7;i++){
            t=this.ellipticalEstimate(currentTime,t);
        }
        
        this.T = Math.round(t/secondsPerDay);
        this.date = convertSecondsToDate(t);
        
    }
    
    
    calculatePhaseAngleForTransfer(txSMA){
        var txTOF = pi*Math.sqrt(txSMA**3 / mu_sun); // /secondsPerDay;
        var destinationDeltaTheta = txTOF / this.destinationPlanet.period * 2 * pi;
        return pi - destinationDeltaTheta;
    }
    
    calculateDeltaT(epsilon){
        
        var relAngV = (2*pi)/this.destinationPlanet.period - (2*pi)/this.originPlanet.period;
        var t = -epsilon/relAngV;
        
        //var relativePeriod =/(1/this.destinationPlanet.period - 1/this.originPlanet.period);
        
        var relativePeriod = Math.abs(2*pi/relAngV);
        
        var margin = -20; //-.1 * Math.abs(relativePeriod);
        
        
        if (t < 0) t += relativePeriod;
        
        return t;
    }
    
    
    meanEstimate(t){
        
        var LnOrigin = (t/this.originPlanet.period * 2*pi + this.originPlanet.mean0) %(2*pi);
        var LnDest = (t/this.destinationPlanet.period * 2*pi + this.destinationPlanet.mean0)%(2*pi);
        
        //var LnOrigin = this.originPlanet.LnAtTimeT(t);
        //var LnDest = this.destinationPlanet.LnAtTimeT(t);
        
        var phi_current = LnDest-LnOrigin;
        
        
        var txSMA = (this.destinationPlanet.sma + this.originPlanet.sma)/2;
        var phi_transfer = this.calculatePhaseAngleForTransfer(txSMA);
        
        var epsilon = phi_current-phi_transfer;
        
        var deltaT = this.calculateDeltaT(epsilon);
        
        return deltaT;
    }
    
    ellipticalEstimate(t, tEst){
        
        var Ln_origin_current = this.originPlanet.LnAtTimeT(t);
        var Ln_destination_current = this.destinationPlanet.LnAtTimeT(t);
        
        var phi_current = Ln_destination_current - Ln_origin_current;
        
        // calculate position at estimated time of departure
        var Ln_origin = this.originPlanet.LnAtTimeT(tEst);
        var Ln_destination = Ln_origin + pi;
        
        // calculate transfer orbit sma at estimated departure time/position
        var pe = this.originPlanet.rAtLn(Ln_origin);
        var ap = this.destinationPlanet.rAtLn(Ln_destination);
        var sma = (ap+pe)/2;
        
        var phi_transfer = this.calculatePhaseAngleForTransfer(sma);
        var epsilon = phi_current - phi_transfer;
        var timeUntilTransfer = this.calculateDeltaT(epsilon);
        
        return Math.round(timeUntilTransfer,1);
    }
    
}

function createPlanetObject(){
    
    var name;

    $(this).attr("name", function(index, curValue){
        name = curValue;
    });

    var sma = Number($(this).find("orbit sma").text());
    var ecc = Number($(this).find("orbit ecc").text());
    var argPe = Number($(this).find("orbit argPe").text() );
    var LAN = Number($(this).find("orbit lan").text());
    var theta0 = Number($(this).find("orbit mean0").text());
    
    var soi = Number($(this).find("soi").text());
    var mu = Number($(this).find("mu").text());
    
    var LnPe = (argPe + LAN) * pi/180;
    LnPe %= (2*pi);
    planet = new Planet(name, sma, ecc, LnPe, theta0, mu, soi);
    planets.push(planet);
    
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