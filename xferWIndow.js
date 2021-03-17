console.log("javaScript started");




function updateTable(){
    
    var table = document.getElementById("scheduleTable");
    
    transferWindows.forEach(
        function(item, index){
            var tableRow = "<tr>"
            tableRow += "<td>" + item.origin + "</td>";
            tableRow += "<td>" + item.destination + "</td>";
            tableRow += "<td>" + item.Tmean + "</td>";
            tableRow += "<td>" + item.T + "</td>";
            tableRow += "</tr>";

            table.insertAdjacentHTML("beforeend", tableRow);
        }
    )
    
}

function calculateWindows(){
    
    console.log("calculate windows");

    /*currentTime = 0;
    
    originPlanet = planets[2];
    destinationPlanet = planets[3];
    
    console.log("window 1: inner: " + originPlanet.name + " outer: " + destinationPlanet.name);
    
    window1 = new TransferWindow(originPlanet, destinationPlanet);
    console.log(window1);
    */
    
    var year = $("#year").val()-1;
    var day = $("#day").val()-1;
    var hour = $("#hour").val();
    var minute = $("#minute").val();
    
    currentTime = convertDateToSeconds(year, day, 0, 0);
    
    var test = false
    if(test){
        
        var testWindow = new TransferWindow(planets[0], planets[1])
        transferWindows.push(testWindow);

        for(var j=0; j<50; j++){
            currentTime = convertDateToSeconds(0,j,0,0);
            var testWindow = new TransferWindow(planets[0], planets[1])
            transferWindows.push(testWindow);
        }

        return;
    
    }
    
    // transfer windows going outward0
    for(i=0; i<planets.length-1; i++){
        var window = new TransferWindow(planets[i], planets[i+1])
        transferWindows.push(window);
    }
    
    // transfer windows going inward
   /* for(j=0; j<planets.length;j++){
        var window = new TransferWindow(planets[j+1], planets[j]);
        transferWindows.push(window);
    }
    transferWindows.sort(function(a,b){return a.departureTime - b.departureTime})
    */
    
    //console.log(transferWindows);
    
}



function updateSchedule(){
    
    transferWindows.length=0;
    
    calculateWindows();
    
    var table = document.getElementById("scheduleTable");
    var headerRow = document.getElementById("scheduleTable").firstElementChild;
    
    table.innerHTML="";
    table.appendChild(headerRow);
    
    updateTable();
}



$(document).ready(function(){
    console.log("document ready");
    var ajax = getPlanetsXML()
});

