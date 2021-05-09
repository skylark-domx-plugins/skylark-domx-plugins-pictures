/**
 * skylark-domx-plugins-pictures - The skylark picture plugin library for dom api extension.
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-domx-plugins/skylark-domx-plugins-pictures/
 * @license MIT
 */
!function(t,i){var s=i.define,require=i.require,a="function"==typeof s&&s.amd,h=!a&&"undefined"!=typeof exports;if(!a&&!s){var o={};s=i.define=function(t,i,e){"function"==typeof e?(o[t]={factory:e,deps:i.map(function(i){return function(t,i){if("."!==t[0])return t;var e=i.split("/"),s=t.split("/");e.pop();for(var a=0;a<s.length;a++)"."!=s[a]&&(".."==s[a]?e.pop():e.push(s[a]));return e.join("/")}(i,t)}),resolved:!1,exports:null},require(t)):o[t]={factory:null,resolved:!0,exports:e}},require=i.require=function(t){if(!o.hasOwnProperty(t))throw new Error("Module "+t+" has not been defined");var module=o[t];if(!module.resolved){var e=[];module.deps.forEach(function(t){e.push(require(t))}),module.exports=module.factory.apply(i,e)||null,module.resolved=!0}return module.exports}}if(!s)throw new Error("The module utility (ex: requirejs or skylark-utils) is not loaded!");if(function(t,require){t("skylark-domx-plugins-pictures/pictures",["skylark-langx/skylark"],function(t){"use strict";return t.attach("domx.plugins.pictures")}),t("skylark-domx-plugins-pictures/viewer",["skylark-langx","skylark-domx/eventer","skylark-domx/geom","skylark-domx/query","skylark-domx-images/preload","skylark-domx-plugins-base","skylark-domx-plugins-interact/movable","./pictures"],function(t,i,s,a,h,o,r,n){"use strict";var g=o.Plugin.inherit({klassName:"PictureViewer",pluginName:"lark.domx.pictureviewer",options:{ratioThreshold:.1,minRatio:.05,maxRatio:16,movable:!0,classes:{grab:null,loader:null}},_construct:function(t,e){o.Plugin.prototype._construct.call(this,t,e),this.$stage=this.$(),this.$image=this.$stage.find("img"),this.$stage.off("wheel").on("wheel",t=>{this._handleWheel(t)}),this.options.movable&&(this._movable=new r(this.$image[0],{starting:t=>{const i=this.$image.width(),e=this.$image.height(),s=this.$stage.width(),a=this.$stage.height();let h,o,r,n;return!(s>=i&&a>=e)&&(s>=i?h=r=(s-i)/2:(h=s-i,r=0),a>=e?o=n=(a-e)/2:(o=a-e,n=0),{constraints:{minX:h,maxX:r,minY:o,maxY:n}})},started:function(t){i.stop(t)}}))},getImageScaleToStage:function(t,i){let e=1;return e=this.isRotated?Math.min(t/this.img.height,i/this.img.width,1):Math.min(t/this.img.width,i/this.img.height,1)},setGrabCursor:function(t,i,e){const s=e?t.h:t.w,a=e?t.w:t.h;(a>i.h||s>i.w)&&this.$stage.addClass("is-grab"),a<=i.h&&s<=i.w&&this.$stage.removeClass("is-grab")},setImageSize:function(i){const e={w:this.$stage.width(),h:this.$stage.height()},s=this.getImageScaleToStage(e.w,e.h);this.$image.css({width:Math.ceil(i.width*s)+"px",height:Math.ceil(i.height*s)+"px",left:(e.w-Math.ceil(i.width*s))/2+"px",top:(e.h-Math.ceil(i.height*s))/2+"px"}),t.mixin(this.imageData,{initWidth:i.width*s,initHeight:i.height*s,initLeft:(e.w-i.width*s)/2,initTop:(e.h-i.height*s)/2,width:i.width*s,height:i.height*s,left:(e.w-i.width*s)/2,top:(e.h-i.height*s)/2}),this.setGrabCursor({w:this.$image.width(),h:this.$image.height()},{w:this.$stage.width(),h:this.$stage.height()},this.isRotated),this.imageLoaded||(this.$stage.find(".${ this.options.classes.loader }").remove(),this.$stage.removeClass("stage-ready"),this.$image.removeClass("image-ready"),this.options.initAnimation&&!this.options.progressiveLoading&&this.$image.fadeIn(),this.imageLoaded=!0)},loadImage:function(t,i,e){this.$image.removeAttr("style").attr("src",""),this.isRotated=!1,this.rotateAngle=0,this.imageLoaded=!1,this.$stage.append(`<div class="${this.options.classes.loader}"></div>`),this.$stage.addClass("stage-ready"),this.$image.addClass("image-ready"),this.options.initAnimation&&!this.options.progressiveLoading&&this.$image.hide(),this.$image.attr("src",t),h(t).then(t=>{var e=t.imgs[0];this.img=e,this.imageData={originalWidth:e.width,originalHeight:e.height},i&&i(e)},()=>{this.$photoviewer.find(".${ this.options.classes.loader }").remove(),e&&e.call()})},_handleWheel:function(t){t.preventDefault();let i=1;t.deltaY?i=t.deltaY>0?1:-1:t.wheelDelta?i=-t.wheelDelta/120:t.detail&&(i=t.detail>0?1:-1);const e=-i*this.options.ratioThreshold,a={x:t.clientX-this.$stage.offset().left+s.scrollLeft(document.body),y:t.clientY-this.$stage.offset().top+s.scrollTop(document.body)};this.zoom(e,a,t)},zoom:function(t,i,e){t=t<0?1/(1-t):1+t,(t=this.$image.width()/this.imageData.originalWidth*t)>this.options.maxRatio||t<this.options.minRatio||this.zoomTo(t,i,e)},zoomTo:function(t,i,e){const s=this.$image,h=this.$stage,o={w:this.imageData.width,h:this.imageData.height,x:this.imageData.left,y:this.imageData.top},r={w:h.width(),h:h.height(),x:h.offset().left,y:h.offset().top},n=this.imageData.originalWidth*t,g=this.imageData.originalHeight*t;let l=i.x-(i.x-o.x)/o.w*n,d=i.y-(i.y-o.y)/o.h*g;const m=this.isRotated?(n-g)/2:0,u=this.isRotated?g:n,c=this.isRotated?n:g,p=r.w-n,f=r.h-g;d=c<=r.h?(r.h-g)/2:d>m?m:d>f-m?d:f-m,l=u<=r.w?(r.w-n)/2:l>-m?-m:l>p+m?l:p+m,Math.abs(this.imageData.initWidth-n)<.05*this.imageData.initWidth?this.setImageSize(this.img):(s.css({width:Math.round(n)+"px",height:Math.round(g)+"px",left:Math.round(l)+"px",top:Math.round(d)+"px"}),this.setGrabCursor({w:Math.round(u),h:Math.round(c)},{w:r.w,h:r.h})),a.extend(this.imageData,{width:n,height:g,left:l,top:d})},rotate:function(t){this.rotateAngle=this.rotateAngle+t,this.rotateAngle/90%2==0?this.isRotated=!1:this.isRotated=!0,this.rotateTo(this.rotateAngle)},rotateTo:function(t){this.$image.css({transform:"rotate("+t+"deg)"}),this.setImageSize({width:this.imageData.originalWidth,height:this.imageData.originalHeight}),this.$stage.removeClass("is-grab")},resize:function(){const t=this.$image.width(),i=this.$image.height(),e=this.$stage.width(),s=this.$stage.height(),a=(e-t)/2,h=(s-i)/2;this.$image.css({left:a,top:h})},shortcut:function(t,i,s){var a=!1;switch(t){case 187:this.zoom(3*this.options.ratioThreshold,{x:this.$stage.width()/2,y:this.$stage.height()/2},e),a=!0;break;case 189:this.zoom(3*-this.options.ratioThreshold,{x:this.$stage.width()/2,y:this.$stage.height()/2},e),a=!0;break;case 61:this.zoom(3*this.options.ratioThreshold,{x:this.$stage.width()/2,y:this.$stage.height()/2},e),a=!0;break;case 173:this.zoom(3*-this.options.ratioThreshold,{x:this.$stage.width()/2,y:this.$stage.height()/2},e),a=!0;break;case 48:i&&s&&this.zoomTo(1,{x:this.$stage.width()/2,y:this.$stage.height()/2},e),a=!0;break;case 188:i&&this.rotate(-90);break;case 190:i&&this.rotate(90),a=!0}return a}});return n.PictureViewer=g}),t("skylark-domx-plugins-pictures/main",["./pictures","./viewer"],function(t){"use strict";return t}),t("skylark-domx-plugins-pictures",["skylark-domx-plugins-pictures/main"],function(t){return t})}(s),!a){var r=require("skylark-langx-ns");h?module.exports=r:i.skylarkjs=r}}(0,this);
//# sourceMappingURL=sourcemaps/skylark-domx-plugins-pictures.js.map