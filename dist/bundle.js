(function () {
'use strict';

var cvtColorToGray = function cvtColorToGray(data) {
  for (var i = 0; i < data.length; i += 4) {
    var grayscale = data[i] * .3 + data[i + 1] * .59 + data[i + 2] * .11;
    data[i] = grayscale; // red
    data[i + 1] = grayscale; // green
    data[i + 2] = grayscale; // blue
    // alpha
  }
  return data;
};

var gaussianBlur = function gaussianBlur(pixes, width, height, radius, sigma) {

  var gaussMatrix = [],
      gaussSum = 0,
      x,
      y,
      r,
      g,
      b,
      a,
      i,
      j,
      k,
      len;

  radius = Math.floor(radius) || 3;
  sigma = sigma || radius / 3;

  a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
  b = -1 / (2 * sigma * sigma);
  //生成高斯矩阵
  for (i = 0, x = -radius; x <= radius; x++, i++) {
    g = a * Math.exp(b * x * x);
    gaussMatrix[i] = g;
    gaussSum += g;
  }
  //归一化, 保证高斯矩阵的值在[0,1]之间
  for (i = 0, len = gaussMatrix.length; i < len; i++) {
    gaussMatrix[i] /= gaussSum;
  }
  //x 方向一维高斯运算
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for (j = -radius; j <= radius; j++) {
        k = x + j;
        if (k >= 0 && k < width) {
          //确保 k 没超出 x 的范围
          //r,g,b,a 四个一组
          i = (y * width + k) * 4;
          r += pixes[i] * gaussMatrix[j + radius];
          g += pixes[i + 1] * gaussMatrix[j + radius];
          b += pixes[i + 2] * gaussMatrix[j + radius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + radius];
        }
      }
      i = (y * width + x) * 4;
      // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
      // console.log(gaussSum)
      pixes[i] = r / gaussSum;
      pixes[i + 1] = g / gaussSum;
      pixes[i + 2] = b / gaussSum;
      // pixes[i + 3] = a ;
    }
  }
  //y 方向一维高斯运算
  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      r = g = b = a = 0;
      gaussSum = 0;
      for (j = -radius; j <= radius; j++) {
        k = y + j;
        if (k >= 0 && k < height) {
          //确保 k 没超出 y 的范围
          i = (k * width + x) * 4;
          r += pixes[i] * gaussMatrix[j + radius];
          g += pixes[i + 1] * gaussMatrix[j + radius];
          b += pixes[i + 2] * gaussMatrix[j + radius];
          // a += pixes[i + 3] * gaussMatrix[j];
          gaussSum += gaussMatrix[j + radius];
        }
      }
      i = (y * width + x) * 4;
      pixes[i] = r / gaussSum;
      pixes[i + 1] = g / gaussSum;
      pixes[i + 2] = b / gaussSum;
      // pixes[i] = r ;
      // pixes[i + 1] = g ;
      // pixes[i + 2] = b ;
      // pixes[i + 3] = a ;
    }
  }

  return pixes;
};

var bindPixelAt = function bindPixelAt(data, width, height) {
  return function (x, y, i) {
    i = i || 0;
    return data[4 * (width * x + y) + i];
    // return data[((width * y) + x) * 4 + i]
  };
};

