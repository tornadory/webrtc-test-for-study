function ArMarker( o )
{
  //define a public variable
  this.pattern = null;
  this.matrixId = 0;
  this.width = 1;
  this.deactivationTime=0.25;
  this.shadow = true;
  this.shadowStrength = 0.5;
  this.shadowMaterial = null;


  //call configure if the components recibe a state in the constructor
  if(o)
    this.configure(o)
}

ArMarker["@shadowStrength"] = { widget: "slider", min:0, max:1, step:0.1, precision:0 };


ArMarker.prototype.hideChildren = function () {
    //for (var i = 0; i < this.entity.children.length; i++) {
    //    this.entity.children[i].enabled = false;
    //}
};

ArMarker.prototype.showChildren = function () {
    //for (var i = 0; i < this.entity.children.length; i++) {
    //    this.entity.children[i].enabled = true;
    //}
};

ArMarker.prototype.createShadow = function () {
    //if (!ArMarker.shadowMaterial) {
    //    var material = new pc.StandardMaterial();
    //    material.chunks.lightDiffuseLambertPS = "float getLightDiffuse() { return 1.0; }";
    //    material.chunks.outputAlphaPS = "gl_FragColor.a = dAlpha * (1.0 - dDiffuseLight.r);";
    //    material.diffuse.set(0, 0, 0);
    //    material.specular.set(0, 0, 0);
    //    material.emissive.set(0, 0, 0);
    //    material.opacity = this.shadowStrength;
    //    material.blendType = pc.BLEND_NORMAL;
    //    material.useGammaTonemap = false;
    //    material.useFog = false;
    //    material.useSkybox = false;
    //    material.depthWrite = false;
    //    material.update();
    //
    //    ArMarker.shadowMaterial = material;
    //}

    //this.shadowEntity = new pc.Entity('Shadow');
    //this.shadowEntity.addComponent('model', {
    //    type: 'plane',
    //    castShadows: false
    //});
    //this.shadowEntity.model.material = ArMarker.shadowMaterial;
    //this.shadowEntity.setLocalScale(5, 5, 5);

    //this.entity.addChild(this.shadowEntity);
};

ArMarker.prototype.destroyShadow = function () {
    //if (this.shadowEntity) {
    //    this.entity.removeChild(this.shadowEntity);
    //    this.shadowEntity.destroy();
    //    this.shadowEntity = null;
    //}
};

// initialize code called once per entity
ArMarker.prototype.initialize = function () {
    var self = this;
    //var entity = this.entity;

    //this.active = false;
    //this.markerId = -1;
    //this.markerMatrix = new pc.Mat4();
    //this.portraitRot = new pc.Mat4();
    //this.portraitRot.setFromEulerAngles(180, 0, 90);
    //this.portraitRot.invert();
    //this.landscapeRot = new pc.Mat4();
    //this.landscapeRot.setFromEulerAngles(180, 0, 0);
    //this.landscapeRot.invert();
    //this.finalMatrix = new pc.Mat4();

    //this.lastSeen = -1;

    this.app.on('trackinginitialized', function (arController) {
        if (self.pattern) {
            arController.loadMarker(self.pattern.getFileUrl(), function (markerId) {
                self.markerId = markerId;
            });
        }
        arController.addEventListener('getMarker', function (ev) {
            var data = ev.data;
            var type = data.type;
            var marker = data.marker;
            if ((self.pattern && type === artoolkit.PATTERN_MARKER && marker.idPatt === self.markerId) ||
                (!self.pattern && type === artoolkit.BARCODE_MARKER && marker.idMatrix === self.matrixId)) {
                // Set the marker entity position and rotation from ARToolkit
                self.markerMatrix.data.set(data.matrix);
                if (arController.orientation === 'portrait') {
                    self.finalMatrix.mul2(self.portraitRot, self.markerMatrix);
                } else {
                    self.finalMatrix.mul2(self.landscapeRot, self.markerMatrix);
                }
                entity.setPosition(self.finalMatrix.getTranslation());
                entity.setEulerAngles(self.finalMatrix.getEulerAngles());

                if (self.width > 0)
                    entity.setLocalScale(1 / self.width, 1 / self.width, 1 / self.width);

                // Z points upwards from an ARToolkit marker so rotate it so Y is up
                entity.rotateLocal(90, 0, 0);

                self.lastSeen = Date.now();
                if (!self.active) {
                    self.showChildren();
                    self.active = true;
                }
            }
        });
    });

    if (this.shadow) {
        this.createShadow();
    }

    //////////////////////////////
    // Handle attribute changes //
    //////////////////////////////
    this.on('attr:shadow', function (value, prev) {
        if (value)
            this.createShadow();
        else
            this.destroyShadow();
    });

    this.on('attr:shadowStrength', function (value, prev) {
        if (ArMarker.shadowMaterial) {
            ArMarker.shadowMaterial.opacity = this.shadowStrength;
            ArMarker.shadowMaterial.update();
        }
    });

    this.hideChildren();
};

// update code called every frame
ArMarker.prototype.onUpdate = function(dt) {
    if (this.active) {
        var timeSinceLastSeen = (Date.now() - this.lastSeen) / 1000;

        if (timeSinceLastSeen > this.deactivationTime) {
            this.hideChildren();
            this.active = false;
        }
    }
}

ArMarker.prototype.serialize = function()
{
	return {
    pattern: this.pattern,
    matrixId: this.matrixId,
    width: this.width,
    deactivationTime: this.deactivationTime,
    shadow: this.shadow,
    shadowStrength: this.shadowStrength
	 };
}

ArMarker.prototype.configure = function(o)
{
  if(o.pattern !== undefined) //we can control if the parameter exist
    this.pattern = o.pattern;

  if(o.matrixId !== undefined)
    this.matrixId = o.matrixId;

  if(o.width !== undefined)
    this.width = o.width;

  if(o.deactivationTime !== undefined)
    this.deactivationTime = o.deactivationTime;

  if(o.shadow !== undefined)
    this.shadow = o.shadow;

  if(o.shadowStrength !== undefined)
    this.shadowStrength = o.shadowStrength;
}

LS.registerComponent( ArMarker );
