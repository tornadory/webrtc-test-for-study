function ArCamera( o )
{
  //define a public variable
  this.cameraCalibration = null;
  this.detectionMode = 0;
  this.matrixCodeType = 0;
  this.labelingMode=0;
  this.processingMode = 0;
  this.thresholdMode = 0;
  this.threshold = 100;
  this.trackerResolution = 0;
  this.trackAlternateFrames = false;
  this.debugOverlay = false;
  this.videoTexture = false;

  //call configure if the components recibe a state in the constructor
  if(o)
    this.configure(o)
}

ArCamera["@detectionMode"] = { type: "enum", values: ["Color Template","Mono Template","Matrix","Color Template and Matrix","Mono Template and Matrix"] };
ArCamera["@cameraCalibration"] = { type: "resource" };
ArCamera["@matrixCodeType"] = { type: "enum", values: ["3x3","3x3 Hamming 63","3x3 Parity 65","4x4","4x4 BCH 13_9_3","4x4 BCH 13_5_5"] };
ArCamera["@labelingMode"] = { type: "enum", values: ["White Region","Black Region"]};
ArCamera["@processingMode"] = {type: "enum", values: ["Frame","Field"]};
ArCamera["@thresholdMode"] = {type: "enum", values: ["Manual","Auto Median","Auto Otsu","Auto Adaptive"]};
ArCamera["@threshold"] = { widget: "slider", min:0, max:250, step:1, precision:0 };
ArCamera["@trackerResolution"] = {type: "enum", values: ["Full","Three Quarters","Half","Quarter"]};


ArCamera.prototype.useDom = function () {
    //if  (this.entity.model) {
    //    this.entity.removeComponent('model');
    //}

    // Create a video element that is full tab and centered
    // CCS taken from: https://slicejack.com/fullscreen-html5-video-background-css/
    var style = this.video.style;
    style.position = 'absolute';
    style.top = '50%';
    style.left = '50%';
    style.width = 'auto';
    style.height = 'auto';
    style.minWidth = '100%';
    style.minHeight = '100%';
    style.backgroundSize = 'cover';
    style.overflow = 'hidden';
    style.transform = 'translate(-50%, -50%)';
    style.zIndex = '0';
    document.body.appendChild(this.video);

    // Z-order for page is:
    //   0: Video DOM element
    //   1: PlayCanvas canvas element
    //   2: ARToolkit debug canvas
    this.app.graphicsDevice.canvas.style.zIndex = '1';
}

ArCamera.prototype.addVideoToDom = function () {
    var style = this.video.style;
    style.position = 'absolute';
    style.width = '1%';
    style.height = '1%';

    document.body.appendChild(this.video);
}

