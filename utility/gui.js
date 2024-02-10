// Author: Kyle Lukaszek
// CIS*4800 W24 - Computer Graphics
// Assignment 1

// A GUI javascript file that uses the Tweakpane library to create a GUI using the DOM
// This is for the assignment but I'm also using it for a personal project so it's a bit more than what's required

// I would probably use dear imgui javascript bindings if I was doing this again

// Keep track of the original pane so we can destroy it
let pane = null

// Keep track of the fps and frametime blades so we can update them
let fps_blade = null;
let frametime_blade = null;
let vertex_blade = null;

// Default parameters for the gui pane
const DEFAULT_GUI_PARAMS = {
  pane_settings: {
    opacity: 1,
  },
  viewport_settings: {
    resolution: { x: 1280, y: 720 },
  },
  camera: {
    pos: { x: 0.0, y: 0.0, z: 5.0 },
    // This value is in degrees (converted to radians in camera.js)
    rot: { x: 0.0, y: 0.0, z: 0.0 },
    // This value is in degrees (converted to radians in camera.js)
    fov: 45,
    aspect: 1,
    near: 0.1,
    far: 100,
  },
  model: {
    path: '',
    rotating: false,
  },
}

let gui_params = DEFAULT_GUI_PARAMS;

// Update the gui_params object with the initial camera settings
set_params = (params) => {
  params.viewport_settings.resolution = { x: gl.canvas.clientWidth, y: gl.canvas.clientHeight };
  params.pane_settings.opacity = 1;
  params.camera.pos = { x: camera.eye[0], y: camera.eye[1], z: camera.eye[2] };
  params.camera.rot = { x: camera.angles[0] * 180 / Math.PI, y: camera.angles[1] * 180 / Math.PI, z: camera.angles[2] * 180 / Math.PI };
  params.camera.fov = camera.get_fov() * 180 / Math.PI;
  params.camera.aspect = camera.get_aspect();
  params.camera.near = camera.get_near();
  params.camera.far = camera.get_far();
}

// Initialize the primary gui pane
/**
 * Initialize the primary gui pane
 * @param {*} params See DEFAULT_GUI_PARAMS for an example, or use DEFAULT_GUI_PARAMS by default
 * @returns 
 */
function initGui(params = DEFAULT_GUI_PARAMS) {

  const gui_element = document.querySelector('#gui');
  const viewport_element = document.querySelector('#glcanvas');

  // Check if the GUI div exists
  if (gui_element) {
    const guiStyles = window.getComputedStyle(gui_element);
  } else {
    console.error('GUI element not found. Failed to initialize GUI.');
    return
  }

  // Set gui pane opacity to 1
  gui_element.style.opacity = 1;

  // Update the gui_params object with the initial camera settings
  set_params(params);

  // Top level pane (the one that contains all the other panes)
  pane = new Pane({ container: gui_element, title: 'Settings' });

  // Add fps counter to the top level pane
  fps_blade = pane.addBlade({
    view: 'text',
    label: 'FPS',
    parse: (v) => String(v),
    value: '0.0',
    disabled: true,
  });

  // Add frametime counter to the top level pane
  frametime_blade = pane.addBlade({
    view: 'text',
    label: 'Frame Time (ms)',
    parse: (v) => String(v),
    value: '0.0',
    disabled: true,
  });

  // Track the total number of vertices in the scene
  vertex_blade = pane.addBlade({
    view: 'text',
    label: 'Vertex Count',
    parse: (v) => String(v),
    value: '0',
    disabled: true,
  });

  // Always include the pane_settings pane
  // Store all blades we create for the pane_settings folder
  let pane_settings = initPaneSettings(pane, gui_element, params);

  // Always include the viewport_settings pane
  // Store all blades we create for the viewport_settings folder
  let viewport_settings = initViewportSettings(pane, viewport_element, params);

  // Always include the camera_settings pane
  // Store all blades we create for the camera_settings folder
  let camera_settings = initCameraSettings(pane, params);


  // Load a model from a list of pre-defined models
  const model_settings = initModelSettings(pane, params);

  return { pane, params };
}

