/**
 * skylark-domx-plugins-pictures - The skylark picture plugin library for dom api extension.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-domx-plugins/skylark-domx-plugins-pictures/
 * @license MIT
 */
(function(factory,globals) {
  var define = globals.define,
      require = globals.require,
      isAmd = (typeof define === 'function' && define.amd),
      isCmd = (!isAmd && typeof exports !== 'undefined');

  if (!isAmd && !define) {
    var map = {};
    function absolute(relative, base) {
        if (relative[0]!==".") {
          return relative;
        }
        var stack = base.split("/"),
            parts = relative.split("/");
        stack.pop(); 
        for (var i=0; i<parts.length; i++) {
            if (parts[i] == ".")
                continue;
            if (parts[i] == "..")
                stack.pop();
            else
                stack.push(parts[i]);
        }
        return stack.join("/");
    }
    define = globals.define = function(id, deps, factory) {
        if (typeof factory == 'function') {
            map[id] = {
                factory: factory,
                deps: deps.map(function(dep){
                  return absolute(dep,id);
                }),
                resolved: false,
                exports: null
            };
            require(id);
        } else {
            map[id] = {
                factory : null,
                resolved : true,
                exports : factory
            };
        }
    };
    require = globals.require = function(id) {
        if (!map.hasOwnProperty(id)) {
            throw new Error('Module ' + id + ' has not been defined');
        }
        var module = map[id];
        if (!module.resolved) {
            var args = [];

            module.deps.forEach(function(dep){
                args.push(require(dep));
            })

            module.exports = module.factory.apply(globals, args) || null;
            module.resolved = true;
        }
        return module.exports;
    };
  }
  
  if (!define) {
     throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");
  }

  factory(define,require);

  if (!isAmd) {
    var skylarkjs = require("skylark-langx-ns");

    if (isCmd) {
      module.exports = skylarkjs;
    } else {
      globals.skylarkjs  = skylarkjs;
    }
  }

})(function(define,require) {

define('skylark-domx-plugins-pictures/pictures',[
    "skylark-langx/skylark"
],function (skylark) {
    'use strict';

    return skylark.attach("domx.plugins.pictures");

});
define('skylark-domx-plugins-pictures/viewer',[
    "skylark-langx",
    "skylark-domx/eventer",
    "skylark-domx/geom",
    "skylark-domx/query",
    "skylark-domx-images/preload",
    "skylark-domx-plugins-base",
    "skylark-domx-plugins-interact/movable",
    "./pictures"
], function (langx,eventer,geom,$,preload,plugins,Movable,pictures) {
    'use strict';

    var PictureViewer = plugins.Plugin.inherit({
        klassName : "PictureViewer",

        pluginName : "lark.pictures.pictureviewer",

        options : {
            ratioThreshold: 0.1,
            minRatio: 0.05,
            maxRatio: 16,
            movable : true,

            classes : {
                grab : null,
                loader : null
            }
        },

        _construct : function(elm,options) {
            plugins.Plugin.prototype._construct.call(this,elm,options);

            this.$stage = this.$();
            this.$image = this.$stage.find("img");
            

            this.$stage.off("wheel").on("wheel", e => {
                this._handleWheel(e);
            });

            if (this.options.movable) {
                this._movable = new Movable(this.$image[0],{
                    starting : (e) => {
                        const imageWidth = this.$image.width();
                        const imageHeight = this.$image.height();
                        const stageWidth = this.$stage.width();
                        const stageHeight = this.$stage.height();
                        let minX,minY,maxX,maxY;

                        if (stageWidth>=imageWidth && stageHeight>=imageHeight) {
                            return false;
                        }

                        if (stageWidth>=imageWidth) {
                            minX=maxX=(stageWidth-imageWidth) / 2;
                        } else {
                            minX = stageWidth - imageWidth;
                            maxX = 0;
                        }

                        if (stageHeight>=imageHeight) {
                            minY=maxY=(stageHeight-imageHeight) / 2;
                        } else {
                            minY = stageHeight - imageHeight;
                            maxY = 0;
                        }

                        return {
                            constraints : {
                                minX,
                                maxX,
                                minY,
                                maxY
                            }
                        };
                    },
                    started : function(e) {
                        eventer.stop(e);
                    }
                });
            }

        }, 

        getImageScaleToStage : function(stageWidth, stageHeight) {
            let scale = 1;
            if (!this.isRotated) {
                scale = Math.min(stageWidth / this.img.width, stageHeight / this.img.height, 1);
            } else {
                scale = Math.min(stageWidth / this.img.height, stageHeight / this.img.width, 1);
            }
            return scale;
        },

        setGrabCursor : function (imageData, stageData, isRotated) {
            const imageWidth = !isRotated ? imageData.w : imageData.h;
            const imageHeight = !isRotated ? imageData.h : imageData.w;
            if (imageHeight > stageData.h || imageWidth > stageData.w) {
                this.$stage.addClass('is-grab');
            }
            if (imageHeight <= stageData.h && imageWidth <= stageData.w) {
                this.$stage.removeClass('is-grab');
            }
        },

        setImageSize: function(img) {
            const stageData = {
                w: this.$stage.width(),
                h: this.$stage.height()
            };
            const scale = this.getImageScaleToStage(stageData.w, stageData.h);
            this.$image.css({
                width: Math.ceil(img.width * scale) + 'px',
                height: Math.ceil(img.height * scale) + 'px',
                left: (stageData.w - Math.ceil(img.width * scale)) / 2 + 'px',
                top: (stageData.h - Math.ceil(img.height * scale)) / 2 + 'px'
            });
            langx.mixin(this.imageData, {
                initWidth: img.width * scale,
                initHeight: img.height * scale,
                initLeft: (stageData.w - img.width * scale) / 2,
                initTop: (stageData.h - img.height * scale) / 2,
                width: img.width * scale,
                height: img.height * scale,
                left: (stageData.w - img.width * scale) / 2,
                top: (stageData.h - img.height * scale) / 2
            });
            this.setGrabCursor({
                w: this.$image.width(),
                h: this.$image.height()
            }, {
                w: this.$stage.width(),
                h: this.$stage.height()
            }, this.isRotated);
            if (!this.imageLoaded) {
                this.$stage.find(".${ this.options.classes.loader }").remove();
                this.$stage.removeClass('stage-ready');
                this.$image.removeClass('image-ready');
                if (this.options.initAnimation && !this.options.progressiveLoading) {
                    this.$image.fadeIn();
                }
                this.imageLoaded = true;
            }
        },

        loadImage : function(imgSrc, fn, err) {
            this.$image.removeAttr('style').attr('src', '');
            this.isRotated = false;
            this.rotateAngle = 0;
            this.imageLoaded = false;
            this.$stage.append(`<div class="${ this.options.classes.loader }"></div>`);
            this.$stage.addClass('stage-ready');
            this.$image.addClass('image-ready');
            if (this.options.initAnimation && !this.options.progressiveLoading) {
                this.$image.hide();
            }
            this.$image.attr('src', imgSrc);
            preload(imgSrc).then((data) => {
                var img = data.imgs[0];
                this.img = img;
                this.imageData = {
                    originalWidth: img.width,
                    originalHeight: img.height
                };
                ///if (this.isMaximized || this.isOpened && this.options.fixedModalPos) {
                ///    this.setImageSize(img);
                ///} else {
                ///    this.setModalSize(img);
                ///}
                if (fn) {
                    fn(img);
                }
            }, () => {
                this.$photoviewer.find(".${ this.options.classes.loader }").remove();
                if (err) {
                    err.call();
                }
            });

        },

        _handleWheel : function(e) {
            e.preventDefault();
            let delta = 1;
            if (e.deltaY) {
                delta = e.deltaY > 0 ? 1 : -1;
            } else if (e.wheelDelta) {
                delta = -e.wheelDelta / 120;
            } else if (e.detail) {
                delta = e.detail > 0 ? 1 : -1;
            }
            const ratio = -delta * this.options.ratioThreshold;
            const pointer = {
                x: e.clientX - this.$stage.offset().left + geom.scrollLeft(document.body),
                y: e.clientY - this.$stage.offset().top + geom.scrollTop(document.body)
            };
            this.zoom(ratio, pointer, e);
        },

        zoom : function(ratio, origin, e) {
            ratio = ratio < 0 ? 1 / (1 - ratio) : 1 + ratio;
            ratio = this.$image.width() / this.imageData.originalWidth * ratio;
            if (ratio > this.options.maxRatio || ratio < this.options.minRatio) {
                return;
            }
            this.zoomTo(ratio, origin, e);
        },

        zoomTo : function(ratio, origin, e) {
            const $image = this.$image;
            const $stage = this.$stage;
            const imgData = {
                w: this.imageData.width,
                h: this.imageData.height,
                x: this.imageData.left,
                y: this.imageData.top
            };
            const stageData = {
                w: $stage.width(),
                h: $stage.height(),
                x: $stage.offset().left,
                y: $stage.offset().top
            };
            const newWidth = this.imageData.originalWidth * ratio;
            const newHeight = this.imageData.originalHeight * ratio;
            let newLeft = origin.x - (origin.x - imgData.x) / imgData.w * newWidth;
            let newTop = origin.y - (origin.y - imgData.y) / imgData.h * newHeight;
            const δ = !this.isRotated ? 0 : (newWidth - newHeight) / 2;
            const imgNewWidth = !this.isRotated ? newWidth : newHeight;
            const imgNewHeight = !this.isRotated ? newHeight : newWidth;
            const offsetX = stageData.w - newWidth;
            const offsetY = stageData.h - newHeight;
            if (imgNewHeight <= stageData.h) {
                newTop = (stageData.h - newHeight) / 2;
            } else {
                newTop = newTop > δ ? δ : newTop > offsetY - δ ? newTop : offsetY - δ;
            }
            if (imgNewWidth <= stageData.w) {
                newLeft = (stageData.w - newWidth) / 2;
            } else {
                newLeft = newLeft > -δ ? -δ : newLeft > offsetX + δ ? newLeft : offsetX + δ;
            }
            if (Math.abs(this.imageData.initWidth - newWidth) < this.imageData.initWidth * 0.05) {
                this.setImageSize(this.img);
            } else {
                $image.css({
                    width: Math.round(newWidth) + 'px',
                    height: Math.round(newHeight) + 'px',
                    left: Math.round(newLeft) + 'px',
                    top: Math.round(newTop) + 'px'
                });
                this.setGrabCursor({
                    w: Math.round(imgNewWidth),
                    h: Math.round(imgNewHeight)
                }, {
                    w: stageData.w,
                    h: stageData.h
                });
            }
            $.extend(this.imageData, {
                width: newWidth,
                height: newHeight,
                left: newLeft,
                top: newTop
            });
        },

        rotate : function(angle) {
            this.rotateAngle = this.rotateAngle + angle;
            if (this.rotateAngle / 90 % 2 === 0) {
                this.isRotated = false;
            } else {
                this.isRotated = true;
            }
            this.rotateTo(this.rotateAngle);
        },
        rotateTo: function(angle) {
            this.$image.css({ transform: 'rotate(' + angle + 'deg)' });
            this.setImageSize({
                width: this.imageData.originalWidth,
                height: this.imageData.originalHeight
            });
            this.$stage.removeClass('is-grab');
        },
        resize: function() {
            const imageWidth = this.$image.width();
            const imageHeight = this.$image.height();
            const stageWidth = this.$stage.width();
            const stageHeight = this.$stage.height();
            const left = (stageWidth - imageWidth) /2;
            const top = (stageHeight- imageHeight) /2;
            this.$image.css({
                left,
                top
            });
        },

        shortcut: function(keyCode,ctrlKey,altKey) {
            var handled = false;
            switch (keyCode) {
                // +
                case 187:
                    this.zoom(this.options.ratioThreshold * 3, {
                        x: this.$stage.width() / 2,
                        y: this.$stage.height() / 2
                    }, e);
                    handled = true;
                    break;
                // -
                case 189:
                    this.zoom(-this.options.ratioThreshold * 3, {
                        x: this.$stage.width() / 2,
                        y: this.$stage.height() / 2
                    }, e);
                    handled = true;
                    break;
                // + Firefox
                case 61:
                    this.zoom(this.options.ratioThreshold * 3, {
                        x: this.$stage.width() / 2,
                        y: this.$stage.height() / 2
                    }, e);
                    handled = true;
                    break;
                // - Firefox
                case 173:
                    this.zoom(-this.options.ratioThreshold * 3, {
                        x: this.$stage.width() / 2,
                        y: this.$stage.height() / 2
                    }, e);
                    handled = true;
                    break;
                // Ctrl + Alt + 0
                case 48:
                    if (ctrlKey && altKey) {
                        this.zoomTo(1, {
                            x: this.$stage.width() / 2,
                            y: this.$stage.height() / 2
                        }, e);
                    }
                    handled = true;
                    break;
                // Ctrl + ,
                case 188:
                    if (ctrlKey) {
                        this.rotate(-90);
                    }
                    break;
                // Ctrl + .
                case 190:
                    if (ctrlKey) {
                        this.rotate(90);
                    }
                    handled = true;
                    break;
                default:
            }

            return handled;
        }
    });

    return pictures.PictureViewer = PictureViewer;
});
define('skylark-domx-plugins-pictures/main',[
	'./pictures',
	"./viewer"
], function (pictures) {
    'use strict';
    return pictures;
});
define('skylark-domx-plugins-pictures', ['skylark-domx-plugins-pictures/main'], function (main) { return main; });


},this);
//# sourceMappingURL=sourcemaps/skylark-domx-plugins-pictures.js.map