var sobel = function sobel(imageData, width, height) {

  var kernelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];

  var kernelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

  var sobelData = [];
  var grayscaleData = [];

  //梯度方向矩阵
  var directionMap = [];

  var data = imageData;
  var pixelAt = bindPixelAt(data, width, height);
  var x, y;

  for (x = 0; x < width; x++) {

    var directionHorizontalMap = [];

    for (y = 0; y < height; y++) {
      var pixelX = kernelX[0][0] * pixelAt(x - 1, y - 1) + kernelX[0][1] * pixelAt(x, y - 1) + kernelX[0][2] * pixelAt(x + 1, y - 1) + kernelX[1][0] * pixelAt(x - 1, y) + kernelX[1][1] * pixelAt(x, y) + kernelX[1][2] * pixelAt(x + 1, y) + kernelX[2][0] * pixelAt(x - 1, y + 1) + kernelX[2][1] * pixelAt(x, y + 1) + kernelX[2][2] * pixelAt(x + 1, y + 1);

      var pixelY = kernelY[0][0] * pixelAt(x - 1, y - 1) + kernelY[0][1] * pixelAt(x, y - 1) + kernelY[0][2] * pixelAt(x + 1, y - 1) + kernelY[1][0] * pixelAt(x - 1, y) + kernelY[1][1] * pixelAt(x, y) + kernelY[1][2] * pixelAt(x + 1, y) + kernelY[2][0] * pixelAt(x - 1, y + 1) + kernelY[2][1] * pixelAt(x, y + 1) + kernelY[2][2] * pixelAt(x + 1, y + 1);

      // var magnitude = Math.abs(pixelX) + Math.abs(pixelY)

      var magnitude = Math.sqrt(pixelX * pixelX + pixelY * pixelY) >>> 0;

      sobelData.push(magnitude, magnitude, magnitude, 255);

      if (Math.abs(pixelX) >= Math.abs(pixelY)) directionHorizontalMap.push(0);else directionHorizontalMap.push(1);
    }
    directionMap.push(directionHorizontalMap);
  }

  var clampedArray = sobelData;

  if (typeof Uint8ClampedArray === 'function') {
    clampedArray = new Uint8ClampedArray(sobelData);
  }

  return {
    gradientMap: clampedArray,
    directionMap: directionMap
  };
};

var anchor = function anchor(gradientMap, directionMap, width, height, AnchorThresh) {

  var pixelAt = bindPixelAt(gradientMap, width, height);
  var AnchorData = [];

  var x, y;

  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      if (x == 0 || x == width - 1 || y == 0 || y == height - 1) AnchorData.push(0, 0, 0, 255);else {
        if (directionMap[x][y] == 1) {
          if (pixelAt(x, y) - pixelAt(x, y - 1) >= AnchorThresh && pixelAt(x, y) - pixelAt(x, y + 1) >= AnchorThresh) AnchorData.push(255, 255, 255, 255);else AnchorData.push(0, 0, 0, 255);
        } else {
          if (pixelAt(x, y) - pixelAt(x - 1, y) >= AnchorThresh && pixelAt(x, y) - pixelAt(x + 1, y) >= AnchorThresh) AnchorData.push(255, 255, 255, 255);else AnchorData.push(0, 0, 0, 255);
        }
      }
    }
  }

  return new Uint8ClampedArray(AnchorData);
};

// 阈值处理
// 低于lowThresh的设置为0
var threshold = function threshold(data, lowThresh) {
  for (var i = 0; i < data.length; i += 4) {
    if (data[i] <= lowThresh) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
    }
  }
  return data;
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 *
 * lowPoly风格图片生成器
 * 
 * 接受一个类canvas ImageData对象，需要包含以下属性
 * {data:Array|Uint8ClampedArray,width:Number,height:Number}
 * 返回一个能被canvas ImageData对象
 * 
 * @param {Object} imageData
 * @return {Object} 
 * 
 */

function LowPolyGenerator(imageData) {

  // 获取宽高
  var width = imageData.width,
      height = imageData.height;
  // 获取图像数组 {Uint8ClampedArray|Array}
  var imageArray = imageData.data;

  // 将图像转为灰度图
  cvtColorToGray(imageArray);

  // 高斯模糊
  gaussianBlur(imageArray, width, height, 2, 1);

  // 求图像梯度和边缘方向矩阵
  var sobelResult = sobel(imageArray, width, height);

  //阈值处理
  threshold(sobelResult.gradientMap, 30, 140);

  var anchorResult = anchor(sobelResult.gradientMap, sobelResult.directionMap, width, height, 26);

  return toImageData(anchorResult, width, height);
}

function toImageData(data, width, height) {

  if (typeof ImageData === 'function' && Object.prototype.toString.call(data) === '[object Uint16Array]') {
    return new ImageData(data, width, height);
  } else {
    if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && _typeof(window.document) === 'object') {
      var canvas = document.createElement('canvas');

      if (typeof canvas.getContext === 'function') {
        var context = canvas.getContext('2d');
        var imageData = context.createImageData(width, height);
        imageData.data.set(data);
        return imageData;
      } else {
        return new this.fakeImageData(data, width, height);
      }
    } else {
      return new this.fakeImageData(data, width, height);
    }
  }
}

window.LowPolyGenerator = LowPolyGenerator;

}());
//# sourceMappingURL=bundle.js.map
