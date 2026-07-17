// ================================
// SMART METRO ABS SCADA SYSTEM
// FINAL TRAIN + SIGNAL ENGINE
// PART 1/5
// ================================


// ---------- DOM ELEMENTS ----------

const clock =
document.getElementById("clock");


const systemStatus =
document.getElementById("systemStatus");


const startBtn =
document.getElementById("startBtn");


const stopBtn =
document.getElementById("stopBtn");


const emergencyBtn =
document.getElementById("emergencyBtn");


const resetBtn =
document.getElementById("resetBtn");



// ---------- ALARM ----------

const alarmSound =
new Audio("alarm.mp3");


alarmSound.loop=true;



// ---------- SYSTEM STATE ----------

let running=false;

let emergency=false;

let animationFrame=null;



// ---------- CONSTANTS ----------

const NORMAL_SPEED=0.12;

const YELLOW_SPEED=0.05;

const BLOCKS=5;





// ---------- TRAIN OBJECTS ----------


const trains={



U1:{

id:"U1",

line:"UP",

position:5,

block:1,

speed:NORMAL_SPEED,

state:"RUNNING",

element:
document.getElementById("U1")

},




U2:{

id:"U2",

line:"UP",

position:35,

block:2,

speed:NORMAL_SPEED,

state:"RUNNING",

element:
document.getElementById("U2")

},





D1:{

id:"D1",

line:"DOWN",

position:90,

block:5,

speed:NORMAL_SPEED,

state:"RUNNING",

element:
document.getElementById("D1")

},





D2:{

id:"D2",

line:"DOWN",

position:60,

block:3,

speed:NORMAL_SPEED,

state:"RUNNING",

element:
document.getElementById("D2")

}


};






// ---------- BLOCK DATABASE ----------


const upBlocks=[];

const downBlocks=[];



for(let i=1;i<=BLOCKS;i++){


upBlocks.push({

id:i,

occupied:false,

train:null,

signal:"GREEN"

});



downBlocks.push({

id:i,

occupied:false,

train:null,

signal:"GREEN"

});


}






// ---------- CLOCK ----------


function updateClock(){


clock.innerHTML=
new Date().toLocaleTimeString();


}


setInterval(updateClock,1000);

updateClock();






// ---------- EVENT LOG ----------


function addLog(message){


const log=
document.getElementById("eventLog");


if(log){


let p=document.createElement("p");


p.innerHTML=
"["+new Date().toLocaleTimeString()+"] "+message;


log.prepend(p);


}


}
// =================================
// PART 2/5
// BLOCK + SIGNAL CONTROL
// =================================



function getLineBlocks(train){


return train.line==="UP"
?
upBlocks
:
downBlocks;


}








// Find current block of train

function updateTrainBlock(train){



let pos=train.position;



if(pos<20){

train.block=1;

}

else if(pos<40){

train.block=2;

}

else if(pos<60){

train.block=3;

}

else if(pos<80){

train.block=4;

}

else{

train.block=5;

}



}









// Clear all blocks

function clearOccupancy(){


upBlocks.forEach(block=>{

block.occupied=false;
block.train=null;

});



downBlocks.forEach(block=>{

block.occupied=false;
block.train=null;

});


}









// Update which train is inside which block


function updateOccupancy(){



clearOccupancy();




Object.values(trains).forEach(train=>{


updateTrainBlock(train);



let blocks=
getLineBlocks(train);



let current=
blocks.find(
b=>b.id===train.block
);



if(current){


current.occupied=true;

current.train=train.id;


}



});



}









// Automatic Block Signalling Logic


function calculateSignals(blocks,direction){



// default clear


blocks.forEach(block=>{


block.signal="GREEN";


});





for(let i=0;i<blocks.length;i++){



let next=null;

let nextNext=null;





// UP direction

if(direction==="UP"){


next=blocks[i+1];

nextNext=blocks[i+2];


}





// DOWN direction

else{


next=blocks[i-1];

nextNext=blocks[i-2];


}








// Next block occupied

if(next && next.occupied){



blocks[i].signal="RED";



}




// Two block protection


else if(nextNext && nextNext.occupied){



blocks[i].signal="YELLOW";



}





else{


blocks[i].signal="GREEN";


}





}



}









function updateAllSignals(){



calculateSignals(
upBlocks,
"UP"
);



calculateSignals(
downBlocks,
"DOWN"
);



}









// Get signal in front of train