/**
 * Return gui object for the "Pane Settings" folder
 * @param {Pane} pane Root pane 
 * @param {*} params GUI Parameter object
 * @returns {Object} camera_settings
 */
function initPaneSettings(pane, gui_element, params = DEFAULT_GUI_PARAMS) {
  // Keep track of all the blades we create for this pane.
  // Blades will be in the order they are added to the array (includes the folder blade itself)
  let blades = []

  // Add a pane folder (subsection)
  const pane_settings = pane.addFolder({ view: 'folder', title: 'Pane Settings', expanded: false });

  blades.push(pane_settings);

  // Manage pane opacity
  const adjust_opacity = pane_settings.addBinding(params.pane_settings, 'opacity', {
    label: 'Pane Opacity',
    min: 0.25,
    max: 1,
  });
  adjust_opacity.on('change', (ev) => {
    gui_element.style.opacity = ev.value;
  });

  blades.push(adjust_opacity)

  // Reset GUI if someone clicks the reset button
  const reset_btn = pane_settings.addButton({
    title: 'Reset Pane',
  });

  // Dispose pane and create a new one
  reset_btn.on('click', () => {
    // Destroy the old pane
    pane.dispose();

    // Create a new pane
    initGui(gui_params);
  });

  blades.push(reset_btn)

  return { pane_settings, blades };
}

/**
 * Return gui object for the "Viewport Settings" folder
 * @param {Pane} pane Root pane 
 * @param {*} params GUI Parameter object
 * @returns {Object} camera_settings
 */
function initViewportSettings(pane, viewport_element, params = DEFAULT_GUI_PARAMS) {
  // Keep track of all the blades we create for this pane.
  // Blades will be in the order they are added to the array (includes the folder blade itself)
  let blades = []

  // Add a viewport settings folder
  const viewport_settings = pane.addFolder({ view: 'folder', title: 'Viewport Settings', expanded: false });
  blades.push(viewport_settings);

  // Manage viewport width and height as vec2
  const adjust_resolution = newBindingBlade(
    viewport_settings,
    'resolution',
    params.viewport_settings,
    {
      label: 'Resolution',
      x: { min: 4, max: screen.width },
      y: { min: 4, max: screen.height, inverted: true },
      expanded: false,
    },
    (ev) => {
      viewport_element.clientWidth = ev.value.x;
      viewport_element.clientHeight = ev.value.y;

      viewport_element.width = ev.value.x;
      viewport_element.height = ev.value.y;

      console.log(params.viewport_settings.resolution);

      if (ev.last) {
        // The things that depend on the resolution are updated here
        ar = gl.canvas.clientWidth / gl.canvas.clientHeight;
        camera.set_aspect(ar);
        params.camera.aspect = ar;

        // Reinitialize the buffers
        initBuffers(gl);
        
        // Adjust the viewport to the new resolution so that everything is scaled properly
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
      }
    },
  );

  blades.push(adjust_resolution)

  return { viewport_settings };
}

/**
 * Return gui object for the "Camera Settings" folder
 * @param {Pane} pane Root pane 
 * @param {*} params GUI Parameter object
 * @returns {Object} camera_settings
 */
