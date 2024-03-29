//<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>

var planets = {};
var transferWindows = [];

var currentTime;

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

    constructor(name, sma, ecc, inc, LAN, LnPe, mean0, mu, soi, r){

        this.name = name;
        this.sma = sma;
        this.ecc = ecc;
        this.inc = inc;
        this.LAN = LAN;
        this.LnPe = LnPe;
        this.mean0 = mean0;
        this.mu = mu;
        this.r = r;
        this.soi = soi
        
        this.period = 2*pi*Math.sqrt(this.sma**3/mu_sun);
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

     
    v(r) {
        //v^2 = k(2/r-1/a)
        //v^2 = [k/p](1+e^2+2*e*cos(?))

        return Math.sqrt(mu_sun * (2 / r - 1 / this.sma));
    }

    flightAngelAtTheta(theta) {
        return Math.atan(this.ecc * Math.sin(theta) / (1 + this.ecc * Math.cos(theta)));
    }
}

class TransferOrbit{
   
    constructor(originPlanet, destinationPlanet){
        
        this.originPlanet = originPlanet;
        this.destinationPlanet = destinationPlanet;
        
        this.update(0)
    }

    meanEstimate(t) {

        let r1 = this.originPlanet.sma;
        let P1 = this.originPlanet.period;
        let Ln1 = this.originPlanet.MeanLnAtTimeT(t);

        let r2 = this.destinationPlanet.sma;
        let P2 = this.destinationPlanet.period;
        let Ln2 = this.destinationPlanet.MeanLnAtTimeT(t);

        let relAngVel = 2*pi/P2 - 2*pi/P1;
        let dir = Math.sign(relAngVel);

        let phi = modRev(Ln2 - Ln1);

        let a = (r1 + r2) / 2
        let tof = pi * Math.sqrt(a ** 3 / mu_sun);

        let deltaTheta = tof * (2 * pi) / P2;
        let phix = pi - deltaTheta;
              
        let epsilon = modRev(dir * (phix - phi));
        let deltaT = dir * epsilon / relAngVel;

        this.update(t + deltaT);
    }

    update(t){

        this.t = t;

        //this.Ln_rdv_mean = (this.originPlanet.MeanLnAtTimeT(t) + pi) % (2*pi);

        this.Ln_o = this.originPlanet.LnAtTimeT(t);
        this.Ln_d = this.Ln_o - pi;

        this.LnPe = this.Ln_o < this.Ln_d ? this.Ln_o : this.Ln_d;
        
        this.ro = this.originPlanet.rAtLn(this.Ln_o);
        this.rd = this.destinationPlanet.rAtLn(this.Ln_d);

        this.vo = this.originPlanet.v(this.ro);
        this.vd = this.destinationPlanet.v(this.rd)

        this.a = (this.ro + this.rd)/2;
        this.b = Math.sqrt(this.ro * this.rd);
        this.e = Math.sqrt(this.a ** 2 - this.b ** 2) / this.a;

        this.TOF = pi * Math.sqrt(this.a**3/mu_sun);

        this.v_depart = Math.sqrt(mu_sun * (2 / this.ro - 1 / this.a));
        this.v_arrive = Math.sqrt(mu_sun * (2 / this.rd - 1 / this.a));

        this.v_soi_o = this.v_depart - this.vo;
        this.v_soi_d = this.v_arrive - this.vd;
    }

    planeChangeDv() {

        let io = this.originPlanet.inc;
        let LANo = this.originPlanet.LAN;

        let id = this.destinationPlanet.inc;
        let LANd = this.destinationPlanet.LAN;

        //vector normal to orbit orbit
        let ax = Math.sin(LANo) * Math.sin(io);
        let ay = -Math.cos(LANo) * Math.sin(io);
        let az = Math.cos(io);

        //vector normal to destination orbit
        let bx = Math.sin(LANd) * Math.sin(id);
        let by = -Math.cos(LANd) * Math.sin(id);
        let bz = Math.cos(id);

        //vector towards AN/DN is cross product
        let cx = ay * bz - az * by; 
        let cy = az * bx - ax * bz;
        let cz = ax * by - ay * bx;

        //angle between normal vectors = angle between planes
        //cross product = mag A * mag B * sin(theta); mag A = mag B = 1
        let mag = Math.sqrt(cx ** 2 + cy ** 2 + cz ** 2);
        let inc = Math.asin(mag);
        let Ln = Math.acos(cx/mag);

        let r = this.a * (1 - this.e ** 2) / (1 + this.e * Math.cos(Ln - this.LnPe));

        let v = Math.sqrt(mu_sun * (2 / r - 1 / this.a));
        let dV = 2 * v * Math.sin(inc / 2);

        return dV;
    }
   
}

function HyperbolicOrbit(body, peAlt, v_soi){

    let r_pe = body.r + peAlt;

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
    let a = Math.abs(1/(2/soi - v2**2/mu));

    // calculate v1 from vis-viva eqn
    let v1 = Math.sqrt(mu*(2/r_pe + 1/a));
    let v0 = Math.sqrt(mu/r_pe);
    let deltaV = v1 - v0;

    // theta is angle between a and f (focus), where f = a + r_pe
    // ejection angle is pi - theta, also is half of turning angle
    let theta = Math.acos(a / (a + r_pe));
    let ejectionAngle = (pi - theta);

    // time of flight
    let e = Math.abs((a+r_pe) / a);
    let l = -a * (1 - e ** 2);
    let theta2 = Math.acos((l / soi - 1) / e);
    let F = Math.acosh((e + Math.cos(theta2)) / (1 + e * Math.cos(theta2)));
    let M = e * Math.sinh(F) - F;
    let TOF = Math.sqrt((a) ** 3 / mu) * M;

    TOF = convertSecondsToDateObj(TOF).toString();

    return { vPeCir: v0, vPeHyp: v1, deltaV: deltaV, ejectionAngle: ejectionAngle, TOF: TOF};
}


function createPlanetObject(){
    
    let name;

    $(this).attr("name", function(index, curValue){
        name = curValue;
    });

    let sma = Number($(this).find("orbit sma").text());
    let ecc = Number($(this).find("orbit ecc").text());
    let argPe = Number($(this).find("orbit argPe").text()) * pi / 180;
    let LAN = Number($(this).find("orbit lan").text()) * pi / 180;
    let theta0 = Number($(this).find("orbit mean0").text());
    let inc = Number($(this).find("orbit inc").text()) * pi / 180;

    let soi = Number($(this).find("soi").text());
    let mu = Number($(this).find("mu").text());
    let r = Number($(this).find("radius").text());

    let LnPe = modRev(argPe + LAN);

    planet = new Planet(name, sma, ecc, inc, LAN, LnPe, theta0, mu, soi, r);

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