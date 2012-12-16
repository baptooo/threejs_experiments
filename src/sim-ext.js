// Sim.js - A Simple Simulator for WebGL (based on Three.js)

Ext.ns('Sim')

// Sim.Publisher - base class for event publishers
Sim.Publisher = Ext.extend(Object, {
	constructor: function(config) {
		Ext.apply(this, config || {});
		
		this.messageTypes = {};
	},
	
	subscribe: function(message, subscriber, callback) {
	    var subscribers = this.messageTypes[message];
	    if (subscribers)
	    {
	        if (this.findSubscriber(subscribers, subscriber) != -1)
	        {
	            return;
	        }
	    }
	    else
	    {
	        subscribers = [];
	        this.messageTypes[message] = subscribers;
	    }
	
	    subscribers.push({ subscriber : subscriber, callback : callback });
	},
	
	unsubscribe:  function(message, subscriber, callback) {
	    if (subscriber) {
	        var subscribers = this.messageTypes[message];
	
	        if (subscribers)
	        {
	            var i = this.findSubscriber(subscribers, subscriber, callback);
	            if (i != -1)
	            {
	                this.messageTypes[message].splice(i, 1);
	            }
	        }
	    }
	    else
	    {
	        delete this.messageTypes[message];
	    }
	},
	
	publish: function(message) {
	    var subscribers = this.messageTypes[message];
	
	    if (subscribers)
	    {
	        for (var i = 0; i < subscribers.length; i++)
	        {
	            var args = [];
	            for (var j = 0; j < arguments.length - 1; j++)
	            {
	                args.push(arguments[j + 1]);
	            }
	            subscribers[i].callback.apply(subscribers[i].subscriber, args);
	        }
	    }
	},
	
	findSubscriber: function (subscribers, subscriber) {
	    for (var i = 0; i < subscribers.length; i++)
	    {
	        if (subscribers[i] == subscriber)
	        {
	            return i;
	        }
	    }
	    
	    return -1;
	}
});

Sim.App = Ext.extend(Sim.Publisher, {
	renderer: null,
	scene: null,
	camera: null,
	objects: null,
	
	constructor: function() {
		Sim.App.superclass.constructor.apply(this, arguments);
		
		var me = this;
		me.objects = [];
		
		var container = me.container;
		var canvas = me.canvas;
		
		var renderer = me.forceCanvas ? 'CanvasRenderer' : 'WebGLRenderer';
		
	    // Create the Three.js renderer, add it to our div
	    var renderer = new THREE[renderer]( { antialias: true, canvas: canvas } );
	    renderer.setSize(container.offsetWidth, container.offsetHeight);
	    container.appendChild( renderer.domElement );
	
	    // Create a new Three.js scene
	    var scene = new THREE.Scene();
	    scene.add( new THREE.AmbientLight( 0x505050 ) );
	    scene.data = me;
	
	    // Put in a camera at a good default location
	    camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 10000 );
	    camera.position.set( 0, 0, 3.3333 );
	
	    scene.add(camera);
	    
	    // Create a root object to contain all other scene objects
	    var root = new THREE.Object3D();
	    scene.add(root);
	    
	    // Create a projector to handle picking
	    var projector = new THREE.Projector();
	    
	    // Save away a few things
	    me.container = container;
	    me.renderer = renderer;
	    me.scene = scene;
	    me.camera = camera;
	    me.projector = projector;
	    me.root = root;
	    
	    return;
	    // Set up event handlers
	    me.initMouse();
	    me.initKeyboard();
	    me.addDomHandlers();
	},
	
	//Core run loop
	run: function() {
		this.update();
		this.renderer.render( this.scene, this.camera );
		var that = this;
		requestAnimationFrame(function() { that.run(); });	
	},
	
	// Update method - called once per tick
	update: function() {
		var i, len;
		len = this.objects.length;
		for (i = 0; i < len; i++)
		{
			this.objects[i].update();
		}
	},
	
	// Add/remove objects
	addObject: function(obj) {
		this.objects.push(obj);
	
		// If this is a renderable object, add it to the root scene
		if (obj.object3D)
		{
			this.root.add(obj.object3D);
		}
	},
	
	removeObject: function(obj) {
		var index = this.objects.indexOf(obj);
		if (index != -1)
		{
			this.objects.splice(index, 1);
			// If this is a renderable object, remove it from the root scene
			if (obj.object3D)
			{
				this.root.remove(obj.object3D);
			}
		}
	}
});

Sim.Object = Ext.extend(Sim.Publisher, {
	constructor: function() {
		Sim.Object.superclass.constructor.apply(this, arguments);
		
		this.object3D = null;
		this.children = [];
	},
	
	init: function() {
		
	},
	
	update: function() {
		this.updateChildren();
	},
	
	setPosition: function(x, y, z) {
		if (this.object3D)
		{
			this.object3D.position.set(x, y, z);
		}
	},
	
	//setScale - scale the object
	setScale: function(x, y, z) {
		if (this.object3D)
		{
			this.object3D.scale.set(x, y, z);
		}
	},
	
	//setScale - scale the object
	setVisible: function(visible) {
		function setVisible(obj, visible)
		{
			obj.visible = visible;
			var i, len = obj.children.length;
			for (i = 0; i < len; i++)
			{
				setVisible(obj.children[i], visible);
			}
		}
		
		if (this.object3D)
		{
			setVisible(this.object3D, visible);
		}
	},
	
	// updateChildren - update all child objects
	update: function() {
		var i, len;
		len = this.children.length;
		for (i = 0; i < len; i++)
		{
			this.children[i].update();
		}
	},
	
	setObject3D: function(object3D) {
		object3D.data = this;
		this.object3D = object3D;
	},
	
	//Add/remove children
	addChild: function(child) {
		this.children.push(child);
		
		// If this is a renderable object, add its object3D as a child of mine
		if (child.object3D)
		{
			this.object3D.add(child.object3D);
		}
	},
	
	removeChild: function(child) {
		var index = this.children.indexOf(child);
		if (index != -1)
		{
			this.children.splice(index, 1);
			// If this is a renderable object, remove its object3D as a child of mine
			if (child.object3D)
			{
				this.object3D.remove(child.object3D);
			}
		}
	},
	
	// Some utility methods
	getScene: function() {
		var scene = null;
		if (this.object3D)
		{
			var obj = this.object3D;
			while (obj.parent)
			{
				obj = obj.parent;
			}
			
			scene = obj;
		}
		
		return scene;
	},
	
	getApp: function() {
		var scene = this.getScene();
		return scene ? scene.data : null;
	}
});