ArCamera.prototype.useVideoTexture = function () {
    // If the video is already in the DOM, remove it
    //if (this.video.parentElement)
    //    document.body.removeChild(this.video);

    //var device = this.app.graphicsDevice;

    // Create a texture to receive video frames. 888 format seems to achieve best performance.
    //this.texture = new pc.Texture(device, {
    //    format: pc.PIXELFORMAT_R8_G8_B8
    //});
    // Apply a linear filter to avoid pixelation of low resolution video
    //this.texture.magFilter = pc.FILTER_LINEAR;
    //this.texture.minFilter = pc.FILTER_LINEAR;
    //this.texture.setSource(this.video);

    var shader = new pc.Shader(device, {
        attributes: {
            aPosition: pc.SEMANTIC_POSITION
        },
        vshader: [
            "attribute vec2 aPosition;",
            "",
            "uniform vec2 uCanvasSize;",
            "uniform vec2 uVideoSize;",
            "",
            "varying vec2 vUv0;",
            "",
            "void main(void)",
            "{",
            "    vUv0 = aPosition;",
            "    float vw = uVideoSize.x;",
            "    float vh = uVideoSize.y;",
            "    float va = uVideoSize.x / uVideoSize.y;",
            "    float cw = uCanvasSize.x;",
            "    float ch = uCanvasSize.y;",
            "    float ca = uCanvasSize.x / uCanvasSize.y;",
            "    if (ca < va)",
            "    {",
            "        vUv0.x *= ca / va;",
            "    }",
            "    else",
            "    {",
            "        vUv0.y *= va / ca;",
            "    }",
            "    vUv0 *= 0.5;",
            "    vUv0 += 0.5;",
            "    gl_Position = vec4(aPosition, 1.0, 1.0);",
            "}"
        ].join("\n"),
        fshader: [
            "precision " + device.precision + " float;",
            "",
            "varying vec2 vUv0;",
            "",
            "uniform sampler2D uVideoMap;",
            "",
            "void main(void)",
            "{",
            "    gl_FragColor = texture2D(uVideoMap, vUv0);",
            "}"
        ].join("\n")
    });

    // Create the vertex format
    var vertexFormat = new pc.VertexFormat(device, [
        {
            semantic: pc.SEMANTIC_POSITION,
            components: 2,
            type: pc.ELEMENTTYPE_FLOAT32
        }
    ]);

    // Create a vertex buffer
    var vertexBuffer = new pc.VertexBuffer(device, vertexFormat, 4);

    // Fill the vertex buffer
    var vertexData = vertexBuffer.lock();
    var vertexDataF32 = new Float32Array(vertexData);
    vertexDataF32.set([-1, -1, 1, -1, -1, 1, 1, 1]);
    vertexBuffer.unlock();

    //var mesh = new pc.Mesh();
    //mesh.vertexBuffer = vertexBuffer;
    //mesh.primitive[0] = {
    //    type: pc.PRIMITIVE_TRISTRIP,
    //    base: 0,
    //    count: 4,
    //    indexed: false
    //};

    //var material = new pc.Material();
    //material.shader = shader;
    //material.depthTest = false;
    //material.depthWrite = false;
    //material.setParameter('uVideoMap', this.texture);
    //var cw = device.width;
    //var ch = device.height;
    //var vw = this.video.videoWidth;
    //var vh = this.video.videoHeight;
    //material.setParameter('uVideoSize', new Float32Array([vw, vh]));
    //material.setParameter('uCanvasSize', new Float32Array([cw, ch]));

    //var node = new pc.GraphNode();

    //var meshInstance = new pc.MeshInstance(node, mesh, material);

    //var model = new pc.Model();
    //model.graph = node;
    //model.meshInstances = [ meshInstance ];

    //this.entity.addComponent('model', {
    //    type: 'asset',
    //    castShadows: false
    //});
    //this.entity.model.model = model;
}

ArCamera.prototype.onResize = function () {
    if (!this.arController) return;

    //var device = this.app.graphicsDevice;
    //var cw = device.width;
    //var ch = device.height;
    //var vw = this.video.videoWidth;
    //var vh = this.video.videoHeight;

    // Resize the video texture
    //if (this.entity.model && this.entity.model.model) {
    //    var material = this.entity.model.model.meshInstances[0].material;
    //    material.setParameter('uVideoSize', new Float32Array([vw, vh]));
    //    material.setParameter('uCanvasSize', new Float32Array([cw, ch]));
    //}

    // Resize the 3D camera frustum (via the fov)
    var camMatrix = this.arController.getCameraMatrix();
    var fovy = 2 * Math.atan(1 / camMatrix[5]) * 180 / Math.PI;

    this.arController.orientation = (vw < vh) ? 'portrait' : 'landscape';
    //if (vw < vh) {
    //    this.entity.camera.fov = Math.abs(fovy) * (vh / vw);
    //} else {
    //    if (cw / ch > vw / vh) {
            // Video Y FOV is limited so we must limit 3D camera FOV to match
    //        this.entity.camera.fov = Math.abs(fovy) * (vw / vh) / (cw / ch);
    //    } else {
            // Video Y FOV is limited so we must limit 3D camera FOV to match
    //        this.entity.camera.fov = Math.abs(fovy);
    //    }
    //}
}

ArCamera.prototype.startVideo = function () {
    if (this.videoTexture) {
        this.useVideoTexture();

        // NASTY NASTY HACK
        //if (pc.platform.ios)
        //    this.addVideoToDom();
    } else {
        this.useDom();
    }
}

ArCamera.prototype._setDebugMode = function (mode) {
    if (this.arController) {
        this.arController.setDebugMode(mode);

        var canvas = this.arController.canvas;
        if (mode) {
            canvas.style.position = 'absolute';
            canvas.style.zIndex = '2';
            document.body.appendChild(canvas);

            this.arController._bwpointer = this.arController.getProcessingImage();
        } else {
            if (canvas.parentElement) {
                document.body.removeChild(canvas);
            }

            this.arController._bwpointer = null;
        }
    }
}

ArCamera.prototype._setImageProcMode = function (procMode) {
    if (this.arController) {
        switch (procMode) {
            case 0:
                this.arController.setImageProcMode(artoolkit.AR_IMAGE_PROC_FRAME_IMAGE);
                break;
            case 1:
                this.arController.setImageProcMode(artoolkit.AR_IMAGE_PROC_FIELD_IMAGE);
                break;
            default:
                console.error("ERROR: " + procMode + " is an invalid image processing mode.");
                break;
        }
    }
}