function initCameraSettings(pane, params = DEFAULT_GUI_PARAMS) {

  let blades = []

  const camera_settings = pane.addFolder({ view: 'folder', title: 'Camera Settings', expanded: false });
  blades.push(camera_settings);

  // Manage camera transform as subfolder of camera_settings
  {
    const camera_transform = camera_settings.addFolder({ view: 'folder', title: 'Camera Transform', expanded: false });

    // Manage camera position as vec3
    const adjust_position = newBindingBlade(
      camera_transform,
      'pos',
      params.camera,
      {
        label: 'Camera Position',
        x: { min: -20, max: 20 },
        y: { min: -20, max: 20 },
        z: { min: -20, max: 20 },
      },
      (ev) => {
        camera.truck(ev.value.x - camera.eye[0]);
        camera.eye[0] = ev.value.x;

        camera.pedestal(ev.value.y - camera.eye[1]);
        camera.eye[1] = ev.value.y;

        camera.dolly(ev.value.z - camera.eye[2]);
        camera.eye[2] = ev.value.z;
      },
    );

    // Manage camera rotation as vec3
    const adjust_rotation = newBindingBlade(
      camera_transform,
      'rot',
      params.camera,
      {
        label: 'Camera Rotation',
        x: { min: -360, max: 360 },
        y: { min: -360, max: 360 },
        z: { min: -360, max: 360 },
      },
      (ev) => {

        // Rotate the camera around the x axis
        {
          // Convert the slider value to radians
          const angleInRadians = (ev.value.x * (2 * Math.PI)) / 360;

          // Normalize the angle to the range [-2PI, 2PI]
          const normalizedAngle = ((angleInRadians % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI) - 2 * Math.PI;
          
          //Apply tilt
          camera.tilt((normalizedAngle) - camera.angles[0]);
          camera.angles[0] = (normalizedAngle);
        }

        // Rotate the camera around the y axis
        {
          // Convert the slider value to radians
          const angleInRadians = (ev.value.y * (2 * Math.PI)) / 360;

          // Normalize the angle to the range [-2PI, 2PI]
          const normalizedAngle = ((angleInRadians % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI) - 2 * Math.PI;
          
          // Apply pan 
          camera.pan((normalizedAngle) - camera.angles[1]);
          camera.angles[1] = (normalizedAngle);
        }

        // Rotate the camera around the z axis
        {
          // Convert the slider value to radians
          const angleInRadians = (ev.value.z * (2 * Math.PI)) / 360;

          // Normalize the angle to the range [-2PI, 2PI]
          const normalizedAngle = ((angleInRadians % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI) - 2 * Math.PI;
          
          camera.cant((normalizedAngle) - camera.angles[2]);
          camera.angles[2] = (normalizedAngle);
        }
      },
    );

    const pos1_btn = camera_settings.addButton({ title: 'Default Camera' });
    pos1_btn.on('click', () => {
        camera.eye = vec3.fromValues(0, 0, 3);

        // Rotate the camera around the x axis
        camera.tilt(0 - camera.angles[0]);
        camera.angles[0] = 0;

        // Rotate the camera around the y axis
        camera.pan(0 - camera.angles[1]);
        camera.angles[1] = 0;

        // Rotate the camera around the z axis
        camera.cant(0 - camera.angles[2]);
        camera.angles[2] = 0;

        camera.update();
        set_params(params);
        pane.refresh();
    });

    const pos2_btn = camera_settings.addButton({ title: 'Angled Camera' });
    pos2_btn.on('click', () => {
        camera.eye = vec3.fromValues(0, 2, 2);

        // Rotate the camera around the x axis
        camera.tilt(-Math.PI / 4 - camera.angles[0]);
        camera.angles[0] = -Math.PI / 4;

        // Rotate the camera around the y axis
        camera.pan(0 - camera.angles[1]);
        camera.angles[1] = 0;

        // Rotate the camera around the z axis
        camera.cant(0 - camera.angles[2]);
        camera.angles[2] = 0;
        camera.update();

        set_params(params);
        pane.refresh();
    });    
  }

  const pos3_btn = camera_settings.addButton({ title: 'Top Down Camera' });
  pos3_btn.on('click', () => {
      camera.eye = vec3.fromValues(0, 7, 0);

      // Rotate the camera around the x axis
      camera.tilt(-Math.PI/2 - camera.angles[0]);
      camera.angles[0] = -Math.PI/2;

      // Rotate the camera around the y axis
      camera.pan(0 - camera.angles[1]);
      camera.angles[1] = 0;

      // Rotate the camera around the z axis
      camera.cant(0 - camera.angles[2]);
      camera.angles[2] = 0;
      
      //camera.update();
      set_params(params);
      pane.refresh();
  });

  // Manage camera view settings as subfolder of camera_settings
  {
    const camera_view = camera_settings.addFolder({ view: 'folder', title: 'Camera View', expanded: false });

    // Manage camera fov
    const adjust_fov = newBindingBlade(
      camera_view,
      'fov',
      params.camera,
      {
        label: 'Field of View',
        min: 0,
        max: 120,
      },
      (ev) => {
        camera.set_fov(ev.value);
      },
    );

    // Adjust camera aspect
    const adjust_aspect = newBindingBlade(
      camera_view,
      'aspect',
      params.camera,
      {
        label: 'Aspect Ratio',
        min: 0,
        max: 2,
      },
      (ev) => {
        camera.set_aspect(ev.value);
      },
    );

    // Manage camera near
    const adjust_near = newBindingBlade(
      camera_view,
      'near',
      params.camera,
      {
        label: 'Camera Near',
        min: 0,
        max: 100,
      },
      (ev) => {
        camera.set_near(ev.value);
      },
    );

    // Manage camera far
    const adjust_far = newBindingBlade(
      camera_view,
      'far',
      params.camera,
      {
        label: 'Camera Far',
        min: 0,
        max: 100,
      },
      (ev) => {
        camera.set_far(ev.value);
      },
    );
  }

  return { camera_settings };
}

// This entire function exists just to make testing easier on github pages.
// Not needed for the assignment
function initModelSettings(pane, params = DEFAULT_GUI_PARAMS) {

  const model_settings = pane.addFolder({ view: 'folder', title: 'Load Testing Models', expanded: false });

  // Manage model selection
  const model_select = model_settings.addBlade({
    view: 'list',
    label: 'Model List',
    options: [
      {text: 'Bat', value: '../models2/bat'},
      {text: 'Cube', value: '../models2/cube'},
      {text: 'Cow', value: '../models2/cow'},
      {text: 'Fish', value: '../models2/fish'},
    ],
    value: '',
  })

  // Set the state to not loaded, and then load the model and texture into memory
  // The button to set the model will be disabled until the model and texture are loaded
  model_select.on('change', async (ev) => {
    
    let path = ev.value;

    // Load the model
    await fetch(path + '.obj')
      .then(loaded = false)     // Set the state to not loaded to pause the render loop
      .then(response => response.text())  // Get the text from the response
      .then(text => initGeometry(text))  // Initialize the geometry
      .catch(err => console.error(err));

    //Load the texture
    await fetch(path + '.ppm')
      .then(response => response.text())
      .then(text => initTexture(text))
      .then(() => {
        // Initialize the buffers and the texture for the glcontext
        initAll();
        // Resume the render loop
        loaded = true;
      })
      .catch(err => console.error(err));
    
    params.model.path = path;
  });

  // Manage plane rotation
  const adjust_rotation = newBindingBlade(
    model_settings,
    'rotating',
    params.model,
    {
      label: 'Rotate Model',
    },
    (ev) => {
      params.model.rotating = ev.value;
      modelRotating = params.model.rotating;
    },
  );

  return { model_settings };
}

/**
 * Create a binding "Blade" that is bound to the given parameters
 * @param {Pane} blade parent node
 * @param {str} param_binding keyword for the parameter to bind to
 * @param {object} params object containing the relevant parameter
 * @param {} new_params child parameters to be passed to the new blade
 * @param {*} callback on change callback
 * @param {*} type type of callback ('change', 'click') (default: 'change')
 * @returns 
 */
const newBindingBlade = (blade, param_binding, params, new_params, callback, type = 'change') => {
  const new_blade = blade.addBinding(params, param_binding, new_params);

  new_blade.on(type, callback);

  return new_blade;
}

/**
 * Update any scene info that is displayed in the GUI (FPS, frametime, vertex count)
 * @param {*} deltaTime 
 */
const guiUpdateSceneInfo = (fps, frametime) => {
  fps_blade.value = String(Math.trunc(fps));
  frametime_blade.value = String(frametime.toFixed(2));
  vertex_blade.value = String(getVertexCount());
}