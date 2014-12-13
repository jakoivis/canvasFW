;(function() {
    'use strict';
    
    window.CanvasUtil = CanvasUtil;
    
    function CanvasUtil()
    {
        if(CanvasUtil.prototype.singletonInstance)
        {
            return CanvasUtil.prototype.singletonInstance;
        }
        
        if (!(this instanceof CanvasUtil))
        {
            return new CanvasUtil();
        }
        
        CanvasUtil.prototype.singletonInstance = this;
        
        var me = this;
        
        var canvas;
        var context;
        
        function init()
        {
            me.resetTempCanvas();
        }
        
        me.resetTempCanvas = function()
        {
            canvas = document.createElement("canvas");
            context = canvas.getContext("2d");
        }
        
        me.getImageDataFromTag = function(imageTag)
        {
            updateCanvasSize(imageTag);
            clearCanvas(imageTag);
            drawImageTag(imageTag);
            return getImageData(imageTag);
        }
        
        function updateCanvasSize(imageTag)
        {
            if (canvas.width < imageTag.width
                || canvas.height < imageTag.height)
            {
                canvas.width = imageTag.width;
                canvas.height = imageTag.height;
            }
        }
        
        function clearCanvas(imageTag)
        {
            context.clearRect(0, 0, imageTag.width, imageTag.height);
        }
        
        function drawImageTag(imageTag)
        {
            context.drawImage(imageTag, 0, 0);
        }
        
        function getImageData(imageTag)
        {
            return context.getImageData(0, 0, imageTag.width, imageTag.height);
        }

        init();
        
        return this;
    }
})();
;(function() {
    'use strict';
    
    window.Graphic = Graphic;
    
    // TODO F MED: options events + other
    // TODO F: remove transition
    // TODO F: make transition switchable feature
    // TODO F HI: invalidation
    // TODO bug: renred width and height needs to be stored. when image data has changed clearing would not clear correct width and height
    // TODO: unit tests for transition... think about moving that away from graphic
    
    function Graphic(options)
    {
        if (!(this instanceof Graphic))
        {
            return new Graphic(options);
        }
        
        var me = this;
        var renderContext;
        
        var _imageData;
        var imageData8ClampedView;
        var imageData32View;
        
        var renderedX;
        var renderedY;
        
        me.x = 0;
        me.y = 0;
        
        me.onRollOver;
        me.onRollOut;
        me.onClick;
        
        var transitions;
        
        function init()
        {
            if (options)
            {
                if (options.imageData)
                {
                    me.setImageData(options.imageData);
                }
                
                me.x = options.x || 0;
                me.y = options.y || 0;
                
                me.onRollOver = options.onRollOver;
                me.onRollOut = options.onRollOut;
                me.onClick = options.onClick;
            }
            
            transitions = {};
        }
        
        me.getImageData = function()
        {
            return _imageData;
        }
        
        me.setImageData = function(imageData)
        {
            _imageData = imageData;
            imageData8ClampedView = _imageData.data;
            imageData32View = new Uint32Array(imageData8ClampedView.buffer);
        }
        
        me.setRenderContext = function(context)
        {
            renderContext = context;
        };
        
        me.render = function()
        {
            saveRenderedPosition();
            renderContext.putImageData(_imageData, me.x, me.y);
        }
        
        me.clear = function()
        {
            renderContext.clearRect(renderedX-1, renderedY-1, _imageData.width+1, _imageData.height+1);
        }
        
        me.update = function()
        {
            for(var name in transitions)
            {
                transitions[name].update();
            }
        }
        
        me.addTransition = function(name, transitionOptions)
        {
            transitionOptions.target = me;
            transitions[name] = new Transition(transitionOptions);
        }
        
        me.playTransition = function(name)
        {
            transitions[name].play();
        }
        
        me.globalToLocal = function(x, y)
        {
            return {
                x: x - me.x,
                y: y - me.y
            }
        }
        
        me.localToGlobal = function(x, y)
        {
            return {
                x: me.x + x,
                y: me.y + y
            }
        }
        
        me.hasGlobalPixelAt = function(x, y)
        {
            var result = false;
            
            if (isGlobalPositionWithinBoundaries(x, y))
            {
                var distanceFromLeft = x - me.x;
                var distanceFromTop = y - me.y;
                var pixel32 = getPixel32At(distanceFromLeft, distanceFromTop);
                
                if (pixel32 !== 0)
                {
                    result = true;
                }
            }
            
            return result;
        }
        
        function isGlobalPositionWithinBoundaries(x, y)
        {
            //var distanceFromLeft = x - me.x;
            //var distanceFromTop = y - me.y;
            //var distanceFromRight = x - (me.x + _imageData.width);
            //var distanceFromBottom = y - (me.y + _imageData.height);
            //return (distanceFromLeft >= 0 && distanceFromRight <= 0
            //    && distanceFromTop >= 0 && distanceFromBottom <= 0);
            
            // the below statement implements the same functionality as above
            return ((x - me.x) >= 0
                    && (y - me.y) >= 0
                    && (x - (me.x + _imageData.width)) <= 0
                    && (y - (me.y + _imageData.height)) <= 0);
        }
        
        function saveRenderedPosition()
        {
            renderedX = me.x;
            renderedY = me.y;
        }
        
        function getPixel32At(x, y)
        {
            return imageData32View[y * _imageData.width + x];
        }
        
        init();
        
        return this;
    }
})();
;(function() {
    'use strict';
    
    window.Group = Group;
    
    function Group(options)
    {
        if (!(this instanceof Group))
        {
            return new Group(options);
        }
        
        var me = this;
        
        function init()
        {
        }

        init();
        
        return this;
    }
})();
;(function() {
    'use strict';
    
    window.Layer = Layer;
    
    // TODO F MED: options enable events
    // TODO F MED: canvas size, fullscreen
    // TODO F MED: remove fullscreen
    
    function Layer(options)
    {
        if (!(this instanceof Layer))
        {
            return new Layer(options);
        }
        
        var me = this;
        var canvas;
        var context;
        
        var hoveredGraphic;
        
        var graphics;
        
        var hasMouseMoveEvent;
        var hasClickEvent;
        
        var canvasStoredState;
        var fullScreenState;
        
        function init()
        {
            canvas = document.createElement("canvas");
            context = canvas.getContext("2d");
            graphics = [];
            
            if (options)
            {
                if (options.enableOnRollEvents)
                {
                    me.enableOnRollEvents();
                }
                
                if (options.enableOnClickEvents)
                {
                    me.enableOnClickEvents();
                }
                
                if (options.fullScreen)
                {
                    me.enableFullScreen();
                }
                
                if (options.appendToBody)
                {
                    document.body.appendChild(canvas);
                }
            }
        }
        
        me.getCanvas = function() { return canvas; }
        
        me.enableOnRollEvents = function()
        {
            if (!hasMouseMoveEvent)
            {
                canvas.addEventListener('mousemove', mouseMoveHandler);
                hasMouseMoveEvent = true;
            }
        }
        
        me.disableOnRollEvents = function()
        {
            if (hasMouseMoveEvent)
            {
                canvas.removeEventListener('mousemove', mouseMoveHandler);
                hasMouseMoveEvent = false;
            }
        }
        
        me.enableOnClickEvents = function()
        {
            if (!hasClickEvent)
            {
                canvas.addEventListener('click', clickHandler);
                hasClickEvent = true;
            }
        }
        
        me.disableOnClickEvents = function()
        {
            if (hasClickEvent)
            {
                canvas.removeEventListener('click', clickHandler);
                hasClickEvent = false;
            }
        }
        
        me.enableFullScreen = function()
        {
            if (!fullScreenState)
            {
                storeCanvasCurrentState();
                setCanvasFullScreenState();
                window.addEventListener('resize', updateCanvasFullScreen);
                fullScreenState = true;
            }
        }
        
        me.disableFullScreen = function()
        {
            if (fullScreenState)
            {
                window.removeEventListener('resize', updateCanvasFullScreen);
                restoreCanvasState();
                fullScreenState = false;
            }
        }
        
        function storeCanvasCurrentState()
        {
            canvasStoredState = {
                position: canvas.style.position,
                left: canvas.style.left,
                top: canvas.style.top,
                width: canvas.width,
                height: canvas.height
            };
        }
        
        function setCanvasFullScreenState()
        {
            canvas.style.position = "absolute";
            canvas.style.left = "0";
            canvas.style.top = "0";
            updateCanvasFullScreen();
        }
        
        function updateCanvasFullScreen()
        {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            me.render();
        }
        
        function restoreCanvasState()
        {
            canvas.style.position = canvasStoredState.position;
            canvas.style.left = canvasStoredState.left;
            canvas.style.top = canvasStoredState.top;
            canvas.width = canvasStoredState.width;
            canvas.height = canvasStoredState.height;
        }
        
        function mouseMoveHandler(event)
        {
            var graphic = me.getGraphicAtPoint(event.clientX, event.clientY);
                    
            // test if we are hitting something different on this move
            if (graphic !== hoveredGraphic)
            {
                if (hoveredGraphic && hoveredGraphic.onRollOut)
                {
                    hoveredGraphic.onRollOut.call(hoveredGraphic);
                }
                    
                if (graphic && graphic.onRollOver)
                {
                    graphic.onRollOver.call(graphic);    
                }
                
                hoveredGraphic = graphic;
            }
        }
        
        function clickHandler(evnet)
        {
            var graphic = me.getGraphicAtPoint(event.clientX, event.clientY);
            
            if (graphic && graphic.onClick)
            {
                graphic.onClick.call(graphic);    
            }
        }
        
        me.length = function()
        {
            return graphics.length;
        }
        
        me.addGraphic = function(graphic)
        {
            graphics.push(graphic);
            graphic.setRenderContext(context);
        }
        
        me.removeGraphic = function(graphic)
        {
            graphic.clear();
            
            for(var i = 0; i < graphics.length; i++)
            {
                if (graphic === graphics[i])
                {
                    graphics = graphics.slice(0,i).concat(graphics.slice(i+1));
                    return;
                }
            }
        }
        
        me.getGraphicAtPoint = function(x, y)
        {
            var result = null;
            
            for(var i = 0; i < graphics.length; i++)
            {
                // TODO Feature Priority low: add distance tolerance, alpha tolerance
                // TODO Feature Priority medium: think about the order of graphics: which one is on top (first, last)-> reduce loopings
                // TODO Feature Priority low: graphic should check wheter it is interactive to speed up the test. is it faster???
                if(graphics[i].hasGlobalPixelAt(x, y))
                {
                    result = graphics[i];
                }
            }
            
            return result;
        }
        
        me.render = function()
        {
            for(var i = 0; i < graphics.length; i++)
            {
                graphics[i].clear();
                graphics[i].render();
            }
        }
        
        me.update = function()
        {
            for(var i = 0; i < graphics.length; i++)
            {
                graphics[i].update();
            }
        }
        
        init();
        
        return this;
    }
})();
;(function() {
    'use strict';
    
    window.Timer = Timer;
    
    //Timer class implements the main loop of the application and the callbacs that handle 
    //game processing in main loop.
    function Timer(options)
    {
        if(Timer.prototype.singletonInstance)
        {
            return Timer.prototype.singletonInstance;
        }
        
        if (!(this instanceof Timer))
        {
            return new Timer(options);
        }
        
        Timer.prototype.singletonInstance = this;
        
        var me = this;
        
        me.renderCallback;
        me.updateCallback;
        me.measureCallback;
        
        // Frame rate
        var frameRate = 30;
        me.getFramerate = function() { return frameRate; }
        me.setFramerate = function(value) 
        { 
            frameRate = value;
            
            // one second / frame rate = time of a period
            period = Math.round(1000 / frameRate);
        }
            
        // Time in milliseconds we have time to perform all operations
        var period;
        me.getPeriod = function() { return period; }
        
        // Time before the operations
        var beforeTime;
        me.getBeforeTime = function() { return beforeTime; }
            
        // Time after the operations
        var afterTime;
        me.getAfterTime = function() { return afterTime; }
            
        // Time that elapsed during the processing of operations
        var timeDiff;
        me.getTimeDiff = function() { return timeDiff; }
            
        // Sleep time is the time left after the operations 
        var sleepTime;
        me.getSleepTime = function() { return sleepTime; }
            
        // Over sleep time is the time between the timer events without the delay itself.
        // This is only plus minus few milliseconds. 
        var overSleepTime;
        me.getOverSleepTime = function() { return overSleepTime; }
            
        // Time in milliseconds the loop is delayed due to the heavy processing. 
        // Drawing of frames are skipped if this is greater than the time of a period.
        var excess;
        me.getExcess = function() { return excess; }
        
        var gameTimerId;
        
        var dummyFunction = function() {};
        
        function init()
        {
            if (options)
            {
                me.renderCallback = options.renderCallback || dummyFunction;
                me.updateCallback = options.updateCallback || dummyFunction;
                me.measureCallback = options.measureCallback || dummyFunction;
                
                me.setFramerate(options.frameRate || 30);
            }
            else
            {
                me.renderCallback = dummyFunction;
                me.updateCallback = dummyFunction;
                me.measureCallback = dummyFunction;
                
                me.setFramerate(30);
            }
            
            beforeTime = 0;
            afterTime = 0;
            timeDiff = 0;
            sleepTime = 0;
            overSleepTime = 0;
            excess = 0;
        }
        
        me.start = function()
        {
            beforeTime = new Date().getTime();
            afterTime = new Date().getTime();
            gameTimerId = setTimeout(run, period);
        }
        
        me.stop = function() 
        {
            clearTimeout(gameTimerId);
        }
       
        
        // Main loop of the game.
        // Game loop starts with the startTimer call. It is called once
        // and afterwards the timer is called inside the game loop.
        function run(event)
        {
            // get start time
            beforeTime = new Date().getTime();
            
            // get the time that elapsed from the previous run function call, 
            // not including the delay itself.
            overSleepTime = (beforeTime - afterTime) - sleepTime;
 
            me.updateCallback();
            me.renderCallback();
            
            // get end time
            afterTime = new Date().getTime();
            
            // get time difference i.e. elapsed time.
            timeDiff = afterTime - beforeTime;
            
            // calculate new delay
            // overSleepTime is reduced to balance the timer error from previus round.
            sleepTime = (period - timeDiff) - overSleepTime;        
            
            if(sleepTime <= 0) 
            {
                // processing a frame takes more time than the time of a period
                
                // store the negative sleep time
                excess -= sleepTime;
                
                // set a minimum sleep time
                sleepTime = 2;
            }        
            
            // set the newly calculated delay
            gameTimerId = setTimeout(run, sleepTime);
                
            // compensate the processings of all delayed run calls
            // by updating everything else but drawing.
            while (excess > period) 
            {
                me.updateCallback();
                excess -= period;
            }
            
            me.measureCallback();
        }
       
        init();
        
        return this;
    }
})();
;(function() {
    'use strict';
    
    window.Transition = Transition;
    
    // TODO: test interrupting a transition
    // TODO: easing
    
    function Transition(options)
    {
        if (!(this instanceof Transition))
        {
            return new Transition(options);
        }
        
        var me = this;
        var timer = new Timer();
        
        me.duration;
        me.property;
        me.fromValue;
        me.toValue;
        me.steps;
        me.target;
        
        var position;
        var isPlaying;
        
        function init()
        {
            if (options)
            {
                me.duration = options.duration || 1000;
                me.property = options.property || "x";
                me.fromValue = options.from || 0;
                me.toValue = options.to || 1;
                me.target = options.target;
            }
            
            me.steps = getPrecalculateSteps();
            me.reset();
            storeTransition();
        }
        
        me.play = function()
        {
            var wasInterrupted = interruptOverlappingTransitions();
            
            if (wasInterrupted)
            {
                position = findNearestStartingPosition();
            }
            
            isPlaying = true;
        }
        
        me.reset = function()
        {
            isPlaying = false;
            position = 0;
        }
        
        me.pause = function()
        {
            isPlaying = false;
        }
        
        me.isPlaying = function()
        {
            return isPlaying;
        }
        
        me.update = function()
        {
            if (isPlaying)
            {
                me.target[me.property] = me.steps[position];
                
                if (position < me.steps.length-1)
                {
                    position++;
                }
                else
                {
                    me.reset();
                }
            }
        }
        
        function getPrecalculateSteps()
        {
            var result = [];
            var frameCount = (me.duration / 1000) * timer.getFramerate();
            var distance = me.toValue - me.fromValue;
            var stepSize = distance / (frameCount-1);
            
            result.push(me.fromValue);
            
            for(var i = 1; i < frameCount-1; i++)
            {
                result.push(stepSize * i + me.fromValue);
            }
            
            result.push(me.toValue);
            
            return result;
        }
        
        function interruptOverlappingTransitions()
        {
            var transitions = Transition.prototype.transitions;
            var wasInterrupting = false;
            
            for(var i = 0; i < transitions.length; i++)
            {
                if (isOverlappingTransition(transitions[i]))
                {
                    wasInterrupting = true;
                    transitions[i].reset();
                }
            }
            
            return wasInterrupting;
        }
        
        function isOverlappingTransition(transition)
        {
            return transition.property === me.property
                    && transition.target === me.target
                    && transition.isPlaying()
                    && transition !== me;
        }
        
        function findNearestStartingPosition()
        {
            var currentValue = me.target[me.property];
            var nearestValue = me.steps[0];
            var nearestValuePosition = 0;
            var nearestDistance = Math.abs(nearestValue - currentValue);
            
            for(var i = 0; i < me.steps.length; i++)
            {
                if (Math.abs(me.steps[i] - currentValue) < nearestDistance)
                {
                    nearestDistance = Math.abs(nearestValue - currentValue);
                    nearestValue = me.steps[i];
                    nearestValuePosition = i;
                }
            }
            
            return nearestValuePosition;
        }
        
        function storeTransition()
        {
            if (!Transition.prototype.transitions)
            {
                Transition.prototype.transitions = [];
            }
            
            Transition.prototype.transitions.push(me);
        }
        
        init();
        
        return this;
    }
})();