ArCamera.prototype._setLabelingMode = function (labelingMode) {
    if (this.arController) {
        switch (labelingMode) {
            case 0:
                this.arController.setLabelingMode(artoolkit.AR_LABELING_WHITE_REGION);
                break;
            case 1:
                this.arController.setLabelingMode(artoolkit.AR_LABELING_BLACK_REGION);
                break;
            default:
                console.error("ERROR: " + labelingMode + " is an invalid labeling mode.");
                break;
        }
    }
}

ArCamera.prototype._setMatrixCodeType = function (matrixCodeType) {
    if (this.arController) {
        switch (matrixCodeType) {
            case 0:
                this.arController.setMatrixCodeType(artoolkit.AR_MATRIX_CODE_3x3);
                break;
            case 1:
                this.arController.setMatrixCodeType(artoolkit.AR_MATRIX_CODE_3x3_HAMMING63);
                break;
            case 2:
                this.arController.setMatrixCodeType(artoolkit.AR_MATRIX_CODE_3x3_PARITY65);
                break;
            case 3:
                this.arController.setMatrixCodeType(artoolkit.AR_MATRIX_CODE_4x4);
                break;
            case 4:
                this.arController.setMatrixCodeType(artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3);
                break;
            case 5:
                this.arController.setMatrixCodeType(artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5);
                break;
            default:
                console.error("ERROR: " + matrixCodeType + " is an invalid matrix code type.");
                break;
        }
    }
}

ArCamera.prototype._setPatternDetectionMode = function (detectionMode) {
    if (this.arController) {
        switch (detectionMode) {
            case 0:
                this.arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_COLOR);
                break;
            case 1:
                this.arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_MONO);
                break;
            case 2:
                this.arController.setPatternDetectionMode(artoolkit.AR_MATRIX_CODE_DETECTION);
                break;
            case 3:
                this.arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX);
                break;
            case 4:
                this.arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX);
                break;
            default:
                console.error("ERROR: " + detectionMode + " is an invalid pattern detection mode.");
                break;
        }
    }
}

ArCamera.prototype._setThreshold = function (theshold) {
    if (this.arController) {
        // Clamp to 0..255 and round down to nearest integer
        theshold = Math.floor(Math.min(Math.max(theshold, 0), 255));
        this.arController.setThreshold(theshold);
    }
}

ArCamera.prototype._setThresholdMode = function (thresholdMode) {
    if (this.arController) {
        switch (thresholdMode) {
            case 0:
                this.arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_MANUAL);
                break;
            case 1:
                this.arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_MEDIAN);
                break;
            case 2:
                this.arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU);
                break;
            case 3:
                this.arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE);
                break;
            default:
                console.error("ERROR: " + thresholdMode + " is an invalid threshold mode.");
                break;
        }
    }
}

ArCamera.prototype._createArController = function (w, h, url) {
    // Load the camera calibration data
    this.cameraParam = new ARCameraParam(url, function () {
        this.arController = new ARController(w * (1 - this.trackerResolution / 4), h * (1 - this.trackerResolution / 4), this.cameraParam);

        // Disable spammy console logging from ARToolkit. See the following for the origin of 4:
        // https://github.com/artoolkit/artoolkit5/blob/master/include/AR/config.h.in#L214
        this.arController.setLogLevel(4);

        this.arController.setProjectionNearPlane(this.entity.camera.nearClip);
        this.arController.setProjectionFarPlane(this.entity.camera.farClip);
        this._setDebugMode(this.debugOverlay);
        this._setImageProcMode(this.processingMode);
        this._setLabelingMode(this.labelingMode);
        this._setMatrixCodeType(this.matrixCodeType);
        this._setPatternDetectionMode(this.detectionMode);
        this._setThreshold(this.threshold);
        this._setThresholdMode(this.thresholdMode);

        this.onResize();

        // Notify all markers that tracking is initialized
        //this.app.fire('trackinginitialized', this.arController);
    }.bind(this));
}

ArCamera.prototype._destroyArController = function () {
    // Tear down tracking resources
    if (this.arController) {
        this.arController.dispose();
        this.arController = null;
    }

    if (this.cameraParam) {
        this.cameraParam.dispose();
        this.cameraParam = null;
    }
}

ArCamera.prototype.startTracking = function () {
    var url = this.cameraCalibration.getFileUrl();
    //console.log(url);
    this._createArController(this.video.videoWidth, this.video.videoHeight, url);
}

