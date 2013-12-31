/*jslint browser: true*/
/*export TERRAIN*/
/*global GLMatrix*/
/*global Float32Array*/

var TERRAIN;

TERRAIN = {};

(function () {
	"use strict";

	// Variáveis
	var gl,
		canvas,
		shaderProgram,
		vertexPositionAttribute,
		vertexColorAttribute,
		terrainVerticesBuffer,
		terrainVerticesColorBuffer,
		perspectiveMatrix,
		modelviewMatrix,
		method,
		deslocX,
		deslocY,
		dist,
		angle,
		scale,
		size,
		side,

	// Interface
		xPos,
		yPos,
		zPos,
		fov,
		scaleInput,

	// Funções
		initWebGL,
		initShaders,
		initBuffers,
		generateVertices,
		getShader,
		drawScene,
		setProjection,

	// Funções de ajuda
		setMatrixUniforms;

	TERRAIN.init = function init() {
		canvas = document.getElementById("glcanvas");
		xPos = document.getElementById("xPos");
		yPos = document.getElementById("yPos");
		zPos = document.getElementById("zPos");
		fov = document.getElementById("fov");
		scaleInput = document.getElementById("scale");
		
		//method = "Diamond-square/Midpoint Displacement";
		method = "Open cube";
		size = 0.1;
		side = 100;

		deslocX = 0;
		deslocY = 0;
		dist = 10;
		angle = 45;
		scale = 1;

		initWebGL();

		initShaders();
		initBuffers();

		setProjection();

		generateVertices();

		setInterval(drawScene, 150);

		xPos.addEventListener("input", function () {
			deslocX = xPos.valueAsNumber - 10;
			drawScene();
		}, false);

		yPos.addEventListener("input", function () {
			deslocY = yPos.valueAsNumber - 10;
			drawScene();
		}, false);

		zPos.addEventListener("input", function () {
			dist = zPos.valueAsNumber - 40;
			drawScene();
		}, false);

		fov.addEventListener("input", function () {
			angle = fov.valueAsNumber;

			setProjection();
			drawScene();
		});

		scaleInput.addEventListener("input", function () {
			scale = scaleInput.valueAsNumber;
			drawScene();
		}, false);
	};

	initWebGL = function initWebGL() {
		gl = canvas.getContext("webgl");

		//gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		/*jslint bitwise: true*/
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		/*jslint bitwise: false*/
	};

	initShaders = function initShaders() {
		var fragmentShader,
			vertexShader;

		fragmentShader = getShader("shader-fs");
		vertexShader = getShader("shader-vs");

		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		// Verifica se linkou corretamente
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Incapaz de inicializar programa shader.");
		}

		gl.useProgram(shaderProgram);

		vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(vertexPositionAttribute);

		vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
		gl.enableVertexAttribArray(vertexColorAttribute);
	};

	initBuffers = function initBuffers() {
		terrainVerticesBuffer = gl.createBuffer();

		terrainVerticesColorBuffer = gl.createBuffer();
	};

	generateVertices = function () {
		var vertices,
			colors,
			depth,
			width;

		vertices = [];
		colors = [];

		switch (method) {
			case "Diamond-square/Midpoint Displacement":
				for (depth = 0; depth < side; depth += 1) {
					for (width = 0; width < side; width += 1) {

					}
				}


				break;
			case "Open cube":
				vertices.push(
					1.0, 1.0, 1.0,
					-1.0, 1.0, 1.0,
					1.0, -1.0, 1.0,
					-1.0, 1.0, 1.0,
					-1.0, -1.0, 1.0,
					1.0, -1.0, 1.0,
					1.0, 1.0, 1.0,
					1.0, -1.0, 1.0,
					1.0, -1.0, -1.0,
					1.0, 1.0, -1.0,
					1.0, 1.0, 1.0,
					1.0, -1.0, -1.0,
					-1.0, -1.0, 1.0,
					-1.0, 1.0, 1.0,
					-1.0, 1.0, -1.0,
					-1.0, -1.0, -1.0,
					-1.0, -1.0, 1.0,
					-1.0, 1.0, -1.0,
					-1.0, 1.0, 1.0,
					1.0, 1.0, 1.0,
					1.0, 1.0, -1.0,
					-1.0, 1.0, -1.0,
					-1.0, 1.0, 1.0,
					1.0, 1.0, -1.0,
					1.0, -1.0, 1.0,
					-1.0, -1.0, 1.0,
					-1.0, -1.0, -1.0,
					1.0, -1.0, -1.0,
					1.0, -1.0, 1.0,
					-1.0, -1.0, -1.0
				);

				colors.push(
					1.0, 0.0, 0.0, 1.0,
					1.0, 0.0, 0.0, 1.0,
					1.0, 0.0, 0.0, 1.0,
					1.0, 0.0, 0.0, 1.0,
					1.0, 0.0, 0.0, 1.0,
					1.0, 0.0, 0.0, 1.0,
					1.0, 1.0, 0.0, 1.0,
					1.0, 1.0, 0.0, 1.0,
					1.0, 1.0, 0.0, 1.0,
					1.0, 1.0, 0.0, 1.0,
					1.0, 1.0, 0.0, 1.0,
					1.0, 1.0, 0.0, 1.0,
					1.0, 0.0, 1.0, 1.0,
					1.0, 0.0, 1.0, 1.0,
					1.0, 0.0, 1.0, 1.0,
					1.0, 0.0, 1.0, 1.0,
					1.0, 0.0, 1.0, 1.0,
					1.0, 0.0, 1.0, 1.0,
					0.0, 0.0, 1.0, 1.0,
					0.0, 0.0, 1.0, 1.0,
					0.0, 0.0, 1.0, 1.0,
					0.0, 0.0, 1.0, 1.0,
					0.0, 0.0, 1.0, 1.0,
					0.0, 0.0, 1.0, 1.0,
					0.0, 1.0, 0.0, 1.0,
					0.0, 1.0, 0.0, 1.0,
					0.0, 1.0, 0.0, 1.0,
					0.0, 1.0, 0.0, 1.0,
					0.0, 1.0, 0.0, 1.0,
					0.0, 1.0, 0.0, 1.0
				);
				break;
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, terrainVerticesBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, terrainVerticesColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	}

	getShader = function getShader(id) {
		var shaderScript,
			theSource,
			currentChild,
			shader;

		shaderScript = document.getElementById(id);

		if (!shaderScript) {
			return null;
		}

		theSource = "";
		currentChild = shaderScript.firstChild;

		while (currentChild) {
			if (currentChild.nodeType === currentChild.TEXT_NODE) {
				theSource += currentChild.textContent;
			}

			currentChild = currentChild.nextSibling;
		}

		if (shaderScript.type === "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type === "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			return null;
		}

		gl.shaderSource(shader, theSource);

		gl.compileShader(shader);

		// Verifica se compilou corretamente
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert("Ocorreu um erro ao compilar shader: " + gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	};

	drawScene = function drawScene() {
		/*jslint bitwise: true*/
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		/*jslint bitwise: false*/

		modelviewMatrix = GLMatrix.identity(4);
		modelviewMatrix
			.scale(scale, scale, scale)
			.translate(deslocX, deslocY, dist);

		gl.bindBuffer(gl.ARRAY_BUFFER, terrainVerticesBuffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, terrainVerticesColorBuffer);
		gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLES, 0, 30);
	};

	setProjection = function () {
		perspectiveMatrix = GLMatrix.perspective(angle, 1.0, 0.1, 100.0);
	};

	setMatrixUniforms = function setMatrixUniforms() {
		var pUniform,
			mvUniform;

		pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		gl.uniformMatrix4fv(pUniform, false,
							new Float32Array(perspectiveMatrix.elements));

		mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
		gl.uniformMatrix4fv(mvUniform, false,
							new Float32Array(modelviewMatrix.elements));
	};
}());

window.onload = TERRAIN.init;