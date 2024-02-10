# WebGL .OBJ + .PPM Viewer
- Name: Kyle Lukaszek
- ID: 1113798
- Class: CIS*4800
- Assignment: 2

I believe that I have included everything that was requested in the assignment outline. Each of the .obj files in the models2/ directory are loaded with their corresponding .ppm file. The .obj file is loaded into a vertex buffer and the .ppm file is loaded into a texture buffer. The object is then rendered to the screen.

# Description

- To load a model with its texture, the user should click on the HTML Input element and select a .obj file with a .ppm file. The test objects provided for the assignment can also be loaded from the Tweakpane GUI under "Load Testing Models". From this menu, the user can also enable and disable object rotation.

- Loaded objects with no normals are given normals by calculating each face normal given 3 vertices. This is done in the loaddata.js file.

- Current supported textures are P3 and P6 .ppm files. The .ppm file is read in as a string and then parsed into an array of pixel data. The pixel data is then used to create a texture buffer. The texture buffer is then used to create a texture for the object. If the .ppm file is P6, then the pixel data is read in as an array buffer and then parsed into an array of pixel data.

- At the moment, only 1 object can be loaded at a time. However, if I were to refactor the code I would create a class for the object that would contain the vertex and texture buffers, as well as the object's transform. This would allow for multiple objects to be loaded at once given that I update the WebGL instance to handle multiple objects.

# Notes

- I also included a GUI for debugging purposes using the Tweakpane library so I could easily identify any issues. The GUI can be used to look at frame information, vertex count, viewport resolution, camera settings and transform, as well as plane settings. 

- I do not claim to have created Tweakpane, I am only using it for convenience. Tweakpane is the property of Cocopon and is licensed under the MIT license.

- I did all this because I plan on building this into a personal project once I am done with it, and I also just like being able to edit the scene without having to return to my code to change values.

- There is a utility/ directory that contains the Camera class, GUI logic (this should have been a class but I didn't really care because I plan on using another GUI system), and the Tweakpane library JavaScript file (so that I can create the GUI in gui.js).

- On my system the scene runs at my display refresh rate with no dips unless a new object is loading in.