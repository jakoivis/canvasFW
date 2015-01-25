
'use strict';

module.exports = Transform;

function Transform(imageData, context)
{
    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;
    var originalImageData = imageData;
    var modifiedImageData = originalImageData;

    me.getImageData = function()
    {
        return modifiedImageData;
    }

    me.do = function(evaluatePixel, factor)
    {
        modifiedImageData = transform(evaluatePixel, factor);

        return me;
    }

    me.reset = function()
    {
        modifiedImageData = originalImageData;

        return me;
    }

    function transform(evaluatePixel, userParameters)
    {
        var imageData = modifiedImageData;
        var imageDataPixels = imageData.data;
        var newImageData = context.createImageData(imageData);
        var newImageDataPixels = newImageData.data;
        var result = [];
        var length = newImageDataPixels.length;
        var parameters = {
            imageData: imageData
        };

        userParameters = userParameters || {};

        for(var property in userParameters)
        {
            parameters[property] = userParameters[property];
        }

        for (var i = 0; i < length; i += 4)
        {
            parameters.r = imageDataPixels[i];
            parameters.g = imageDataPixels[i+1];
            parameters.b = imageDataPixels[i+2];
            parameters.a = imageDataPixels[i+3];
            parameters.x = (i % (imageData.width << 2)) >> 2;
            parameters.y = Math.floor(i / (imageData.width << 2));

            result = evaluatePixel(parameters);

            newImageDataPixels[i]   = result[0]; // R
            newImageDataPixels[i+1] = result[1]; // G
            newImageDataPixels[i+2] = result[2]; // B
            newImageDataPixels[i+3] = result[3]; // A
        }

        return newImageData;
    };
}

Transform.sampleLinear = function(imageData, x, y)
{
    var data = imageData.data;
    var index = y * (imageData.width << 2) + (x << 2);

    return [
        data[index],
        data[index+1],
        data[index+2],
        data[index+3]
    ];
};

Transform.distance = function(x1, y1, x2, y2)
{
    var distanceX = x1-x2;
    var distanceY = y1-y2;
    return Math.sqrt(distanceX*distanceX + distanceY*distanceY);
}

Transform.Invert = function(p)
{
    return [255-p.r, 255-p.g, 255-p.b, p.a];
};

Transform.GrayScale = function(p)
{
    var average = (p.r + p.g + p.b) /3;
    return [average, average, average, p.a];
};

Transform.Alpha = function(p)
{
    return [p.r, p.g, p.b, p.value];
}

Transform.Rotate = function(p)
{
    var degree = p.degree;

    var radian = (degree/180.0)*3.14159265;
    var tx = Math.round(p.x*Math.cos(radian) - p.y*Math.sin(radian));
    var ty = Math.round(p.x*Math.sin(radian) + p.y*Math.cos(radian));

    return Transform.sampleLinear(p.imageData, tx, ty);
}

Transform.Swirl = function(p)
{
    var originX = p.originX;
    var originY = p.originY;
    var degree = p.degree;
    var radius = p.radius;

    var distance = Transform.distance(p.x, p.y, originX, originY);

    // radian is the greater the farther the pixel is from origin
    var radian = ((degree * distance)/180.0)*3.14159265;
    var tx = originX + Math.cos(radian)*radius;
    var ty = originY - Math.sin(radian)*radius;

    tx -= originX;
    ty -= originY;

    tx = Math.round(p.x - tx);
    ty = Math.round(p.y - ty);

    return Transform.sampleLinear(p.imageData, tx, ty);
}

Transform.descriptions = {
    Invert: {
        arguments: []
    },
    GrayScale: {
        arguments: []
    },
    Alpha: {
        arguments: [
            {
                name:"value",
                min: 0,
                max: 255,
                default: 255,
                type: "number",
                description: "Control the alpha channel of pixels."
            }
        ]
    },
    Rotate: {
        arguments: []
    },
    Swirl: {
        arguments: [
            {
                name: "originX",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on X axis."
            },
            {
                name: "originY",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on Y axis."
            },
            {
                name: "degree",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 2,
                type: "number",
                description: "Degree of the twist."
            },
            {
                name: "radius",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 20,
                type: "number",
                description: ""
            },
        ]
    }
};
