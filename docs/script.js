/**
 * @license
 * Copyright 2023 NPCshim All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * Google CodeLab "Make a smart webcam in JavaScript with a TensorFlow.js pre-trained Machine Learning model" を基に作成しました。
 * This code is based on "Make a smart webcam in JavaScript with a TensorFlow.js pre-trained Machine Learning model."
 * URL: https://codelabs.developers.google.com/codelabs/tensorflowjs-object-detection
 * 元コードの著作権は Google LLC. と Jason Mayes氏に帰属します。
 * The original code is copyrighted by Google LLC. and Mr. Jason Mayes.
 */

const video = document.getElementById('webcam');  // Stream.
const liveView = document.getElementById('liveView');  // Container.
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const h1 = document.getElementById('title');
const des = document.getElementById('description');
const body = document.getElementById('body');
const header = document.getElementById('header');
// Summarize the id numbers assigned to objects that might be obstacles.
const obstacles = [1, 2, 3, 4, 6, 7, 8, 11, 18, 33, 37, 41, 44, 64];
// Determine the width of the video (changes according to the device)
let videoWidth = 640;
// Measure the time elapsed since the object was detected.
let p_detTime;
let n_elapTime;
// Time object detected - elapsed time = dif
let dif;

// Check if webcam access is supported.
function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will 
// define in the next step.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser')
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  // Only continue if the COCO-SSD has finished loading.
  if (!model) { return; }

  // Hide all of the text once clicked the button.
  event.target.classList.add('removed');
  h1.classList.add('removed');
  des.classList.add('removed');

  // getUsermedia parameters to force video but not audio.
  var constraints = {
    video: true
  };
  
  // If the user is using a smart phone, activate the outside camera.
  if((navigator.userAgent.indexOf('iPhone') > 0) || (navigator.userAgent.indexOf('iPad') > 0) || (navigator.userAgent.indexOf('iPod') > 0) || (navigator.userAgent.indexOf('Android') > 0)){
    constraints = { video: { facingMode: { exact: "environment" } }};
    if(window.innerWidth < window.innerHeight){
      videoWidth = 480;
    }
  }
  
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.width = window.innerWidth;
    liveView.style = 'margin: 0px;';
    body.style = 'margin: 0px;';

    video.addEventListener('loadeddata', predictWebcam);
  });

}


// Store the resulting model in the global scope of our app.
var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment 
// to get everything needed to run.

cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  demosSection.classList.remove('invisible');
});

var children = [];

function predictWebcam() {
  //var detectTime;
  //var elapsedTime;
  
  // Now let's start classifying a frame in the stream.
  model.detect(video).then(function (predictions) {
    // Remove any highlighting we did previous frame (except for the header).
    
    // Note elapsed time.
    sessionStorage.setItem('elaptime',Date.now());
    
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);  
    }

    children.splice(0);

    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
         // To begin with, identify whether the object we are looking for might be an obstacle or not.
         // Then, if we are over 66% sure we are sure we classified it right, draw it.
        if ((obstacles.includes(predictions[n].ident) === true) && predictions[n].score > 0.66) {
          const p = document.createElement('p');
          
          header.classList.remove('removed');
          header.innerText = 'There is a ' + predictions[n].class + ' in front of you.';
          header.style = 'position: absolute; z-index: 10;';
          
          p.innerText = predictions[n].class  + ' - with ' 
              + Math.round(parseFloat(predictions[n].score) * 100) 
              + '% confidence.';

          p.style = 'margin-left: ' + (predictions[n].bbox[0] * (window.innerWidth/videoWidth)) + 'px; margin-top: '
              + (predictions[n].bbox[1] * (window.innerWidth/videoWidth) - 10) + 'px; width: ' 
              + (predictions[n].bbox[2] * (window.innerWidth/videoWidth) - 10) + 'px; top: 0; left: 0;';

          const highlighter = document.createElement('div');
          highlighter.setAttribute('class', 'highlighter');
          highlighter.style = 'left: ' + (predictions[n].bbox[0] * (window.innerWidth/videoWidth)) + 'px; top: '
              + (predictions[n].bbox[1] * (window.innerWidth/videoWidth)) + 'px; width: ' 
              + (predictions[n].bbox[2] * (window.innerWidth/videoWidth)) + 'px; height: '
              + (predictions[n].bbox[3]  * (window.innerWidth/videoWidth)) + 'px;';
          
          liveView.appendChild(highlighter);
          liveView.appendChild(p);
 
          children.push(highlighter);
          children.push(p);
          
          sessionStorage.setItem('detTime', Date.now());
      }
    }   

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);

  });
  
  // Calculate the time elapsed.
  p_detTime = sessionStorage.getItem('detTime');
  n_elapTime = sessionStorage.getItem('elaptime');
  dif = n_elapTime - p_detTime
  
  // If the time exceeds 5 minutes, remove the header.
  if(dif > 5000){
    header.classList.add('removed');
  }
}