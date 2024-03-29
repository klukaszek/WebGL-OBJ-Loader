
/* -the functions which return the 3D vertices, normals, indices to
   the WebGL program
   -image array structure and variables
*/

// flag indicating that data has been loaded
let loaded = false;

// global variables for image data, size, and depth
// you may not need all of these variables
let imageData = [];
let imageHeight = 0;
let imageWidth = 0;
let imageDepth = 0;

// global geometry arrays
let vertices = [];
let indices = [];
let normals = [];
let vertexCount = 0;
let textureCoords = [];

// create geometry which will be drawn by WebGL
// create vertex, normal, texture, and index information
function initGeometry(objFile) {

	console.log("Loading geometry from .obj file");

	// Reset the geometry arrays to empty if they are not already
	// This is to ensure that the geometry arrays are empty if the user loads a new .obj file
	vertices = [];
	indices = [];
	normals = [];
	textureCoords = [];
	vertexCount = 0;

	// Load the .obj file and create the vertex, normal, texture, and faces arrays
	let local_vertices = [];
	let local_textures = [];
	let local_normals = [];
	let faces = [];

	// Get the lines of the .obj file
	const lines = objFile.split('\n');

	// For each line in the .obj file, parse the line and create the vertex, normal, texture, and faces arrays
	lines.forEach(line => {
		const parts = line.trim().split(/\s+/);
		const prefix = parts.shift();

		// Load the vertex, normal, texture, and face data
		if (prefix === 'v') {
			local_vertices.push(parts.map(parseFloat));
		} else if (prefix === 'vt') {
			// Here we cannot use map since we need to flip the y value of the texture coordinates
			let vt1 = parseFloat(parts[0]);
			let vt2 = 1.0 - parseFloat(parts[1]);
			local_textures.push([vt1, vt2]);
		} else if (prefix === 'vn') {
			local_normals.push(parts.map(parseFloat));
		} else if (prefix === 'f') {
			const faceData = parts.map(vertex => {
				const indices = vertex.split('/');
				return indices.map(index => index ? parseInt(index) : 0);
			});

			// Ensure proper winding order (counter-clockwise)
			if (faceData.length >= 3 && local_normals.length > 0) {
				const v0 = local_vertices[faceData[0][0] - 1];
				const v1 = local_vertices[faceData[1][0] - 1];
				const v2 = local_vertices[faceData[2][0] - 1];
				const crossProduct = vec3.cross([], vec3.subtract([], v1, v0), vec3.subtract([], v2, v0));
				// If the cross product is pointing in the opposite direction of the normal, reverse the face data
				if (vec3.dot(crossProduct, local_normals[faceData[0][2] - 1]) < 0) {
					faceData.reverse();
				}
			}

			// Add the face data to the faces array
			faces.push(faceData);
		}
	});

	// If the obj file does not contain normals, calculate the normals based on the vertices
	if (local_normals.length === 0) {
		local_normals = calculateMeshNormals(local_vertices, faces);
	}

	// Generate the vertex, normal, texture, and indices arrays based on the face data from the .obj file
	faces.forEach(face => {
		face.forEach(vertex => {
			const [vertexIndex, textureIndex, normalIndex] = vertex;

			// Our indices should just be an array of numbers from 0 to the number of vertices
			indices.push(vertexCount++);

			// Add the corresponding face vertices to the vertices array
			// We subtract 1 from the vertex index since the .obj file indices are 1-based
			vertices.push(...local_vertices[vertexIndex - 1]);

			// If the obj file contains texture coordinates, use them
			if (textureIndex !== undefined && local_textures.length > 0)
				textureCoords.push(...local_textures[textureIndex - 1]);

			// If the obj  file contains normals, use them
			if (normalIndex !== undefined && local_normals.length > 0) {
				normals.push(...local_normals[normalIndex - 1]);
			}
			// Otherwise, we use the normals that were calculated relative to the vertices
			// This means that we can use the vertex index to get the normal
			else if (normalIndex === undefined && local_normals.length > 0) {
				normals.push(...local_normals[vertexIndex - 1]);
			}
		});
	});
}

/**
 * Calculate the normals for the vertices of a mesh based on the faces
 * @param {*} local_vertices 
 * @param {*} faces 
 * @returns face normals
 */
function calculateMeshNormals(local_vertices, faces) {
	// Create an array to store the normals for each vertex, and initialize them to [0, 0, 0]
	let local_normals = new Array(faces.length).fill([0, 0, 0]);

	// Determine the normals for each face and add them to the corresponding vertices
	faces.forEach(face => {
		const vertex1 = local_vertices[face[0][0] - 1];
		const vertex2 = local_vertices[face[1][0] - 1];
		const vertex3 = local_vertices[face[2][0] - 1];

		// Determine the normal for the face
		const normal = calculateNormal(vertex1, vertex2, vertex3);

		face.forEach(vertex => {
			const vertexIndex = vertex[0] - 1;
			local_normals[vertexIndex] = vec3.add([], local_normals[vertexIndex], normal);
		});
	});

	// Normalize the normals
	local_normals.forEach(normal => {
		normal = vec3.normalize(normal, normal);
	});

	return local_normals;
}

/**
 * Calculate the normal for a given triangle defined by three vertices
 * @param {*} vertex1 
 * @param {*} vertex2 
 * @param {*} vertex3 
 * @returns {vec3} The normal for the triangle defined by the three vertices
 */
