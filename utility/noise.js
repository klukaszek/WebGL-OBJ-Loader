// ----------------------------Perlin Noise----------------------------

// This class is based on the Perlin Noise implementation by Joe Iddon
// https://joeiddon.github.io/projects/javascript/perlin.html

class PerlinNoise {
	constructor() {
		this.seed();
		this.intensity = 1.0;

		// Handles how zoomed in the noise is
		// < 1.0 is zoomed in, > 1.0 is zoomed out
		this.scale = 1.0;
	}

	// Clear object memory so we can generate new noise
	seed() {
		this.memory = {};
		this.gradients = {};
	}

	// Get a random vector
	rand_vect() {
		let theta = Math.random() * 2 * Math.PI;
		return {x: Math.cos(theta), y: Math.sin(theta)};
	}

	// Computes the dot product of the distance and gradient vectors.
	dot_prod_grid(x, y, vx, vy) {
		let g_vect;
		let d_vect = {x: x - vx, y: y - vy};
		if (this.gradients[[vx, vy]]){
			g_vect = this.gradients[[vx, vy]];
		} else {
			g_vect = this.rand_vect();
			this.gradients[[vx, vy]] = g_vect;
		}
		return (d_vect.x * g_vect.x + d_vect.y * g_vect.y);
	}

	// Smooth fade between cells
	smootherstep(x) {
		return 6*x**5 - 15*x**4 + 10*x**3;
	}

	// Interpolate between values
	interp(x, a, b) {
		return a + this.smootherstep(x) * (b-a);
	}

	// Get the noise value at a given point
	get(x, y) {
		if (this.memory.hasOwnProperty([x, y])){
			return this.memory[[x, y]];
		}

        // Rescale the x and y coordinates to zoom in/out on the noise
		x *= this.scale;
		y *= this.scale;

		let x0 = Math.floor(x);
		let y0 = Math.floor(y);

		let x1 = x0 + 1;
		let y1 = y0 + 1;

		// Determine interpolation weights and multiply by the noise intensity
        // The noise intensity will be used to adjust the height of the terrain
		let tl = this.dot_prod_grid(x, y, x0, y0) * this.intensity;
		let tr = this.dot_prod_grid(x, y, x1, y0) * this.intensity;
		let bl = this.dot_prod_grid(x, y, x0, y1) * this.intensity;
		let br = this.dot_prod_grid(x, y, x1, y1) * this.intensity;
		let xt = this.interp(x-x0, tl, tr);
		let xb = this.interp(x-x0, bl, br);
		let v = this.interp(y-y0, xt, xb);
		this.memory[[x, y]] = v;
		return v;
	}

	// Adjust the zoom level of the noise
	setScale(scale) {
		this.scale = scale;
	}

	// Adjust the intensity of the noise
	setIntensity(intensity) {
		this.intensity = intensity;
	}
}