function getNextSignal(train){



let blocks=
getLineBlocks(train);



let signal="GREEN";





if(train.line==="UP"){



// Signal before next block


if(train.block<5){


signal=
blocks[train.block].signal;


}



}





else{



// DOWN travels from 5 to 1


if(train.block>1){


signal=
blocks[train.block-2].signal;


}



}





return signal;


}
// =================================
// PART 3/5
// TRAIN MOVEMENT ENGINE
// =================================



function checkFollowingDistance(train){



// UP FOLLOWING TRAIN

if(train.id==="U2"){


let gap=
trains.U1.position -
trains.U2.position;



if(gap<0){

gap+=100;

}



if(gap<18){

return false;

}



}







// DOWN FOLLOWING TRAIN

if(train.id==="D2"){


let gap=
trains.D2.position -
trains.D1.position;



if(gap<0){

gap+=100;

}



if(gap<18){

return false;

}



}



return true;


}









function applySignal(train){



let signal=
getNextSignal(train);






if(signal==="RED"){


train.speed=0;

train.state="STOPPED";


return;


}







if(signal==="YELLOW"){



train.speed=
YELLOW_SPEED;


train.state="CAUTION";


return;


}







train.speed=
NORMAL_SPEED;


train.state="RUNNING";



}









function moveTrain(train){



applySignal(train);




// waiting at RED

if(train.speed===0){


return;


}






if(!checkFollowingDistance(train)){


train.speed=0;

train.state="CAUTION";

return;


}








// UP direction


if(train.line==="UP"){



train.position+=train.speed;



if(train.position>=98){


train.position=5;


addLog(
train.id+" completed UP route"
);


}



}









// DOWN direction


else{



train.position-=train.speed;



if(train.position<=2){


train.position=95;


addLog(
train.id+" completed DOWN route"
);


}



}









train.element.style.left=
train.position+"%";



updateTrainBlock(train);



}









function moveAllTrains(){



Object.values(trains).forEach(train=>{


moveTrain(train);


});



}









function simulationLoop(){



if(!running || emergency){


return;


}






// 1. Update current position

updateOccupancy();





// 2. Calculate signals

updateAllSignals();





// 3. Give movement permission

moveAllTrains();





// 4. Refresh blocks

updateOccupancy();


updateAllSignals();





updateSignalDisplay();


updateSCADA();






animationFrame=
requestAnimationFrame(simulationLoop);



}
// =================================
// PART 4/5
// SCADA DISPLAY SYSTEM
// =================================



function setSignalColor(id,status){



let element=
document.getElementById(id);



if(!element){

return;

}



element.className="signal";



if(status==="GREEN"){


element.classList.add("green");


}

else if(status==="YELLOW"){


element.classList.add("yellow");


}

else{


element.classList.add("red");


}



}









function updateSignalDisplay(){



const upIDs=[

"US1",
"US2",
"US3",
"US4",
"US5"

];



const downIDs=[

"DS1",
"DS2",
"DS3",
"DS4",
"DS5"

];








upBlocks.forEach((block,index)=>{



setSignalColor(
upIDs[index],
block.signal
);



let aspect=
document.getElementById(
upIDs[index]+"Aspect"
);



if(aspect){


aspect.innerHTML=
block.signal;


}



let summary=
document.getElementById(
"sum"+upIDs[index]
);



if(summary){


summary.innerHTML=
block.signal;


}



});









downBlocks.forEach((block,index)=>{



setSignalColor(
downIDs[index],
block.signal
);



let aspect=
document.getElementById(
downIDs[index]+"Aspect"
);



if(aspect){


aspect.innerHTML=
block.signal;


}



let summary=
document.getElementById(
"sum"+downIDs[index]
);



if(summary){


summary.innerHTML=
block.signal;


}



});



}









function updateTrainMonitor(){



// BLOCKS


document.getElementById("u1Block").innerHTML=
"BLOCK "+trains.U1.block;


document.getElementById("u2Block").innerHTML=
"BLOCK "+trains.U2.block;


document.getElementById("d1Block").innerHTML=
"BLOCK "+trains.D1.block;


document.getElementById("d2Block").innerHTML=
"BLOCK "+trains.D2.block;





// SPEED


document.getElementById("u1Speed").innerHTML=
trains.U1.speed===0
?
"0 km/h"
:
"45 km/h";



document.getElementById("u2Speed").innerHTML=
trains.U2.speed===0
?
"0 km/h"
:
"45 km/h";



document.getElementById("d1Speed").innerHTML=
trains.D1.speed===0
?
"0 km/h"
:
"45 km/h";



document.getElementById("d2Speed").innerHTML=
trains.D2.speed===0
?
"0 km/h"
:
"45 km/h";







// SIGNAL


document.getElementById("u1Signal").innerHTML=
getNextSignal(trains.U1);


document.getElementById("u2Signal").innerHTML=
getNextSignal(trains.U2);


document.getElementById("d1Signal").innerHTML=
getNextSignal(trains.D1);


document.getElementById("d2Signal").innerHTML=
getNextSignal(trains.D2);






// STATE


document.getElementById("u1Status").innerHTML=
trains.U1.state;


document.getElementById("u2Status").innerHTML=
trains.U2.state;


document.getElementById("d1Status").innerHTML=
trains.D1.state;


document.getElementById("d2Status").innerHTML=
trains.D2.state;



}









