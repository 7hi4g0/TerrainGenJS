/*jslint browser: true*/
/*export TERRAIN*/
/*global GLMatrix*/
/*global RANDOM*/
/*global Float32Array*/

var TERRAIN;

TERRAIN = {};

(function () {
	"use strict";

	// Variáveis
	var gl,
		canvas,
		shaderName,
		shaderProgram,
		vertexPositionAttribute,
		vertexColorAttribute,
		terrainVerticesBuffer,
		terrainVerticesColorBuffer,
		perspectiveMatrix,
		modelviewMatrix,
		method,
		time,
		walkSpeed,
		moveX,
		moveZ,
		deslocX,
		deslocY,
		dist,
		pitch,
		yaw,
		roll,
		angle,
		scale,
		size,
		side,
		maxHeight,
		vertices,
		colors,
		rand,
		seed,

	// Interface
		xPos,
		yPos,
		zPos,
		xRot,
		yRot,
		zRot,
		fov,
		scaleInput,
		model,
		dimension,
		sqSize,
		shaderSelect,
		seedInput,

	// Funções
		initWebGL,
		initShaders,
		initBuffers,
		generateVertices,
		generateHeights,
		getShader,
		calculateFrame,
		drawScene,
		setCamera,
		setProjection,

	// Funções de ajuda
		setMatrixUniforms;

	walkSpeed = 1.5;

	TERRAIN.init = function init() {
		canvas = document.getElementById("glcanvas");
		xPos = document.getElementById("xPos");
		yPos = document.getElementById("yPos");
		zPos = document.getElementById("zPos");
		xRot = document.getElementById("xRot");
		yRot = document.getElementById("yRot");
		zRot = document.getElementById("zRot");
		fov = document.getElementById("fov");
		scaleInput = document.getElementById("scale");
		model = document.getElementById("model");
		dimension = document.getElementById("dimension");
		sqSize = document.getElementById("sqSize");
		shaderSelect = document.getElementById("shaderSelect");
		seedInput = document.getElementById("seedInput");

		//method = "Diamond-square/Midpoint Displacement";
		shaderName = "colorfull";
		method = "Open cube";
		size = 0.1;
		side = 128;
		maxHeight = side;

		moveX = 0;
		moveZ = 0;

		deslocX = 0;
		deslocY = 0;
		dist = 10;
		//pitch = 0;
		//yaw = 0;
		//roll = 0;
		angle = 45;
		scale = 1;

		seed = 42;

		initWebGL();

		initShaders();
		initBuffers();

		setCamera();
		setProjection();

		generateVertices();

		time = new Date().getTime();

		setInterval(drawScene, 18);

		canvas.addEventListener("keydown", function (event) {
			switch (event.keyCode) {
				case 87:
					moveZ = -walkSpeed;
					break;
				case 83:
					moveZ = walkSpeed;
					break;
				case 65:
					moveX = walkSpeed;
					break;
				case 68:
					moveX = -walkSpeed;
					break;
			}
		}, false);

		canvas.addEventListener("keyup", function (event) {
			switch (event.keyCode) {
				case 87:
				case 83:
					moveZ = 0;
					break;
				case 65:
				case 68:
					moveX = 0;
					break;
			}
		}, false);

		//xPos.addEventListener("input", function () {
			//deslocX = xPos.valueAsNumber - 10;
			//drawScene();
		//}, false);

		//yPos.addEventListener("input", function () {
			//deslocY = yPos.valueAsNumber - 10;
			//drawScene();
		//}, false);

		//zPos.addEventListener("input", function () {
			//dist = zPos.valueAsNumber - 40;
			//drawScene();
		//}, false);

		//xRot.addEventListener("input", function () {
			//pitch = xRot.valueAsNumber;
			//drawScene();
		//}, false);

		//yRot.addEventListener("input", function () {
			//yaw = yRot.valueAsNumber;
			//drawScene();
		//}, false);

		//zRot.addEventListener("input", function () {
			//roll = zRot.valueAsNumber;
			//drawScene();
		//}, false);

		fov.addEventListener("input", function () {
			angle = fov.valueAsNumber;

			setProjection();
			drawScene();
		});

		scaleInput.addEventListener("input", function () {
			scale = scaleInput.valueAsNumber;
			drawScene();
		}, false);

		model.addEventListener("change", function () {
			method = model.value;
			generateVertices();
			drawScene();
		}, false);

		dimension.addEventListener("change", function () {
			maxHeight = side = parseInt(dimension.value, 10);
			generateVertices();
			drawScene();
		}, false);

		sqSize.addEventListener("change", function () {
			size = sqSize.valueAsNumber;
		}, false);

		shaderSelect.addEventListener("change", function () {
			shaderName = shaderSelect.value;
			initShaders();
			drawScene();
		}, false);

		seedInput.addEventListener("change", function () {
			seed = seedInput.value;

			if (seed === parseInt(seed, 10).toString()) {
				seed = parseInt(seed, 10);
			}

			generateVertices();
			drawScene();
		}, false);
	};

	initWebGL = function initWebGL() {
		gl = canvas.getContext("webgl");

		//gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0.3, 0.5, 0.9, 1.0);
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

		fragmentShader = getShader(shaderName + "-fs");
		vertexShader = getShader(shaderName + "-vs");

		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		// Verifica se linkou corretamente
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			alert("Incapaz de inicializar programa shader: " + gl.getProgramInfoLog(shaderProgram));
		}

		gl.useProgram(shaderProgram);

		vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(vertexPositionAttribute);

		if (shaderName === "colorfull") {
			vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
			gl.enableVertexAttribArray(vertexColorAttribute);
		}
	};

	initBuffers = function initBuffers() {
		terrainVerticesBuffer = gl.createBuffer();

		terrainVerticesColorBuffer = gl.createBuffer();
	};

	generateVertices = function generateVertices() {
		var heights,
			halfSide,
			halfTerrainSize,
			color,
			index,
			depth,
			width,
			depthIndex,
			widthIndex;

		vertices = [];
		colors = [];

		rand = RANDOM.RC4(seed);

		switch (method) {
		case "Diamond-square/Midpoint Displacement":
			heights = [];

			generateHeights(heights);

			halfSide = side / 2;
			halfTerrainSize = halfSide * size;

			for (depthIndex = 0, depth = -halfSide;
				depthIndex < side;
				depthIndex += 1, depth += 1) {
				for (widthIndex = 0, width = -halfSide;
					widthIndex < side;
					widthIndex += 1, width += 1) {
					vertices.push(
						width, heights[depthIndex * (side + 1) + widthIndex], depth,
						width, heights[(depthIndex + 1) * (side + 1) + widthIndex], depth + 1,
						width + 1, heights[(depthIndex + 1) * (side + 1) + widthIndex + 1], depth + 1,

						width + 1, heights[(depthIndex + 1) * (side + 1) + widthIndex + 1], depth + 1,
						width + 1, heights[depthIndex * (side + 1) + widthIndex + 1], depth,
						width, heights[depthIndex * (side + 1) + widthIndex], depth
					);

					color = [rand.random(), rand.random(), rand.random(), 1.0];

					for (index = 0; index < 6; index += 1) {
						Array.prototype.push.apply(colors, color);
					}
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
	};

	generateHeights = function generateHeights(heights) {
		var depth,
			width,
			diff,
			//smoothness,
			halfDepth,
			halfWidth,
			length;

		function diamond(x1, z1, x2, z2) {
			var count,
				half,
				heightIndex,
				height;

			count = 2;
			height = 0;

			if (x1 === x2) {
				half = (z2 - z1) / 2;

				heightIndex = (z1 + half) * (side + 1) + x1;

				if (x1 - half >= 0) {
					height += heights[(z1 + half) * (side + 1) + x1 - half];
					count += 1;
				}

				if (x1 + half <= side) {
					height += heights[(z1 + half) * (side + 1) + x1 + half];
					count += 1;
				}
			} else if (z1 === z2) {
				half = (x2 - x1) / 2;

				heightIndex = z1 * (side + 1) + x1 + half;

				if (z1 - half >= 0) {
					height += heights[(z1 - half) * (side + 1) + x1 + half];
					count += 1;
				}

				if (z1 + half <= side) {
					height += heights[(z1 + half) * (side + 1) + x1 + half];
					count += 1;
				}
			}

			height +=
				heights[z1 * (side + 1) + x1] +
				heights[z2 * (side + 1) + x2];
			height /= count;
			height += (rand.random() * 2 * diff) - diff;

			heights[heightIndex] = height;
		}

		//smoothness = 0.2;
		//diff = maxHeight * Math.pow(2, -smoothness);
		diff = maxHeight / 2;

		for (length = (side + 1) * (side + 1) ; length > 0; length -= 1) {
			heights.push(null);
		}

		heights[0] = //Math.random() * maxHeight;
		heights[side] = //Math.random() * maxHeight;
		heights[side * (side + 1)] = //Math.random() * maxHeight;
		heights[side * (side + 1) + side] = //Math.random() * maxHeight;
			maxHeight;

		for (length = side; length > 1; length /= 2, diff /= 2) {
			for (depth = 0; depth < side; depth += length) {
				for (width = 0; width < side; width += length) {
					halfDepth = depth + (length / 2);
					halfWidth = width + (length / 2);

					heights[halfDepth * (side + 1) + halfWidth] = (
						heights[depth * (side + 1) + width] +
						heights[depth * (side + 1) + width + length] +
						heights[(depth + length) * (side + 1) + width] +
						heights[(depth + length) * (side + 1) + width + length]
					) / 4 + (rand.random() * 2 * diff) - diff;
				}
			}
			for (depth = 0; depth < side; depth += length) {
				for (width = 0; width < side; width += length) {
					//diff = diff * Math.pow(2, -smoothness);

					diamond(width, depth, width, depth + length);
					diamond(width, depth, width + length, depth);
					diamond(width + length, depth, width + length, depth + length);
					diamond(width, depth + length, width + length, depth + length);

					//diff = diff * Math.pow(2, -smoothness);
				}
			}
		}
	};

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

	calculateFrame = function calculateFrame() {
		var movementX,
			movementZ,
			timeNow;

		timeNow = new Date().getTime();

		time = (timeNow - time) / 1000;

		movementX = moveX * time;
		movementZ = moveZ * time;

		modelviewMatrix.translate(movementX, 0, movementZ);

		deslocX += movementX;
		dist += movementZ;

		time = timeNow;
	};

	drawScene = function drawScene() {
		/*jslint bitwise: true*/
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		/*jslint bitwise: false*/

		calculateFrame();

		gl.bindBuffer(gl.ARRAY_BUFFER, terrainVerticesBuffer);
		gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		if (shaderName === "colorfull") {
			gl.bindBuffer(gl.ARRAY_BUFFER, terrainVerticesColorBuffer);
			gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
		}

		setMatrixUniforms();
		gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);
	};

	setCamera = function setCamera() {
		modelviewMatrix = GLMatrix.identity(4);
		modelviewMatrix
			.rotate(90, 1.0, 0.0, 0.0)
			//.rotate(pitch, 1.0, 0.0, 0.0)
			//.rotate(yaw, 0.0, 1.0, 0.0)
			//.rotate(roll, 0.0, 0.0, 1.0)
			.scale(scale, scale, scale)
			.translate(deslocX, deslocY, dist);
	};

	setProjection = function setProjection() {
		perspectiveMatrix = GLMatrix.perspective(angle, 1.0, 0.1, 100.0);
	};

	setMatrixUniforms = function setMatrixUniforms() {
		var pUniform,
			mvUniform,
			szUniform,
			mhUniform;

		pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		gl.uniformMatrix4fv(pUniform, false,
							new Float32Array(perspectiveMatrix.elements));

		mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
		gl.uniformMatrix4fv(mvUniform, false,
							new Float32Array(modelviewMatrix.elements));

		szUniform = gl.getUniformLocation(shaderProgram, "uSize");
		gl.uniform1f(szUniform, size);

		if (shaderName === "heightmap") {
			mhUniform = gl.getUniformLocation(shaderProgram, "uMaxHeight");
			gl.uniform1f(mhUniform, maxHeight);
		}
	};
}());

window.onload = TERRAIN.init;