ArCamera.prototype.stopTracking = function () {
    this._destroyArController();
}

ArCamera.prototype.supportsAr = function () {
    return (navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

ArCamera.prototype.enterAr = function (success, error) {
    if (!this.cameraCalibration) {
        console.error('ERROR: No camera calibration file set on your arCamera script. Try assigning camera_para.dat.');
    }

    var self = this;

    var constraints = {
        audio: false,
        video: {
            // Prefer the rear camera
            facingMode: "environment"
        }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        self.videoPlaying = false;

        // Create the video element to receive the camera stream
        var video = document.createElement('video');

        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        // This is critical for iOS or the video initially goes fullscreen
        video.setAttribute('playsinline', '');
        video.srcObject = stream;

        self.video = video;

        // Check for both video and canvas resizing
        // Changing screen orientation on mobile can change both!
        //self.app.graphicsDevice.on('resizecanvas', function () {
        //    self.onResize();
        //});
        video.addEventListener('resize', function () {
            self.onResize();
        });

        // Only play the video when it's actually ready
        video.addEventListener('canplay', function () {
            if (!self.videoPlaying) {
                self.startVideo();
                self.startTracking();
                self.videoPlaying = true;
                if (success) success();
            }
        });

        // iOS needs a user action to start the video
        //if (pc.platform.mobile) {
        //    window.addEventListener('touchstart', function (e) {
        //        e.preventDefault();
        //        if (!self.videoPlaying) {
        //            self.startVideo();
        //            self.startTracking();
        //            self.videoPlaying = true;
        //            if (success) success();
        //        }
        //    });
        //}
    }).catch(function (e) {
        if (error) error("ERROR: Unable to acquire camera stream");
    });
}

ArCamera.prototype.exitAr = function () {
    // Tear down video resources
    if (this.video) {
        this.video.stop();
        if (this.video.parentElement) {
            document.body.removeChild(this.video);
        }
    }
}

//we bind the events once this component gets attached to a scene
ArCamera.prototype.onAddedToScene = function(scene)
{
	LEvent.bind( scene, "update", this.onUpdate, this );
}

//and remove the events once it is detached
ArCamera.prototype.onRemovedFromScene = function(scene)
{
	LEvent.unbindAll( scene, this );
}

//This will be called every time the update method is launched because we bound it that way
ArCamera.prototype.onUpdate = function(e,dt)
{
  if (this.arController) {
        // Update the tracking
        if (this.trackAlternateFrames) {
            if (this.process) {
                this.arController.process(this.video);
            }
            this.process = !this.process;
       } else {
            this.arController.process(this.video);
       }

        // If we're displaying video via a texture, copy the video frame into the texture
        if (this.videoTexture && this.texture) {
            this.texture.upload();
        }
    }
}

//in this case we dont need to do a serialize method but just to show how it is done
ArCamera.prototype.serialize = function()
{
	return {
    cameraCalibration: this.cameraCalibration,
    detectionMode: this.detectionMode,
    matrixCodeType: this.matrixCodeType,
    labelingMode: this.labelingMode,
    processingMode: this.processingMode,
    thresholdMode: this.thresholdMode,
    threshold: this.threshold,
    trackerResolution: this.trackerResolution,
    trackAlternateFrames: this.trackAlternateFrames,
    debugOverlay: this.debugOverlay,
    videoTexture: this.videoTexture
	 };
}

ArCamera.prototype.configure = function(o)
{
  if(o.cameraCalibration !== undefined) //we can control if the parameter exist
    this.cameraCalibration = o.cameraCalibration;

  if(o.detectionMode !== undefined)
    this.detectionMode = o.detectionMode;

  if(o.matrixCodeType !== undefined)
    this.matrixCodeType = o.matrixCodeType;

  if(o.labelingMode !== undefined)
    this.labelingMode = o.labelingMode;

  if(o.processingMode !== undefined)
    this.processingMode = o.processingMode;

  if(o.thresholdMode !== undefined)
    this.thresholdMode = o.thresholdMode;

  if(o.threshold !== undefined)
    this.threshold = o.threshold;

  if(o.trackerResolution !== undefined)
    this.trackerResolution = o.trackerResolution;

  if(o.trackAlternateFrames !== undefined)
    this.trackAlternateFrames = o.trackAlternateFrames;

  if(o.debugOverlay !== undefined)
    this.debugOverlay = o.debugOverlay;

  if(o.videoTexture !== undefined)
    this.videoTexture = o.videoTexture;
}

//Add this component to the components pool in the system
LS.registerComponent( ArCamera );