function updateBlockDisplay(){



upBlocks.forEach(block=>{


let id=
"upBlock"+block.id;



let element=
document.getElementById(id);



if(element){


element.innerHTML=
block.occupied
?
"OCCUPIED "+block.train
:
"FREE";


}



});








downBlocks.forEach(block=>{


let id=
"downBlock"+block.id;



let element=
document.getElementById(id);



if(element){


element.innerHTML=
block.occupied
?
"OCCUPIED "+block.train
:
"FREE";


}



});



}









function updateDashboard(){



let count=0;



upBlocks.forEach(block=>{


if(block.occupied){

count++;

}


});



downBlocks.forEach(block=>{


if(block.occupied){

count++;

}


});





document.getElementById("upCount").innerHTML=2;


document.getElementById("downCount").innerHTML=2;



document.getElementById("blockCount").innerHTML=
count;



}









function updateSCADA(){


updateSignalDisplay();


updateTrainMonitor();


updateBlockDisplay();


updateDashboard();



}
// =================================
// PART 5/5
// CONTROL SYSTEM + EMERGENCY
// =================================




function startSystem(){



if(emergency){


addLog(
"START LOCKED - RESET EMERGENCY FIRST"
);


return;


}



if(running){

return;

}



running=true;



systemStatus.innerHTML=
"RUNNING";



addLog(
"Metro Simulation Started"
);




animationFrame=
requestAnimationFrame(simulationLoop);



}









function stopSystem(){



running=false;



if(animationFrame){

cancelAnimationFrame(animationFrame);

}





Object.values(trains).forEach(train=>{


train.speed=0;

train.state="STOPPED";


});



systemStatus.innerHTML=
"STOPPED";



addLog(
"Manual Stop Activated"
);



updateSCADA();



}









function emergencyStop(){



running=false;


emergency=true;



if(animationFrame){

cancelAnimationFrame(animationFrame);

}





Object.values(trains).forEach(train=>{


train.speed=0;

train.state="EMERGENCY STOP";


});






systemStatus.innerHTML=
"EMERGENCY";





let alarmBox=
document.getElementById("alarmBox");



if(alarmBox){


alarmBox.innerHTML=
"🚨 EMERGENCY ACTIVE";


alarmBox.classList.add("active");


}





let alarmCount=
document.getElementById("alarmCount");



if(alarmCount){


alarmCount.innerHTML="1";


}





// start alarm

alarmSound.play()
.catch(()=>{


addLog(
"Alarm blocked - add alarm.mp3"
);


});





addLog(
"Emergency Brake Applied"
);



}









function resetSystem(){



emergency=false;


running=false;



alarmSound.pause();


alarmSound.currentTime=0;





let alarmBox=
document.getElementById("alarmBox");



if(alarmBox){


alarmBox.innerHTML=
"NO ACTIVE ALARM";


alarmBox.classList.remove("active");


}





let alarmCount=
document.getElementById("alarmCount");



if(alarmCount){


alarmCount.innerHTML="0";


}





Object.values(trains).forEach(train=>{


train.speed=NORMAL_SPEED;

train.state="READY";


});





systemStatus.innerHTML=
"NORMAL";



addLog(
"System Reset Completed"
);



updateSCADA();



}









function initializeSystem(){



Object.values(trains).forEach(train=>{


if(train.element){


train.element.style.left=
train.position+"%";


}



});





updateOccupancy();


updateAllSignals();


updateSCADA();





addLog(
"Smart Metro ABS SCADA Ready"
);



}









// BUTTON CONNECTION


startBtn.onclick=startSystem;


stopBtn.onclick=stopSystem;


emergencyBtn.onclick=emergencyStop;


resetBtn.onclick=resetSystem;









// START PROGRAM


initializeSystem();