function calculateNormal(vertex1, vertex2, vertex3) {
	const vector1 = vec3.subtract([], vertex2, vertex1);
	const vector2 = vec3.subtract([], vertex3, vertex1);
	const normal = vec3.cross([], vector1, vector2);
	return normal;
}


function initTexture(textureData) {
	// Reset the image data array to empty if it is not already
	imageData = [];

	// Check if the texture data is in the P3 or P6 format
	if (textureData.startsWith("P3")) {
		// Parse the ASCII .ppm file
		parseP3PPM(textureData);
	} else if (textureData.startsWith("P6")) {
		// Parse the binary .ppm file
		parseP6PPM(textureData);
	}
}

// Parse a PPM file with the P3 ASCII format
function parseP3PPM(str) {
	// Split the texture data into lines
	let lines = str.split("\n");

	// Skip the first line of the .ppm file
	lines = lines.slice(1);

	// Skip any comments in the .ppm file
	lines = lines.filter(line => !line.startsWith("#"));

	// Remove any empty lines
	lines = lines.filter(line => line != "");

	// Split the lines into tokens
	let tokens = lines.map(line => line.split(/[ ,]+/));

	// Flatten the tokens array
	tokens = tokens.flat();

	// Get the width and height of the image
	imageWidth = parseInt(tokens[0]);
	imageHeight = parseInt(tokens[1]);

	// Get max colour value
	imageDepth = parseInt(tokens[2]);

	// Remove the first three elements from the tokens array
	tokens = tokens.slice(3);

	// The remaining tokens are the image data, so we can set the imageData array to the tokens array
	// Convert the tokens array to an integer array
	tokens = tokens.map(token => parseInt(token));
	imageData = tokens;

	// Set the imageData array to the image data with the alpha values
	rgbaData = convertToRGBA(imageData);
	imageData = rgbaData;
}

// Parse a PPM file with the P6 binary format
function parseP6PPM(str) {

	// Convert the string to an ArrayBuffer
	const buffer = new ArrayBuffer(str.length);
	const bufferView = new Uint8Array(buffer);
	for (let i = 0; i < str.length; i++) {
		bufferView[i] = str.charCodeAt(i);
	}

	// Create a DataView from the buffer ()
	// I originally tried to read from the buffer directly, but it was not working
	// I found that DataView was a better way to read from the buffer
	const dataView = new DataView(buffer);

	// Parse the header of the .ppm file
	let offset = 3; // Skip "P6\n"
	let width = "";
	let height = "";
	let maxColorValue = "";
	let nextChar;

	// Skip anything that is a new line (10) or a comment (35)
	while (dataView.getUint8(offset) === 10 || dataView.getUint8(offset) === 35) {
		while (dataView.getUint8(offset++) !== 10);
	}

	// Parse width
	// Read until we reach a space character (32)
	while ((nextChar = dataView.getUint8(offset++)) !== 32) {
		width += String.fromCharCode(nextChar);
	}

	// Parse height
	// Read until we reach a new line character (10)
	while ((nextChar = dataView.getUint8(offset++)) !== 10) {
		height += String.fromCharCode(nextChar);
	}

	// Skip max color value
	// Read until we reach a new line character (10)
	while (dataView.getUint8(offset++) !== 10) {
		maxColorValue += String.fromCharCode(nextChar);
	}

	// Set the width and height of the image
	imageWidth = parseInt(width);
	imageHeight = parseInt(height);
	imageDepth = parseInt(maxColorValue);

	// Get the image data
	const dataSize = imageWidth * imageHeight * 3;
	imageData = new Uint8Array(buffer, offset, dataSize);

	// Set the imageData array to the image data with the alpha values
	rgbaData = convertToRGBA(imageData);
	imageData = rgbaData
}

function convertToRGBA(imageData) {
	// For every RGB value, we need to add an A value of 255
	let tempImageData = [];
	for (let i = 0; i < imageData.length; i += 3) {
		tempImageData.push(imageData[i]);
		tempImageData.push(imageData[i + 1]);
		tempImageData.push(imageData[i + 2]);
		tempImageData.push(255);
	}
	return tempImageData;
}

/**
 * Calculate the new vertex positions after rotating the vertices by the given angle
 * This function is rather inefficient, but it works
 * @param {*} rotationAngle Angle in radians to rotate the vertices by
 * @returns 
 */
function rotateVertices(rotationAngle) {
    const rotationMatrix = mat4.create();

	// Rotate rotationMatrix around the y axis
    mat4.rotate(rotationMatrix, rotationMatrix, rotationAngle, [0, 1, 0]);

    // Iterate over each vertex and apply the rotation
    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = vertices.slice(i, i + 3); // Extract [x, y, z] for each vertex
        vec3.transformMat4(vertex, vertex, rotationMatrix);
        vertices[i] = vertex[0];
        vertices[i + 1] = vertex[1];
        vertices[i + 2] = vertex[2];
    }
}

// return the number of indices in the object
// this should match the number of values in the indices[] array
function getVertexCount() {
	return (vertexCount);
}

// vertex positions (x,y,z values)
function loadvertices() {
	return (vertices);
}


// normals array
function loadnormals() {
	return (normals);
}


// texture coordinates
function loadtextcoords() {
	return (textureCoords);
}


// load vertex indices
function loadvertexindices() {
	return (indices);
}

// texture array size and data
// these should return the size of the image in the .ppm file
function loadwidth() {
	return imageWidth;
}

function loadheight() {
	return imageHeight;
}

// using a fixed texture map to colour object
// this should be changed to return the data from the .ppm file
function loadtexture() {
	return (new Uint8Array(imageData));
}

