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

     
    v(r) {
        return Math.sqrt(mu_sun * (2 / r - 1 / this.sma));

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
        let Ln = Math.acos(cx);

        var r = this.a * (1 - this.e ** 2) / (1 + this.e * Math.cos(Ln - this.Ln_o))

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
    let a_hyp = Math.abs(1/(2/soi - v2**2/mu));

    // calculate v1 from vis-viva eqn
    let v1 = Math.sqrt(mu*(2/r_pe + 1/a_hyp));
    let v0 = Math.sqrt(mu/r_pe);
    let deltaV = v1 - v0;

    let theta = Math.acos(a_hyp / (a_hyp + r_pe));
    let halfAngle = (pi - theta) * 180/pi;

    return {deltaV: deltaV, halfAngle: halfAngle};
}


function createPlanetObject(){
    
    let name;

    $(this).attr("name", function(index, curValue){
        name = curValue;
    });

    let sma = Number($(this).find("orbit sma").text());
    let ecc = Number($(this).find("orbit ecc").text());
    let argPe = Number($(this).find("orbit argPe").text() );
    let LAN = Number($(this).find("orbit lan").text()) * pi / 180;
    let theta0 = Number($(this).find("orbit mean0").text());
    let inc = Number($(this).find("orbit inc").text()) * pi / 180;

    let soi = Number($(this).find("soi").text());
    let mu = Number($(this).find("mu").text());
    let r = Number($(this).find("radius").text());

    var LnPe = (argPe + LAN) * pi/180;
    LnPe %= (2*pi);
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