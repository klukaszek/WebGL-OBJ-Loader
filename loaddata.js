
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

	if (local_normals.length === 0) {
		local_normals = normalizeMesh(local_vertices, faces);
	}

	// Generate the vertex, normal, texture, and indices arrays based on the face data from the .obj file
	faces.forEach(face => {
		face.forEach(vertex => {
			const [vertexIndex, textureIndex, normalIndex] = vertex;

			indices.push(vertexCount++);
			vertices.push(...local_vertices[vertexIndex - 1]);

			// If the obj file contains texture coordinates, use them
			if (textureIndex !== undefined && local_textures.length > 0)
				textureCoords.push(...local_textures[textureIndex - 1]);

			// If the obj  file contains normals, use them
			if (normalIndex !== undefined && local_normals.length > 0)
			{
				normals.push(...local_normals[normalIndex - 1]);
			}
			// Otherwise, we use the normals that were calculated relative to the vertices
			// This means that we can use the vertex index to get the normal
			else if (normalIndex === undefined && local_normals.length > 0)
			{
				normals.push(...local_normals[vertexIndex - 1]);
			}
		});
	});

	console.log("Faces: ", faces.length);
	console.log("Vertices: ", vertices);
	console.log("Texture Coords: ", textureCoords.length);
	console.log("Normals: ", normals.length);
	console.log("Indices: ", indices.length);
}

function normalizeMesh(local_vertices, faces) {

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

	console.log("Normals: ", local_normals);

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

	imageData = [];

	console.log("Texture Data: ", textureData);

	// Split the texture data into lines
	let lines =  textureData.split("\n");

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

	// For every RGB value, we need to add an A value of 255
	let tempImageData = [];
	for (let i = 0; i < imageData.length; i += 3) {
		tempImageData.push(imageData[i]);
		tempImageData.push(imageData[i + 1]);
		tempImageData.push(imageData[i + 2]);
		tempImageData.push(255);
	}

	// Set the imageData array to the image data with the alpha values
	imageData = tempImageData;
}

	// return the number of indices in the object
	// this should match the number of values in the indices[] array
function getVertexCount() {
   return(vertexCount);
}

	// vertex positions (x,y,z values)
function loadvertices() {
  return(vertices);
}


	// normals array
function loadnormals() {
   return(normals);
}


	// texture coordinates
function loadtextcoords() {
    return(textureCoords);
}


	// load vertex indices
function loadvertexindices() {
   return(indices);
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

