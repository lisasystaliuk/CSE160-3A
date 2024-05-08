var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {

    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;                   // Use color

    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);            // Use UV debug color

    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);   // Use texture0

    } else if (u_whichTexture == 1) { // take out to revert
      gl_FragColor = texture2D(u_Sampler1, v_UV);   // Use texture1

    } else {
      gl_FragColor = vec4(1, .2, .2, 1);   // Error, put Redish
    }
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering contect for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_Position
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  //Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  //Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  // Set an initial value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements)

}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const PICTURE = 3;

// Globals related UI elements
let g_selectedColor = [0.0,0.0,0.0,1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_yAngle = 0;
let g_xAngle = 0;
let g_zAngle = 0;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI() {

    document.getElementById('yAngleSlide').addEventListener('mousemove', function() { g_yAngle = this.value; renderAllShapes(); });
    document.getElementById('xAngleSlide').addEventListener('mousemove', function() { g_xAngle = this.value; renderAllShapes(); });
    document.getElementById('zAngleSlide').addEventListener('mousemove', function() { g_zAngle = this.value; renderAllShapes(); });

    // Reset Camera
    document.getElementById("cam_reset").onclick = function() { g_yAngle = 0; g_xAngle = 0; g_zAngle = 0; document.getElementById("yAngleSlide").value = 0; 
		document.getElementById("xAngleSlide").value = 0; document.getElementById("zAngleSlide").value = 0; renderAllShapes();};
}

// texture
function initTextures() {

  var image = new Image(); // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }

  // Register the event hangler to be called on loading an image
  image.onload = function(){ sendImageToTEXTURE0( image); };
  // Tell the browser to load an image
  image.src = 'sand.jpg';

  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture(); // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  //Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log('finished loadTexture');
}

/////////////////////////
// texture two, test
function initTexturesTwo() {

  var sky = new Image(); // Create the sky object
  if (!sky) {
    console.log('Failed to create the sky object');
    return false;
  }

  // Register the event hangler to be called on loading an sky
  sky.onload = function(){ sendImageToTEXTURE2( sky); };
  // Tell the browser to load an sky
  sky.src = 'sky.jpg';

  // Add more texture loading

  return true;
}

function sendImageToTEXTURE2(image) {
  var textureSky = gl.createTexture(); // Create a textureSky object
  if (!textureSky) {
    console.log('Failed to create the textureSky object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable textureSky unit0
  gl.activeTexture(gl.TEXTURE1);
  //Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, textureSky);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler1, 1);

  console.log('finished loadTexture 2');
}


// Set up actions for the HTML UI elements
function main() {

  // Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables.
  connectVariablesToGLSL();

  // Set up actions for the HTML UI elements
  addActionsForHtmlUI();

  initTextures();
  initTexturesTwo();

  // Specify the color for clearing <canvas>
  gl.clearColor(0,0,0,1);
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

// Called by browser repeatedly whenever it's time
function tick() {
  // Save the current time
  g_seconds = performance.now()/1000.0 - g_startTime;

  // Draw everything
  renderAllShapes();

  // Tell the browser to update again when it has time
  requestAnimationFrame(tick);
}

var g_eye = [0,0,3];
var g_at = [0,0,-100];
var g_up = [0,1,0];

// Draw every shape that is supposed to be in the canvas
function renderAllShapes() {

  // Check the time at the start of this function
  var startTime = performance.now();

  // Pass the projection matrix
  var projMat = new Matrix4();
  projMat.setPerspective(60, 1 * canvas.width/canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  // Pass the view matrix
  var viewMat = new Matrix4();
  viewMat.setLookAt(g_eye[0],g_eye[1],g_eye[2], g_at[0],g_at[1],g_at[2], g_up[0],g_up[1],g_up[2]); // (eye, at, up)
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // Pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4()
    .rotate(g_yAngle, 0, 1, 0) // y
    .rotate(g_xAngle, 1, 0, 0) // x
    .rotate(g_zAngle, 0, 0, 1); // z

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw shapes
  var sky = new Cube();
  sky.color = [135/255.0, 206/255.0, 235/255.0, 1.0];
  sky.textureNum = 1;
  sky.matrix.scale(50,50,50);
  sky.matrix.translate(-.5,-.5,-.5);
  sky.render();

  var fenceEnd1 = new Cube();
  fenceEnd1.color = [128/255, 128/255, 128/255, 1.0];
  fenceEnd1.textureNum = -2;
  fenceEnd1.matrix.translate(-0.5,-1,-0.5);
  fenceEnd1.matrix.scale(0.35,0.8,0.35);
  fenceEnd1.render();

  var fenceEnd2 = new Cube();
  fenceEnd2.color = [128/255, 128/255, 128/255, 1.0];
  fenceEnd2.textureNum = -2;
  fenceEnd2.matrix.translate(-1.5,-1,-0.5);
  fenceEnd2.matrix.scale(0.35,0.8,0.35);
  fenceEnd2.render();

  var middle = new Cube();
  middle.color = [140/255, 140/255, 140/255, 1.0];
  middle.textureNum = -2;
  middle.matrix.translate(-1.2,-1,-0.43);
  middle.matrix.scale(0.8,0.6,0.2);
  middle.render();

  var ground = new Cube();
  ground.color = [.3, 0.8, 0.3, 1.0];
  ground.textureNum = 0;
  ground.matrix.translate(-6,-1.2,-5);
  //ground.matrix.rotate(-5,1,0,0);
  ground.matrix.scale(15,0.2,15);
  ground.render();

  // Check the time at the end of the function, and show on web page
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");

}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
      console.log("Failed to get " + htmlID + " from the HTML");
      return;
    }
    htmlElm.innerHTML = text;
  }
