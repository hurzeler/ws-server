var url = "ws://192.168.4.1:1337/";

const decrease = document.querySelector('.decrease');
const reset0 = document.querySelector('.reset0');
const reset1 = document.querySelector('.reset1');
const reset2 = document.querySelector('.reset2');
const increase = document.querySelector('.increase');
const output = document.querySelector('.output');
PCSst = document.getElementById("PCSstate");

decrease.innerHTML = "-";
increase.innerHTML = "+";

let counter = 0;

decrease.addEventListener('click', () => {
    counter = counter - 100;
	changePulseCount(counter);
    output.innerHTML = counter;
    if (counter < 0) {
        output.style.color = "#ff1a1a";
	}
});

reset0.addEventListener('click', () => {
	counter = 0;
	changePulseCount(counter);
	output.innerHTML = counter;
	output.style.color = "#ff531a";
});

reset1.addEventListener('click', () => {
	counter = 1500;
	changePulseCount(counter);
	output.innerHTML = counter;
	output.style.color = "#102b42";
});

reset2.addEventListener('click', () => {
	counter = 40000;
	changePulseCount(counter);
	output.innerHTML = counter;
	output.style.color = "#102b42";
});

increase.addEventListener('click', () => {
	counter = counter + 100;
	changePulseCount(counter);
	output.innerHTML = counter;
	if (counter > 0) {
		output.style.color = "#00b300";
	}
});
// This is called when the page finishes loading
function init() 
{
	// Connect to Websocket server
	wsConnect(url);
}
// Call the init function as soon as the page loads
// Call this to connect to the WebSocket server
function wsConnect(url) 
{
    // Connect to WebSocket server
    websocket = new WebSocket(url);
    
    // Assign callbacks
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
		
}
 
// Called when a WebSocket connection is established with the server
function onOpen(evt) 
{
    console.log("Connected");
    //const myTimeout = setTimeout(changePulseCount(0), 100);
    //clearTimeout(myTimeout);
    doSend("getWPCSVal");
    doSend("getWPCSSta");
}

// Called when the WebSocket connection is closed
function onClose(evt) 
{
    // Log disconnection state
    console.log("Disconnected");

    // Try to reconnect after a few seconds
    setTimeout(function() { wsConnect(url) }, 2000);
}
function onError(evt)
{
    console.log("ERROR: " + evt.data);
}

function onMessage(evt)
{
    // Print out our received message
    console.log("Received: " + evt.data);
    var evtMessage1 = evt.data.substring(0,3);
    var evtMessage2 = evt.data.substring(3);
    //console.log(evtMessage1);    
    //console.log(evtMessage2);

    if (evtMessage1 == "vPC") {
        console.log("Pulse count stop value is: " + evtMessage2);
        const num = evtMessage2;
        const result = Intl.NumberFormat('en-US').format(num);
        output.innerHTML = result;
    }
    if (evtMessage1 == "vPS") {
        switch(evtMessage2) {
        case "1":
            console.log("Pulse count contolled line stopping engaged");
            PCSst.checked = true;
            break;
        case "0":
            console.log("Pulse count contolled line stopping disengaged");
            PCSst.checked = false;
            break;
        }
    }
}
// Sends a message to the server (and prints it to the console)
function doSend(message) 
{
    console.log("Sending: " + message);
    websocket.send(message);
}
// Called whenever the counter value changed
function changePulseCount(counter) {
	message = "WPCSVal" + counter;
	doSend(message);
}
// Called whenever the counter value changed
function PCSClick() {
    if (PCSst.checked == true) {
        i = 1;
    }
    if (PCSst.checked == false) {
        i = 0;
        counter = 0;
        changePulseCount(counter);
    }
	message = "WPCSSta" + i;
	doSend(message);
}

window.addEventListener("load", init, false);