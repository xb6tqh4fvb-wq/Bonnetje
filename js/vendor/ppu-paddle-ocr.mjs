var e_=Object.defineProperty;var Rt=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var t_=(e,t)=>{for(var r in t)e_(e,r,{get:t[r],enumerable:!0})};var ii={};t_(ii,{InferenceSession:()=>_a,TRACE:()=>Ai,TRACE_EVENT_BEGIN:()=>vt,TRACE_EVENT_END:()=>$t,TRACE_FUNC_BEGIN:()=>Je,TRACE_FUNC_END:()=>Fe,Tensor:()=>Qe,default:()=>vy,env:()=>fe,registerBackend:()=>Wt});var ma=Object.defineProperty,i_=Object.getOwnPropertyDescriptor,r_=Object.getOwnPropertyNames,n_=Object.prototype.hasOwnProperty,a_=(e=>typeof Rt<"u"?Rt:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof Rt<"u"?Rt:t)[r]}):e)(function(e){if(typeof Rt<"u")return Rt.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),V=(e,t)=>()=>(e&&(t=e(e=0)),t),ti=(e,t)=>{for(var r in t)ma(e,r,{get:t[r],enumerable:!0})},s_=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of r_(t))!n_.call(e,n)&&n!==r&&ma(e,n,{get:()=>t[n],enumerable:!(i=i_(t,n))||i.enumerable});return e},ki=e=>s_(ma({},"__esModule",{value:!0}),e),hi,yt,Wt,To,rp,np=V(()=>{"use strict";hi=new Map,yt=[],Wt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=hi.get(e);if(i===void 0)hi.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let n=yt.indexOf(e);n!==-1&&yt.splice(n,1);for(let a=0;a<yt.length;a++)if(hi.get(yt[a]).priority<=r){yt.splice(a,0,e);return}yt.push(e)}return}throw new TypeError("not a valid backend")},To=async e=>{let t=hi.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},rp=async e=>{let t=e.executionProviders||[],r=t.map(u=>typeof u=="string"?u:u.name),i=r.length===0?yt:r,n,a=[],s=new Set;for(let u of i){let d=await To(u);typeof d=="string"?a.push({name:u,err:d}):(n||(n=d),n===d&&s.add(u))}if(!n)throw new Error(`no available backend found. ERR: ${a.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:d}of a)r.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${d}`);let o=t.filter(u=>s.has(typeof u=="string"?u:u.name));return[n,new Proxy(e,{get:(u,d)=>d==="executionProviders"?o:Reflect.get(u,d)})]}}),o_=V(()=>{"use strict";np()}),ap,l_=V(()=>{"use strict";ap="1.23.2"}),tn,ze,sp=V(()=>{"use strict";l_(),tn="warning",ze={wasm:{},webgl:{},webgpu:{},versions:{common:ap},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);tn=e}},get logLevel(){return tn}},Object.defineProperty(ze,"logLevel",{enumerable:!0})}),fe,u_=V(()=>{"use strict";sp(),fe=ze}),op,lp,d_=V(()=>{"use strict";op=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let n,a;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[3]):(n=e.dims[3],a=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",o=t?.norm,u,d;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?d=[0,0,0,0]:typeof o.bias=="number"?d=[o.bias,o.bias,o.bias,o.bias]:(d=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(d[3]=o.bias[3]));let c=a*n,h=0,m=c,_=c*2,g=-1;s==="RGBA"?(h=0,m=c,_=c*2,g=c*3):s==="RGB"?(h=0,m=c,_=c*2):s==="RBG"&&(h=0,_=c,m=c*2);for(let w=0;w<a;w++)for(let x=0;x<n;x++){let $=(e.data[h++]-d[0])*u[0],b=(e.data[m++]-d[1])*u[1],C=(e.data[_++]-d[2])*u[2],T=g===-1?255:(e.data[g++]-d[3])*u[3];i.fillStyle="rgba("+$+","+b+","+C+","+T+")",i.fillRect(x,w,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},lp=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let n,a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[1],s=e.dims[3]):(n=e.dims[3],a=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t?.norm,d,c;u===void 0||u.mean===void 0?d=[255,255,255,255]:typeof u.mean=="number"?d=[u.mean,u.mean,u.mean,u.mean]:(d=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(d[3]=u.mean[3])),u===void 0||u.bias===void 0?c=[0,0,0,0]:typeof u.bias=="number"?c=[u.bias,u.bias,u.bias,u.bias]:(c=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(c[3]=u.bias[3]));let h=a*n;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let m=4,_=0,g=1,w=2,x=3,$=0,b=h,C=h*2,T=-1;o==="RGBA"?($=0,b=h,C=h*2,T=h*3):o==="RGB"?($=0,b=h,C=h*2):o==="RBG"&&($=0,C=h,b=h*2),i=r.createImageData(n,a);for(let I=0;I<a*n;_+=m,g+=m,w+=m,x+=m,I++)i.data[_]=(e.data[$++]-c[0])*d[0],i.data[g]=(e.data[b++]-c[1])*d[1],i.data[w]=(e.data[C++]-c[2])*d[2],i.data[x]=T===-1?255:(e.data[T++]-c[3])*d[3]}else throw new Error("Can not access image data");return i}}),Xi,up,dp,pp,cp,hp,p_=V(()=>{"use strict";ga(),Xi=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,n=t.norm??{mean:255,bias:0},a,s;typeof n.mean=="number"?a=[n.mean,n.mean,n.mean,n.mean]:a=[n.mean[0],n.mean[1],n.mean[2],n.mean[3]??255],typeof n.bias=="number"?s=[n.bias,n.bias,n.bias,n.bias]:s=[n.bias[0],n.bias[1],n.bias[2],n.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",d=r*i,c=u==="RGBA"?new Float32Array(d*4):new Float32Array(d*3),h=4,m=0,_=1,g=2,w=3,x=0,$=d,b=d*2,C=-1;o==="RGB"&&(h=3,m=0,_=1,g=2,w=-1),u==="RGBA"?C=d*3:u==="RBG"?(x=0,b=d,$=d*2):u==="BGR"&&(b=0,$=d,x=d*2);for(let T=0;T<d;T++,m+=h,g+=h,_+=h,w+=h)c[x++]=(e[m]+s[0])/a[0],c[$++]=(e[_]+s[1])/a[1],c[b++]=(e[g]+s[2])/a[2],C!==-1&&w!==-1&&(c[C++]=(e[w]+s[3])/a[3]);return u==="RGBA"?new Ue("float32",c,[1,4,r,i]):new Ue("float32",c,[1,3,r,i])},up=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,n=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,a=typeof e=="string",s,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},d=c=>typeof HTMLCanvasElement<"u"&&c instanceof HTMLCanvasElement||c instanceof OffscreenCanvas?c.getContext("2d"):null;if(r){let c=u();c.width=e.width,c.height=e.height;let h=d(c);if(h!=null){let m=e.height,_=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(m=t.resizedHeight,_=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=m,o.width=_}else o.tensorFormat="RGBA",o.height=m,o.width=_;h.drawImage(e,0,0),s=h.getImageData(0,0,_,m).data}else throw new Error("Can not access image data")}else if(i){let c,h;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(c=t.resizedHeight,h=t.resizedWidth):(c=e.height,h=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=c,o.width=h,t!==void 0){let m=u();m.width=h,m.height=c;let _=d(m);if(_!=null)_.putImageData(e,0,0),s=_.getImageData(0,0,h,c).data;else throw new Error("Can not access image data")}else s=e.data}else if(n){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let c=u();c.width=e.width,c.height=e.height;let h=d(c);if(h!=null){let m=e.height,_=e.width;return h.drawImage(e,0,0,_,m),s=h.getImageData(0,0,_,m).data,o.height=m,o.width=_,Xi(s,o)}else throw new Error("Can not access image data")}else{if(a)return new Promise((c,h)=>{let m=u(),_=d(m);if(!e||!_)return h();let g=new Image;g.crossOrigin="Anonymous",g.src=e,g.onload=()=>{m.width=g.width,m.height=g.height,_.drawImage(g,0,0,m.width,m.height);let w=_.getImageData(0,0,m.width,m.height);o.height=m.height,o.width=m.width,c(Xi(w.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return Xi(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},dp=(e,t)=>{let{width:r,height:i,download:n,dispose:a}=t,s=[1,i,r,4];return new Ue({location:"texture",type:"float32",texture:e,dims:s,download:n,dispose:a})},pp=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new Ue({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:n,dispose:a})},cp=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new Ue({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:n,dispose:a})},hp=(e,t,r)=>new Ue({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Pt,Ci,rn,fp,c_=V(()=>{"use strict";Pt=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Ci=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),rn=!1,fp=()=>{if(!rn){rn=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(Pt.set("int64",BigInt64Array),Ci.set(BigInt64Array,"int64")),t&&(Pt.set("uint64",BigUint64Array),Ci.set(BigUint64Array,"uint64")),i?(Pt.set("float16",r),Ci.set(r,"float16")):Pt.set("float16",Uint16Array)}}}),mp,gp,h_=V(()=>{"use strict";ga(),mp=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},gp=(e,t)=>{switch(e.location){case"cpu":return new Ue(e.type,e.data,t);case"cpu-pinned":return new Ue({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Ue({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Ue({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Ue({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Ue,ga=V(()=>{"use strict";d_(),p_(),c_(),h_(),Ue=class{constructor(e,t,r){fp();let i,n;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,n=e.dims,e.location){case"cpu-pinned":{let s=Pt.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(i=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let u=Pt.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?s=u.from(t,BigInt):s=u.from(t)}else if(t instanceof u)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")i="string",s=e;else if(u==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let u=Ci.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=u,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");n=o,this.cpuData=s,this.dataLocation="cpu"}let a=mp(n);if(this.cpuData&&a!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(a/2)===this.cpuData.length))throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=n,this.size=a}static async fromImage(e,t){return up(e,t)}static fromTexture(e,t){return dp(e,t)}static fromGpuBuffer(e,t){return pp(e,t)}static fromMLTensor(e,t){return cp(e,t)}static fromPinnedBuffer(e,t,r){return hp(e,t,r)}toDataURL(e){return op(this,e)}toImageData(e){return lp(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return gp(this,e)}}}),Qe,_p=V(()=>{"use strict";ga(),Qe=Ue}),Ai,nn,Je,Fe,vt,$t,yp=V(()=>{"use strict";sp(),Ai=(e,t)=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||console.timeStamp(`${e}::ORT::${t}`)},nn=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(a+=`::${t}`),Ai("CPU",a);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},Je=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||nn("BEGIN",e)},Fe=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||nn("END",e)},vt=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||console.time(`ORT::${e}`)},$t=e=>{(typeof ze.trace>"u"?!ze.wasm.trace:!ze.trace)||console.timeEnd(`ORT::${e}`)}}),bp,f_=V(()=>{"use strict";np(),_p(),yp(),bp=class wp{constructor(t){this.handler=t}async run(t,r,i){Je(),vt("InferenceSession.run");let n={},a={};if(typeof t!="object"||t===null||t instanceof Qe||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof Qe)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let d of r){if(typeof d!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(d)===-1)throw new RangeError(`'fetches' contains invalid output name: ${d}.`);n[d]=null}if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let d=!1,c=Object.getOwnPropertyNames(r);for(let h of this.outputNames)if(c.indexOf(h)!==-1){let m=r[h];(m===null||m instanceof Qe)&&(d=!0,s=!1,n[h]=m)}if(d){if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else a=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let d of this.inputNames)if(typeof t[d]>"u")throw new Error(`input '${d}' is missing in 'feeds'.`);if(s)for(let d of this.outputNames)n[d]=null;let o=await this.handler.run(t,n,a),u={};for(let d in o)if(Object.hasOwnProperty.call(o,d)){let c=o[d];c instanceof Qe?u[d]=c:u[d]=new Qe(c.type,c.data,c.dims)}return $t("InferenceSession.run"),Fe(),u}async release(){return this.handler.dispose()}static async create(t,r,i,n){Je(),vt("InferenceSession.create");let a,s={};if(typeof t=="string"){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let c=t,h=0,m=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(h=r,!Number.isSafeInteger(h))throw new RangeError("'byteOffset' must be an integer.");if(h<0||h>=c.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${c.byteLength}).`);if(m=t.byteLength-h,typeof i=="number"){if(m=i,!Number.isSafeInteger(m))throw new RangeError("'byteLength' must be an integer.");if(m<=0||h+m>c.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${c.byteLength-h}].`);if(typeof n=="object"&&n!==null)s=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");a=new Uint8Array(c,h,m)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await rp(s),d=await o.createInferenceSessionHandler(a,u);return $t("InferenceSession.create"),Fe(),new wp(d)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),_a,m_=V(()=>{"use strict";f_(),_a=bp}),g_=V(()=>{"use strict"}),__=V(()=>{"use strict"}),y_=V(()=>{"use strict"}),b_=V(()=>{"use strict"}),vp={};ti(vp,{InferenceSession:()=>_a,TRACE:()=>Ai,TRACE_EVENT_BEGIN:()=>vt,TRACE_EVENT_END:()=>$t,TRACE_FUNC_BEGIN:()=>Je,TRACE_FUNC_END:()=>Fe,Tensor:()=>Qe,env:()=>fe,registerBackend:()=>Wt});var Ge=V(()=>{"use strict";o_(),u_(),m_(),_p(),g_(),__(),yp(),y_(),b_()}),ya=V(()=>{"use strict"}),$p={};ti($p,{default:()=>xp});var an,sn,xp,w_=V(()=>{"use strict";kf(),Gt(),ba(),an="ort-wasm-proxy-worker",sn=globalThis.self?.name===an,sn&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":wa(r.wasm).then(()=>{Na(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:n}=r;Pa(n,i).then(()=>{postMessage({type:t})},a=>{postMessage({type:t,err:a})});break}case"copy-from":{let{buffer:i}=r,n=_r(i);postMessage({type:t,out:n});break}case"create":{let{model:i,options:n}=r;La(i,n).then(a=>{postMessage({type:t,out:a})},a=>{postMessage({type:t,err:a})});break}case"release":Ua(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:n,inputs:a,outputIndices:s,options:o}=r;Wa(i,n,a,s,new Array(s.length).fill(null),o).then(u=>{u.some(d=>d[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:u},qa([...a,...u]))},u=>{postMessage({type:t,err:u})});break}case"end-profiling":Va(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),xp=sn?null:e=>new Worker(e??Le,{type:"module",name:an})}),Cp={};ti(Cp,{default:()=>Tp});var on,Tp,So,v_=V(()=>{"use strict";on=async function(e={}){var t,r,i=e,n=new Promise((l,p)=>{t=l,r=p}),a=typeof window=="object",s=typeof WorkerGlobalScope<"u",o=s&&self.name?.startsWith("em-pthread");i.mountExternalData=(l,p)=>{l.startsWith("./")&&(l=l.substring(2)),(i.Fb||(i.Fb=new Map)).set(l,p)},i.unmountExternalData=()=>{delete i.Fb};var u=globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,qc:!0}).buffer.constructor;let d=l=>async(...p)=>{try{if(i.Gb)throw Error("Session already started");let f=i.Gb={ec:p[0],errors:[]},y=await l(...p);if(i.Gb!==f)throw Error("Session mismatch");i.Kb?.flush();let v=f.errors;if(0<v.length){let S=await Promise.all(v);if(S=S.filter(A=>A),0<S.length)throw Error(S.join(`
`))}return y}finally{i.Gb=null}};i.jsepInit=(l,p)=>{if(l==="webgpu"){[i.Kb,i.Vb,i.Zb,i.Lb,i.Yb,i.Ab,i.$b,i.bc,i.Wb,i.Xb,i.ac]=p;let f=i.Kb;i.jsepRegisterBuffer=(y,v,S,A)=>f.registerBuffer(y,v,S,A),i.jsepGetBuffer=y=>f.getBuffer(y),i.jsepCreateDownloader=(y,v,S)=>f.createDownloader(y,v,S),i.jsepOnCreateSession=y=>{f.onCreateSession(y)},i.jsepOnReleaseSession=y=>{f.onReleaseSession(y)},i.jsepOnRunStart=y=>f.onRunStart(y),i.cc=(y,v)=>{f.upload(y,v)}}else if(l==="webnn"){let f=p[0];[i.oc,i.Ob,i.webnnEnsureTensor,i.Pb,i.webnnDownloadTensor,i.nc,i.webnnEnableTraceEvent]=p.slice(1),i.webnnReleaseTensorId=i.Ob,i.webnnUploadTensor=i.Pb,i.webnnRegisterMLContext=i.nc,i.webnnOnRunStart=y=>f.onRunStart(y),i.webnnOnRunEnd=f.onRunEnd.bind(f),i.webnnOnReleaseSession=y=>{f.onReleaseSession(y)},i.webnnCreateMLTensorDownloader=(y,v)=>f.createMLTensorDownloader(y,v),i.webnnRegisterMLTensor=(y,v,S,A)=>f.registerMLTensor(y,v,S,A),i.webnnCreateMLContext=y=>f.createMLContext(y),i.webnnRegisterMLConstant=(y,v,S,A,R,L)=>f.registerMLConstant(y,v,S,A,R,i.Fb,L),i.webnnRegisterGraphInput=f.registerGraphInput.bind(f),i.webnnIsGraphInput=f.isGraphInput.bind(f),i.webnnRegisterGraphOutput=f.registerGraphOutput.bind(f),i.webnnIsGraphOutput=f.isGraphOutput.bind(f),i.webnnCreateTemporaryTensor=f.createTemporaryTensor.bind(f),i.webnnIsGraphInputOutputTypeSupported=f.isGraphInputOutputTypeSupported.bind(f)}};let c=()=>{let l=(p,f,y)=>(...v)=>{let S=tt,A=f?.();v=p(...v);let R=f?.();return A!==R&&(p=R,y(A),f=y=null),tt!=S?new Promise((L,G)=>{Fr={resolve:L,reject:G}}):v};(()=>{for(let p of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])i[p]=l(i[p],()=>i[p],f=>i[p]=f)})(),d!==void 0&&(i._OrtRun=d(i._OrtRun),i._OrtRunWithBinding=d(i._OrtRunWithBinding)),c=void 0};i.asyncInit=()=>{c?.()};var h,m,_=(l,p)=>{throw p},g=import.meta.url,w="";if(a||s){try{w=new URL(".",g).href}catch{}s&&(m=l=>{var p=new XMLHttpRequest;return p.open("GET",l,!1),p.responseType="arraybuffer",p.send(null),new Uint8Array(p.response)}),h=async l=>{if(me(l))return new Promise((f,y)=>{var v=new XMLHttpRequest;v.open("GET",l,!0),v.responseType="arraybuffer",v.onload=()=>{v.status==200||v.status==0&&v.response?f(v.response):y(v.status)},v.onerror=y,v.send(null)});var p=await fetch(l,{credentials:"same-origin"});if(p.ok)return p.arrayBuffer();throw Error(p.status+" : "+p.url)}}var x,$,b,C,T,I,E,k,z,M,W,j,H,F,U,K=console.log.bind(console),Z=console.error.bind(console),Y=K,ae=Z,X=!1,me=l=>l.startsWith("file://");function P(){return $.buffer!=T.buffer&&Ae(),T}function q(){return $.buffer!=T.buffer&&Ae(),I}function ie(){return $.buffer!=T.buffer&&Ae(),E}function pe(){return $.buffer!=T.buffer&&Ae(),k}function N(){return $.buffer!=T.buffer&&Ae(),z}function ue(){return $.buffer!=T.buffer&&Ae(),M}function Me(){return $.buffer!=T.buffer&&Ae(),W}function ge(){return $.buffer!=T.buffer&&Ae(),F}if(o){let l=function(p){try{var f=p.data,y=f.Db;if(y==="load"){let v=[];self.onmessage=S=>v.push(S),self.startWorker=()=>{postMessage({Db:"loaded"});for(let S of v)l(S);self.onmessage=l};for(let S of f.Sb)i[S]&&!i[S].proxy||(i[S]=(...A)=>{postMessage({Db:"callHandler",Rb:S,args:A})},S=="print"&&(Y=i[S]),S=="printErr"&&(ae=i[S]));$=f.kc,Ae(),U(f.lc)}else if(y==="run"){Om(f.Bb),Xr(f.Bb,0,0,1,0,0),ws(),Vr(f.Bb),Ee||(ho(),Ee=!0);try{Rm(f.hc,f.Jb)}catch(v){if(v!="unwind")throw v}}else f.target!=="setimmediate"&&(y==="checkMailbox"?Ee&&Ui():y&&(ae(`worker: received unknown command ${y}`),ae(f)))}catch(v){throw fo(),v}};var ve=l,Ee=!1;self.onunhandledrejection=p=>{throw p.reason||p},self.onmessage=l}function Ae(){var l=$.buffer;i.HEAP8=T=new Int8Array(l),E=new Int16Array(l),i.HEAPU8=I=new Uint8Array(l),k=new Uint16Array(l),i.HEAP32=z=new Int32Array(l),i.HEAPU32=M=new Uint32Array(l),W=new Float32Array(l),F=new Float64Array(l),j=new BigInt64Array(l),H=new BigUint64Array(l)}function ct(){o?startWorker(i):D.Da()}var Et,rt=0,nt=null;function kt(){if(--rt==0&&nt){var l=nt;nt=null,l()}}function ht(l){throw ae(l="Aborted("+l+")"),X=!0,l=new WebAssembly.RuntimeError(l+". Build with -sASSERTIONS for more info."),r(l),l}function fs(){return{a:{L:Qg,Aa:Zg,b:Dm,$:Cs,A:Is,pa:Es,X:ks,Z:As,qa:zs,na:Os,ga:Rs,ma:Ms,J:Ds,Y:Bs,V:Ns,oa:Ps,W:Ls,va:Bm,E:Pm,Q:Lm,O:Wm,D:qm,v:Fm,s:Gm,P:jm,z:Jm,R:eg,ja:tg,T:ig,aa:rg,M:ng,F:ag,ia:Vr,sa:sg,r:og,Ca:lg,w:pg,o:cg,m:fg,c:Pr,Ba:mg,n:gg,j:bg,u:wg,p:vg,f:$g,t:xg,l:Cg,e:Tg,k:Sg,h:Ig,g:Eg,d:kg,da:Ag,ea:zg,fa:Og,ba:Qs,ca:Js,N:eo,xa:Mg,ua:Ng,i:Pg,C:Lg,G:Ug,ta:Dg,x:Wg,ra:Vg,U:qg,q:Rg,y:Fg,K:Gg,S:jg,za:Hg,ya:Kg,ka:no,la:ao,_:Mr,B:so,I:oo,ha:lo,H:uo,a:$,wa:Rr}}}class zr{name="ExitStatus";constructor(p){this.message=`Program terminated with exit(${p})`,this.status=p}}var ms=l=>{l.terminate(),l.onmessage=()=>{}},Or=[],gs=l=>{mt.length==0&&($s(),vs(mt[0]));var p=mt.pop();if(!p)return 6;di.push(p),At[l.Bb]=p,p.Bb=l.Bb;var f={Db:"run",hc:l.fc,Jb:l.Jb,Bb:l.Bb};return p.postMessage(f,l.Nb),0},ft=0,$e=(l,p,...f)=>{for(var y=2*f.length,v=Jr(),S=Qr(8*y),A=S>>>3,R=0;R<f.length;R++){var L=f[R];typeof L=="bigint"?(j[A+2*R]=1n,j[A+2*R+1]=L):(j[A+2*R]=0n,ge()[A+2*R+1>>>0]=L)}return l=mo(l,0,y,S,p),Yi(v),l};function Rr(l){if(o)return $e(0,1,l);if(C=l,!(0<ft)){for(var p of di)ms(p);for(p of mt)ms(p);mt=[],di=[],At={},X=!0}_(0,new zr(l))}function _s(l){if(o)return $e(1,0,l);Mr(l)}var Mr=l=>{if(C=l,o)throw _s(l),"unwind";Rr(l)},mt=[],di=[],ys=[],At={},bs=l=>{var p=l.Bb;delete At[p],mt.push(l),di.splice(di.indexOf(l),1),l.Bb=0,go(p)};function ws(){ys.forEach(l=>l())}var vs=l=>new Promise(p=>{l.onmessage=v=>{var S=(v=v.data).Db;if(v.Hb&&v.Hb!=Yr()){var A=At[v.Hb];A?A.postMessage(v,v.Nb):ae(`Internal error! Worker sent a message "${S}" to target pthread ${v.Hb}, but that thread no longer exists!`)}else S==="checkMailbox"?Ui():S==="spawnThread"?gs(v):S==="cleanupThread"?bs(At[v.ic]):S==="loaded"?(l.loaded=!0,p(l)):v.target==="setimmediate"?l.postMessage(v):S==="callHandler"?i[v.Rb](...v.args):S&&ae(`worker sent an unknown command ${S}`)},l.onerror=v=>{throw ae(`worker sent an error! ${v.filename}:${v.lineno}: ${v.message}`),v};var f,y=[];for(f of[])i.propertyIsEnumerable(f)&&y.push(f);l.postMessage({Db:"load",Sb:y,kc:$,lc:b})});function $s(){var l=new Worker((()=>{let p=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new p("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});mt.push(l)}var Om=l=>{Ae();var p=ue()[l+52>>>2>>>0];l=ue()[l+56>>>2>>>0],bo(p,p-l),Yi(p)},Rm=(l,p)=>{ft=0,l=wo(l,p),0<ft?C=l:Zr(l)};class Mm{constructor(p){this.Ib=p-24}}function Dm(l,p,f){var y=new Mm(l>>>=0);throw p>>>=0,f>>>=0,ue()[y.Ib+16>>>2>>>0]=0,ue()[y.Ib+4>>>2>>>0]=p,ue()[y.Ib+8>>>2>>>0]=f,l}function xs(l,p,f,y){return o?$e(2,1,l,p,f,y):Cs(l,p,f,y)}function Cs(l,p,f,y){if(l>>>=0,f>>>=0,y>>>=0,u===void 0)return 6;var v=[];return o&&v.length===0?xs(l,p>>>=0,f,y):(l={fc:f,Bb:l,Jb:y,Nb:v},o?(l.Db="spawnThread",postMessage(l,v),0):gs(l))}var Ts=typeof TextDecoder<"u"?new TextDecoder:void 0,Ss=(l,p=0,f=NaN)=>{var y=(p>>>=0)+f;for(f=p;l[f]&&!(f>=y);)++f;if(16<f-p&&l.buffer&&Ts)return Ts.decode(l.buffer instanceof ArrayBuffer?l.subarray(p,f):l.slice(p,f));for(y="";p<f;){var v=l[p++];if(128&v){var S=63&l[p++];if((224&v)==192)y+=String.fromCharCode((31&v)<<6|S);else{var A=63&l[p++];65536>(v=(240&v)==224?(15&v)<<12|S<<6|A:(7&v)<<18|S<<12|A<<6|63&l[p++])?y+=String.fromCharCode(v):(v-=65536,y+=String.fromCharCode(55296|v>>10,56320|1023&v))}}else y+=String.fromCharCode(v)}return y},Se=(l,p)=>(l>>>=0)?Ss(q(),l,p):"";function Is(l,p,f){return o?$e(3,1,l,p,f):0}function Es(l,p){if(o)return $e(4,1,l,p)}function ks(l,p){if(o)return $e(5,1,l,p)}function As(l,p,f){if(o)return $e(6,1,l,p,f)}function zs(l,p,f){return o?$e(7,1,l,p,f):0}function Os(l,p){if(o)return $e(8,1,l,p)}function Rs(l,p,f){if(o)return $e(9,1,l,p,f)}function Ms(l,p,f,y){if(o)return $e(10,1,l,p,f,y)}function Ds(l,p,f,y){if(o)return $e(11,1,l,p,f,y)}function Bs(l,p,f,y){if(o)return $e(12,1,l,p,f,y)}function Ns(l){if(o)return $e(13,1,l)}function Ps(l,p){if(o)return $e(14,1,l,p)}function Ls(l,p,f){if(o)return $e(15,1,l,p,f)}var Us,Bm=()=>ht(""),et=l=>{for(var p="";q()[l>>>0];)p+=Us[q()[l++>>>0]];return p},Dr={},Br={},Nm={},Yt=i.BindingError=class extends Error{constructor(l){super(l),this.name="BindingError"}};function at(l,p,f={}){return(function(y,v,S={}){var A=v.name;if(!y)throw new Yt(`type "${A}" must have a positive integer typeid pointer`);if(Br.hasOwnProperty(y)){if(S.Tb)return;throw new Yt(`Cannot register type '${A}' twice`)}Br[y]=v,delete Nm[y],Dr.hasOwnProperty(y)&&(v=Dr[y],delete Dr[y],v.forEach(R=>R()))})(l,p,f)}var Ws=(l,p,f)=>{switch(p){case 1:return f?y=>P()[y>>>0]:y=>q()[y>>>0];case 2:return f?y=>ie()[y>>>1>>>0]:y=>pe()[y>>>1>>>0];case 4:return f?y=>N()[y>>>2>>>0]:y=>ue()[y>>>2>>>0];case 8:return f?y=>j[y>>>3]:y=>H[y>>>3];default:throw new TypeError(`invalid integer width (${p}): ${l}`)}};function Pm(l,p,f){f>>>=0,at(l>>>=0,{name:p=et(p>>>0),fromWireType:y=>y,toWireType:function(y,v){if(typeof v!="bigint"&&typeof v!="number")throw v=v===null?"null":(y=typeof v)=="object"||y==="array"||y==="function"?v.toString():""+v,new TypeError(`Cannot convert "${v}" to ${this.name}`);return typeof v=="number"&&(v=BigInt(v)),v},Cb:gt,readValueFromPointer:Ws(p,f,p.indexOf("u")==-1),Eb:null})}var gt=8;function Lm(l,p,f,y){at(l>>>=0,{name:p=et(p>>>0),fromWireType:function(v){return!!v},toWireType:function(v,S){return S?f:y},Cb:gt,readValueFromPointer:function(v){return this.fromWireType(q()[v>>>0])},Eb:null})}var Nr=[],st=[];function Pr(l){9<(l>>>=0)&&--st[l+1]==0&&(st[l]=void 0,Nr.push(l))}var De=l=>{if(!l)throw new Yt(`Cannot use deleted val. handle = ${l}`);return st[l]},Ve=l=>{switch(l){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let p=Nr.pop()||st.length;return st[p]=l,st[p+1]=1,p}};function Lr(l){return this.fromWireType(ue()[l>>>2>>>0])}var Um={name:"emscripten::val",fromWireType:l=>{var p=De(l);return Pr(l),p},toWireType:(l,p)=>Ve(p),Cb:gt,readValueFromPointer:Lr,Eb:null};function Wm(l){return at(l>>>0,Um)}var Vm=(l,p)=>{switch(p){case 4:return function(f){return this.fromWireType(Me()[f>>>2>>>0])};case 8:return function(f){return this.fromWireType(ge()[f>>>3>>>0])};default:throw new TypeError(`invalid float width (${p}): ${l}`)}};function qm(l,p,f){f>>>=0,at(l>>>=0,{name:p=et(p>>>0),fromWireType:y=>y,toWireType:(y,v)=>v,Cb:gt,readValueFromPointer:Vm(p,f),Eb:null})}function Fm(l,p,f,y,v){if(l>>>=0,f>>>=0,p=et(p>>>0),v===-1&&(v=4294967295),v=R=>R,y===0){var S=32-8*f;v=R=>R<<S>>>S}var A=p.includes("unsigned")?function(R,L){return L>>>0}:function(R,L){return L};at(l,{name:p,fromWireType:v,toWireType:A,Cb:gt,readValueFromPointer:Ws(p,f,y!==0),Eb:null})}function Gm(l,p,f){function y(S){var A=ue()[S>>>2>>>0];return S=ue()[S+4>>>2>>>0],new v(P().buffer,S,A)}var v=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][p];at(l>>>=0,{name:f=et(f>>>0),fromWireType:y,Cb:gt,readValueFromPointer:y},{Tb:!0})}var zt=(l,p,f)=>{var y=q();if(p>>>=0,0<f){var v=p;f=p+f-1;for(var S=0;S<l.length;++S){var A=l.charCodeAt(S);if(55296<=A&&57343>=A&&(A=65536+((1023&A)<<10)|1023&l.charCodeAt(++S)),127>=A){if(p>=f)break;y[p++>>>0]=A}else{if(2047>=A){if(p+1>=f)break;y[p++>>>0]=192|A>>6}else{if(65535>=A){if(p+2>=f)break;y[p++>>>0]=224|A>>12}else{if(p+3>=f)break;y[p++>>>0]=240|A>>18,y[p++>>>0]=128|A>>12&63}y[p++>>>0]=128|A>>6&63}y[p++>>>0]=128|63&A}}y[p>>>0]=0,l=p-v}else l=0;return l},Ur=l=>{for(var p=0,f=0;f<l.length;++f){var y=l.charCodeAt(f);127>=y?p++:2047>=y?p+=2:55296<=y&&57343>=y?(p+=4,++f):p+=3}return p};function jm(l,p){at(l>>>=0,{name:p=et(p>>>0),fromWireType:function(f){for(var y,v=ue()[f>>>2>>>0],S=f+4,A=S,R=0;R<=v;++R){var L=S+R;R!=v&&q()[L>>>0]!=0||(A=Se(A,L-A),y===void 0?y=A:(y+="\0",y+=A),A=L+1)}return ot(f),y},toWireType:function(f,y){y instanceof ArrayBuffer&&(y=new Uint8Array(y));var v=typeof y=="string";if(!(v||ArrayBuffer.isView(y)&&y.BYTES_PER_ELEMENT==1))throw new Yt("Cannot pass non-string to std::string");var S=v?Ur(y):y.length,A=Ki(4+S+1),R=A+4;return ue()[A>>>2>>>0]=S,v?zt(y,R,S+1):q().set(y,R>>>0),f!==null&&f.push(ot,A),A},Cb:gt,readValueFromPointer:Lr,Eb(f){ot(f)}})}var Vs=typeof TextDecoder<"u"?new TextDecoder("utf-16le"):void 0,Hm=(l,p)=>{for(var f=l>>1,y=f+p/2;!(f>=y)&&pe()[f>>>0];)++f;if(32<(f<<=1)-l&&Vs)return Vs.decode(q().slice(l,f));for(f="",y=0;!(y>=p/2);++y){var v=ie()[l+2*y>>>1>>>0];if(v==0)break;f+=String.fromCharCode(v)}return f},Km=(l,p,f)=>{if(f??=2147483647,2>f)return 0;var y=p;f=(f-=2)<2*l.length?f/2:l.length;for(var v=0;v<f;++v){var S=l.charCodeAt(v);ie()[p>>>1>>>0]=S,p+=2}return ie()[p>>>1>>>0]=0,p-y},Ym=l=>2*l.length,Xm=(l,p)=>{for(var f=0,y="";!(f>=p/4);){var v=N()[l+4*f>>>2>>>0];if(v==0)break;++f,65536<=v?(v-=65536,y+=String.fromCharCode(55296|v>>10,56320|1023&v)):y+=String.fromCharCode(v)}return y},Zm=(l,p,f)=>{if(p>>>=0,f??=2147483647,4>f)return 0;var y=p;f=y+f-4;for(var v=0;v<l.length;++v){var S=l.charCodeAt(v);if(55296<=S&&57343>=S&&(S=65536+((1023&S)<<10)|1023&l.charCodeAt(++v)),N()[p>>>2>>>0]=S,(p+=4)+4>f)break}return N()[p>>>2>>>0]=0,p-y},Qm=l=>{for(var p=0,f=0;f<l.length;++f){var y=l.charCodeAt(f);55296<=y&&57343>=y&&++f,p+=4}return p};function Jm(l,p,f){if(l>>>=0,p>>>=0,f=et(f>>>=0),p===2)var y=Hm,v=Km,S=Ym,A=R=>pe()[R>>>1>>>0];else p===4&&(y=Xm,v=Zm,S=Qm,A=R=>ue()[R>>>2>>>0]);at(l,{name:f,fromWireType:R=>{for(var L,G=ue()[R>>>2>>>0],Q=R+4,re=0;re<=G;++re){var de=R+4+re*p;re!=G&&A(de)!=0||(Q=y(Q,de-Q),L===void 0?L=Q:(L+="\0",L+=Q),Q=de+p)}return ot(R),L},toWireType:(R,L)=>{if(typeof L!="string")throw new Yt(`Cannot pass non-string to C++ string type ${f}`);var G=S(L),Q=Ki(4+G+p);return ue()[Q>>>2>>>0]=G/p,v(L,Q+4,G+p),R!==null&&R.push(ot,Q),Q},Cb:gt,readValueFromPointer:Lr,Eb(R){ot(R)}})}function eg(l,p){at(l>>>=0,{Ub:!0,name:p=et(p>>>0),Cb:0,fromWireType:()=>{},toWireType:()=>{}})}function tg(l){Xr(l>>>0,!s,1,!a,131072,!1),ws()}var Wr=l=>{if(!X)try{if(l(),!(0<ft))try{o?Zr(C):Mr(C)}catch(p){p instanceof zr||p=="unwind"||_(0,p)}}catch(p){p instanceof zr||p=="unwind"||_(0,p)}};function Vr(l){l>>>=0,typeof Atomics.jc=="function"&&(Atomics.jc(N(),l>>>2,l).value.then(Ui),l+=128,Atomics.store(N(),l>>>2,1))}var Ui=()=>{var l=Yr();l&&(Vr(l),Wr(yo))};function ig(l,p){(l>>>=0)==p>>>0?setTimeout(Ui):o?postMessage({Hb:l,Db:"checkMailbox"}):(l=At[l])&&l.postMessage({Db:"checkMailbox"})}var qr=[];function rg(l,p,f,y,v){for(p>>>=0,y/=2,qr.length=y,f=v>>>0>>>3,v=0;v<y;v++)qr[v]=j[f+2*v]?j[f+2*v+1]:ge()[f+2*v+1>>>0];return(p?Kr[p]:Xg[l])(...qr)}var ng=()=>{ft=0};function ag(l){l>>>=0,o?postMessage({Db:"cleanupThread",ic:l}):bs(At[l])}function sg(l){}var Wi=(l,p)=>{var f=Br[l];if(f===void 0)throw l=co(l),f=et(l),ot(l),new Yt(`${p} has unknown type ${f}`);return f},qs=(l,p,f)=>{var y=[];return l=l.toWireType(y,f),y.length&&(ue()[p>>>2>>>0]=Ve(y)),l};function og(l,p,f){return p>>>=0,f>>>=0,l=De(l>>>0),p=Wi(p,"emval::as"),qs(p,f,l)}function lg(l,p){return p>>>=0,l=De(l>>>0),(p=Wi(p,"emval::as")).toWireType(null,l)}var Vi=l=>{try{l()}catch(p){ht(p)}},_t=0,tt=null,Fs=0,qi=[],Gs={},js={},ug=0,Fr=null,dg=[];function Hs(l){return(function(p){if(!X){if(_t===0){var f=!1,y=!1;p((v=0)=>{if(!X&&(Fs=v,f=!0,y)){_t=2,Vi(()=>xo(tt)),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.resume(),v=!1;try{var S=(function(){var L=N()[tt+8>>>2>>>0];return L=D[js[L]],--ft,L()})()}catch(L){S=L,v=!0}var A=!1;if(!tt){var R=Fr;R&&(Fr=null,(v?R.reject:R.resolve)(S),A=!0)}if(v&&!A)throw S}}),y=!0,f||(_t=1,tt=(function(){var v=Ki(65548),S=v+12;ue()[v>>>2>>>0]=S,ue()[v+4>>>2>>>0]=S+65536,S=qi[0];var A=Gs[S];return A===void 0&&(A=ug++,Gs[S]=A,js[A]=S),S=A,N()[v+8>>>2>>>0]=S,v})(),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.pause(),Vi(()=>vo(tt)))}else _t===2?(_t=0,Vi(Co),ot(tt),tt=null,dg.forEach(Wr)):ht(`invalid state: ${_t}`);return Fs}})(p=>{l().then(p)})}function pg(l){return l>>>=0,Hs(async()=>{var p=await De(l);return Ve(p)})}var Fi=[];function cg(l,p,f,y){return f>>>=0,y>>>=0,(l=Fi[l>>>0])(null,p=De(p>>>0),f,y)}var hg={},Gi=l=>{var p=hg[l];return p===void 0?et(l):p};function fg(l,p,f,y,v){return f>>>=0,y>>>=0,v>>>=0,(l=Fi[l>>>0])(p=De(p>>>0),p[f=Gi(f)],y,v)}function mg(l,p){return p>>>=0,(l=De(l>>>0))==De(p)}var Ks=()=>typeof globalThis=="object"?globalThis:Function("return this")();function gg(l){return(l>>>=0)==0?Ve(Ks()):(l=Gi(l),Ve(Ks()[l]))}var _g=l=>{var p=Fi.length;return Fi.push(l),p},yg=(l,p)=>{for(var f=Array(l),y=0;y<l;++y)f[y]=Wi(ue()[p+4*y>>>2>>>0],`parameter ${y}`);return f};function bg(l,p,f){var y=(p=yg(l,p>>>0)).shift();l--;var v=`return function (obj, func, destructorsRef, args) {
`,S=0,A=[];f===0&&A.push("obj");for(var R=["retType"],L=[y],G=0;G<l;++G)A.push(`arg${G}`),R.push(`argType${G}`),L.push(p[G]),v+=`  var arg${G} = argType${G}.readValueFromPointer(args${S?"+"+S:""});
`,S+=p[G].Cb;return v+=`  var rv = ${f===1?"new func":"func.call"}(${A.join(", ")});
`,y.Ub||(R.push("emval_returnValue"),L.push(qs),v+=`  return emval_returnValue(retType, destructorsRef, rv);
`),l=new Function(...R,v+`};
`)(...L),f=`methodCaller<(${p.map(Q=>Q.name).join(", ")}) => ${y.name}>`,_g(Object.defineProperty(l,"name",{value:f}))}function wg(l){return l=Gi(l>>>0),Ve(i[l])}function vg(l,p){return p>>>=0,l=De(l>>>0),p=De(p),Ve(l[p])}function $g(l){9<(l>>>=0)&&(st[l+1]+=1)}function xg(){return Ve([])}function Cg(l){l=De(l>>>0);for(var p=Array(l.length),f=0;f<l.length;f++)p[f]=l[f];return Ve(p)}function Tg(l){return Ve(Gi(l>>>0))}function Sg(){return Ve({})}function Ig(l){for(var p=De(l>>>=0);p.length;){var f=p.pop();p.pop()(f)}Pr(l)}function Eg(l,p,f){p>>>=0,f>>>=0,l=De(l>>>0),p=De(p),f=De(f),l[p]=f}function kg(l,p){return p>>>=0,l=(l=Wi(l>>>0,"_emval_take_value")).readValueFromPointer(p),Ve(l)}function Ag(l,p){l=-9007199254740992>l||9007199254740992<l?NaN:Number(l),p>>>=0,l=new Date(1e3*l),N()[p>>>2>>>0]=l.getUTCSeconds(),N()[p+4>>>2>>>0]=l.getUTCMinutes(),N()[p+8>>>2>>>0]=l.getUTCHours(),N()[p+12>>>2>>>0]=l.getUTCDate(),N()[p+16>>>2>>>0]=l.getUTCMonth(),N()[p+20>>>2>>>0]=l.getUTCFullYear()-1900,N()[p+24>>>2>>>0]=l.getUTCDay(),l=(l.getTime()-Date.UTC(l.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,N()[p+28>>>2>>>0]=l}var Ys=l=>l%4==0&&(l%100!=0||l%400==0),Xs=[0,31,60,91,121,152,182,213,244,274,305,335],Zs=[0,31,59,90,120,151,181,212,243,273,304,334];function zg(l,p){l=-9007199254740992>l||9007199254740992<l?NaN:Number(l),p>>>=0,l=new Date(1e3*l),N()[p>>>2>>>0]=l.getSeconds(),N()[p+4>>>2>>>0]=l.getMinutes(),N()[p+8>>>2>>>0]=l.getHours(),N()[p+12>>>2>>>0]=l.getDate(),N()[p+16>>>2>>>0]=l.getMonth(),N()[p+20>>>2>>>0]=l.getFullYear()-1900,N()[p+24>>>2>>>0]=l.getDay();var f=(Ys(l.getFullYear())?Xs:Zs)[l.getMonth()]+l.getDate()-1|0;N()[p+28>>>2>>>0]=f,N()[p+36>>>2>>>0]=-60*l.getTimezoneOffset(),f=new Date(l.getFullYear(),6,1).getTimezoneOffset();var y=new Date(l.getFullYear(),0,1).getTimezoneOffset();l=0|(f!=y&&l.getTimezoneOffset()==Math.min(y,f)),N()[p+32>>>2>>>0]=l}function Og(l){l>>>=0;var p=new Date(N()[l+20>>>2>>>0]+1900,N()[l+16>>>2>>>0],N()[l+12>>>2>>>0],N()[l+8>>>2>>>0],N()[l+4>>>2>>>0],N()[l>>>2>>>0],0),f=N()[l+32>>>2>>>0],y=p.getTimezoneOffset(),v=new Date(p.getFullYear(),6,1).getTimezoneOffset(),S=new Date(p.getFullYear(),0,1).getTimezoneOffset(),A=Math.min(S,v);return 0>f?N()[l+32>>>2>>>0]=+(v!=S&&A==y):0<f!=(A==y)&&(v=Math.max(S,v),p.setTime(p.getTime()+6e4*((0<f?A:v)-y))),N()[l+24>>>2>>>0]=p.getDay(),f=(Ys(p.getFullYear())?Xs:Zs)[p.getMonth()]+p.getDate()-1|0,N()[l+28>>>2>>>0]=f,N()[l>>>2>>>0]=p.getSeconds(),N()[l+4>>>2>>>0]=p.getMinutes(),N()[l+8>>>2>>>0]=p.getHours(),N()[l+12>>>2>>>0]=p.getDate(),N()[l+16>>>2>>>0]=p.getMonth(),N()[l+20>>>2>>>0]=p.getYear(),l=p.getTime(),BigInt(isNaN(l)?-1:l/1e3)}function Qs(l,p,f,y,v,S,A){return o?$e(16,1,l,p,f,y,v,S,A):-52}function Js(l,p,f,y,v,S){if(o)return $e(17,1,l,p,f,y,v,S)}var pi={},Rg=()=>performance.timeOrigin+performance.now();function eo(l,p){if(o)return $e(18,1,l,p);if(pi[l]&&(clearTimeout(pi[l].id),delete pi[l]),!p)return 0;var f=setTimeout(()=>{delete pi[l],Wr(()=>_o(l,performance.timeOrigin+performance.now()))},p);return pi[l]={id:f,rc:p},0}function Mg(l,p,f,y){l>>>=0,p>>>=0,f>>>=0,y>>>=0;var v=new Date().getFullYear(),S=new Date(v,0,1).getTimezoneOffset();v=new Date(v,6,1).getTimezoneOffset();var A=Math.max(S,v);ue()[l>>>2>>>0]=60*A,N()[p>>>2>>>0]=+(S!=v),l=(p=R=>{var L=Math.abs(R);return`UTC${0<=R?"-":"+"}${String(Math.floor(L/60)).padStart(2,"0")}${String(L%60).padStart(2,"0")}`})(S),p=p(v),v<S?(zt(l,f,17),zt(p,y,17)):(zt(l,y,17),zt(p,f,17))}var Dg=()=>Date.now(),Bg=1;function Ng(l,p,f){if(!(0<=l&&3>=l))return 28;if(l===0)l=Date.now();else{if(!Bg)return 52;l=performance.timeOrigin+performance.now()}return j[f>>>0>>>3]=BigInt(Math.round(1e6*l)),0}var Gr=[],to=(l,p)=>{Gr.length=0;for(var f;f=q()[l++>>>0];){var y=f!=105;p+=(y&=f!=112)&&p%8?4:0,Gr.push(f==112?ue()[p>>>2>>>0]:f==106?j[p>>>3]:f==105?N()[p>>>2>>>0]:ge()[p>>>3>>>0]),p+=y?8:4}return Gr};function Pg(l,p,f){return l>>>=0,p=to(p>>>0,f>>>0),Kr[l](...p)}function Lg(l,p,f){return l>>>=0,p=to(p>>>0,f>>>0),Kr[l](...p)}var Ug=()=>{};function Wg(l,p){return ae(Se(l>>>0,p>>>0))}var Vg=()=>{throw ft+=1,"unwind"};function qg(){return 4294901760}var Fg=()=>navigator.hardwareConcurrency;function Gg(){return ht("Cannot use emscripten_pc_get_function without -sUSE_OFFSET_CONVERTER"),0}function jg(l){l>>>=0;var p=q().length;if(l<=p||4294901760<l)return!1;for(var f=1;4>=f;f*=2){var y=p*(1+.2/f);y=Math.min(y,l+100663296);e:{y=(Math.min(4294901760,65536*Math.ceil(Math.max(l,y)/65536))-$.buffer.byteLength+65535)/65536|0;try{$.grow(y),Ae();var v=1;break e}catch{}v=void 0}if(v)return!0}return!1}var ji=()=>(ht("Cannot use convertFrameToPC (needed by __builtin_return_address) without -sUSE_OFFSET_CONVERTER"),0),Xt={},io=l=>{l.forEach(p=>{var f=ji();f&&(Xt[f]=p)})};function Hg(){var l=Error().stack.toString().split(`
`);return l[0]=="Error"&&l.shift(),io(l),Xt.Mb=ji(),Xt.dc=l,Xt.Mb}function Kg(l,p,f){if(l>>>=0,p>>>=0,Xt.Mb==l)var y=Xt.dc;else(y=Error().stack.toString().split(`
`))[0]=="Error"&&y.shift(),io(y);for(var v=3;y[v]&&ji()!=l;)++v;for(l=0;l<f&&y[l+v];++l)N()[p+4*l>>>2>>>0]=ji();return l}var jr,Hr={},ro=()=>{if(!jr){var l,p={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:"./this.program"};for(l in Hr)Hr[l]===void 0?delete p[l]:p[l]=Hr[l];var f=[];for(l in p)f.push(`${l}=${p[l]}`);jr=f}return jr};function no(l,p){if(o)return $e(19,1,l,p);l>>>=0,p>>>=0;var f,y=0,v=0;for(f of ro()){var S=p+y;ue()[l+v>>>2>>>0]=S,y+=zt(f,S,1/0)+1,v+=4}return 0}function ao(l,p){if(o)return $e(20,1,l,p);l>>>=0,p>>>=0;var f=ro();for(var y of(ue()[l>>>2>>>0]=f.length,l=0,f))l+=Ur(y)+1;return ue()[p>>>2>>>0]=l,0}function so(l){return o?$e(21,1,l):52}function oo(l,p,f,y){return o?$e(22,1,l,p,f,y):52}function lo(l,p,f,y){return o?$e(23,1,l,p,f,y):70}var Yg=[null,[],[]];function uo(l,p,f,y){if(o)return $e(24,1,l,p,f,y);p>>>=0,f>>>=0,y>>>=0;for(var v=0,S=0;S<f;S++){var A=ue()[p>>>2>>>0],R=ue()[p+4>>>2>>>0];p+=8;for(var L=0;L<R;L++){var G=l,Q=q()[A+L>>>0],re=Yg[G];Q===0||Q===10?((G===1?Y:ae)(Ss(re)),re.length=0):re.push(Q)}v+=R}return ue()[y>>>2>>>0]=v,0}o||(function(){for(var l=i.numThreads-1;l--;)$s();Or.push(()=>{rt++,(function(p){o?p():Promise.all(mt.map(vs)).then(p)})(()=>kt())})})();for(var po=Array(256),Hi=0;256>Hi;++Hi)po[Hi]=String.fromCharCode(Hi);Us=po,st.push(0,1,void 0,1,null,1,!0,1,!1,1),i.count_emval_handles=()=>st.length/2-5-Nr.length,o||($=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),Ae()),i.wasmBinary&&(x=i.wasmBinary),i.stackSave=()=>Jr(),i.stackRestore=l=>Yi(l),i.stackAlloc=l=>Qr(l),i.setValue=function(l,p,f="i8"){switch(f.endsWith("*")&&(f="*"),f){case"i1":case"i8":P()[l>>>0]=p;break;case"i16":ie()[l>>>1>>>0]=p;break;case"i32":N()[l>>>2>>>0]=p;break;case"i64":j[l>>>3]=BigInt(p);break;case"float":Me()[l>>>2>>>0]=p;break;case"double":ge()[l>>>3>>>0]=p;break;case"*":ue()[l>>>2>>>0]=p;break;default:ht(`invalid type for setValue: ${f}`)}},i.getValue=function(l,p="i8"){switch(p.endsWith("*")&&(p="*"),p){case"i1":case"i8":return P()[l>>>0];case"i16":return ie()[l>>>1>>>0];case"i32":return N()[l>>>2>>>0];case"i64":return j[l>>>3];case"float":return Me()[l>>>2>>>0];case"double":return ge()[l>>>3>>>0];case"*":return ue()[l>>>2>>>0];default:ht(`invalid type for getValue: ${p}`)}},i.UTF8ToString=Se,i.stringToUTF8=zt,i.lengthBytesUTF8=Ur;var Xg=[Rr,_s,xs,Is,Es,ks,As,zs,Os,Rs,Ms,Ds,Bs,Ns,Ps,Ls,Qs,Js,eo,no,ao,so,oo,lo,uo],Kr={893836:(l,p,f,y,v)=>{if(i===void 0||!i.Fb)return 1;if((l=Se(Number(l>>>0))).startsWith("./")&&(l=l.substring(2)),!(l=i.Fb.get(l)))return 2;if(p=Number(p>>>0),f=Number(f>>>0),y=Number(y>>>0),p+f>l.byteLength)return 3;try{let S=l.subarray(p,p+f);switch(v){case 0:q().set(S,y>>>0);break;case 1:i.mc?i.mc(y,S):i.cc(y,S);break;default:return 4}return 0}catch{return 4}},894660:(l,p,f)=>{i.Pb(l,q().subarray(p>>>0,p+f>>>0))},894724:()=>i.oc(),894766:l=>{i.Ob(l)},894803:()=>{i.Wb()},894834:()=>{i.Xb()},894863:()=>{i.ac()},894888:l=>i.Vb(l),894921:l=>i.Zb(l),894953:(l,p,f)=>{i.Lb(Number(l),Number(p),Number(f),!0)},895016:(l,p,f)=>{i.Lb(Number(l),Number(p),Number(f))},895073:()=>typeof wasmOffsetConverter<"u",895130:l=>{i.Ab("Abs",l,void 0)},895181:l=>{i.Ab("Neg",l,void 0)},895232:l=>{i.Ab("Floor",l,void 0)},895285:l=>{i.Ab("Ceil",l,void 0)},895337:l=>{i.Ab("Reciprocal",l,void 0)},895395:l=>{i.Ab("Sqrt",l,void 0)},895447:l=>{i.Ab("Exp",l,void 0)},895498:l=>{i.Ab("Erf",l,void 0)},895549:l=>{i.Ab("Sigmoid",l,void 0)},895604:(l,p,f)=>{i.Ab("HardSigmoid",l,{alpha:p,beta:f})},895683:l=>{i.Ab("Log",l,void 0)},895734:l=>{i.Ab("Sin",l,void 0)},895785:l=>{i.Ab("Cos",l,void 0)},895836:l=>{i.Ab("Tan",l,void 0)},895887:l=>{i.Ab("Asin",l,void 0)},895939:l=>{i.Ab("Acos",l,void 0)},895991:l=>{i.Ab("Atan",l,void 0)},896043:l=>{i.Ab("Sinh",l,void 0)},896095:l=>{i.Ab("Cosh",l,void 0)},896147:l=>{i.Ab("Asinh",l,void 0)},896200:l=>{i.Ab("Acosh",l,void 0)},896253:l=>{i.Ab("Atanh",l,void 0)},896306:l=>{i.Ab("Tanh",l,void 0)},896358:l=>{i.Ab("Not",l,void 0)},896409:(l,p,f)=>{i.Ab("Clip",l,{min:p,max:f})},896478:l=>{i.Ab("Clip",l,void 0)},896530:(l,p)=>{i.Ab("Elu",l,{alpha:p})},896588:l=>{i.Ab("Gelu",l,void 0)},896640:l=>{i.Ab("Relu",l,void 0)},896692:(l,p)=>{i.Ab("LeakyRelu",l,{alpha:p})},896756:(l,p)=>{i.Ab("ThresholdedRelu",l,{alpha:p})},896826:(l,p)=>{i.Ab("Cast",l,{to:p})},896884:l=>{i.Ab("Add",l,void 0)},896935:l=>{i.Ab("Sub",l,void 0)},896986:l=>{i.Ab("Mul",l,void 0)},897037:l=>{i.Ab("Div",l,void 0)},897088:l=>{i.Ab("Pow",l,void 0)},897139:l=>{i.Ab("Equal",l,void 0)},897192:l=>{i.Ab("Greater",l,void 0)},897247:l=>{i.Ab("GreaterOrEqual",l,void 0)},897309:l=>{i.Ab("Less",l,void 0)},897361:l=>{i.Ab("LessOrEqual",l,void 0)},897420:(l,p,f,y,v)=>{i.Ab("ReduceMean",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},897595:(l,p,f,y,v)=>{i.Ab("ReduceMax",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},897769:(l,p,f,y,v)=>{i.Ab("ReduceMin",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},897943:(l,p,f,y,v)=>{i.Ab("ReduceProd",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},898118:(l,p,f,y,v)=>{i.Ab("ReduceSum",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},898292:(l,p,f,y,v)=>{i.Ab("ReduceL1",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},898465:(l,p,f,y,v)=>{i.Ab("ReduceL2",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},898638:(l,p,f,y,v)=>{i.Ab("ReduceLogSum",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},898815:(l,p,f,y,v)=>{i.Ab("ReduceSumSquare",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},898995:(l,p,f,y,v)=>{i.Ab("ReduceLogSumExp",l,{keepDims:!!p,noopWithEmptyAxes:!!f,axes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},899175:l=>{i.Ab("Where",l,void 0)},899228:(l,p,f)=>{i.Ab("Transpose",l,{perm:p?Array.from(N().subarray(Number(p)>>>0,Number(f)>>>0)):[]})},899352:(l,p,f,y)=>{i.Ab("DepthToSpace",l,{blocksize:p,mode:Se(f),format:y?"NHWC":"NCHW"})},899485:(l,p,f,y)=>{i.Ab("DepthToSpace",l,{blocksize:p,mode:Se(f),format:y?"NHWC":"NCHW"})},899618:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie)=>{i.Ab("ConvTranspose",l,{format:L?"NHWC":"NCHW",autoPad:p,dilations:[f],group:y,kernelShape:[v],pads:[S,A],strides:[R],wIsConst:()=>!!P()[G>>>0],outputPadding:Q?Array.from(N().subarray(Number(Q)>>>0,Number(re)>>>0)):[],outputShape:de?Array.from(N().subarray(Number(de)>>>0,Number(_e)>>>0)):[],activation:Se(Ie)})},900051:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e)=>{i.Ab("ConvTranspose",l,{format:R?"NHWC":"NCHW",autoPad:p,dilations:Array.from(N().subarray(Number(f)>>>0,2+(Number(f)>>>0)>>>0)),group:y,kernelShape:Array.from(N().subarray(Number(v)>>>0,2+(Number(v)>>>0)>>>0)),pads:Array.from(N().subarray(Number(S)>>>0,4+(Number(S)>>>0)>>>0)),strides:Array.from(N().subarray(Number(A)>>>0,2+(Number(A)>>>0)>>>0)),wIsConst:()=>!!P()[L>>>0],outputPadding:G?Array.from(N().subarray(Number(G)>>>0,Number(Q)>>>0)):[],outputShape:re?Array.from(N().subarray(Number(re)>>>0,Number(de)>>>0)):[],activation:Se(_e)})},900712:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie)=>{i.Ab("ConvTranspose",l,{format:L?"NHWC":"NCHW",autoPad:p,dilations:[f],group:y,kernelShape:[v],pads:[S,A],strides:[R],wIsConst:()=>!!P()[G>>>0],outputPadding:Q?Array.from(N().subarray(Number(Q)>>>0,Number(re)>>>0)):[],outputShape:de?Array.from(N().subarray(Number(de)>>>0,Number(_e)>>>0)):[],activation:Se(Ie)})},901145:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e)=>{i.Ab("ConvTranspose",l,{format:R?"NHWC":"NCHW",autoPad:p,dilations:Array.from(N().subarray(Number(f)>>>0,2+(Number(f)>>>0)>>>0)),group:y,kernelShape:Array.from(N().subarray(Number(v)>>>0,2+(Number(v)>>>0)>>>0)),pads:Array.from(N().subarray(Number(S)>>>0,4+(Number(S)>>>0)>>>0)),strides:Array.from(N().subarray(Number(A)>>>0,2+(Number(A)>>>0)>>>0)),wIsConst:()=>!!P()[L>>>0],outputPadding:G?Array.from(N().subarray(Number(G)>>>0,Number(Q)>>>0)):[],outputShape:re?Array.from(N().subarray(Number(re)>>>0,Number(de)>>>0)):[],activation:Se(_e)})},901806:(l,p)=>{i.Ab("GlobalAveragePool",l,{format:p?"NHWC":"NCHW"})},901897:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e)=>{i.Ab("AveragePool",l,{format:_e?"NHWC":"NCHW",auto_pad:p,ceil_mode:f,count_include_pad:y,storage_order:v,dilations:S?Array.from(N().subarray(Number(S)>>>0,Number(A)>>>0)):[],kernel_shape:R?Array.from(N().subarray(Number(R)>>>0,Number(L)>>>0)):[],pads:G?Array.from(N().subarray(Number(G)>>>0,Number(Q)>>>0)):[],strides:re?Array.from(N().subarray(Number(re)>>>0,Number(de)>>>0)):[]})},902376:(l,p)=>{i.Ab("GlobalAveragePool",l,{format:p?"NHWC":"NCHW"})},902467:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e)=>{i.Ab("AveragePool",l,{format:_e?"NHWC":"NCHW",auto_pad:p,ceil_mode:f,count_include_pad:y,storage_order:v,dilations:S?Array.from(N().subarray(Number(S)>>>0,Number(A)>>>0)):[],kernel_shape:R?Array.from(N().subarray(Number(R)>>>0,Number(L)>>>0)):[],pads:G?Array.from(N().subarray(Number(G)>>>0,Number(Q)>>>0)):[],strides:re?Array.from(N().subarray(Number(re)>>>0,Number(de)>>>0)):[]})},902946:(l,p)=>{i.Ab("GlobalMaxPool",l,{format:p?"NHWC":"NCHW"})},903033:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e)=>{i.Ab("MaxPool",l,{format:_e?"NHWC":"NCHW",auto_pad:p,ceil_mode:f,count_include_pad:y,storage_order:v,dilations:S?Array.from(N().subarray(Number(S)>>>0,Number(A)>>>0)):[],kernel_shape:R?Array.from(N().subarray(Number(R)>>>0,Number(L)>>>0)):[],pads:G?Array.from(N().subarray(Number(G)>>>0,Number(Q)>>>0)):[],strides:re?Array.from(N().subarray(Number(re)>>>0,Number(de)>>>0)):[]})},903508:(l,p)=>{i.Ab("GlobalMaxPool",l,{format:p?"NHWC":"NCHW"})},903595:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e)=>{i.Ab("MaxPool",l,{format:_e?"NHWC":"NCHW",auto_pad:p,ceil_mode:f,count_include_pad:y,storage_order:v,dilations:S?Array.from(N().subarray(Number(S)>>>0,Number(A)>>>0)):[],kernel_shape:R?Array.from(N().subarray(Number(R)>>>0,Number(L)>>>0)):[],pads:G?Array.from(N().subarray(Number(G)>>>0,Number(Q)>>>0)):[],strides:re?Array.from(N().subarray(Number(re)>>>0,Number(de)>>>0)):[]})},904070:(l,p,f,y,v)=>{i.Ab("Gemm",l,{alpha:p,beta:f,transA:y,transB:v})},904174:l=>{i.Ab("MatMul",l,void 0)},904228:(l,p,f,y)=>{i.Ab("ArgMax",l,{keepDims:!!p,selectLastIndex:!!f,axis:y})},904336:(l,p,f,y)=>{i.Ab("ArgMin",l,{keepDims:!!p,selectLastIndex:!!f,axis:y})},904444:(l,p)=>{i.Ab("Softmax",l,{axis:p})},904507:(l,p)=>{i.Ab("Concat",l,{axis:p})},904567:(l,p,f,y,v)=>{i.Ab("Split",l,{axis:p,numOutputs:f,splitSizes:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},904723:l=>{i.Ab("Expand",l,void 0)},904777:(l,p)=>{i.Ab("Gather",l,{axis:Number(p)})},904848:(l,p)=>{i.Ab("GatherElements",l,{axis:Number(p)})},904927:(l,p)=>{i.Ab("GatherND",l,{batch_dims:Number(p)})},905006:(l,p,f,y,v,S,A,R,L,G,Q)=>{i.Ab("Resize",l,{antialias:p,axes:f?Array.from(N().subarray(Number(f)>>>0,Number(y)>>>0)):[],coordinateTransformMode:Se(v),cubicCoeffA:S,excludeOutside:A,extrapolationValue:R,keepAspectRatioPolicy:Se(L),mode:Se(G),nearestMode:Se(Q)})},905368:(l,p,f,y,v,S,A)=>{i.Ab("Slice",l,{starts:p?Array.from(N().subarray(Number(p)>>>0,Number(f)>>>0)):[],ends:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[],axes:S?Array.from(N().subarray(Number(S)>>>0,Number(A)>>>0)):[]})},905632:l=>{i.Ab("Tile",l,void 0)},905684:(l,p,f)=>{i.Ab("InstanceNormalization",l,{epsilon:p,format:f?"NHWC":"NCHW"})},905798:(l,p,f)=>{i.Ab("InstanceNormalization",l,{epsilon:p,format:f?"NHWC":"NCHW"})},905912:l=>{i.Ab("Range",l,void 0)},905965:(l,p)=>{i.Ab("Einsum",l,{equation:Se(p)})},906046:(l,p,f,y,v)=>{i.Ab("Pad",l,{mode:p,value:f,pads:y?Array.from(N().subarray(Number(y)>>>0,Number(v)>>>0)):[]})},906189:(l,p,f,y,v,S)=>{i.Ab("BatchNormalization",l,{epsilon:p,momentum:f,spatial:!!v,trainingMode:!!y,format:S?"NHWC":"NCHW"})},906358:(l,p,f,y,v,S)=>{i.Ab("BatchNormalization",l,{epsilon:p,momentum:f,spatial:!!v,trainingMode:!!y,format:S?"NHWC":"NCHW"})},906527:(l,p,f)=>{i.Ab("CumSum",l,{exclusive:Number(p),reverse:Number(f)})},906624:(l,p,f)=>{i.Ab("DequantizeLinear",l,{axis:p,blockSize:f})},906714:(l,p,f,y,v)=>{i.Ab("GridSample",l,{align_corners:p,mode:Se(f),padding_mode:Se(y),format:v?"NHWC":"NCHW"})},906884:(l,p,f,y,v)=>{i.Ab("GridSample",l,{align_corners:p,mode:Se(f),padding_mode:Se(y),format:v?"NHWC":"NCHW"})},907054:(l,p)=>{i.Ab("ScatterND",l,{reduction:Se(p)})},907139:(l,p,f,y,v,S,A,R,L)=>{i.Ab("Attention",l,{numHeads:p,isUnidirectional:f,maskFilterValue:y,scale:v,doRotary:S,qkvHiddenSizes:A?Array.from(N().subarray(Number(R)>>>0,Number(R)+A>>>0)):[],pastPresentShareBuffer:!!L})},907411:l=>{i.Ab("BiasAdd",l,void 0)},907466:l=>{i.Ab("BiasSplitGelu",l,void 0)},907527:l=>{i.Ab("FastGelu",l,void 0)},907583:(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe)=>{i.Ab("Conv",l,{format:re?"NHWC":"NCHW",auto_pad:p,dilations:f?Array.from(N().subarray(Number(f)>>>0,Number(y)>>>0)):[],group:v,kernel_shape:S?Array.from(N().subarray(Number(S)>>>0,Number(A)>>>0)):[],pads:R?Array.from(N().subarray(Number(R)>>>0,Number(L)>>>0)):[],strides:G?Array.from(N().subarray(Number(G)>>>0,Number(Q)>>>0)):[],w_is_const:()=>!!P()[Number(de)>>>0],activation:Se(_e),activation_params:Ie?Array.from(Me().subarray(Number(Ie)>>>0,Number(Pe)>>>0)):[]})},908167:l=>{i.Ab("Gelu",l,void 0)},908219:(l,p,f,y,v,S,A,R,L)=>{i.Ab("GroupQueryAttention",l,{numHeads:p,kvNumHeads:f,scale:y,softcap:v,doRotary:S,rotaryInterleaved:A,smoothSoftmax:R,localWindowSize:L})},908436:(l,p,f,y)=>{i.Ab("LayerNormalization",l,{axis:p,epsilon:f,simplified:!!y})},908547:(l,p,f,y)=>{i.Ab("LayerNormalization",l,{axis:p,epsilon:f,simplified:!!y})},908658:(l,p,f,y,v,S)=>{i.Ab("MatMulNBits",l,{k:p,n:f,accuracyLevel:y,bits:v,blockSize:S})},908785:(l,p,f,y,v,S)=>{i.Ab("MultiHeadAttention",l,{numHeads:p,isUnidirectional:f,maskFilterValue:y,scale:v,doRotary:S})},908944:(l,p)=>{i.Ab("QuickGelu",l,{alpha:p})},909008:(l,p,f,y,v)=>{i.Ab("RotaryEmbedding",l,{interleaved:!!p,numHeads:f,rotaryEmbeddingDim:y,scale:v})},909147:(l,p,f)=>{i.Ab("SkipLayerNormalization",l,{epsilon:p,simplified:!!f})},909249:(l,p,f)=>{i.Ab("SkipLayerNormalization",l,{epsilon:p,simplified:!!f})},909351:(l,p,f,y)=>{i.Ab("GatherBlockQuantized",l,{gatherAxis:p,quantizeAxis:f,blockSize:y})},909472:l=>{i.$b(l)},909506:(l,p)=>i.bc(Number(l),Number(p),i.Gb.ec,i.Gb.errors)};function Zg(l,p,f){return Hs(async()=>{await i.Yb(Number(l),Number(p),Number(f))})}function Qg(){return typeof wasmOffsetConverter<"u"}var D=await(async function(){function l(y,v){return D=y.exports,D=(function(){var S=D,A={};for(let[R,L]of Object.entries(S))A[R]=typeof L=="function"?(...G)=>{qi.push(R);try{return L(...G)}finally{X||(qi.pop(),tt&&_t===1&&qi.length===0&&(_t=0,ft+=1,Vi($o),typeof Fibers<"u"&&Fibers.sc()))}}:L;return A})(),D=(function(){var S=D,A=L=>G=>L(G)>>>0,R=L=>()=>L()>>>0;return(S=Object.assign({},S)).Ea=A(S.Ea),S.gb=R(S.gb),S.ib=A(S.ib),S.tb=A(S.tb),S.ub=R(S.ub),S.__cxa_get_exception_ptr=A(S.__cxa_get_exception_ptr),S})(),ys.push(D.jb),b=v,kt(),D}rt++;var p=fs();if(i.instantiateWasm)return new Promise(y=>{i.instantiateWasm(p,(v,S)=>{y(l(v,S))})});if(o)return new Promise(y=>{U=v=>{var S=new WebAssembly.Instance(v,fs());y(l(S,v))}});Et??=i.locateFile?i.locateFile?i.locateFile("ort-wasm-simd-threaded.jsep.wasm",w):w+"ort-wasm-simd-threaded.jsep.wasm":new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href;try{var f=await(async function(y){var v=Et;if(!x&&typeof WebAssembly.instantiateStreaming=="function"&&!me(v))try{var S=fetch(v,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(S,y)}catch(A){ae(`wasm streaming compile failed: ${A}`),ae("falling back to ArrayBuffer instantiation")}return(async function(A,R){try{var L=await(async function(G){if(!x)try{var Q=await h(G);return new Uint8Array(Q)}catch{}if(G==Et&&x)G=new Uint8Array(x);else{if(!m)throw"both async and sync fetching of the wasm failed";G=m(G)}return G})(A);return await WebAssembly.instantiate(L,R)}catch(G){ae(`failed to asynchronously prepare wasm: ${G}`),ht(G)}})(v,y)})(p);return l(f.instance,f.module)}catch(y){return r(y),Promise.reject(y)}})(),co=l=>(co=D.Ea)(l),ho=()=>(ho=D.Fa)();i._OrtInit=(l,p)=>(i._OrtInit=D.Ga)(l,p),i._OrtGetLastError=(l,p)=>(i._OrtGetLastError=D.Ha)(l,p),i._OrtCreateSessionOptions=(l,p,f,y,v,S,A,R,L,G)=>(i._OrtCreateSessionOptions=D.Ia)(l,p,f,y,v,S,A,R,L,G),i._OrtAppendExecutionProvider=(l,p,f,y,v)=>(i._OrtAppendExecutionProvider=D.Ja)(l,p,f,y,v),i._OrtAddFreeDimensionOverride=(l,p,f)=>(i._OrtAddFreeDimensionOverride=D.Ka)(l,p,f),i._OrtAddSessionConfigEntry=(l,p,f)=>(i._OrtAddSessionConfigEntry=D.La)(l,p,f),i._OrtReleaseSessionOptions=l=>(i._OrtReleaseSessionOptions=D.Ma)(l),i._OrtCreateSession=(l,p,f)=>(i._OrtCreateSession=D.Na)(l,p,f),i._OrtReleaseSession=l=>(i._OrtReleaseSession=D.Oa)(l),i._OrtGetInputOutputCount=(l,p,f)=>(i._OrtGetInputOutputCount=D.Pa)(l,p,f),i._OrtGetInputOutputMetadata=(l,p,f,y)=>(i._OrtGetInputOutputMetadata=D.Qa)(l,p,f,y),i._OrtFree=l=>(i._OrtFree=D.Ra)(l),i._OrtCreateTensor=(l,p,f,y,v,S)=>(i._OrtCreateTensor=D.Sa)(l,p,f,y,v,S),i._OrtGetTensorData=(l,p,f,y,v)=>(i._OrtGetTensorData=D.Ta)(l,p,f,y,v),i._OrtReleaseTensor=l=>(i._OrtReleaseTensor=D.Ua)(l),i._OrtCreateRunOptions=(l,p,f,y)=>(i._OrtCreateRunOptions=D.Va)(l,p,f,y),i._OrtAddRunConfigEntry=(l,p,f)=>(i._OrtAddRunConfigEntry=D.Wa)(l,p,f),i._OrtReleaseRunOptions=l=>(i._OrtReleaseRunOptions=D.Xa)(l),i._OrtCreateBinding=l=>(i._OrtCreateBinding=D.Ya)(l),i._OrtBindInput=(l,p,f)=>(i._OrtBindInput=D.Za)(l,p,f),i._OrtBindOutput=(l,p,f,y)=>(i._OrtBindOutput=D._a)(l,p,f,y),i._OrtClearBoundOutputs=l=>(i._OrtClearBoundOutputs=D.$a)(l),i._OrtReleaseBinding=l=>(i._OrtReleaseBinding=D.ab)(l),i._OrtRunWithBinding=(l,p,f,y,v)=>(i._OrtRunWithBinding=D.bb)(l,p,f,y,v),i._OrtRun=(l,p,f,y,v,S,A,R)=>(i._OrtRun=D.cb)(l,p,f,y,v,S,A,R),i._OrtEndProfiling=l=>(i._OrtEndProfiling=D.db)(l),i._JsepOutput=(l,p,f)=>(i._JsepOutput=D.eb)(l,p,f),i._JsepGetNodeName=l=>(i._JsepGetNodeName=D.fb)(l);var Yr=()=>(Yr=D.gb)(),ot=i._free=l=>(ot=i._free=D.hb)(l),Ki=i._malloc=l=>(Ki=i._malloc=D.ib)(l),Xr=(l,p,f,y,v,S)=>(Xr=D.kb)(l,p,f,y,v,S),fo=()=>(fo=D.lb)(),mo=(l,p,f,y,v)=>(mo=D.mb)(l,p,f,y,v),go=l=>(go=D.nb)(l),Zr=l=>(Zr=D.ob)(l),_o=(l,p)=>(_o=D.pb)(l,p),yo=()=>(yo=D.qb)(),bo=(l,p)=>(bo=D.rb)(l,p),Yi=l=>(Yi=D.sb)(l),Qr=l=>(Qr=D.tb)(l),Jr=()=>(Jr=D.ub)(),wo=i.dynCall_ii=(l,p)=>(wo=i.dynCall_ii=D.vb)(l,p);i.dynCall_vii=(l,p,f)=>(i.dynCall_vii=D.dynCall_vii)(l,p,f),i.dynCall_iiiii=(l,p,f,y,v)=>(i.dynCall_iiiii=D.dynCall_iiiii)(l,p,f,y,v),i.dynCall_iii=(l,p,f)=>(i.dynCall_iii=D.dynCall_iii)(l,p,f),i.dynCall_iiiiii=(l,p,f,y,v,S)=>(i.dynCall_iiiiii=D.dynCall_iiiiii)(l,p,f,y,v,S),i.dynCall_iiiiiiii=(l,p,f,y,v,S,A,R)=>(i.dynCall_iiiiiiii=D.dynCall_iiiiiiii)(l,p,f,y,v,S,A,R),i.dynCall_iiiiiii=(l,p,f,y,v,S,A)=>(i.dynCall_iiiiiii=D.dynCall_iiiiiii)(l,p,f,y,v,S,A),i.dynCall_vi=(l,p)=>(i.dynCall_vi=D.dynCall_vi)(l,p),i.dynCall_iiii=(l,p,f,y)=>(i.dynCall_iiii=D.dynCall_iiii)(l,p,f,y),i.dynCall_i=l=>(i.dynCall_i=D.dynCall_i)(l),i.dynCall_viiiiiiii=(l,p,f,y,v,S,A,R,L)=>(i.dynCall_viiiiiiii=D.dynCall_viiiiiiii)(l,p,f,y,v,S,A,R,L),i.dynCall_viii=(l,p,f,y)=>(i.dynCall_viii=D.dynCall_viii)(l,p,f,y),i.dynCall_viijj=(l,p,f,y,v)=>(i.dynCall_viijj=D.dynCall_viijj)(l,p,f,y,v),i.dynCall_viiiiii=(l,p,f,y,v,S,A)=>(i.dynCall_viiiiii=D.dynCall_viiiiii)(l,p,f,y,v,S,A),i.dynCall_viiii=(l,p,f,y,v)=>(i.dynCall_viiii=D.dynCall_viiii)(l,p,f,y,v),i.dynCall_viiiii=(l,p,f,y,v,S)=>(i.dynCall_viiiii=D.dynCall_viiiii)(l,p,f,y,v,S),i.dynCall_vfiii=(l,p,f,y,v)=>(i.dynCall_vfiii=D.dynCall_vfiii)(l,p,f,y,v),i.dynCall_viiiiff=(l,p,f,y,v,S,A)=>(i.dynCall_viiiiff=D.dynCall_viiiiff)(l,p,f,y,v,S,A),i.dynCall_viiiiiff=(l,p,f,y,v,S,A,R)=>(i.dynCall_viiiiiff=D.dynCall_viiiiiff)(l,p,f,y,v,S,A,R),i.dynCall_ffff=(l,p,f,y)=>(i.dynCall_ffff=D.dynCall_ffff)(l,p,f,y),i.dynCall_viiff=(l,p,f,y,v)=>(i.dynCall_viiff=D.dynCall_viiff)(l,p,f,y,v),i.dynCall_fffffff=(l,p,f,y,v,S,A)=>(i.dynCall_fffffff=D.dynCall_fffffff)(l,p,f,y,v,S,A),i.dynCall_jjjjjjj=(l,p,f,y,v,S,A)=>(i.dynCall_jjjjjjj=D.dynCall_jjjjjjj)(l,p,f,y,v,S,A),i.dynCall_jjjjjj=(l,p,f,y,v,S)=>(i.dynCall_jjjjjj=D.dynCall_jjjjjj)(l,p,f,y,v,S),i.dynCall_iijjii=(l,p,f,y,v,S)=>(i.dynCall_iijjii=D.dynCall_iijjii)(l,p,f,y,v,S),i.dynCall_viiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e)=>(i.dynCall_viiiiiiiiiiiii=D.dynCall_viiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e),i.dynCall_viiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q)=>(i.dynCall_viiiiiiiiii=D.dynCall_viiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q),i.dynCall_viiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re)=>(i.dynCall_viiiiiiiiiii=D.dynCall_viiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re),i.dynCall_viiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de)=>(i.dynCall_viiiiiiiiiiii=D.dynCall_viiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de),i.dynCall_viiiiiiiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot,ci)=>(i.dynCall_viiiiiiiiiiiiiiiiii=D.dynCall_viiiiiiiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot,ci),i.dynCall_viiiiiiiii=(l,p,f,y,v,S,A,R,L,G)=>(i.dynCall_viiiiiiiii=D.dynCall_viiiiiiiii)(l,p,f,y,v,S,A,R,L,G),i.dynCall_viiiiiiiiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot,ci,en)=>(i.dynCall_viiiiiiiiiiiiiiiiiii=D.dynCall_viiiiiiiiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot,ci,en),i.dynCall_viiiiiii=(l,p,f,y,v,S,A,R)=>(i.dynCall_viiiiiii=D.dynCall_viiiiiii)(l,p,f,y,v,S,A,R),i.dynCall_viiiiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe)=>(i.dynCall_viiiiiiiiiiiiiii=D.dynCall_viiiiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe),i.dynCall_jiji=(l,p,f,y)=>(i.dynCall_jiji=D.dynCall_jiji)(l,p,f,y),i.dynCall_v=l=>(i.dynCall_v=D.dynCall_v)(l),i.dynCall_iidiiii=(l,p,f,y,v,S,A)=>(i.dynCall_iidiiii=D.dynCall_iidiiii)(l,p,f,y,v,S,A),i.dynCall_iiiiiiiii=(l,p,f,y,v,S,A,R,L)=>(i.dynCall_iiiiiiiii=D.dynCall_iiiiiiiii)(l,p,f,y,v,S,A,R,L),i.dynCall_iiij=(l,p,f,y)=>(i.dynCall_iiij=D.dynCall_iiij)(l,p,f,y),i.dynCall_iiiiiiiiii=(l,p,f,y,v,S,A,R,L,G)=>(i.dynCall_iiiiiiiiii=D.dynCall_iiiiiiiiii)(l,p,f,y,v,S,A,R,L,G),i.dynCall_iiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de)=>(i.dynCall_iiiiiiiiiiiii=D.dynCall_iiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de),i.dynCall_iiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q)=>(i.dynCall_iiiiiiiiiii=D.dynCall_iiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q),i.dynCall_ji=(l,p)=>(i.dynCall_ji=D.dynCall_ji)(l,p),i.dynCall_iijii=(l,p,f,y,v)=>(i.dynCall_iijii=D.dynCall_iijii)(l,p,f,y,v),i.dynCall_vij=(l,p,f)=>(i.dynCall_vij=D.dynCall_vij)(l,p,f),i.dynCall_viiijii=(l,p,f,y,v,S,A)=>(i.dynCall_viiijii=D.dynCall_viiijii)(l,p,f,y,v,S,A),i.dynCall_viijiiiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot)=>(i.dynCall_viijiiiiiiiiiiiiii=D.dynCall_viijiiiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot),i.dynCall_viiiji=(l,p,f,y,v,S)=>(i.dynCall_viiiji=D.dynCall_viiiji)(l,p,f,y,v,S),i.dynCall_fiii=(l,p,f,y)=>(i.dynCall_fiii=D.dynCall_fiii)(l,p,f,y),i.dynCall_viijii=(l,p,f,y,v,S)=>(i.dynCall_viijii=D.dynCall_viijii)(l,p,f,y,v,S),i.dynCall_viij=(l,p,f,y)=>(i.dynCall_viij=D.dynCall_viij)(l,p,f,y),i.dynCall_jiij=(l,p,f,y)=>(i.dynCall_jiij=D.dynCall_jiij)(l,p,f,y),i.dynCall_fi=(l,p)=>(i.dynCall_fi=D.dynCall_fi)(l,p),i.dynCall_fii=(l,p,f)=>(i.dynCall_fii=D.dynCall_fii)(l,p,f),i.dynCall_jii=(l,p,f)=>(i.dynCall_jii=D.dynCall_jii)(l,p,f),i.dynCall_dii=(l,p,f)=>(i.dynCall_dii=D.dynCall_dii)(l,p,f),i.dynCall_fiiii=(l,p,f,y,v)=>(i.dynCall_fiiii=D.dynCall_fiiii)(l,p,f,y,v),i.dynCall_fif=(l,p,f)=>(i.dynCall_fif=D.dynCall_fif)(l,p,f),i.dynCall_jfi=(l,p,f)=>(i.dynCall_jfi=D.dynCall_jfi)(l,p,f),i.dynCall_viiiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie)=>(i.dynCall_viiiiiiiiiiiiii=D.dynCall_viiiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie),i.dynCall_viiiiiiiiiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot,ci,en,Jg)=>(i.dynCall_viiiiiiiiiiiiiiiiiiii=D.dynCall_viiiiiiiiiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt,Ot,ci,en,Jg),i.dynCall_viiiiiiiiiiiiiiii=(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt)=>(i.dynCall_viiiiiiiiiiiiiiii=D.dynCall_viiiiiiiiiiiiiiii)(l,p,f,y,v,S,A,R,L,G,Q,re,de,_e,Ie,Pe,lt),i.dynCall_iif=(l,p,f)=>(i.dynCall_iif=D.dynCall_iif)(l,p,f),i.dynCall_jiiii=(l,p,f,y,v)=>(i.dynCall_jiiii=D.dynCall_jiiii)(l,p,f,y,v),i.dynCall_jiii=(l,p,f,y)=>(i.dynCall_jiii=D.dynCall_jiii)(l,p,f,y),i.dynCall_viif=(l,p,f,y)=>(i.dynCall_viif=D.dynCall_viif)(l,p,f,y),i.dynCall_viiij=(l,p,f,y,v)=>(i.dynCall_viiij=D.dynCall_viiij)(l,p,f,y,v),i.dynCall_viiiijii=(l,p,f,y,v,S,A,R)=>(i.dynCall_viiiijii=D.dynCall_viiiijii)(l,p,f,y,v,S,A,R),i.dynCall_iiiiij=(l,p,f,y,v,S)=>(i.dynCall_iiiiij=D.dynCall_iiiiij)(l,p,f,y,v,S),i.dynCall_iiiiid=(l,p,f,y,v,S)=>(i.dynCall_iiiiid=D.dynCall_iiiiid)(l,p,f,y,v,S),i.dynCall_iiiiijj=(l,p,f,y,v,S,A)=>(i.dynCall_iiiiijj=D.dynCall_iiiiijj)(l,p,f,y,v,S,A),i.dynCall_iiiiiijj=(l,p,f,y,v,S,A,R)=>(i.dynCall_iiiiiijj=D.dynCall_iiiiiijj)(l,p,f,y,v,S,A,R);var vo=l=>(vo=D.wb)(l),$o=()=>($o=D.xb)(),xo=l=>(xo=D.yb)(l),Co=()=>(Co=D.zb)();return(function l(){if(0<rt)nt=l;else if(o)t(i),ct();else{for(;0<Or.length;)Or.shift()(i);0<rt?nt=l:(i.calledRun=!0,X||(ct(),t(i)))}})(),i.PTR_SIZE=4,n},Tp=on,So=globalThis.self?.name?.startsWith("em-pthread"),So&&on()}),ln,Jn,Io,Le,Sp,Zi,Eo,ko,un,Ao,dn,Ip,pn,Ep,ba=V(()=>{"use strict";ya(),ln=typeof location>"u"?void 0:location.origin,Jn=import.meta.url>"file:"&&import.meta.url<"file;",Io=()=>{if(Jn){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,ln).href}return import.meta.url},Le=Io(),Sp=()=>{if(Le&&!Le.startsWith("blob:"))return Le.substring(0,Le.lastIndexOf("/")+1)},Zi=(e,t)=>{try{let r=t??Le;return(r?new URL(e,r):new URL(e)).origin===ln}catch{return!1}},Eo=(e,t)=>{let r=t??Le;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},ko=(e,t)=>`${t??"./"}${e}`,un=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},Ao=async e=>(await import(e)).default,dn=(w_(),ki($p)).default,Ip=async()=>{if(!Le)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Zi(Le))return[void 0,dn()];let e=await un(Le);return[e,dn(e)]},pn=(v_(),ki(Cp)).default,Ep=async(e,t,r,i)=>{let n=pn&&!(e||t);if(n)if(Le)n=Zi(Le);else if(i&&!r)n=!0;else throw new Error("cannot determine the script source URL.");if(n)return[void 0,pn];{let a="ort-wasm-simd-threaded.jsep.mjs",s=e??Eo(a,t),o=r&&s&&!Zi(s,t),u=o?await un(s):s??ko(a,t);return[o?u:void 0,await Ao(u)]}}}),cn,Qi,fi,hn,zo,Oo,Ro,wa,we,Gt=V(()=>{"use strict";ba(),Qi=!1,fi=!1,hn=!1,zo=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},Oo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Ro=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},wa=async e=>{if(Qi)return Promise.resolve();if(fi)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(hn)throw new Error("previous call to 'initializeWebAssembly()' failed.");fi=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Ro())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!Oo())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=zo();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let n=e.wasmPaths,a=typeof n=="string"?n:void 0,s=n?.mjs,o=s?.href??s,u=n?.wasm,d=u?.href??u,c=e.wasmBinary,[h,m]=await Ep(o,a,r>1,!!c||!!d),_=!1,g=[];if(t>0&&g.push(new Promise(w=>{setTimeout(()=>{_=!0,w()},t)})),g.push(new Promise((w,x)=>{let $={numThreads:r};if(c)$.wasmBinary=c;else if(d||a)$.locateFile=b=>d??a+b;else if(o&&o.indexOf("blob:")!==0)$.locateFile=b=>new URL(b,o).href;else if(h){let b=Sp();b&&($.locateFile=C=>b+C)}m($).then(b=>{fi=!1,Qi=!0,cn=b,w(),h&&URL.revokeObjectURL(h)},b=>{fi=!1,hn=!0,x(b)})})),await Promise.race(g),_)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},we=()=>{if(Qi&&cn)return cn;throw new Error("WebAssembly is not initialized yet.")}}),Ze,pr,be,va=V(()=>{"use strict";Gt(),Ze=(e,t)=>{let r=we(),i=r.lengthBytesUTF8(e)+1,n=r._malloc(i);return r.stringToUTF8(e,n,i),t.push(n),n},pr=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([n,a])=>{let s=t?t+n:n;if(typeof a=="object")pr(a,s+".",r,i);else if(typeof a=="string"||typeof a=="number")i(s,a.toString());else if(typeof a=="boolean")i(s,a?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof a}`)})},be=e=>{let t=we(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetLastError(n,n+i);let a=Number(t.getValue(n,i===4?"i32":"i64")),s=t.getValue(n+i,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),kp,$_=V(()=>{"use strict";Gt(),va(),kp=e=>{let t=we(),r=0,i=[],n=e||{};try{if(e?.logSeverityLevel===void 0)n.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)n.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(n.terminate=!1);let a=0;return e?.tag!==void 0&&(a=Ze(e.tag,i)),r=t._OrtCreateRunOptions(n.logSeverityLevel,n.logVerbosityLevel,!!n.terminate,a),r===0&&be("Can't create run options."),e?.extra!==void 0&&pr(e.extra,"",new WeakSet,(s,o)=>{let u=Ze(s,i),d=Ze(o,i);t._OrtAddRunConfigEntry(r,u,d)!==0&&be(`Can't set a run config entry: ${s} - ${o}.`)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),a}}}),Mo,Do,Bo,mi,No,Ap,x_=V(()=>{"use strict";Gt(),va(),Mo=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},Do=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Bo=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},mi=(e,t,r,i)=>{let n=Ze(t,i),a=Ze(r,i);we()._OrtAddSessionConfigEntry(e,n,a)!==0&&be(`Can't set a session config entry: ${t} - ${r}.`)},No=async(e,t,r)=>{for(let i of t){let n=typeof i=="string"?i:i.name,a=[];switch(n){case"webnn":if(n="WEBNN",typeof i!="string"){let c=i?.deviceType;c&&mi(e,"deviceType",c,r)}break;case"webgpu":if(n="JS",typeof i!="string"){let c=i;if(c?.preferredLayout){if(c.preferredLayout!=="NCHW"&&c.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${c.preferredLayout}`);mi(e,"preferredLayout",c.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${n}`)}let s=Ze(n,r),o=a.length,u=0,d=0;if(o>0){u=we()._malloc(o*we().PTR_SIZE),r.push(u),d=we()._malloc(o*we().PTR_SIZE),r.push(d);for(let c=0;c<o;c++)we().setValue(u+c*we().PTR_SIZE,a[c][0],"*"),we().setValue(d+c*we().PTR_SIZE,a[c][1],"*")}await we()._OrtAppendExecutionProvider(e,s,u,d,o)!==0&&be(`Can't append execution provider: ${n}.`)}},Ap=async e=>{let t=we(),r=0,i=[],n=e||{};Bo(n);try{let a=Mo(n.graphOptimizationLevel??"all"),s=Do(n.executionMode??"sequential"),o=typeof n.logId=="string"?Ze(n.logId,i):0,u=n.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log severity level is not valid: ${u}`);let d=n.logVerbosityLevel??0;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log verbosity level is not valid: ${d}`);let c=typeof n.optimizedModelFilePath=="string"?Ze(n.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(a,!!n.enableCpuMemArena,!!n.enableMemPattern,s,!!n.enableProfiling,0,o,u,d,c),r===0&&be("Can't create session options."),n.executionProviders&&await No(r,n.executionProviders,i),n.enableGraphCapture!==void 0){if(typeof n.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);mi(r,"enableGraphCapture",n.enableGraphCapture.toString(),i)}if(n.freeDimensionOverrides)for(let[h,m]of Object.entries(n.freeDimensionOverrides)){if(typeof h!="string")throw new Error(`free dimension override name must be a string: ${h}`);if(typeof m!="number"||!Number.isInteger(m)||m<0)throw new Error(`free dimension override value must be a non-negative integer: ${m}`);let _=Ze(h,i);t._OrtAddFreeDimensionOverride(r,_,m)!==0&&be(`Can't set a free dimension override: ${h} - ${m}.`)}return n.extra!==void 0&&pr(n.extra,"",new WeakSet,(h,m)=>{mi(r,h,m,i)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&be("Can't release session options."),i.forEach(s=>t._free(s)),a}}}),Lt,dt,Ut,yr,cr,$a,xa,ea,ne=V(()=>{"use strict";Lt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},dt=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Ut=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((n,a)=>n*a,1);return r>0?Math.ceil(i*r):void 0},yr=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},cr=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},$a=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",xa=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",ea=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Ca,zp=V(()=>{"use strict";ya(),Ca=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let n=t.body.getReader(),a;try{a=new ArrayBuffer(i)}catch(o){if(o instanceof RangeError){let u=Math.ceil(i/65536);a=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let s=0;for(;;){let{done:o,value:u}=await n.read();if(o)break;let d=u.byteLength;new Uint8Array(a,s,d).set(u),s+=d}return new Uint8Array(a,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Po,Lo,Uo,Wo,Ta,Vo,ce,pt=V(()=>{"use strict";ne(),Po=["V","I","W","E","F"],Lo=(e,t)=>{console.log(`[${Po[e]},${new Date().toISOString()}]${t}`)},Ta=(e,t)=>{Uo=e,Wo=t},Vo=(e,t)=>{let r=cr(e),i=cr(Uo);r>=i&&Lo(r,typeof t=="function"?t():t)},ce=(...e)=>{Wo&&Vo(...e)}}),qo,Jt,O,hr,Op,Rp,Mp,oe=V(()=>{"use strict";qo=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Jt=class{static calcShape(e,t,r=!1){let i=e.length,n=t.length;if(i===0)return t;if(n===0)return e;let a=Math.max(e.length,t.length),s=new Array(a);if(r){if(i<2||n<2)return;let o=qo.calcMatMulShape([e[i-2],e[i-1]],[t[n-2],t[n-1]]);if(o===void 0)return;[s[a-2],s[a-1]]=o}for(let o=r?3:1;o<=a;o++){let u=i-o<0?1:e[i-o],d=n-o<0?1:t[n-o];if(u!==d&&u>1&&d>1)return;let c=Math.max(u,d);if(u&&d)s[a-o]=Math.max(u,d);else{if(c>1)return;s[a-o]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let n=1;n<=r;n++)if(e[r-n]!==1&&e[r-n]!==t[i-n])return!1;return!0}},O=class ur{static size(t){return ur.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let n=new Array(i),a=i-1;for(;a>=0;){if(t[a]%r===0){n[a]=t[a]/r;break}if(r%t[a]!==0)throw new Error("cannot convert shape");n[a]=1,r/=t[a],a--}for(a--;a>=0;a--)n[a]=t[a];return n}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return ur.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return ur.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let n=1;for(let a=r;a<i;a++){if(t[a]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");n*=Number(t[a])}return n}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let n=r-3;n>=0;--n)i[n]=i[n+1]*t[n+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((n,a)=>n+r[a]+r[a+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,n)=>i===r[n])}},hr=class Ti{static adjustPoolAttributes(t,r,i,n,a,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=i.length?i.push(r[o+2]):i[o]=r[o+2];for(let o=0;o<i.length;o++)if(o<n.length){if(n[o]<0)throw new Error("strides should be greater than or equal to 1")}else n.push(1);for(let o=0;o<i.length;o++)if(o<a.length){if(a[o]<0)throw new Error("dilations should be greater than or equal to 1")}else a.push(1);for(let o=0;o<i.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<i.length;o++){if(i[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=i[o]||s[o+i.length]>=i[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,n,a,s,o){if(o){if(a.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)Ti.adjustPadAndReturnShape(t[u+(s?1:2)],r[u],i[u],n[u],a,u,u+t.length-2,o)}}static computePoolOutputShape(t,r,i,n,a,s,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let u=[r[0],r[1]];return Ti.computeShapeHelper(t,r,u,i,n,a,s,o),u}static computeConvOutputShape(t,r,i,n,a,s,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],r[0]];return Ti.computeShapeHelper(!1,t,u,i,n,a,s,o),u}static computeShapeHelper(t,r,i,n,a,s,o,u){if(t)for(let d=0;d<r.length-2;d++)i.push(1);else for(let d=0;d<r.length-2;d++)i.push(Ti.adjustPadAndReturnShape(r[d+2],n[d],a[d],s[d],o,d,d+r.length-2,u))}static adjustPadAndReturnShape(t,r,i,n,a,s,o,u){let d=i*(n-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return a[s]=0,a[o]=0,Math.floor((t-d)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let c=((t+r-1)/r-1)*r+n-t;return a[s]=Math.floor(u==="SAME_LOWER"?(c+1)/2:c/2),a[o]=c-a[s],Math.floor((t+c-n)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+a[s]+a[o]-d)/r+1)}},Op=class{static getShapeOfGemmResult(e,t,r,i,n){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let a,s,o;t?(a=e[1],s=e[0]):(a=e[0],s=e[1]);let u=-1;if(i?(o=r[0],u=1):(o=r[1],u=0),r[u]!==s)throw new Error("dimension mismatch");if(a<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(n&&!Jt.isValidBroadcast(n,[a,o]))throw new Error("gemm: invalid bias shape for broadcast");return[a,o,s]}},Rp=-34028234663852886e22,Mp=34028234663852886e22}),Sa,Dp=V(()=>{"use strict";ne(),Sa=(e,t)=>new(yr(t))(e)}),fn,ta,mn,Fo,gn,Go,_n,yn,bn,jo,Bp,C_=V(()=>{"use strict";ne(),pt(),fn=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),ta=(e,t)=>{if(t==="int32")return e;let r=fn.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let n=e.byteLength/i,a=new(yr(t))(e.buffer,e.byteOffset,n);switch(t){case"int64":case"uint64":{let s=new Int32Array(n);for(let o=0;o<n;o++){let u=a[o];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(u)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&a.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(a,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},mn=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let n=BigInt64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"uint64":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let n=BigUint64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"int8":{if(i.some(a=>a<-128||a>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let n=Int8Array.from(i,Number);return new Uint8Array(n.buffer)}case"uint8":{if(i.some(n=>n<0||n>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let n=Uint32Array.from(i,Number);return new Uint8Array(n.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Fo=1,gn=()=>Fo++,Go=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),_n=(e,t)=>{let r=fn.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,n)=>i*n)*r/8):0},yn=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:n,shape:a,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=n,this.tensorShape=a,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return _n(this.dataType,this.tensorShape)}destroy(){ce("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=mn(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,n)=>i===r[n])}setIsDataConverted(e){this.isDataConverted=e}},bn=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let n=this.tensorManager.getMLContext(e),a;if(!n.opSupportLimits().input.dataTypes.includes(t)){if(a=Go.get(t),!a||!n.opSupportLimits().input.dataTypes.includes(a))throw new Error(`WebNN backend does not support data type: ${t}`);ce("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${a}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(n,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==_n(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let s=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,s,!0,!0,a),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=ta(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else ce("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?mn(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},jo=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=gn();return this.tensorTrackersById.set(e,new bn(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,n){ce("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${n}}`);let a=this.tensorTrackersById.get(t);if(!a)throw new Error("Tensor not found.");return a.ensureTensor(e,r,i,n)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){ce("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let n=this.getMLContext(e),a=gn(),s=new yn({sessionId:e,context:n,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(a,new bn(this,s)),this.externalTensors.add(s),a}async getCachedTensor(e,t,r,i,n,a,s){let o=this.getMLContext(e);for(let[d,c]of this.freeTensors.entries())if(c.canReuseTensor(o,t,r)){ce("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let h=this.freeTensors.splice(d,1)[0];return h.sessionId=e,h}ce("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let u=await o.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:n,readable:a});return new yn({sessionId:e,context:o,tensor:u,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Bp=(...e)=>new jo(...e)}),gi,Ho,Np,T_=V(()=>{"use strict";ne(),Gt(),Dp(),C_(),pt(),gi=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Ho=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((n,a)=>n===i[a]&&e[n]===t[n])},Np=class{constructor(e){this.tensorManager=Bp(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,Ta(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){ce("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){ce("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)ce("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>Ho(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(n=>n.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){ce("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,n){let a=gi.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,a,i,n)}async createTemporaryTensor(e,t,r){ce("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=gi.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let n=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,n,i,r,!1);let a=this.temporarySessionTensorIds.get(e);return a?a.push(n):this.temporarySessionTensorIds.set(e,[n]),n}uploadTensor(e,t){if(!we().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");ce("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Sa(r,t)}}registerMLTensor(e,t,r,i){let n=gi.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);let a=this.tensorManager.registerTensor(e,t,n,i);return ce("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${n}, dimensions: ${i}} -> {tensorId: ${a}}`),a}registerMLConstant(e,t,r,i,n,a,s=!1){if(!a)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=a.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let d=u.slice(t,t+r).buffer,c;switch(n.dataType){case"float32":c=new Float32Array(d);break;case"float16":c=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(d):new Uint16Array(d);break;case"int32":c=new Int32Array(d);break;case"uint32":c=new Uint32Array(d);break;case"int64":if(s){let h=ta(new Uint8Array(d),"int64");c=new Int32Array(h.buffer),n.dataType="int32"}else c=new BigInt64Array(d);break;case"uint64":c=new BigUint64Array(d);break;case"int8":c=new Int8Array(d);break;case"int4":case"uint4":case"uint8":c=new Uint8Array(d);break;default:throw new Error(`Unsupported data type: ${n.dataType} in creating WebNN Constant from external data.`)}return ce("verbose",()=>`[WebNN] registerMLConstant {dataType: ${n.dataType}, shape: ${n.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(n,c)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=this.mlContextBySessionId.get(e),n=gi.get(Lt(t));return typeof n>"u"?!1:r?!!i?.opSupportLimits().input.dataTypes.includes(n):!!i?.opSupportLimits().output.dataTypes.includes(n)}flush(){}}}),Ia=V(()=>{"use strict"}),wn,Ji,er,Ko,Yo,vn,ia,Xo,Pp,S_=V(()=>{"use strict";pt(),Ia(),wn=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Ji=[],er=e=>Math.ceil(Number(e)/16)*16,Ko=e=>{for(let t=0;t<Ji.length;t++){let r=Ji[t];if(e<=r)return r}return Math.ceil(e/16)*16},Yo=1,vn=()=>Yo++,ia=async(e,t,r,i)=>{let n=er(r),a=e.device.createBuffer({size:n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,a,0,n),e.flush(),await a.mapAsync(GPUMapMode.READ);let o=a.getMappedRange();if(i){let u=i();return u.set(new Uint8Array(o,0,r)),u}else return new Uint8Array(o.slice(0,r))}finally{a.destroy()}},Xo=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of wn)Ji.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,n=t.byteLength,a=er(n),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==n)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${n}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:a,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(r,i,n)),o.unmap();let d=this.backend.device.createCommandEncoder();d.copyBufferToBuffer(o,0,s.gpuData.buffer,0,a),this.backend.device.queue.submit([d.finish()]),o.destroy(),ce("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let n=er(r.originalSize),a=this.backend.getCommandEncoder();this.backend.endComputePass(),a.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,n)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return ce("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=vn();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),ce("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),ce("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Ko(e),i,n=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,a=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(n||a){let o=(n?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?i=o.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:vn(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),ce("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return ce("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await ia(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=wn.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(ce("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Pp=(...e)=>new Xo(...e)}),Zo,ye,Te=V(()=>{"use strict";Zo=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},ye=e=>new Zo(e)}),ei,tr,ke,Re,te,Ce,ra,Qt,xt,ee,_i,B,J,Lp,Ea,Qo,Up,le=V(()=>{"use strict";ne(),oe(),ei=64,tr=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},ke=(e,t=1)=>{let r=tr(e,t);return typeof r=="string"?r:r[0]},Re=(e,t=1)=>{let r=tr(e,t);return typeof r=="string"?r:r[1]},te=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:O.computeStrides(r)})}),t},Ce=e=>e%4===0?4:e%2===0?2:1,ra=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Qt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,xt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,ee=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,_i=(e,t,r,i,n)=>{let a=typeof r=="number",s=a?r:r.length,o=[...new Array(s).keys()],u=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,d=tr(t,n),c=typeof d=="string"?d:d[1],h=typeof d=="string"?d:d[0],m={indices:u,value:c,storage:h,tensor:t},_=P=>typeof P=="string"?P:`${P}u`,g={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},w=a?"uniforms.":"",x=`${w}${e}_shape`,$=`${w}${e}_strides`,b="";for(let P=0;P<s-1;P++)b+=`
    let dim${P} = current / ${ee($,P,s)};
    let rest${P} = current % ${ee($,P,s)};
    indices[${P}] = dim${P};
    current = rest${P};
    `;b+=`indices[${s-1}] = current;`;let C=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${m.indices} {
    var indices: ${m.indices};
    var current = offset;
    ${b}
    return indices;
  }`,T=P=>(g.offsetToIndices=!0,s<2?P:`o2i_${e}(${P})`),I=[];if(s>=2)for(let P=s-1;P>=0;P--)I.push(`${ee($,P,s)} * (indices[${P}])`);let E=s<2?"":`
  fn i2o_${e}(indices: ${m.indices}) -> u32 {
    return ${I.join("+")};
  }`,k=P=>(g.indicesToOffset=!0,s<2?P:`i2o_${e}(${P})`),z=(...P)=>s===0?"0u":`${m.indices}(${P.map(_).join(",")})`,M=(P,q)=>s<2?`${P}`:`${ee(P,q,s)}`,W=(P,q,ie)=>s<2?`${P}=${ie};`:`${ee(P,q,s)}=${ie};`,j={},H=(P,q)=>{g.broadcastedIndicesToOffset=!0;let ie=`${q.name}broadcastedIndicesTo${e}Offset`;if(ie in j)return`${ie}(${P})`;let pe=[];for(let N=s-1;N>=0;N--){let ue=q.indicesGet("outputIndices",N+q.rank-s);pe.push(`${M($,N)} * (${ue} % ${M(x,N)})`)}return j[ie]=`fn ${ie}(outputIndices: ${q.type.indices}) -> u32 {
             return ${pe.length>0?pe.join("+"):"0u"};
           }`,`${ie}(${P})`},F=(P,q)=>(()=>{if(m.storage===m.value)return`${e}[${P}]=${q};`;if(m.storage==="vec2<u32>"&&m.value==="i32")return`${e}[${P}]=vec2<u32>(u32(${q}), select(0u, 0xFFFFFFFFu, ${q} < 0));`;if(m.storage==="vec2<u32>"&&m.value==="u32")return`${e}[${P}]=vec2<u32>(u32(${q}), 0u);`;if(m.storage==="u32"&&m.value==="vec4<bool>")return`${e}[${P}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${q}));`;throw new Error(`not supported combination of storage type ${m.storage} and value type ${m.value} yet`)})(),U=P=>(()=>{if(m.storage===m.value)return`${e}[${P}]`;if(m.storage==="vec2<u32>"&&m.value==="i32")return`i32(${e}[${P}].x)`;if(m.storage==="vec2<u32>"&&m.value==="u32")return`u32(${e}[${P}].x)`;if(m.storage==="u32"&&m.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${P}] & 0xFFu), bool(${e}[${P}] & 0xFF00u), bool(${e}[${P}] & 0xFF0000u), bool(${e}[${P}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${m.storage} and value type ${m.value} yet`)})(),K=s<2?"":`
  fn get_${e}ByIndices(indices: ${m.indices}) -> ${c} {
    return ${U(`i2o_${e}(indices)`)};
  }`,Z=s<2?"":(()=>{let P=o.map(ie=>`d${ie}: u32`).join(", "),q=o.map(ie=>`d${ie}`).join(", ");return`
  fn get_${e}(${P}) -> ${c} {
    return get_${e}ByIndices(${z(q)});
  }`})(),Y=(...P)=>{if(P.length!==s)throw new Error(`indices length must be ${s}`);let q=P.map(_).join(",");return s===0?U("0u"):s===1?U(q[0]):(g.get=!0,g.getByIndices=!0,g.indicesToOffset=!0,`get_${e}(${q})`)},ae=P=>s<2?U(P):(g.getByIndices=!0,g.indicesToOffset=!0,`get_${e}ByIndices(${P})`),X=s<2?"":`
  fn set_${e}ByIndices(indices: ${m.indices}, value: ${c}) {
    ${F(`i2o_${e}(indices)`,"value")}
  }`,me=s<2?"":(()=>{let P=o.map(ie=>`d${ie}: u32`).join(", "),q=o.map(ie=>`d${ie}`).join(", ");return`
  fn set_${e}(${P}, value: ${c}) {
    set_${e}ByIndices(${z(q)}, value);
  }`})();return{impl:()=>{let P=[],q=!1;return g.offsetToIndices&&(P.push(C),q=!0),g.indicesToOffset&&(P.push(E),q=!0),g.broadcastedIndicesToOffset&&(Object.values(j).forEach(ie=>P.push(ie)),q=!0),g.set&&(P.push(me),q=!0),g.setByIndices&&(P.push(X),q=!0),g.get&&(P.push(Z),q=!0),g.getByIndices&&(P.push(K),q=!0),!a&&q&&P.unshift(`const ${x} = ${m.indices}(${r.join(",")});`,`const ${$} = ${m.indices}(${O.computeStrides(r).join(",")});`),P.join(`
`)},type:m,offsetToIndices:T,indicesToOffset:k,broadcastedIndicesToOffset:H,indices:z,indicesGet:M,indicesSet:W,set:(...P)=>{if(P.length!==s+1)throw new Error(`indices length must be ${s}`);let q=P[s];if(typeof q!="string")throw new Error("value must be string");let ie=P.slice(0,s).map(_).join(",");return s===0?F("0u",q):s===1?F(ie[0],q):(g.set=!0,g.setByIndices=!0,g.indicesToOffset=!0,`set_${e}(${ie}, ${q})`)},setByOffset:F,setByIndices:(P,q)=>s<2?F(P,q):(g.setByIndices=!0,g.indicesToOffset=!0,`set_${e}ByIndices(${P}, ${q});`),get:Y,getByOffset:U,getByIndices:ae,usage:i,name:e,strides:$,shape:x,rank:s}},B=(e,t,r,i=1)=>_i(e,t,r,"input",i),J=(e,t,r,i=1)=>_i(e,t,r,"output",i),Lp=(e,t,r)=>_i(e,t,r,"atomicOutput",1),Ea=(e,t,r,i=1)=>_i(e,t,r,"internal",i),Qo=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=ei){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let n=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,a=n?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=n?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${a}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let n=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${n}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Up=(e,t)=>new Qo(e,t)}),Jo,$n,el,tl,il,rl,We,Wp,Vp,Ct=V(()=>{"use strict";ne(),oe(),Te(),le(),Jo=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},$n=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),el=(e,t)=>O.sortBasedOnPerm(e,$n(e.length,t)),tl=(e,t,r,i)=>{let n=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let a=0;a<t;++a)n+=`a[${e[a]}]=i[${a}];`;return n+="return a;}"},il=(e,t)=>{let r=[],i=[];for(let n=0;n<e.length;++n)e[n]!==1&&r.push(e[n]),e[t[n]]!==1&&i.push(t[n]);return{newShape:r,newPerm:i}},rl=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},We=(e,t)=>{let r=e.dataType,i=e.dims.length,n=$n(i,t),a=el(e.dims,n),s=e.dims,o=a,u=i<2||rl(n,e.dims),d;if(u)return d=g=>{let w=B("input",r,s,4),x=J("output",r,o,4);return`
  ${g.registerUniform("output_size","u32").declareVariables(w,x)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let g=O.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64/4)},programUniforms:[{type:12,data:Math.ceil(g/4)}]}},getShaderSource:d};let{newShape:c,newPerm:h}=il(e.dims,n),m=O.areEqual(h,[2,3,1]),_=O.areEqual(h,[3,1,2]);if(c.length===2||m||_){s=m?[c[0],c[1]*c[2]]:_?[c[0]*c[1],c[2]]:c,o=[s[1],s[0]];let g=16;return d=w=>{let x=B("a",r,s.length),$=J("output",r,o.length);return`
  ${w.registerUniform("output_size","u32").declareVariables(x,$)}
  var<workgroup> tile : array<array<${$.type.value}, ${g+1}>, ${g}>;
  ${w.mainStart([g,g,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${g} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${g}u + local_id.x;
    let input_row = workgroup_id_x * ${g}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${x.getByIndices(`${x.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${g}u + local_id.x;
    let output_row = workgroup_id_y * ${g}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${$.setByIndices(`${$.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let w=O.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/g),y:Math.ceil(o[0]/g)},programUniforms:[{type:12,data:w},...te(s,o)]}},getShaderSource:d}}return d=g=>{let w=B("a",r,s.length),x=J("output",r,o.length);return`
  ${g.registerUniform("output_size","u32").declareVariables(w,x)}

  ${tl(n,i,w,x)}

  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${x.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${x.setByOffset("global_idx",w.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let g=O.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},...te(s,o)]}},getShaderSource:d}},Wp=(e,t)=>{Jo(e.inputs,t.perm),e.compute(We(e.inputs[0],t.perm))},Vp=e=>ye({perm:e.perm})}),nl,al,sl,ol,ll,ul,dl,pl,cl,hl,je,qp,Fp,Gp,jp,Hp,Kp,Yp,Xp,Zp,Qp,I_=V(()=>{"use strict";ne(),oe(),le(),ka(),Ct(),nl={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},al={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},sl={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},ol={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},ll=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},ul=(e,t)=>{let r=[],i=e.length;for(let a=0;a<i;a++)t.indexOf(a)===-1&&r.push(e[a]);let n=t.map(a=>e[a]);return[r,n]},dl=(e,t)=>{let r=e.length+t.length,i=[],n=0;for(let a=0;a<r;a++)t.indexOf(a)===-1?i.push(e[n++]):i.push(1);return i},pl=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},cl=(e,t)=>{let r=[];if(!pl(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},hl=(e,t,r,i,n,a,s)=>{let o=r[0].dims,u=O.size(a),d=O.size(s),c=B("_A",r[0].dataType,o),h=J("output",n,a),m=64;u===1&&(m=256);let _=`
          var<workgroup> aBestValues : array<f32, ${m}>;
       `,g=w=>`
        ${w.registerUniform("reduceSize","u32").declareVariables(c,h)}
        ${_}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${w.mainStart(m)}

          let outputIndex = global_idx / ${m};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${sl[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${m}) {
           let candidate = f32(${c.getByOffset("offset + k")});
           bestValue = ${nl[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${m}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${al[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${h.setByOffset("outputIndex",`${i==="mean"?`${h.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${h.type.storage}(${ol[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${m}`,inputDependencies:["type"]},getShaderSource:g,getRunData:()=>({outputs:[{dims:a,dataType:n}],dispatchGroup:{x:u},programUniforms:[{type:12,data:d}]})}},je=(e,t,r,i)=>{let n=e.inputs.length===1?r:na(e.inputs,r),a=n.axes;a.length===0&&!n.noopWithEmptyAxes&&(a=e.inputs[0].dims.map((_,g)=>g));let s=O.normalizeAxes(a,e.inputs[0].dims.length),o=s,u=e.inputs[0],d=cl(o,e.inputs[0].dims.length);d.length>0&&(u=e.compute(We(e.inputs[0],d),{inputs:[0],outputs:[-1]})[0],o=ll(o.length,u.dims.length));let[c,h]=ul(u.dims,o),m=c;n.keepDims&&(m=dl(c,s)),e.compute(hl(t,n.cacheKey,[u],i,e.inputs[0].dataType,m,h),{inputs:[u]})},qp=(e,t)=>{je(e,"ReduceMeanShared",t,"mean")},Fp=(e,t)=>{je(e,"ReduceL1Shared",t,"l1")},Gp=(e,t)=>{je(e,"ReduceL2Shared",t,"l2")},jp=(e,t)=>{je(e,"ReduceLogSumExpShared",t,"logSumExp")},Hp=(e,t)=>{je(e,"ReduceMaxShared",t,"max")},Kp=(e,t)=>{je(e,"ReduceMinShared",t,"min")},Yp=(e,t)=>{je(e,"ReduceProdShared",t,"prod")},Xp=(e,t)=>{je(e,"ReduceSumShared",t,"sum")},Zp=(e,t)=>{je(e,"ReduceSumSquareShared",t,"sumSquare")},Qp=(e,t)=>{je(e,"ReduceLogSumShared",t,"logSum")}}),He,fl,fr,na,Ke,ml,gl,_l,yl,bl,wl,vl,$l,xl,Cl,Ye,Jp,ec,tc,ic,rc,nc,ac,sc,oc,lc,ka=V(()=>{"use strict";ne(),oe(),Te(),le(),I_(),He=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},fl=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],fr=(e,t,r,i,n,a,s=!1,o=!1)=>{let u=[],d=r[0].dims,c=d.length,h=O.normalizeAxes(n,c),m=!o&&h.length===0;d.forEach((w,x)=>{m||h.indexOf(x)>=0?s&&u.push(1):u.push(w)});let _=u.length,g=O.size(u);return{name:e,shaderCache:t,getShaderSource:w=>{let x=[],$=B("_A",r[0].dataType,c),b=J("output",a,_),C=i($,b,h),T=C[2];for(let I=0,E=0;I<c;I++)m||h.indexOf(I)>=0?(s&&E++,T=`for(var j${I}: u32 = 0; j${I} < ${d[I]}; j${I}++) {
                  ${C[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${$.indicesSet("input_indices",I,`j${I}`)}
                  ${T}
                }`):(x.push(`${$.indicesSet("input_indices",I,b.indicesGet("output_indices",E))};`),E++);return`

        ${w.registerUniform("output_size","u32").declareVariables($,b)}

        ${w.mainStart()}
          ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${$.type.indices};
          let output_indices = ${b.offsetToIndices("global_idx")};

          ${x.join(`
`)}
          ${C[0]}       // init ops for reduce max/min
          ${C[1]}
          ${T}
          ${C[3]}
          ${C.length===4?b.setByOffset("global_idx","value"):C.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:a}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},...te(d,u)]})}},na=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),ye({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Ke=(e,t,r,i)=>{let n=e.inputs,a=n.length===1?r:na(n,r);e.compute(fr(t,{hint:a.cacheKey,inputDependencies:["rank"]},[n[0]],a.noopWithEmptyAxes&&a.axes.length===0?fl:i,a.axes,n[0].dataType,a.keepDims,a.noopWithEmptyAxes),{inputs:[0]})},ml=(e,t)=>{He(e.inputs),Ke(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},gl=(e,t)=>{He(e.inputs),Ke(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},_l=(e,t)=>{He(e.inputs),Ke(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},yl=(e,t)=>{He(e.inputs),Ke(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},bl=(e,t)=>{He(e.inputs),Ke(e,"ReduceMax",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(r.indicesSet("input_indices",s,0));return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},wl=(e,t)=>{He(e.inputs),Ke(e,"ReduceMean",t,(r,i,n)=>{let a=1;for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&(a*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${a});`]})},vl=(e,t)=>{He(e.inputs),Ke(e,"ReduceMin",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(`input_indices[${s}] = 0;`);return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},$l=(e,t)=>{He(e.inputs),Ke(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},xl=(e,t)=>{He(e.inputs),Ke(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},Cl=(e,t)=>{He(e.inputs),Ke(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Ye=(e,t,r)=>{if(t.length===0)return r;let i=1,n=1;for(let a=0;a<t.length;a++)t.indexOf(a)===-1?i*=e[a]:n*=e[a];return n<32&&i>1024},Jp=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?wl(e,t):qp(e,t)},ec=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?gl(e,t):Fp(e,t)},tc=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?_l(e,t):Gp(e,t)},ic=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?yl(e,t):jp(e,t)},rc=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?bl(e,t):Hp(e,t)},nc=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?vl(e,t):Kp(e,t)},ac=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?$l(e,t):Yp(e,t)},sc=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?xl(e,t):Xp(e,t)},oc=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cl(e,t):Zp(e,t)},lc=(e,t)=>{Ye(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ml(e,t):Qp(e,t)}}),xn,uc,dc,aa,E_=V(()=>{"use strict";ne(),Te(),ka(),xn=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},uc=(e,t)=>{xn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(fr("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},dc=(e,t)=>{xn(e.inputs);let r=(i,n,a)=>{let s=[];for(let o=0;o<i.rank;o++)(a.indexOf(o)>=0||a.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(fr("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},aa=e=>ye(e)}),Tl,ir,Sl,Il,El,zi,kl,pc,Aa=V(()=>{"use strict";ne(),oe(),Ia(),le(),Tl=(e,t)=>{let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=r.dims[0],d=r.dims[1],c=r.dims[2];if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==c)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(n.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let h=n.dims[0]/3,m=h,_=m;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let C of t.qkvHiddenSizes)if(C%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");h=t.qkvHiddenSizes[0],m=t.qkvHiddenSizes[1],_=t.qkvHiddenSizes[2]}let g=d;if(h!==m)throw new Error("qkv_hidden_sizes first element should be same as the second");if(n.dims[0]!==h+m+_)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let w=0;if(s){if(m!==_)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==m/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(w=s.dims[3])}let x=g+w,$=-1,b=0;if(a)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==d||o.dims[3]!==x)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:d,pastSequenceLength:w,kvSequenceLength:g,totalSequenceLength:x,maxSequenceLength:$,inputHiddenSize:c,hiddenSize:h,vHiddenSize:_,headSize:Math.floor(h/t.numHeads),vHeadSize:Math.floor(_/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:b,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},ir=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,Sl=(e,t,r,i,n,a,s,o)=>{let u=Ce(s?1:a),d=64,c=a/u;c<d&&(d=32);let h=Math.ceil(a/u/d),m=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:n},{type:12,data:c},{type:12,data:h}],_=ke(e.dataType,u),g=Re(1,u),w=["type"];s&&w.push("type"),o&&w.push("type");let x=$=>{let b=J("x",e.dataType,e.dims,u),C=[b],T=s?B("seq_lens",s.dataType,s.dims):void 0;T&&C.push(T);let I=o?B("total_sequence_length_input",o.dataType,o.dims):void 0;I&&C.push(I);let E=Re(e.dataType),k=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${d}>;
  var<workgroup> thread_sum: array<f32, ${d}>;
  ${$.registerUniforms(k).declareVariables(...C)}
  ${$.mainStart([d,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${ir(T,I,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${d}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${g}(-3.402823e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${g}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.402823e+38f);
    for (var i = 0u; i < ${d}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${g}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${g}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${d}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${b.type.value}(${E}(1.0) / ${E}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${g}(x[offset + i]);
        x[offset + i] = ${b.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${b.type.value}(${E}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${d};${_};${u}`,inputDependencies:w},getShaderSource:x,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:n,z:t*r},programUniforms:m})}},Il=(e,t,r,i,n,a,s,o,u)=>{let d=s+a.kvSequenceLength,c=[a.batchSize,a.numHeads,a.sequenceLength,d],h=e>1&&i,m=a.kvNumHeads?a.kvNumHeads:a.numHeads,_=h?[a.batchSize,m,d,a.headSize]:void 0,g=a.nReps?a.nReps:1,w=a.scale===0?1/Math.sqrt(a.headSize):a.scale,x=Ce(a.headSize),$=a.headSize/x,b=12,C={x:Math.ceil(d/b),y:Math.ceil(a.sequenceLength/b),z:a.batchSize*a.numHeads},T=[{type:12,data:a.sequenceLength},{type:12,data:$},{type:12,data:d},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:1,data:w},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:g}],I=h&&i&&O.size(i.dims)>0,E=["type","type"];I&&E.push("type"),n&&E.push("type"),o&&E.push("type"),u&&E.push("type");let k=[{dims:c,dataType:t.dataType,gpuDataType:0}];h&&k.push({dims:_,dataType:t.dataType,gpuDataType:0});let z=M=>{let W=B("q",t.dataType,t.dims,x),j=B("key",r.dataType,r.dims,x),H=[W,j];if(I){let X=B("past_key",i.dataType,i.dims,x);H.push(X)}n&&H.push(B("attention_bias",n.dataType,n.dims));let F=o?B("seq_lens",o.dataType,o.dims):void 0;F&&H.push(F);let U=u?B("total_sequence_length_input",u.dataType,u.dims):void 0;U&&H.push(U);let K=J("output",t.dataType,c),Z=[K];h&&Z.push(J("present_key",t.dataType,_,x));let Y=Re(1,x),ae=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;

  var<workgroup> tileQ: array<${W.type.storage}, ${b*b}>;
  var<workgroup> tileK: array<${W.type.storage}, ${b*b}>;
  ${M.registerUniforms(ae).declareVariables(...H,...Z)}
  ${M.mainStart([b,b,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${g===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${g===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${ir(F,U,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${I&&h?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${h?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${Y}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${I&&h?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${h?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${Y}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(x){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${x}`)}})()};
        output[outputIdx] = ${K.type.value} (sum * uniforms.alpha) + ${n?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${x};${n!==void 0};${i!==void 0};${e}`,inputDependencies:E},getRunData:()=>({outputs:k,dispatchGroup:C,programUniforms:T}),getShaderSource:z}},El=(e,t,r,i,n,a,s=void 0,o=void 0)=>{let u=a+n.kvSequenceLength,d=n.nReps?n.nReps:1,c=n.vHiddenSize*d,h=e>1&&i,m=n.kvNumHeads?n.kvNumHeads:n.numHeads,_=h?[n.batchSize,m,u,n.headSize]:void 0,g=[n.batchSize,n.sequenceLength,c],w=12,x={x:Math.ceil(n.vHeadSize/w),y:Math.ceil(n.sequenceLength/w),z:n.batchSize*n.numHeads},$=[{type:12,data:n.sequenceLength},{type:12,data:u},{type:12,data:n.vHeadSize},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:12,data:c},{type:12,data:a},{type:12,data:n.kvSequenceLength},{type:12,data:d}],b=h&&i&&O.size(i.dims)>0,C=["type","type"];b&&C.push("type"),s&&C.push("type"),o&&C.push("type");let T=[{dims:g,dataType:t.dataType,gpuDataType:0}];h&&T.push({dims:_,dataType:t.dataType,gpuDataType:0});let I=E=>{let k=B("probs",t.dataType,t.dims),z=B("v",r.dataType,r.dims),M=[k,z];b&&M.push(B("past_value",i.dataType,i.dims));let W=s?B("seq_lens",s.dataType,s.dims):void 0;s&&M.push(W);let j=o?B("total_sequence_length_input",o.dataType,o.dims):void 0;o&&M.push(j);let H=[J("output",t.dataType,g)];h&&H.push(J("present_value",t.dataType,_));let F=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;
  var<workgroup> tileQ: array<${k.type.value}, ${w*w}>;
  var<workgroup> tileV: array<${k.type.value}, ${w*w}>;
  ${E.registerUniforms(F).declareVariables(...M,...H)}
  ${E.mainStart([w,w,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${d===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${d===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${ir(W,j,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${b&&h?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${h?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${k.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${b&&h?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${h?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:C},getRunData:()=>({outputs:T,dispatchGroup:x,programUniforms:$}),getShaderSource:I}},zi=(e,t,r,i,n,a,s,o,u,d,c=void 0,h=void 0)=>{let m=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),_=m>1?d.pastSequenceLength:0,g=_+d.kvSequenceLength,w=u&&O.size(u.dims)>0?u:void 0,x=[t,r];m>1&&s&&O.size(s.dims)>0&&x.push(s),w&&x.push(w),c&&x.push(c),h&&x.push(h);let $=e.compute(Il(m,t,r,s,w,d,_,c,h),{inputs:x,outputs:m>1?[-1,1]:[-1]})[0];e.compute(Sl($,d.batchSize,d.numHeads,_,d.sequenceLength,g,c,h),{inputs:c&&h?[$,c,h]:[$],outputs:[]});let b=[$,i];m>1&&o&&O.size(o.dims)>0&&b.push(o),c&&b.push(c),h&&b.push(h),e.compute(El(m,$,i,o,d,_,c,h),{inputs:b,outputs:m>1?[0,2]:[0]})},kl=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,n=t.inputHiddenSize,a=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],d=[{type:12,data:i},{type:12,data:n},{type:12,data:a},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],c=h=>{let m=J("output_q",u[0].dataType,r),_=J("output_k",u[0].dataType,r),g=J("output_v",u[0].dataType,r),w=B("input",u[0].dataType,u[0].dims),x=B("weight",u[1].dataType,u[1].dims),$=B("bias",u[2].dataType,u[2].dims),b=w.type.storage,C=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${b}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${b}, ${s*s}>;
  var<workgroup> tileWeightK: array<${b}, ${s*s}>;
  var<workgroup> tileWeightV: array<${b}, ${s*s}>;
  ${h.registerUniforms(C).declareVariables(w,x,$,m,_,g)}
  ${h.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${b}(0);
    var valueK = ${b}(0);
    var valueV = ${b}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:d}),getShaderSource:c},{inputs:u,outputs:[-1,-1,-1]})},pc=(e,t)=>{let r=Tl(e.inputs,t),[i,n,a]=kl(e,r);return zi(e,i,n,a,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),Al,zl,Ol,cc,k_=V(()=>{"use strict";Ge(),ne(),oe(),Te(),le(),Al=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,n,a)=>{let s=n.length;if(s!==i.length)throw new Error(`${a}: num dimensions != ${s}`);n.forEach((o,u)=>{if(o!==i[u])throw new Error(`${a}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},zl=(e,t)=>{let{epsilon:r,spatial:i,format:n}=t,a=e[0].dims,s=i?Ce(a[a.length-1]):1,o=n==="NHWC"&&a.length>1?s:1,u=O.size(a)/s,d=i,c=d?a.length:a,h=B("x",e[0].dataType,e[0].dims,s),m=B("scale",e[1].dataType,e[1].dims,o),_=B("bias",e[2].dataType,e[2].dims,o),g=B("inputMean",e[3].dataType,e[3].dims,o),w=B("inputVar",e[4].dataType,e[4].dims,o),x=J("y",e[0].dataType,c,s),$=()=>{let C="";if(i)C=`let cOffset = ${a.length===1?"0u":n==="NHWC"?`outputIndices[${a.length-1}] / ${s}`:"outputIndices[1]"};`;else if(n==="NCHW")C=`
            ${x.indicesSet("outputIndices","0","0")}
            let cOffset = ${x.indicesToOffset("outputIndices")};`;else{C=`var cIndices = ${m.type.indices}(0);
                       cIndices[0] = outputIndices[${a.length-1}];`;for(let T=1;T<m.rank;T++)C+=`cIndices[${T}] = outputIndices[${T}];`;C+=`let cOffset = ${m.indicesToOffset("cIndices")};`}return C},b=C=>`
  const epsilon = ${r};
  ${C.registerUniform("outputSize","u32").declareVariables(h,m,_,g,w,x)}
  ${C.mainStart()}
  ${C.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${x.offsetToIndices(`global_idx * ${s}`)};
    ${$()}
    let scale = ${m.getByOffset("cOffset")};
    let bias = ${_.getByOffset("cOffset")};
    let inputMean = ${g.getByOffset("cOffset")};
    let inputVar = ${w.getByOffset("cOffset")};
    let x = ${h.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${x.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:d?["rank","type","type","type","type"]:void 0},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d?[{type:12,data:u},...te(a)]:[{type:12,data:u}]})}},Ol=e=>ye(e),cc=(e,t)=>{let{inputs:r,outputCount:i}=e,n=Ol({...t,outputCount:i});if(fe.webgpu.validateInputContent&&Al(r,n),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(zl(r,n))}}),Rl,Ml,hc,A_=V(()=>{"use strict";oe(),le(),Rl=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Ml=e=>{let t=e[0].dims,r=e[0].dims[2],i=O.size(t)/4,n=e[0].dataType,a=B("input",n,t,4),s=B("bias",n,[r],4),o=B("residual",n,t,4),u=J("output",n,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:d=>`
  const channels = ${r}u / 4;
  ${d.declareVariables(a,s,o,u)}

  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${a.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},hc=e=>{Rl(e.inputs),e.compute(Ml(e.inputs))}}),Dl,he,fc,mc,gc,_c,yc,bc,wc,vc,$c,Bl,xc,Cc,Tc,Sc,Si,Ic,dr,Ec,kc,Ac,zc,Oc,Rc,Mc,Dc,Bc,Nc,Pc,Lc,Uc,Wc,Vc,qc,Cn,Fc,sa,oa,Gc,jc,Hc,Nl,Pl,Kc,za=V(()=>{"use strict";ne(),oe(),Te(),le(),Dl=(e,t,r,i,n,a,s)=>{let o=Math.ceil(t/4),u="";typeof n=="string"?u=`${n}(a)`:u=n("a");let d=B("inputData",r,[o],4),c=J("outputData",i,[o],4),h=[{name:"vec_size",type:"u32"}];return s&&h.push(...s),`
      ${e.registerUniforms(h).declareVariables(d,c)}

  ${a??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${d.getByOffset("global_idx")};
    ${c.setByOffset("global_idx",u)}
  }`},he=(e,t,r,i,n,a=e.dataType,s,o)=>{let u=[{type:12,data:Math.ceil(O.size(e.dims)/4)}];return s&&u.push(...s),{name:t,shaderCache:{hint:n,inputDependencies:["type"]},getShaderSource:d=>Dl(d,O.size(e.dims),e.dataType,a,r,i,o),getRunData:d=>({outputs:[{dims:e.dims,dataType:a}],dispatchGroup:{x:Math.ceil(O.size(d[0].dims)/64/4)},programUniforms:u})}},fc=e=>{e.compute(he(e.inputs[0],"Abs","abs"))},mc=e=>{e.compute(he(e.inputs[0],"Acos","acos"))},gc=e=>{e.compute(he(e.inputs[0],"Acosh","acosh"))},_c=e=>{e.compute(he(e.inputs[0],"Asin","asin"))},yc=e=>{e.compute(he(e.inputs[0],"Asinh","asinh"))},bc=e=>{e.compute(he(e.inputs[0],"Atan","atan"))},wc=e=>{e.compute(he(e.inputs[0],"Atanh","atanh"))},vc=e=>ye(e),$c=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(he(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},Bl=e=>{let t,r,i=e.length>=2&&e[1].data!==0,n=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=n?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=n?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return ye({min:t,max:r})},xc=(e,t)=>{let r=t||Bl(e.inputs),i=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Clip",n=>`clamp(${n}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},Cc=e=>{e.compute(he(e.inputs[0],"Ceil","ceil"))},Tc=e=>{e.compute(he(e.inputs[0],"Cos","cos"))},Sc=e=>{e.compute(he(e.inputs[0],"Cosh","cosh"))},Si=e=>ye(e),Ic=(e,t)=>{let r=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},dr=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,Ec=e=>{let t=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,dr(t)))},kc=e=>{e.compute(he(e.inputs[0],"Exp","exp"))},Ac=e=>{e.compute(he(e.inputs[0],"Floor","floor"))},zc=e=>{let t=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,dr(t)))},Oc=(e,t)=>{let r=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Rc=e=>{e.compute(he(e.inputs[0],"Not",t=>`!${t}`))},Mc=e=>{e.compute(he(e.inputs[0],"Neg",t=>`-${t}`))},Dc=e=>{e.compute(he(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Bc=e=>{let t=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Nc=e=>{e.compute(he(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Pc=e=>ye(e),Lc=(e,t)=>{let r=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Uc=e=>{e.compute(he(e.inputs[0],"Sin","sin"))},Wc=e=>{e.compute(he(e.inputs[0],"Sinh","sinh"))},Vc=e=>{e.compute(he(e.inputs[0],"Sqrt","sqrt"))},qc=e=>{e.compute(he(e.inputs[0],"Tan","tan"))},Cn=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Fc=e=>{e.compute(he(e.inputs[0],"Tanh",Cn))},sa=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Cn("v")};
}
`,oa=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Gc=e=>{let t=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"FastGelu",oa,sa(t),void 0,e.inputs[0].dataType))},jc=(e,t)=>{let r=Re(e.inputs[0].dataType);return e.compute(he(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Hc=e=>{e.compute(he(e.inputs[0],"Log","log"))},Nl=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,Pl=e=>`quick_gelu_impl(${e})`,Kc=(e,t)=>{let r=Re(e.inputs[0].dataType);e.compute(he(e.inputs[0],"QuickGelu",Pl,Nl(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Ll,Ul,Yc,z_=V(()=>{"use strict";oe(),le(),za(),Ll=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Ul=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=B("input",e[0].dataType,e[0].dims,4),i=B("bias",e[0].dataType,[e[0].dims[2]],4),n=J("output",e[0].dataType,t,4),a=O.size(t)/4,s=ke(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,i,n)}

  ${dr(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(a)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${n.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Yc=e=>{Ll(e.inputs),e.compute(Ul(e.inputs))}}),Wl,Vl,Xe,Xc,Zc,Qc,Jc,eh,th,ih,rh,nh,ah,O_=V(()=>{"use strict";ne(),oe(),le(),Wl=(e,t,r,i,n,a,s,o,u,d,c,h)=>{let m,_;typeof o=="string"?m=_=(b,C)=>`${o}((${b}),(${C}))`:typeof o=="function"?m=_=o:(m=o.scalar,_=o.vector);let g=J("outputData",c,i.length,4),w=B("aData",u,t.length,4),x=B("bData",d,r.length,4),$;if(n)if(a){let b=O.size(t)===1,C=O.size(r)===1,T=t.length>0&&t[t.length-1]%4===0,I=r.length>0&&r[r.length-1]%4===0;b||C?$=g.setByOffset("global_idx",_(b?`${w.type.value}(${w.getByOffset("0")}.x)`:w.getByOffset("global_idx"),C?`${x.type.value}(${x.getByOffset("0")}.x)`:x.getByOffset("global_idx"))):$=`
            let outputIndices = ${g.offsetToIndices("global_idx * 4u")};
            let offsetA = ${w.broadcastedIndicesToOffset("outputIndices",g)};
            let offsetB = ${x.broadcastedIndicesToOffset("outputIndices",g)};
            ${g.setByOffset("global_idx",_(s||T?w.getByOffset("offsetA / 4u"):`${w.type.value}(${w.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||I?x.getByOffset("offsetB / 4u"):`${x.type.value}(${x.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else $=g.setByOffset("global_idx",_(w.getByOffset("global_idx"),x.getByOffset("global_idx")));else{if(!a)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let b=(C,T,I="")=>{let E=`aData[indexA${T}][componentA${T}]`,k=`bData[indexB${T}][componentB${T}]`;return`
            let outputIndices${T} = ${g.offsetToIndices(`global_idx * 4u + ${T}u`)};
            let offsetA${T} = ${w.broadcastedIndicesToOffset(`outputIndices${T}`,g)};
            let offsetB${T} = ${x.broadcastedIndicesToOffset(`outputIndices${T}`,g)};
            let indexA${T} = offsetA${T} / 4u;
            let indexB${T} = offsetB${T} / 4u;
            let componentA${T} = offsetA${T} % 4u;
            let componentB${T} = offsetB${T} % 4u;
            ${C}[${T}] = ${I}(${m(E,k)});
          `};c===9?$=`
            var data = vec4<u32>(0);
            ${b("data",0,"u32")}
            ${b("data",1,"u32")}
            ${b("data",2,"u32")}
            ${b("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:$=`
            ${b("outputData[global_idx]",0)}
            ${b("outputData[global_idx]",1)}
            ${b("outputData[global_idx]",2)}
            ${b("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(w,x,g)}

        ${h??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${$}
      }`},Vl=(e,t,r,i,n,a,s=r.dataType)=>{let o=r.dims.map(w=>Number(w)??1),u=i.dims.map(w=>Number(w)??1),d=!O.areEqual(o,u),c=o,h=O.size(o),m=!1,_=!1,g=[d];if(d){let w=Jt.calcShape(o,u,!1);if(!w)throw new Error("Can't perform binary op on the given tensors");c=w.slice(),h=O.size(c);let x=O.size(o)===1,$=O.size(u)===1,b=o.length>0&&o[o.length-1]%4===0,C=u.length>0&&u[u.length-1]%4===0;g.push(x),g.push($),g.push(b),g.push(C);let T=1;for(let I=1;I<c.length;I++){let E=o[o.length-I],k=u[u.length-I];if(E===k)T*=E;else break}T%4===0?(_=!0,m=!0):(x||$||b||C)&&(m=!0)}else m=!0;return g.push(m),{name:e,shaderCache:{hint:t+g.map(w=>w.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:w=>Wl(w,o,u,c,m,d,_,n,r.dataType,i.dataType,s,a),getRunData:()=>({outputs:[{dims:c,dataType:s}],dispatchGroup:{x:Math.ceil(h/64/4)},programUniforms:[{type:12,data:Math.ceil(O.size(c)/4)},...te(o,u,c)]})}},Xe=(e,t,r,i,n,a)=>{e.compute(Vl(t,n??"",e.inputs[0],e.inputs[1],r,i,a))},Xc=e=>{Xe(e,"Add",(t,r)=>`${t}+${r}`)},Zc=e=>{Xe(e,"Div",(t,r)=>`${t}/${r}`)},Qc=e=>{Xe(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Jc=e=>{Xe(e,"Mul",(t,r)=>`${t}*${r}`)},eh=e=>{let t=B("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Xe(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},th=e=>{Xe(e,"Sub",(t,r)=>`${t}-${r}`)},ih=e=>{Xe(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},rh=e=>{Xe(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},nh=e=>{Xe(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},ah=e=>{Xe(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),ql,Fl,Gl,jl,sh,oh,R_=V(()=>{"use strict";ne(),oe(),Te(),le(),ql=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],n=i.dataType,a=i.dims.length;e.forEach((s,o)=>{if(o!==r){if(s.dataType!==n)throw new Error("input tensors should be one type");if(s.dims.length!==a)throw new Error("input tensors should have the same shape");s.dims.forEach((u,d)=>{if(d!==t&&u!==i.dims[d])throw new Error("non concat dimensions must match")})}})},Fl=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Gl=(e,t)=>{let r=e.length,i=[];for(let n=0;n<r;++n){let a=t.setByOffset("global_idx",e[n].getByIndices("indices"));r===1?i.push(a):n===0?i.push(`if (inputIndex == ${n}u) { ${a} }`):n===r-1?i.push(`else { ${a} }`):i.push(`else if (inputIndex == ${n}) { ${a} }`)}return i.join(`
`)},jl=(e,t,r,i)=>{let n=O.size(r),a=new Array(e.length),s=new Array(e.length),o=0,u=[],d=[],c=[{type:12,data:n}];for(let w=0;w<e.length;++w)o+=e[w].dims[t],a[w]=o,d.push(e[w].dims.length),s[w]=B(`input${w}`,i,d[w]),u.push("rank"),c.push({type:12,data:a[w]});for(let w=0;w<e.length;++w)c.push(...te(e[w].dims));c.push(...te(r));let h=J("output",i,r.length),m=h.indicesGet("indices",t),_=Array.from(Array(a.length).keys()).map(w=>`uniforms.sizeInConcatAxis${w}`).join(","),g=w=>`

  ${(()=>{w.registerUniform("outputSize","u32");for(let x=0;x<e.length;x++)w.registerUniform(`sizeInConcatAxis${x}`,"u32");return w.declareVariables(...s,h)})()}

  ${Fl(a.length,_)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${h.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${m});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${a.length}u>(${_});
      ${m} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Gl(s,h)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:c}),getShaderSource:g}},sh=(e,t)=>{let r=e.inputs,i=r[0].dims,n=O.normalizeAxis(t.axis,i.length);ql(r,n);let a=i.slice();a[n]=r.reduce((o,u)=>o+(u.dims.length>n?u.dims[n]:0),0);let s=r.filter(o=>O.size(o.dims)>0);e.compute(jl(s,n,a,r[0].dataType),{inputs:s})},oh=e=>ye({axis:e.axis})}),Vt,qt,Ft,Oa,jt=V(()=>{"use strict";ne(),oe(),Vt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},qt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Ft=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Oa=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[Rp,Mp];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Oe,lh,Ra=V(()=>{"use strict";Oe=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},lh=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),uh,M_=V(()=>{"use strict";uh=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),Ei,Ma,Da=V(()=>{"use strict";ne(),oe(),le(),jt(),Ei=(e,t,r,i,n)=>{let a=i-r;return`
      ${Array.from({length:r}).map((s,o)=>`
      if (${ee(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,ee(n,o+a,i))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},Ma=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,u=s[s.length-2],d=o[o.length-1],c=s[s.length-1],h=Ce(d),m=Ce(c),_=Ce(u),g=O.size(r)/h/_,w=e.length>2,x=i?i.slice(0,-2):r.slice(0,-2),$=[O.size(x),u,d],b=[{type:12,data:g},{type:12,data:u},{type:12,data:d},{type:12,data:c}];qt(t,b),b.push(...te(x,s,o)),w&&b.push(...te(e[2].dims)),b.push(...te($));let C=T=>{let I=Ea("batch_dims",e[0].dataType,x.length),E=B("a",e[0].dataType,s.length,m),k=B("b",e[1].dataType,o.length,h),z=J("output",e[0].dataType,$.length,h),M=ke(z.type.tensor),W=Vt(t,z.type.value,M),j=[E,k],H="";if(w){let K=n?h:1;j.push(B("bias",e[2].dataType,e[2].dims.length,K)),H=`${n?`value += bias[col / ${K}];`:`value += ${z.type.value}(bias[row + i]);`}`}let F=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Ft(t,F);let U=()=>{let K=`var a_data: ${E.type.value};`;for(let Z=0;Z<m;Z++)K+=`
              let b_data${Z} = b[(b_offset + (k + ${Z}) * uniforms.N + col) / ${h}];`;for(let Z=0;Z<_;Z++){K+=`a_data = a[(a_offset + (row + ${Z}) * uniforms.K + k) / ${m}];`;for(let Y=0;Y<m;Y++)K+=`
            values[${Z}] = fma(${k.type.value}(a_data${m===1?"":`[${Y}]`}), b_data${Y}, values[${Z}]);
`}return K};return`
  ${T.registerUniforms(F).registerInternalVariables(I).declareVariables(...j,z)}
  ${T.mainStart()}
    ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${h})) * ${h};
    var index1 = global_idx / (uniforms.N / ${h});
    let stride1 = uniforms.M / ${_};
    let row = (index1 % stride1) * ${_};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${I.offsetToIndices("batch")};`}

    var a_indices: ${E.type.indices};
    ${Ei("a_indices",E,E.rank-2,I.rank,"batch_indices")}
    ${E.indicesSet("a_indices",E.rank-2,0)}
    ${E.indicesSet("a_indices",E.rank-1,0)}
    let a_offset = ${E.indicesToOffset("a_indices")};

    var b_indices: ${k.type.indices};
    ${Ei("b_indices",k,k.rank-2,I.rank,"batch_indices")}
    ${k.indicesSet("b_indices",k.rank-2,0)}
    ${k.indicesSet("b_indices",k.rank-1,0)}
    let b_offset = ${k.indicesToOffset("b_indices")};
    var values: array<${z.type.value}, ${_}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${m}) {
      ${U()}
    }
    for (var i = 0u; i < ${_}u; i++) {
      var value = values[i];
      ${H}
      ${W}
      let cur_indices = ${z.type.indices}(batch, row + i, col);
      let offset = ${z.indicesToOffset("cur_indices")};
      ${z.setByOffset(`offset / ${h}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${h};${m};${_};${n}`,inputDependencies:w?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:b}),getShaderSource:C}}}),Hl,Kl,la,Tn,Yl,ua,Xl,mr,Ba=V(()=>{"use strict";ne(),oe(),le(),jt(),Da(),Ra(),Hl=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,Kl=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,la=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32)=>{let u=t[1]*e[1],d=t[0]*e[0],c=n?u:a,h=n?a:u,m=c/t[0],_=a/t[1];if(!((n&&m===4&&e[1]===4||!n&&(m===3||m===4))&&c%t[0]===0&&a%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${n} is true, innerElementSize ${m} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${m} must be 3 or 4.
  tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}. tileInner ${a} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${m}<${r}>, ${c/m}>, ${h}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${d/e[0]}>, ${a}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${m};
const tileInner = ${a};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${u};

  let num_tiles = ${s?`${Math.ceil(o/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${_};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${Hl(n,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${m===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${Kl(n,m)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Tn=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,Yl=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",ua=(e,t,r="f32",i,n=!1,a=32,s=!1,o=32,u=!1)=>{let d=e[1]*t[1],c=e[0]*t[0],h=n?d:a,m=n?a:d;if(!(m%t[1]===0&&h%t[0]===0&&a%t[1]===0))throw new Error(`tileAHight ${m} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${h} must be divisible by workgroupSize[0]${t[0]}, tileInner ${a} must be divisible by workgroupSize[1]${t[1]}`);let _=m/t[1],g=h/t[0],w=a/t[1],x=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${d};
    let globalColStart = i32(workgroupId.x) * ${c};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${m}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${h}; inputCol = inputCol + ${t[0]}) {
          ${Tn(n,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${a}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${n?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${d};

let tileRowA = i32(localId.y) * ${_};
let tileColA = i32(localId.x) * ${g};
let tileRowB = i32(localId.y) * ${w};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${g}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${Tn(n,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${w}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${Yl(n)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${h}>, ${m}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${c}>, ${a}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${a};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(o/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${x}
  }
`},Xl=(e,t,r,i,n=!1)=>{let[a,s,o,u]=i,d=ke(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Oe(e,d)} {
      var value = ${Oe(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${Ei("aIndices",s,s.rank-2,a.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Oe(e,d)} {
      var value = ${Oe(e,d)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${Ei("bIndices",o,o.rank-2,a.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Oe(e,d)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${n?"bias[colIn]":`${Oe(e,d)}(bias[row])`};`:""}
        ${r}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},mr=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,o=e[1].dims,u=s.slice(0,-2),d=o.slice(0,-2),c=i?i.slice(0,-2):r.slice(0,-2),h=O.size(c),m=s[s.length-2],_=s[s.length-1],g=o[o.length-1],w=_%4===0&&g%4===0,x=m<=8?[4,1,1]:[4,4,1],$=[8,8,1],b=[Math.ceil(g/$[0]/x[0]),Math.ceil(m/$[1]/x[1]),Math.ceil(h/$[2]/x[2])],C=w?4:1,T=[...u,m,_/C],I=T.length,E=[...d,_,g/C],k=E.length,z=[h,m,g/C],M=[{type:6,data:m},{type:6,data:g},{type:6,data:_}];qt(t,M),M.push(...te(c,T,E));let W=["rank","rank"],j=e.length>2;j&&(M.push(...te(e[2].dims)),W.push("rank")),M.push(...te(z));let H=F=>{let U=c.length,K=Ea("batchDims",e[0].dataType,U,1),Z=ke(e[0].dataType),Y=B("a",e[0].dataType,I,C),ae=B("b",e[1].dataType,k,C),X=J("result",e[0].dataType,z.length,C),me=[Y,ae];if(j){let N=n?C:1;me.push(B("bias",e[2].dataType,e[2].dims.length,N))}let P=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Ft(t,P);let q=ke(X.type.tensor),ie=Vt(t,X.type.value,q),pe=Xl(C,j,ie,[K,Y,ae,X],n);return`
  ${F.registerUniforms(P).registerInternalVariables(K).declareVariables(...me,X)}
  ${pe}
  ${w?la(x,$,Z,K):ua(x,$,Z,K)}
                   `};return{name:"MatMul",shaderCache:{hint:`${x};${t.activation};${w};${n}`,inputDependencies:W},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:b[0],y:b[1],z:b[2]},programUniforms:M}),getShaderSource:H}}}),Zl,dh,D_=V(()=>{"use strict";ne(),pt(),le(),jt(),Ra(),M_(),Ba(),Zl=(e,t,r,i,n=!1,a,s=4,o=4,u=4,d="f32")=>{let c=M=>{switch(M){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${d}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${M} is not supported.`)}},h=M=>{switch(M){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${M} is not supported.`)}},m=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,_=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,g=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",w=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",x=e?"row":"col",$=e?"col":"row",b=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${x} / outWidth;
    let outCol = ${x} % outWidth;

    let WRow = ${$} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${$} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${$} % inChannels;
    var resData = ${Oe(s,d)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${g} && xCol >= 0 && xCol < ${w}) {
      ${m}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${c(s)}
    }
    return resData;`,C=e?t&&i?`
    let col = colIn * ${s};
    ${b}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${b}
    }
    return ${Oe(s,d)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${b}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${b}
    }
    return ${Oe(s,d)}(0.0);`,T=e?i&&r?h(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${h(o)}
    }
    return ${Oe(o,d)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${h(o)}
    }
    return ${Oe(o,d)}(0.0);`,I=Oe(u,d),E=Oe(e?s:o,d),k=Oe(e?o:s,d),z=Vt(a,I,d);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${E} {
      ${e?C:T}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${k} {
      ${e?T:C}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${I}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${_}
      ${lh(n)}
      ${z}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},dh=(e,t,r,i,n,a,s,o,u)=>{let d=t.format==="NHWC",c=d?e[0].dims[3]:e[0].dims[1],h=r[0],m=d?r[2]:r[3],_=d?r[1]:r[2],g=d?r[3]:r[1],w=d&&(c%4===0||c%3===0)&&g%4===0,x=d?g:m*_,$=d?m*_:g,b=[8,8,1],C=i<=8?[4,1,1]:[4,4,1],T=[Math.ceil(x/b[0]/C[0]),Math.ceil($/b[1]/C[1]),Math.ceil(h/b[2]/C[2])];ce("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${T}`);let I=w?d&&c%4!==0?3:4:1,E=b[1]*C[1],k=b[0]*C[0],z=Math.max(b[0]*I,b[1]),M=i%E===0,W=n%k===0,j=a%z===0,H=w?[I,4,4]:[1,1,1],F=[{type:6,data:i},{type:6,data:n},{type:6,data:a},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];qt(t,F),F.push(...te(e[0].dims,e[1].dims));let U=["rank","rank"];s&&(F.push(...te(e[2].dims)),U.push("rank")),F.push(...te(r));let K=Z=>{let Y=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Ft(t,Y);let ae=w?4:1,X=ke(e[0].dataType),me=`
      fn setOutputAtIndex(flatIndex : i32, value : ${w?`vec4<${X}>`:X}) {
        result[flatIndex] = ${w?`vec4<${X}>`:X}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${w?`vec4<${X}>`:X}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${w?"/ 4":""}, value);
      }`,P=B("x",e[0].dataType,e[0].dims.length,I===3?1:I),q=B("w",e[1].dataType,e[1].dims.length,ae),ie=[P,q],pe=J("result",e[0].dataType,r.length,ae);if(s){let N=B("bias",e[2].dataType,e[2].dims.length,ae);ie.push(N),me+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${w?`vec4<${X}>`:X} {
          return bias[coords.${d?"w":"y"}${w?"/ 4":""}];
        }`}return`
        ${uh("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${Z.registerUniforms(Y).declareVariables(...ie,pe)}
        ${me}
        ${Zl(d,M,W,j,s,t,H[0],H[1],H[2],X)}
        ${w?la(C,b,X,void 0,!d,z):ua(C,b,X,void 0,!d,z,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${w};${M};${W};${j};${E};${k};${z}`,inputDependencies:U},getRunData:()=>({outputs:[{dims:u?u(r):r,dataType:e[0].dataType}],dispatchGroup:{x:T[0],y:T[1],z:T[2]},programUniforms:F}),getShaderSource:K}}}),Ql,Sn,yi,Jl,In,eu,ph,ch,B_=V(()=>{"use strict";ne(),pt(),oe(),le(),jt(),Ra(),Ql=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},Sn=e=>typeof e=="number"?[e,e,e]:e,yi=(e,t)=>t<=1?e:e+(e-1)*(t-1),Jl=(e,t,r,i=1)=>{let n=yi(t,i);return Math.floor((e[0]*(r-1)-r+n)/2)},In=(e,t,r,i,n)=>{n==null&&(n=Jl(e,t[0],i[0]));let a=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*n>=t[s]&&(a[s]=Math.trunc((e[s]-t[s]+2*n)/i[s]+1));return a},eu=(e,t,r,i,n,a,s,o,u,d)=>{let c,h,m,_;if(e==="VALID"&&(e=0),typeof e=="number"){c={top:e,bottom:e,left:e,right:e,front:e,back:e};let g=In([t,r,i,1],[o,u,d],1,[n,a,s],e);h=g[0],m=g[1],_=g[2]}else if(Array.isArray(e)){if(!e.every((w,x,$)=>w===$[0]))throw Error(`Unsupported padding parameter: ${e}`);c={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let g=In([t,r,i,1],[o,u,d],1,[n,a,s],e[0]);h=g[0],m=g[1],_=g[2]}else if(e==="SAME_UPPER"){h=Math.ceil(t/n),m=Math.ceil(r/a),_=Math.ceil(i/s);let g=(h-1)*n+o-t,w=(m-1)*a+u-r,x=(_-1)*s+d-i,$=Math.floor(g/2),b=g-$,C=Math.floor(w/2),T=w-C,I=Math.floor(x/2),E=x-I;c={top:C,bottom:T,left:I,right:E,front:$,back:b}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:c,outDepth:h,outHeight:m,outWidth:_}},ph=(e,t,r,i,n,a=!1,s="channelsLast")=>{let o,u,d,c,h;if(s==="channelsLast")[o,u,d,c,h]=e;else if(s==="channelsFirst")[o,h,u,d,c]=e;else throw new Error(`Unknown dataFormat ${s}`);let[m,,_,g,w]=t,[x,$,b]=Sn(r),[C,T,I]=Sn(i),E=yi(_,C),k=yi(g,T),z=yi(w,I),{padInfo:M,outDepth:W,outHeight:j,outWidth:H}=eu(n,u,d,c,x,$,b,E,k,z),F=a?m*h:m,U=[0,0,0,0,0];return s==="channelsFirst"?U=[o,F,W,j,H]:s==="channelsLast"&&(U=[o,W,j,H,F]),{batchSize:o,dataFormat:s,inDepth:u,inHeight:d,inWidth:c,inChannels:h,outDepth:W,outHeight:j,outWidth:H,outChannels:F,padInfo:M,strideDepth:x,strideHeight:$,strideWidth:b,filterDepth:_,filterHeight:g,filterWidth:w,effectiveFilterDepth:E,effectiveFilterHeight:k,effectiveFilterWidth:z,dilationDepth:C,dilationHeight:T,dilationWidth:I,inShape:e,outShape:U,filterShape:t}},ch=(e,t,r,i,n,a)=>{let s=a==="channelsLast",o=s?e[0].dims[3]:e[0].dims[1],u=!1,d=[64,1,1],c={x:r.map((b,C)=>C)},h=[Math.ceil(Ql(c.x.map(b=>r[b]))/d[0]),1,1];ce("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${h}`);let m=u?s&&o%4!==0?3:4:1,_=O.size(r),g=[{type:12,data:_},{type:12,data:i},{type:12,data:n},{type:12,data:t.strides},{type:12,data:t.dilations}];qt(t,g),g.push(...te(e[0].dims,e[1].dims));let w=["rank","rank"],x=e.length===3;x&&(g.push(...te(e[2].dims)),w.push("rank")),g.push(...te(r));let $=b=>{let C=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:n.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Ft(t,C);let T=u?4:1,I=ke(e[0].dataType),E=B("x",e[0].dataType,e[0].dims.length,m===3?1:m),k=B("W",e[1].dataType,e[1].dims.length,T),z=[E,k],M=J("result",e[0].dataType,r.length,T),W="";if(x){let F=B("bias",e[2].dataType,e[2].dims.length,T);z.push(F),W+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${u?`vec4<${I}>`:I} {
          return bias[${s?ee("coords",4,5):ee("coords",1,5)}${u?"/ 4":""}];
        }`}let j=Oe(m,I),H=Vt(t,j,I);return`
            ${W}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${E.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${k.getByIndices("aIndices")};
            }
          ${b.registerUniforms(C).declareVariables(...z,M)}
          ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${M.offsetToIndices("global_idx")};
              let batch = ${ee("coords",0,E.rank)};
              let d2 = ${s?ee("coords",E.rank-1,E.rank):ee("coords",1,E.rank)};
              let xFRCCorner = vec3<u32>(${s?ee("coords",1,E.rank):ee("coords",2,E.rank)},
              ${s?ee("coords",2,E.rank):ee("coords",3,E.rank)},
              ${s?ee("coords",3,E.rank):ee("coords",4,E.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?ee("uniforms.x_shape",1,E.rank):ee("uniforms.x_shape",2,E.rank)};
              let xShapeZ = ${s?ee("uniforms.x_shape",2,E.rank):ee("uniforms.x_shape",3,E.rank)};
              let xShapeW = ${s?ee("uniforms.x_shape",3,E.rank):ee("uniforms.x_shape",4,E.rank)};
              let xShapeU = ${s?ee("uniforms.x_shape",4,E.rank):ee("uniforms.x_shape",1,E.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${x?"value = value + getBiasByOutputCoords(coords)":""};
              ${H}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${m};${x}`,inputDependencies:w},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:h[0],y:h[1],z:h[2]},programUniforms:g}),getShaderSource:$}}}),hh,fh,N_=V(()=>{"use strict";ne(),oe(),le(),jt(),hh=(e,t,r,i)=>{let n=e.length>2,a=n?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,u=t.format==="NHWC",d=u?r[3]:r[1],c=d/t.group,h=u&&c>=4?Ce(d):1,m=O.size(r)/h,_=[{type:12,data:m},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:c}];qt(t,_),_.push(...te(s,[o[0],o[1],o[2],o[3]/h]));let g=n?["rank","rank","rank"]:["rank","rank"];_.push(...te([r[0],r[1],r[2],r[3]/h]));let w=x=>{let $=J("output",e[0].dataType,r.length,h),b=ke($.type.tensor),C=Vt(t,$.type.value,b),T=B("x",e[0].dataType,s.length),I=B("w",e[1].dataType,o.length,h),E=[T,I];n&&E.push(B("b",e[2].dataType,e[2].dims,h));let k=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Ft(t,k);let z=u?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${T.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${I.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${T.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${I.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${x.registerUniforms(k).declareVariables(...E,$)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${$.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${u?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${h} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

    var value: ${$.type.value} = ${$.type.value}(0);
    ${z}
    ${a}
    ${C}
    ${$.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${h}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:_}),getShaderSource:w}},fh=(e,t,r,i)=>{let n=e.length>2,a=Ce(r[3]),s=Ce(r[2]),o=O.size(r)/a/s,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/a],d=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/a],c=[r[0],r[1],r[2],r[3]/a],h=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];qt(t,h),h.push(...te(u,d,c));let m=(s-1)*t.strides[1]+d[1],_=g=>{let w=J("output",e[0].dataType,c.length,a),x=ke(w.type.tensor),$=Vt(t,w.type.value,x),b=B("x",e[0].dataType,u.length,a),C=B("w",e[1].dataType,d.length,a),T=[b,C];n&&T.push(B("b",e[2].dataType,e[2].dims,a));let I=n?"value += b[output_channel];":"",E=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Ft(t,E),`
  ${g.registerUniforms(E).declareVariables(...T,w)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${b.type.value}, ${m}>;
    var values: array<${w.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${d[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${m}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${b.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${b.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${d[1]}; w_width++) {
          let w_val = ${C.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${I}
      ${$}
      ${w.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${a};${s};${m};${d[0]};${d[1]}`,inputDependencies:n?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:h}),getShaderSource:_}}}),tu,rr,iu,nr,da,En,ru,nu,pa,P_=V(()=>{"use strict";oe(),D_(),B_(),Ba(),N_(),jt(),Da(),Ct(),tu=(e,t,r,i,n,a)=>{let s=e[0],o=e.slice(a?1:2,a?3:4),u=o.length,d=t[0],c=t.slice(2).map((m,_)=>m+(m-1)*(r[_]-1)),h=o.map((m,_)=>m+i[_]+i[_+u]).map((m,_)=>Math.floor((m-c[_]+n[_])/n[_]));return h.splice(0,0,s),h.splice(a?3:1,0,d),h},rr=[2,3,1,0],iu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},nr=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let a=2;a<t[1].dims.length;++a)r[a-2]===0&&(r[a-2]=t[1].dims[a]);let i=e.pads.slice();hr.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let n=Object.assign({},e);return Object.assign(n,{kernelShape:r,pads:i}),n},da=e=>{let t=Oa(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],n=e.dilations,a=e.group,s=e.kernel_shape,o=e.pads,u=e.strides,d=e.w_is_const();return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,pads:o,strides:u,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},En=(e,t,r,i)=>{let n=r.format==="NHWC",a=tu(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,n);if(r.group!==1){let E=[t[0]];if(n){let k=e.kernelCustomData.wT??e.compute(We(t[1],rr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=k),E.push(k)}else E.push(t[1]);t.length===3&&E.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&n&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(fh(E,r,a,i),{inputs:E}):e.compute(hh(E,r,a,i),{inputs:E});return}let s=t.length===3,o=t[0].dims[n?1:2],u=t[0].dims[n?2:3],d=t[0].dims[n?3:1],c=t[1].dims[2],h=t[1].dims[3],m=a[n?1:2],_=a[n?2:3],g=a[n?3:1],w=n&&c===o&&h===u&&r.pads[0]===0&&r.pads[1]===0;if(w||c===1&&h===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let E=a[0],k,z,M,W=[];if(n){let F=e.kernelCustomData.wT??e.compute(We(t[1],rr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=F),w){let U=o*u*d;k=t[0].reshape([1,E,U]),z=F.reshape([1,U,g]),M=[1,E,g]}else k=t[0].reshape([E,o*u,d]),z=F.reshape([1,d,g]),M=[E,m*_,g];W.push(k),W.push(z)}else k=t[0].reshape([E,d,o*u]),z=t[1].reshape([1,g,d]),M=[E,g,m*_],W.push(z),W.push(k);s&&W.push(t[2]);let j=M[2],H=W[0].dims[W[0].dims.length-1];j<8&&H<8?e.compute(Ma(W,r,a,M,n,i),{inputs:W}):e.compute(mr(W,r,a,M,n,i),{inputs:W});return}let x=!0,$=e.kernelCustomData.wT??e.compute(We(t[1],rr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=$);let b=[t[0],$];s&&b.push(t[2]);let C=n?m*_:g,T=n?g:m*_,I=c*h*d;e.compute(dh(b,r,a,C,T,I,s,x,i),{inputs:b})},ru=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=[0,t.pads[0],0,t.pads[1]],a=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=nr({...t,pads:n,strides:a,dilations:s,kernelShape:o},i);En(e,i,u,d=>r?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},nu=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",n=nr(r,t),a=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=ph(t[0].dims,t[1].dims,r.strides,r.dilations,a,!1,i);e.compute(ch(t,n,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},pa=(e,t)=>{if(iu(e.inputs,t),e.inputs[0].dims.length===3)ru(e,t);else if(e.inputs[0].dims.length===5)nu(e,e.inputs,t);else{let r=nr(t,e.inputs);En(e,e.inputs,r)}}}),mh,L_=V(()=>{"use strict";ne(),pt(),oe(),le(),mh=(e,t,r)=>{let i=e.length>2,n=t.outputShape,a=t.format==="NHWC",s=t.group,o=e[1].dims,u=o[2]/s,d=o[3],c=a?Ce(u):1,h=a&&d===1&&u>=4,m=h?Math.floor(u/4)*4:Math.floor(u/c)*c,_=u-m,g=a?Ce(d):1,w=a?d===1?c:g:1,x=O.size(n)/g,$=[Math.ceil(x/64),1,1];ce("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${$}`);let b=["rank","rank"],C=[t.strides[0],t.strides[1]],T=[t.kernelShape[a?1:2],t.kernelShape[a?2:3]],I=[t.dilations[0],t.dilations[1]],E=[T[0]+(t.dilations[0]<=1?0:(t.kernelShape[a?1:2]-1)*(t.dilations[0]-1)),T[1]+(t.dilations[1]<=1?0:(t.kernelShape[a?2:3]-1)*(t.dilations[1]-1))],k=[E[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),E[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],z=[{type:12,data:x},{type:12,data:C},{type:12,data:T},{type:12,data:I},{type:12,data:E},{type:6,data:k},{type:12,data:m},{type:12,data:u},{type:12,data:d},...te(e[0].dims,e[1].dims)];i&&(z.push(...te(e[2].dims)),b.push("rank")),z.push(...te(n));let M=W=>{let j=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:C.length},{name:"filter_dims",type:"u32",length:T.length},{name:"dilations",type:"u32",length:T.length},{name:"effective_filter_dims",type:"u32",length:E.length},{name:"pads",type:"i32",length:k.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],H=ke(e[0].dataType),F=a?1:2,U=a?2:3,K=a?3:1,Z=B("W",e[1].dataType,e[1].dims.length,w),Y=B("Dy",e[0].dataType,e[0].dims.length,c),ae=[Y,Z];i&&ae.push(B("bias",e[2].dataType,[n[K]].length,g));let X=J("result",e[0].dataType,n.length,g),me=()=>{let ie="";if(h)c===4?ie+=`
        let xValue = ${Y.getByOffset("x_offset")};
        let wValue = ${Z.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:c===2?ie+=`
          dotProd = dotProd + dot(vec4<${H}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}), vec4<${H}>(${Z.getByOffset("w_offset")}, ${Z.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:c===1&&(ie+=`
          dotProd = dotProd + dot(vec4<${H}>(${Y.getByOffset("x_offset")}, ${Y.getByOffset("x_offset + 1u")}, ${Y.getByOffset("x_offset + 2u")}, ${Y.getByOffset("x_offset + 3u")}), vec4<${H}>(${Z.getByOffset("w_offset")}, ${Z.getByOffset("w_offset + 1u")}, ${Z.getByOffset("w_offset + 2u")}, ${Z.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(ie+=`
                  let xValue = ${a?Y.getByOffset(`${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c}`):Y.get("batch","inputChannel","idyR","idyC")};
        `,c===1)ie+=`
          let w_offset = ${Z.indicesToOffset(`${Z.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${Z.getByOffset(`w_offset / ${w}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let pe=0;pe<c;pe++)ie+=`
            let wValue${pe} = ${Z.getByOffset(`${Z.indicesToOffset(`${Z.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${pe}, wOutChannel)`)} / ${w}`)};
            dotProd = dotProd + xValue[${pe}] * wValue${pe};`;return ie},P=()=>{if(_===0)return"";if(!h)throw new Error(`packInputAs4 ${h} is not true.`);let ie="";if(c===1){ie+="dotProd = dotProd";for(let pe=0;pe<_;pe++)ie+=`
            + ${Y.getByOffset(`x_offset + ${pe}`)} * ${Z.getByOffset(`w_offset + ${pe}`)}`;ie+=";"}else if(c===2){if(_!==2)throw new Error(`Invalid inputChannelsRemainder ${_}.`);ie+=`
          let xValue = ${Y.getByOffset("x_offset")};
          let wValue = ${Z.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return ie},q=`
            let outputIndices = ${X.offsetToIndices(`global_idx * ${g}`)};
            let batch = ${X.indicesGet("outputIndices",0)};
            let d1 = ${X.indicesGet("outputIndices",K)};
            let r = ${X.indicesGet("outputIndices",F)};
            let c = ${X.indicesGet("outputIndices",U)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${X.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${H}(dyRCorner) + ${H}(wR)) / ${H}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${H}(uniforms.Dy_shape[${F}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${H}(dyCCorner) + ${H}(wC)) / ${H}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${H}(uniforms.Dy_shape[${U}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${h?`
                var x_offset = ${Y.indicesToOffset(`${Y.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c};
                var w_offset = ${Z.indicesToOffset(`${Z.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${w};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${h?4:c}) {
                  ${me()}
                  inputChannel = inputChannel + ${h?4:c};
                }
                ${P()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${g}]`:""};
            ${X.setByOffset("global_idx","value")};
          `;return`
    ${W.registerUniforms(j).declareVariables(...ae,X)}
      ${W.mainStart()}
      ${W.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${q}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${c}${w}${g}${h}${_}`,inputDependencies:b},getRunData:()=>({dispatchGroup:{x:$[0],y:$[1],z:$[2]},outputs:[{dims:r?r(n):n,dataType:e[0].dataType}],programUniforms:z}),getShaderSource:M}}}),au,su,ou,kn,gh,lu,An,uu,_h,U_=V(()=>{"use strict";L_(),jt(),Ct(),au=(e,t,r,i,n,a)=>(e-1)*t+r+(i-1)*n+1-a,su=(e,t,r,i,n)=>{let a=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=a,r[n]=e-a):t==="SAME_LOWER"&&(r[i]=e-a,r[n]=a)},ou=(e,t,r,i,n,a,s,o,u,d)=>{let c=e.length-2,h=d.length===0;u.length<c&&u.push(...Array(c-u.length).fill(0));let m=e[0],_=t[o?3:1]*n;for(let g=0,w=e.length-c-(o?1:0);g<c;++g,++w){let x=e[w],$=h?x*s[g]:d[g],b=au(x,s[g],a[g],t[w],r[g],$);su(b,i,a,g,g+c),h&&d.push(s[g]*(x-1)+u[g]+(t[w]-1)*r[g]+1-a[g]-a[g+c])}d.splice(0,0,m),d.splice(o?3:1,0,_)},kn=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((h,m)=>h*m,1)===0){r.length=0;for(let h=2;h<t[1].dims.length;++h)r.push(t[1].dims[h])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let n=e.pads.slice(),a=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((h,m)=>h+m,0)===0){let h=t[0].dims.length-2;u=new Array(h).fill(1)}let d=e.strides.slice();if(d.reduce((h,m)=>h+m,0)===0){let h=t[0].dims.length-2;d=new Array(h).fill(1)}ou(o,r,u,e.autoPad,e.group,n,d,i,s,a);let c=Object.assign({},e);return Object.assign(c,{kernelShape:r,pads:n,outputPadding:s,outputShape:a,dilations:u,strides:d}),c},gh=e=>{let t=Oa(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],n=e.dilations,a=e.group,s=e.kernelShape,o=e.pads,u=e.strides,d=e.wIsConst(),c=e.outputPadding,h=e.outputShape;return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,outputPadding:c,outputShape:h,pads:o,strides:u,wIsConst:d,...t,cacheKey:`${e.format};${t.activation};`}},lu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let n=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==n))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.outputPadding.length!==a&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${a}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},An=(e,t,r,i)=>{let n=e.kernelCustomData.wT??e.compute(We(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=n);let a=[t[0],n];t.length===3&&a.push(t[2]),e.compute(mh(a,r,i),{inputs:a})},uu=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=t.kernelShape;(n.length===0||n[0]===0)&&(n=[e.inputs[1].dims[2]]);let a=t.dilations;(a.length===0||a[0]===0)&&(a=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),a=[1].concat(a),n=[1].concat(n);let u=t.outputPadding;u=[0].concat(u);let d=kn({...t,pads:o,strides:s,dilations:a,kernelShape:n,outputPadding:u},i);An(e,i,d,c=>r?[c[0],c[2],c[3]]:[c[0],c[1],c[3]])},_h=(e,t)=>{if(lu(e.inputs,t),e.inputs[0].dims.length===3)uu(e,t);else{let r=kn(t,e.inputs);An(e,e.inputs,r)}}}),du,yh,bh,W_=V(()=>{"use strict";ne(),oe(),Te(),le(),du=(e,t,r,i)=>{let n=O.size(t),a=t.length,s=B("input",e,a),o=J("output",e,a),u=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),d=O.normalizeAxis(u,a),c=h=>{let m=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,_=ee("uniforms.input_shape","uniforms.axis",a),g=i.reverse?m+(i.exclusive?" + 1":""):"0",w=i.reverse?_:m+(i.exclusive?"":" + 1");return`
                ${h.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,o)}
                ${h.mainStart()}
                  ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${o.offsetToIndices("global_idx")};
                  var sum = ${o.type.value}(0);
                  let first : i32 = ${g};
                  let last : i32 = ${w};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${o.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},{type:12,data:d},...te(t,t)]}),getShaderSource:c}},yh=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,n=e.inputs[1];e.compute(du(i,r,n,t),{inputs:[0]})},bh=e=>{let t=e.exclusive===1,r=e.reverse===1;return ye({exclusive:t,reverse:r})}}),pu,cu,hu,wh,vh,V_=V(()=>{"use strict";ne(),oe(),Te(),le(),pu=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},cu=(e,t,r,i)=>{let n=[];n.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let a=0;a<t;++a)n.push(r.indicesSet("a",e[a],`i[${a}]`));return n.push("return a;}"),n.join(`
`)},hu=(e,t)=>{let r,i,n,a,s,o,u=t.format==="NHWC",d=t.blocksize,c=t.mode==="DCR";u?([r,i,n,a]=e.dims,s=c?[r,i,n,d,d,a/d**2]:[r,i,n,a/d**2,d,d],o=c?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,n,a]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=c?[r,d,d,a/d**2,i,n]:[r,a/d**2,d,d,i,n],o=c?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let h=e.reshape(s),m=h.dims.length,_=e.dataType,g=B("a",_,m),w=J("output",_,m),x=$=>`
  ${$.registerUniform("output_size","u32").declareVariables(g,w)}

  ${cu(o,m,g,w)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${w.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${w.setByOffset("global_idx",g.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:$=>{let b=u?[r,i*d,n*d,a/d**2]:[r,a/d**2,i*d,n*d],C=O.size(b),T=h.dims,I=O.sortBasedOnPerm(T,o);return{outputs:[{dims:b,dataType:$[0].dataType}],dispatchGroup:{x:Math.ceil(C/64)},programUniforms:[{type:12,data:C},...te(T,I)]}},getShaderSource:x}},wh=(e,t)=>{pu(e.inputs),e.compute(hu(e.inputs[0],t))},vh=e=>ye({blocksize:e.blocksize,mode:e.mode,format:e.format})}),ar,bi,zn,fu,mu,gu,_u,On,yu,$h,xh,q_=V(()=>{"use strict";ne(),oe(),Te(),le(),ar="[a-zA-Z]|\\.\\.\\.",bi="("+ar+")+",zn="^"+bi+"$",fu="("+bi+",)*"+bi,mu="^"+fu+"$",gu=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},_u=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(mu)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,a)=>{let s=e[a].dims.slice();if(!n.match(RegExp(zn)))throw new Error("Invalid LHS term");let o=this.processTerm(n,!0,s,a);this.lhs.push(o)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,a])=>a.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(bi)))throw new Error("Invalid RHS");i.match(RegExp(ar,"g"))?.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(n);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let n=r.length,a=!1,s=[],o=0;if(!e.match(RegExp(zn))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(ar,"g")),d=new gu(i);return u?.forEach((c,h)=>{if(c==="..."){if(a)throw new Error("Only one ellipsis is allowed per input term");a=!0;let m=n-u.length+1;if(m<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(o,o+m),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let _=0;_<s.length;_++){let g=String.fromCharCode(48+_);d.addSymbol(g,h+_),this.addSymbol(g,r[o++],i)}}else d.addSymbol(c,h+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(c,r[o++],i)}),d}},On=e=>e+"_max",yu=(e,t,r,i)=>{let n=e.map(d=>d.length).map((d,c)=>B(`input${c}`,t,d)),a=O.size(i),s=J("output",t,i.length),o=[...r.symbolToInfo.keys()].filter(d=>!r.rhs.symbolToIndices.has(d)),u=d=>{let c=[],h="var prod = 1.0;",m="var sum = 0.0;",_="sum += prod;",g=[],w=[],x=[],$=[],b=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((T,I)=>{if(r.rhs.symbolToIndices.has(I)){let E=r.rhs.symbolToIndices.get(I)?.[0];E!==void 0&&r.lhs.forEach((k,z)=>{if(T.inputIndices.includes(z)){let M=k.symbolToIndices.get(I);if(M===void 0)throw new Error("Invalid symbol error");M.forEach(W=>{c.push(`${n[z].indicesSet(`input${z}Indices`,W,s.indicesGet("outputIndices",E))}`)})}})}else r.lhs.forEach((E,k)=>{if(T.inputIndices.includes(k)){let z=E.symbolToIndices.get(I);if(z===void 0)throw new Error("Invalid symbol error");z.forEach(M=>{g.push(`${n[k].indicesSet(`input${k}Indices`,M,`${I}`)}`)}),$.push(`prod *= ${n[k].getByIndices(`input${k}Indices`)};`)}}),w.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${On(I)}; ${I}++) {`),x.push("}")});let C=b?[...c,`let sum = ${n.map((T,I)=>T.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...c,m,...w,...g,h,...$,_,...x];return`
            ${d.registerUniforms(o.map(T=>({name:`${On(T)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...n,s)}

            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${n.map((T,I)=>`var input${I}Indices: ${n[I].type.indices};`).join(`
`)}
            ${C.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let d=o.filter(h=>r.symbolToInfo.has(h)).map(h=>({type:12,data:r.symbolToInfo.get(h)?.dimValue||0}));d.push({type:12,data:a});let c=e.map((h,m)=>[...te(h)]).reduce((h,m)=>h.concat(m),d);return c.push(...te(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:c}},getShaderSource:u}},$h=(e,t)=>{let r=new _u(e.inputs,t.equation),i=r.outputDims,n=e.inputs.map((a,s)=>a.dims);e.compute(yu(n,e.inputs[0].dataType,r,i))},xh=e=>{let t=e.equation.replace(/\s+/g,"");return ye({equation:t})}}),bu,Rn,wu,vu,Ch,F_=V(()=>{"use strict";ne(),oe(),le(),bu=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,n=t.length<r.length?0:t.length-r.length;for(;i<r.length&&n<t.length;++i,++n)if(r[i]!==t[n]&&r[i]!==1&&t[n]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Rn=(e,t)=>{let r=e.length-t.length,i=[];for(let n=0;n<r;++n)i.push(e[n]);for(let n=0;n<t.length;++n)i.push(t[n]===1?e[n+r]:t[n]);return i},wu=(e,t)=>e.length>t.length?Rn(e,t):Rn(t,e),vu=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=wu(t,r),n=e[0].dataType,a=n===9||O.size(t)===1,s=n===9||t.length>0&&t[t.length-1]%4===0?4:1,o=a||i.length>0&&i[i.length-1]%4===0?4:1,u=Math.ceil(O.size(i)/o),d=h=>{let m=B("input",n,t.length,s),_=J("output",n,i.length,o),g;if(n===9){let w=(x,$,b="")=>`
          let outputIndices${$} = ${_.offsetToIndices(`outputOffset + ${$}u`)};
          let offset${$} = ${m.broadcastedIndicesToOffset(`outputIndices${$}`,_)};
          let index${$} = offset${$} / 4u;
          let component${$} = offset${$} % 4u;
          ${x}[${$}] = ${b}(${m.getByOffset(`index${$}`)}[component${$}]);
        `;g=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${w("data",0,"u32")}
        ${w("data",1,"u32")}
        ${w("data",2,"u32")}
        ${w("data",3,"u32")}
        ${_.setByOffset("global_idx","data")}
      }`}else g=`
        let outputIndices = ${_.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${m.broadcastedIndicesToOffset("outputIndices",_)};
        let data = ${_.type.value}(${m.getByOffset(`inputOffset / ${s}`)});
        ${_.setByOffset("global_idx","data")}
      }`;return`
    ${h.registerUniform("vec_size","u32").declareVariables(m,_)}
    ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${g}`},c=[{type:12,data:u},...te(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:d,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:c})}},Ch=e=>{bu(e.inputs),e.compute(vu(e.inputs),{inputs:[0]})}}),$u,Th,G_=V(()=>{"use strict";ne(),oe(),le(),za(),$u=e=>{let t=e[0].dataType,r=O.size(e[0].dims),i=O.size(e[1].dims),n=i%4===0,a=s=>{let o=B("x",t,[1],4),u=B("bias",t,[1],4),d=J("y",t,[1],4),c=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],h=_=>`
      let bias${_}_offset: u32 = (global_idx * 4 + ${_}) % uniforms.bias_size;
      let bias${_} = ${u.getByOffset(`bias${_}_offset / 4`)}[bias${_}_offset % 4];`,m=n?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${h(0)}${h(1)}${h(2)}${h(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(c).declareVariables(o,u,d)}

    ${sa(Re(t))}

    ${s.mainStart(ei)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${m}
      let x_in = x + bias;
      ${d.setByOffset("global_idx",oa("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${n}`,inputDependencies:["type","type"]},getShaderSource:a,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/ei/4)}})}},Th=e=>{e.inputs.length<2||O.size(e.inputs[1].dims)===0?Gc(e):e.compute($u(e.inputs))}}),xu,Cu,Sh,Ih,j_=V(()=>{"use strict";ne(),oe(),Te(),le(),xu=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},Cu=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=O.normalizeAxis(t.axis,n),s=r.slice(0);s.splice(a,1,...i);let o=r[a],u=e[0].dataType===9?4:1,d=Math.ceil(O.size(s)/u),c=[{type:12,data:d},{type:6,data:o},{type:12,data:a},...te(e[0].dims,e[1].dims,s)],h=m=>{let _=B("data",e[0].dataType,e[0].dims.length,u),g=B("inputIndices",e[1].dataType,e[1].dims.length),w=J("output",e[0].dataType,s.length,u),x=b=>{let C=i.length,T=`var indicesIndices${b}  = ${g.type.indices}(0);`;for(let I=0;I<C;I++)T+=`${C>1?`indicesIndices${b}[${I}]`:`indicesIndices${b}`} = ${s.length>1?`outputIndices${b}[uniforms.axis + ${I}]`:`outputIndices${b}`};`;T+=`
          var idx${b} = ${g.getByIndices(`indicesIndices${b}`)};
          if (idx${b} < 0) {
            idx${b} = idx${b} + uniforms.axisDimLimit;
          }
          var dataIndices${b} : ${_.type.indices};
        `;for(let I=0,E=0;I<n;I++)I===a?(T+=`${n>1?`dataIndices${b}[${I}]`:`dataIndices${b}`} = u32(idx${b});`,E+=C):(T+=`${n>1?`dataIndices${b}[${I}]`:`dataIndices${b}`} = ${s.length>1?`outputIndices${b}[${E}]`:`outputIndices${b}`};`,E++);return T},$;if(e[0].dataType===9){let b=(C,T,I="")=>`
          let outputIndices${T} = ${w.offsetToIndices(`outputOffset + ${T}u`)};
          ${x(T)};
          let offset${T} = ${_.indicesToOffset(`dataIndices${T}`)};
          let index${T} = offset${T} / 4u;
          let component${T} = offset${T} % 4u;
          ${C}[${T}] = ${I}(${_.getByOffset(`index${T}`)}[component${T}]);
        `;$=`
        let outputOffset = global_idx * ${u};
        var value = vec4<u32>(0);
        ${b("value",0,"u32")}
        ${b("value",1,"u32")}
        ${b("value",2,"u32")}
        ${b("value",3,"u32")}
        ${w.setByOffset("global_idx","value")}
      `}else $=`
      let outputIndices = ${w.offsetToIndices("global_idx")};
      ${x("")};
      let value = ${_.getByIndices("dataIndices")};
      ${w.setByOffset("global_idx","value")};
      `;return`
      ${m.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(_,g,w)}
      ${m.mainStart()}
        ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${$}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:c}),getShaderSource:h}},Sh=e=>ye({axis:e.axis}),Ih=(e,t)=>{let r=e.inputs;xu(r),e.compute(Cu(e.inputs,t))}}),Tu,Eh,kh,H_=V(()=>{"use strict";ne(),oe(),le(),Tu=(e,t,r,i,n,a,s,o,u)=>{let d=[{type:12,data:a},{type:12,data:i},{type:12,data:n},{type:12,data:r},{type:12,data:s},{type:12,data:o},{type:12,data:u}],c=[a];d.push(...te(t.dims,c));let h=m=>{let _=B("indices_data",t.dataType,t.dims.length),g=J("input_slice_offsets_data",12,1,1),w=[_,g],x=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:n.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${m.registerUniforms(x).declareVariables(...w)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${n.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${n.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:c,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:h},{inputs:[t],outputs:[-1]})[0]},Eh=(e,t)=>{let r=e.inputs,i=r[0].dims,n=r[0].dataType,a=r[1].dims,s=a[a.length-1],o=O.sizeToDimension(a,a.length-1),u=O.sizeFromDimension(i,t.batchDims+s),d=O.sizeToDimension(i,t.batchDims),c=O.sizeFromDimension(i,t.batchDims),h=o/d,m=new Array(s),_=u;for(let T=0;T<s;++T)m[s-1-T]=_,_*=i[t.batchDims+s-1-T];let g=Tu(e,r[1],m,t.batchDims,i,o,h,c,s),w=t.batchDims+s;if(w>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let x=a.slice(0,-1).concat(i.slice(w)),$=O.size(x),b=[{type:12,data:$},{type:12,data:u},...te(r[0].dims,g.dims,x)],C=T=>{let I=B("data",r[0].dataType,r[0].dims.length),E=B("slice_offsets",12,g.dims.length),k=J("output",r[0].dataType,x.length);return`
          ${T.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,E,k)}
            ${T.mainStart()}
            ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:x,dataType:n}],dispatchGroup:{x:Math.ceil($/64)},programUniforms:b}),getShaderSource:C},{inputs:[r[0],g]})},kh=e=>({batchDims:e.batch_dims,cacheKey:""})}),Su,Iu,Ah,zh,K_=V(()=>{"use strict";ne(),oe(),Te(),le(),Su=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=O.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,n=e[0],a=e[2],s=e.length===4?e[3]:void 0;if(a.dims.length!==n.dims.length||!n.dims.map((o,u)=>u===r?Math.ceil(o/i)===a.dims[u]:o===a.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==n.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==a.dims.length||!s.dims.map((o,u)=>o===a.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},Iu=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=O.normalizeAxis(t.gatherAxis,n),s=O.normalizeAxis(t.quantizeAxis,n),o=r.slice(0);o.splice(a,1,...i);let u=O.size(o),d=e[2].dataType,c=e[0].dataType===22,h=[{type:12,data:u},{type:12,data:s},{type:12,data:a},{type:12,data:t.blockSize},...te(...e.map((_,g)=>_.dims),o)],m=_=>{let g=B("data",e[0].dataType,e[0].dims.length),w=B("inputIndices",e[1].dataType,e[1].dims.length),x=B("scales",e[2].dataType,e[2].dims.length),$=e.length>3?B("zeroPoint",e[3].dataType,e[3].dims.length):void 0,b=J("output",d,o.length),C=[g,w,x];$&&C.push($);let T=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${_.registerUniforms(T).declareVariables(...C,b)}
        ${_.mainStart()}
        let output_indices = ${b.offsetToIndices("global_idx")};
        var indices_indices = ${w.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${b.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${w.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${b.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${g.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${b.indicesGet("output_indices","i")};
          ${g.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${w.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[a]};
        }
        ${g.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
          let index = ${b.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${g.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${g.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${g.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${x.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${x.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${x.getByIndices("scale_indices")};
        ${$?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${$.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${$.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${Re(d)}(quantized_data - zero_point) * scale;
        ${b.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((_,g)=>g!==1).map(_=>_.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(_,g)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:d}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:h}),getShaderSource:m}},Ah=(e,t)=>{let r=e.inputs;Su(r,t),e.compute(Iu(e.inputs,t))},zh=e=>ye({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),Eu,ku,Oh,Rh,Y_=V(()=>{"use strict";ne(),oe(),Te(),le(),Eu=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},ku=(e,t)=>{let r=e[0].dims,i=e[0].dataType,n=r.length,a=e[1].dims,s=e[1].dataType,o=O.normalizeAxis(t.axis,n),u=r[o],d=a.slice(0),c=O.size(d),h=B("input",i,n),m=B("indicesInput",s,a.length),_=J("output",i,d.length),g=[{type:12,data:c},{type:6,data:u},{type:12,data:o}];return g.push(...te(r,a,d)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:g}),getShaderSource:w=>`
      ${w.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,m,_)}
      ${w.mainStart()}
      ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${_.offsetToIndices("global_idx")};

      var idx = ${m.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${h.type.indices}(outputIndices);
      ${h.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${h.getByIndices("inputIndices")};

      ${_.setByOffset("global_idx","value")};
  }`}},Oh=e=>ye({axis:e.axis}),Rh=(e,t)=>{let r=e.inputs;Eu(r),e.compute(ku(e.inputs,t))}}),Au,zu,Mh,Dh,X_=V(()=>{"use strict";ne(),oe(),le(),Au=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},zu=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[n,a,s]=Op.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),o=[n,a];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,d=Math.ceil(a/u),c=Math.ceil(n/u),h=!0,m=O.size(o),_=[{type:12,data:h?d:m},{type:12,data:n},{type:12,data:a},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],g=["type","type"];e.length===3&&(_.push(...te(e[2].dims)),g.push("rank")),_.push(...te(o));let w=$=>{let b="";t.transA&&t.transB?b="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?b="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?b="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(b="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let C=t.alpha===1?"":"value *= uniforms.alpha;",T=B("a",e[0].dataType,e[0].dims),I=B("b",e[1].dataType,e[1].dims),E=T.type.value,k=null,z=[T,I];e.length===3&&(k=B("c",e[2].dataType,e[2].dims.length),z.push(k));let M=J("output",e[0].dataType,o.length);z.push(M);let W=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${$.registerUniforms(W).declareVariables(...z)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${E}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${b}
    }

    ${C}
    ${k!=null?`let cOffset = ${k.broadcastedIndicesToOffset("vec2(m, n)",M)}; value += ${E}(uniforms.beta) * ${k.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},x=$=>{let b=B("a",e[0].dataType,e[0].dims),C=B("b",e[1].dataType,e[1].dims),T=null,I=[b,C];e.length===3&&(T=B("c",e[2].dataType,e[2].dims.length),I.push(T));let E=J("output",e[0].dataType,o.length);I.push(E);let k=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],z="",M="";t.transA&&t.transB?(M=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${C.type.value}(0);
      }
      `,z="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(M=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${C.type.value}(0);
      }
      `,z="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(M=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${C.type.value}(0);
      }
      `,z="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(M=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${C.type.value}(0);
      }
      `,z="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let W=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${$.registerUniforms(k).declareVariables(...I)}
  var<workgroup> tile_a: array<array<${b.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${C.type.storage}, ${u}>, ${u}>;
  ${$.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${E.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${M}
      k_start = k_start + ${u};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${u}; k++) {
        ${z}
      }
      workgroupBarrier();
    }

    ${W}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${T!=null?`let cOffset = ${T.broadcastedIndicesToOffset("vec2(m, n)",E)}; value += ${E.type.value}(uniforms.beta) * ${T.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return h?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:d*c},programUniforms:_}),getShaderSource:x}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:_}),getShaderSource:w}},Mh=e=>{let t=e.transA,r=e.transB,i=e.alpha,n=e.beta;return{transA:t,transB:r,alpha:i,beta:n,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Dh=(e,t)=>{Au(e.inputs),e.compute(zu(e.inputs,t))}}),it,ut,Mt,Dt,Ou,Ru,Mu,Du,Bu,Nu,Pu,Lu,Bh,Nh,Z_=V(()=>{"use strict";ne(),oe(),Te(),le(),[it,ut,Mt,Dt]=[0,1,2,3],Ou=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Ru=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,Mu=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,Du=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Bu=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,Nu=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${it}] = batch;
     indices[${ut}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Mt}] = u32(r);
            indices[${Dt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Mt}] = u32(clamp(r, 0, H - 1));
          indices[${Dt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Mt}] = gs_reflect(r, border[1], border[3]);
          indices[${Dt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,Pu=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${it}], indices[${ut}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${it}], indices[${ut}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${it}], indices[${ut}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${it}], indices[${ut}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${it}], indices[${ut}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${it}], indices[${ut}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Lu=(e,t)=>{let r=B("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],n=B("grid",e[1].dataType,i.length,2),a=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(a=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[it,ut,Mt,Dt]=[0,3,1,2]);let s=J("output",e[0].dataType,a.length),o=r.type.value,u=O.size(a),d=[{type:12,data:u},...te(e[0].dims,i,a)],c=h=>`
  ${h.registerUniform("output_size","u32").declareVariables(r,n,s)}
  ${Ru}
  ${Mu(o)}
  ${Du(t)}
  ${Bu(t)}
  ${Nu(r,o,t)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Mt}]);
      let W_in = i32(uniforms.x_shape[${Dt}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${it}], indices[${Mt}], indices[${Dt}]);
      let nxy = ${n.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${Pu(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:h=>{let m=O.size(a);return{outputs:[{dims:a,dataType:h[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:d}},getShaderSource:c}},Bh=(e,t)=>{Ou(e.inputs),e.compute(Lu(e.inputs,t))},Nh=e=>ye({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Be,Uu,Ph,Mn,Wu,Ii,Lh,Uh=V(()=>{"use strict";ne(),oe(),Te(),Ia(),Aa(),le(),Ct(),Be=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Uu=(e,t)=>{let r=e[0],i=Be(e,1),n=Be(e,2),a=Be(e,3),s=Be(e,4),o=Be(e,5),u=Be(e,6),d=Be(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let c=r.dims[0],h=r.dims[1],m=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],_=h,g=0,w=0,x=Math.floor(m/t.numHeads);if(u&&d&&O.size(u.dims)&&O.size(d.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==c||u.dims[1]!==t.numHeads||u.dims[3]!==x)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[0]!==c||d.dims[1]!==t.numHeads||d.dims[3]!==x)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==d.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(d.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');g=u.dims[2],w=u.dims[2]}else if(u&&O.size(u.dims)||d&&O.size(d.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $;if(i&&O.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');$=2,_=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==x)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');$=5,_=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==x)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');$=0,_=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}if(a&&O.size(a.dims)>0){if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let b=g+_,C=0;if(s&&O.size(s.dims)>0){C=8;let k=s.dims;throw k.length===1?k[0]===c?C=1:k[0]===3*c+2&&(C=3):k.length===2&&k[0]===c&&k[1]===b&&(C=5),C===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let T=!1,I=m;if(n&&O.size(n.dims)>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(_!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=n.dims[2]}else{if(_!==n.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=n.dims[1]*n.dims[3],T=!0}}let E=!1;if(s&&O.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&O.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==c||o.dims[1]!==t.numHeads||o.dims[2]!==h||o.dims[3]!==b)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:c,sequenceLength:h,pastSequenceLength:g,kvSequenceLength:_,totalSequenceLength:b,maxSequenceLength:w,inputHiddenSize:0,hiddenSize:m,vHiddenSize:I,headSize:x,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:C,scale:t.scale,broadcastResPosBias:E,passPastInKv:T,qkvFormat:$}},Ph=e=>ye({...e}),Mn=ye({perm:[0,2,1,3]}),Wu=(e,t,r,i,n,a,s)=>{let o=[i,n,a],u=O.size(o),d=[{type:12,data:u},{type:12,data:s},{type:12,data:a}],c=h=>{let m=J("qkv_with_bias",t.dataType,o),_=B("qkv",t.dataType,o),g=B("bias",r.dataType,o),w=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${h.registerUniforms(w).declareVariables(_,g,m)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d}),getShaderSource:c},{inputs:[t,r],outputs:[-1]})[0]},Ii=(e,t,r,i,n,a,s,o)=>{let u=a;if(s&&O.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=Wu(e,a,s,t,i,r*n,o),u=u.reshape([t,i,r,n]),r===1||i===1?u:e.compute(We(u,Mn.perm),{inputs:[u],outputs:[-1]})[0]}else return a.dims.length===3&&(u=a.reshape([t,i,r,n])),r===1||i===1?u:e.compute(We(u,Mn.perm),{inputs:[u],outputs:[-1]})[0]},Lh=(e,t)=>{let r=Uu(e.inputs,t),i=e.inputs[0],n=Be(e.inputs,1),a=Be(e.inputs,2),s=Be(e.inputs,3),o=Be(e.inputs,4),u=Be(e.inputs,5),d=Be(e.inputs,6),c=Be(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(n?.dims.length===5)throw new Error("Packed KV is not implemented");let h=n&&a&&n.dims.length===4&&a.dims.length===4,m=Ii(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(h)return zi(e,m,n,a,o,void 0,d,c,u,r);if(!n||!a)throw new Error("key and value must be provided");let _=Ii(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,n,s,r.hiddenSize),g=Ii(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,a,s,2*r.hiddenSize);zi(e,m,_,g,o,void 0,d,c,u,r)}}),Vu,qu,Fu,Gu,ca,Wh,Vh,qh=V(()=>{"use strict";ne(),oe(),Te(),le(),Vu=e=>{if(!e||e.length<1)throw new Error("too few inputs")},qu=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),i=r.length),ye({numOutputs:i,axis:t.axis,splitSizes:r})},Fu=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${ee("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Gu=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let n=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(n):i===0?r.push(`if (output_number == ${i}u) { ${n} }`):i===t-1?r.push(`else { ${n} }`):r.push(`else if (output_number == ${i}) { ${n} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},ca=(e,t)=>{let r=e[0].dims,i=O.size(r),n=e[0].dataType,a=O.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),o=B("input",n,r.length),u=new Array(t.numOutputs),d=[],c=[],h=0,m=[{type:12,data:i}];for(let g=0;g<t.numOutputs;g++){h+=t.splitSizes[g],u[g]=h;let w=r.slice();w[a]=t.splitSizes[g],c.push(w),s[g]=J(`output${g}`,n,w.length),d.push({dims:c[g],dataType:e[0].dataType})}m.push({type:12,data:u},...te(r,...c));let _=g=>`
  ${g.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...s)}
  ${Fu(u.length)}
  ${Gu(s)}

  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",a)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${ee("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${o.indicesSet("indices",a,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:d,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:m})}},Wh=(e,t)=>{Vu(e.inputs);let r=e.inputs.length===1?t:qu(e.inputs,t);e.compute(ca(e.inputs,r),{inputs:[0]})},Vh=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return ye({axis:t,numOutputs:i,splitSizes:r})}}),ju,gr,Fh,Gh=V(()=>{"use strict";ne(),oe(),Te(),le(),ju=(e,t)=>{let[r,i,n,a]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!O.areEqual(i.dims,[])&&!O.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(!O.areEqual(n.dims,a.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=r.dims[0],d=r.dims[r.dims.length-2],c=n.dims[0],h=O.sizeFromDimension(r.dims,1)/d,m=o===0?n.dims[1]*2:h/s;if(o>m)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(u!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(d!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(m/2!==n.dims[1]&&o/2!==n.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${n.dims[1]}`);if(d>c)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},gr=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:n,scale:a}=t,s=e[0].dims[0],o=O.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],d=o/u,c=e[2].dims[1],h=n===0?c*2:d/i,m=new Array(s,u,d/h,h-c),_=O.computeStrides(m),g=[{type:1,data:a},{type:12,data:m},{type:12,data:_},...e[0].dims.length===3?new Array({type:12,data:[o,d,h,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,h,u*h,1]}):[],...te(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],w=x=>{let $=B("input",e[0].dataType,e[0].dims.length),b=B("position_ids",e[1].dataType,e[1].dims.length),C=B("cos_cache",e[2].dataType,e[2].dims.length),T=B("sin_cache",e[3].dataType,e[3].dims.length),I=J("output",e[0].dataType,e[0].dims.length);return x.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:m.length},{name:"global_strides",type:"u32",length:_.length},{name:"input_output_strides",type:"u32",length:_.length}]),`
        ${x.declareVariables($,b,C,T,I)}

        ${x.mainStart(ei)}
          let half_rotary_emb_dim = uniforms.${C.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${b.broadcastedIndicesToOffset("bsnh.xy",J("",b.type.tensor,2))};
            let position_id =
                u32(${b.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${$.getByOffset("i")} * ${C.get("position_id","bsnh[3]")} -
                ${$.getByOffset("j")} * ${T.get("position_id","bsnh[3]")};
            ${I.setByOffset("i","re")}
            let im = ${$.getByOffset("i")} * ${T.get("position_id","bsnh[3]")} +
                ${$.getByOffset("j")} * ${C.get("position_id","bsnh[3]")};
            ${I.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${I.setByOffset("k",$.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:ye({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(O.size(m)/ei)},programUniforms:g})}},Fh=(e,t)=>{ju(e.inputs,t),e.compute(gr(e.inputs,t))}}),Hu,Ku,Dn,Yu,jh,Q_=V(()=>{"use strict";Te(),ne(),Aa(),Uh(),qh(),Ct(),Gh(),le(),Hu=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=r.dims[0],d=r.dims[1],c=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],h=d,m=0,_=!i||i.dims.length===0,g=Math.floor(_?c/(t.numHeads+2*t.kvNumHeads):c/t.numHeads);_&&(c=g*t.numHeads);let w=a&&a.dims.length!==0,x=s&&s.dims.length!==0;if(w&&a.dims.length===4&&a.dims[0]===u&&a.dims[1]!==t.kvNumHeads&&a.dims[2]===t.kvNumHeads&&a.dims[3]===g)throw new Error("BSNH pastKey/pastValue is not supported");if(w&&x){if(a.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');m=a.dims[2]}else if(w||x)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let $=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');h=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==g)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');h=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==g)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');h=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');$=3}let b=0,C=!1,T=t.kvNumHeads?g*t.kvNumHeads:c;if(n&&n.dims.length>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(h!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');T=n.dims[2]}else{if(h!==n.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');T=n.dims[1]*n.dims[3],C=!0}}let I=e.length>4?e[5]:void 0;if(I&&I.dims.length!==1&&I.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:d,pastSequenceLength:m,kvSequenceLength:h,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:c,vHiddenSize:T,headSize:g,vHeadSize:Math.floor(T/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:b,scale:t.scale,broadcastResPosBias:!1,passPastInKv:C,qkvFormat:$}},Ku=ye({perm:[0,2,1,3]}),Dn=(e,t,r)=>{let i=t,n=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,n,r.headSize]),i=e.compute(We(i,Ku.perm),{inputs:[i],outputs:[-1]})[0]),i},Yu=(e,t,r,i)=>{let n=7,a=["type","type"],s=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],d=c=>{let h=B("seq_lens",r.dataType,r.dims),m=B("total_seq_lens",i.dataType,i.dims),_=J("pos_ids",n,s),g=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${c.registerUniforms(g).declareVariables(h,m,_)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${m.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${h.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${_.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:d}},jh=(e,t)=>{let r=Hu(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],n=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,a=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,d=e.inputs.length>5?e.inputs[6]:void 0,c=r.kvNumHeads?r.kvNumHeads:r.numHeads,h=ye({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,c*r.headSize,c*r.headSize]}),[m,_,g]=!n&&!a?e.compute(ca([i],h),{inputs:[i],outputs:[-1,-1,-1]}):[i,n,a],w,x;if(t.doRotary){let T=e.compute(Yu(r.batchSize,r.sequenceLength,u,d),{inputs:[u,d],outputs:[-1]})[0],I=e.inputs[7],E=e.inputs[8],k=ye({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),z=[m,T,I,E],M=[-1];w=e.compute(gr(z,k),{inputs:z,outputs:M})[0],z.splice(0,1,_);let W=ye({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});x=e.compute(gr(z,W),{inputs:z,outputs:M})[0]}let $=Ii(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?w:m,void 0,0),b=Dn(e,t.doRotary?x:_,r),C=Dn(e,g,r);zi(e,$,b,C,void 0,void 0,s,o,void 0,r,u,d)}}),Bn,Xu,Zu,Hh,J_=V(()=>{"use strict";ne(),oe(),Ct(),le(),Bn=(e,t,r,i,n,a,s,o)=>{let u=Ce(a),d=u===1?"f32":`vec${u}f`,c=u===1?"vec2f":`mat2x${u}f`,h=n*s,m=64;h===1&&(m=256);let _=[n,s,a/u],g=[n,s,2],w=["rank","type","type"],x=[];x.push(...te(_,g));let $=b=>{let C=B("x",t.dataType,3,u),T=B("scale",r.dataType,r.dims),I=B("bias",i.dataType,i.dims),E=J("output",1,3,2),k=[C,T,I,E];return`
  var<workgroup> workgroup_shared : array<${c}, ${m}>;
  const workgroup_size = ${m}u;
  ${b.declareVariables(...k)}
  ${b.mainStart(m)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${d}(0);
    var squared_sum = ${d}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${d}(${C.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${c}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${xt("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${xt("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${m}`,inputDependencies:w},getRunData:()=>({outputs:[{dims:g,dataType:1}],dispatchGroup:{x:h},programUniforms:x}),getShaderSource:$},{inputs:[t,r,i],outputs:[-1]})[0]},Xu=(e,t,r)=>{let i=t[0].dims,n=i,a=2,s=i[0],o=i[1],u=O.sizeFromDimension(i,a),d=Ce(u),c=O.size(n)/d,h=Bn(e,t[0],t[1],t[2],s,u,o,r.epsilon),m=[s,o,u/d],_=[s,o],g=["type","none"],w=x=>{let $=B("x",t[0].dataType,m.length,d),b=B("scale_shift",1,_.length,2),C=J("output",t[0].dataType,m.length,d),T=[$,b,C];return`
  ${x.registerUniform("output_size","u32").declareVariables(...T)}
  ${x.mainStart()}
  ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${C.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${b.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${$.getByOffset("global_idx")} * ${C.type.value}(scale_shift.x) + ${C.type.value}(scale_shift.y);
      ${C.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${d}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:[{type:12,data:c},...te(m,_,m)]}),getShaderSource:w},{inputs:[t[0],h]})},Zu=(e,t,r)=>{let i=t[0].dims,n=i,a=i[0],s=i[i.length-1],o=O.sizeFromDimension(i,1)/s,u=Ce(s),d=O.size(n)/u,c=[{type:12,data:o},{type:12,data:Math.floor(s/u)}],h=["type","type"],m=!1,_=[0,i.length-1];for(let $=0;$<i.length-2;$++)m=m||i[$+1]!==1,_.push($+1);m=m&&i[i.length-1]!==1;let g=m?e.compute(We(e.inputs[0],_),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},($,b)=>i[_[b]])),w=Bn(e,g,t[1],t[2],a,o,s,r.epsilon),x=$=>{let b=ke(t[0].dataType),C=u===1?"vec2f":`mat${u}x2f`,T=k=>{let z=k===0?"x":"y",M=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${b}(${M}(scale.${z}))`;case 2:return`vec2<${b}>(${M}(scale[0].${z}, scale[1].${z}))`;case 4:return`vec4<${b}>(${M}(scale[0].${z}, scale[1].${z}, scale[2].${z}, scale[3].${z}))`;default:throw new Error(`Not supported compoents ${u}`)}},I=B("input",t[0].dataType,t[0].dims,u),E=J("output",t[0].dataType,n,u);return`
  @group(0) @binding(0) var<storage, read> input : array<${I.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${C}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${E.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${$.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${T(0)}, ${T(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:c}),getShaderSource:x},{inputs:[t[0],w]})},Hh=(e,t)=>{t.format==="NHWC"?Zu(e,e.inputs,t):Xu(e,e.inputs,t)}}),Qu,Ju,Kh,ey=V(()=>{"use strict";ne(),oe(),le(),Qu=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Ju=(e,t,r)=>{let i=t.simplified,n=e[0].dims,a=e[1],s=!i&&e[2],o=n,u=O.normalizeAxis(t.axis,n.length),d=O.sizeToDimension(n,u),c=O.sizeFromDimension(n,u),h=O.size(a.dims),m=s?O.size(s.dims):0;if(h!==c||s&&m!==c)throw new Error(`Size of X.shape()[axis:] == ${c}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${h} and bias size of ${m}`);let _=[];for(let I=0;I<n.length;++I)I<u?_.push(n[I]):_.push(1);let g=Ce(c),w=["type","type"],x=[{type:12,data:d},{type:1,data:c},{type:12,data:Math.floor(c/g)},{type:1,data:t.epsilon}];s&&w.push("type");let $=r>1,b=r>2,C=I=>{let E=ke(e[0].dataType),k=[B("x",e[0].dataType,e[0].dims,g),B("scale",a.dataType,a.dims,g)];s&&k.push(B("bias",s.dataType,s.dims,g)),k.push(J("output",e[0].dataType,o,g)),$&&k.push(J("mean_data_output",1,_)),b&&k.push(J("inv_std_output",1,_));let z=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(z).declareVariables(...k)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${ra("f32",g)};
    var mean_square_vector = ${ra("f32",g)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Qt(E,g,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${xt("mean_vector",g)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${xt("mean_square_vector",g)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Qt(E,g,"x[j + offset]")};
      let f32scale = ${Qt(E,g,"scale[j]")};
      output[j + offset] = ${k[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Qt(E,g,"bias[j]")}`:""}
      );
    }

    ${$?"mean_data_output[global_idx] = mean":""};
    ${b?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},T=[{dims:o,dataType:e[0].dataType}];return $&&T.push({dims:_,dataType:1}),b&&T.push({dims:_,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${g};${r};${i}`,inputDependencies:w},getRunData:()=>({outputs:T,dispatchGroup:{x:Math.ceil(d/64)},programUniforms:x}),getShaderSource:C}},Kh=(e,t)=>{Qu(e.inputs),e.compute(Ju(e.inputs,t,e.outputCount))}}),ed,Yh,ty=V(()=>{"use strict";oe(),Da(),Ba(),ed=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Yh=e=>{ed(e.inputs);let t=Jt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(Ma(e.inputs,{activation:""},t));else{let n=t[t.length-2],a=O.size(e.inputs[0].dims.slice(0,-2)),s=O.size(e.inputs[1].dims.slice(0,-2));if(a!==1&&n===1&&s===1){let o=e.inputs[0].reshape([1,a,i]),u=e.inputs[1].reshape([1,i,r]),d=[1,a,r],c=[o,u];e.compute(mr(c,{activation:""},t,d),{inputs:c})}else e.compute(mr(e.inputs,{activation:""},t))}}}),td,id,rd,Xh,Zh,iy=V(()=>{"use strict";ne(),oe(),Te(),le(),td=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let n=Math.floor((t.k+t.blockSize-1)/t.blockSize),a=t.blockSize/8*t.bits,s=e[1];if(!O.areEqual(s.dims,[t.n,n,a]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(O.size(o)!==t.n*n)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,d=t.n*(t.bits===8?n:Math.floor((n*t.bits+7)/8));if(O.size(u)!==d)throw new Error("zeroPoints input size error.")}},id=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),u=O.size(o),d=e[1].dims[2]/4,c=e[0].dataType,h=Ce(t.k),m=Ce(d),_=Ce(s),g=o.concat([n,s]),w=n>1&&s/_%2===0?2:1,x=O.size(g)/_/w,$=64,b=[],C=[u,n,a/h],T=O.convertShape(e[1].dims).slice();T.splice(-1,1,d/m),b.push(...te(C)),b.push(...te(T)),b.push(...te(e[2].dims)),e.length===4&&b.push(...te(O.convertShape(e[3].dims)));let I=[u,n,s/_];b.push(...te(I));let E=k=>{let z=C.length,M=B("a",e[0].dataType,z,h),W=B("b",12,T.length,m),j=B("scales",e[2].dataType,e[2].dims.length),H=[M,W,j],F=e.length===4?B("zero_points",12,e[3].dims.length):void 0;F&&H.push(F);let U=I.length,K=J("output",e[0].dataType,U,_),Z=ke(e[0].dataType),Y=(()=>{switch(h){case 1:return`array<${Z}, 8>`;case 2:return`mat4x2<${Z}>`;case 4:return`mat2x4<${Z}>`;default:throw new Error(`${h}-component is not supported.`)}})(),ae=()=>{let P=`
          // reuse a data
            var input_offset = ${M.indicesToOffset(`${M.type.indices}(batch, row, word_offset)`)};
            var a_data: ${Y};
            for (var j: u32 = 0; j < ${8/h}; j++) {
              a_data[j] = ${M.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let q=0;q<_*w;q++)P+=`
            b_value = ${m===1?`b${q}_data`:`b${q}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${Y}(${Array.from({length:4},(ie,pe)=>`${Z}(b_value_lower[${pe}]), ${Z}(b_value_upper[${pe}])`).join(", ")});
            b_dequantized_values = ${h===1?`${Y}(${Array.from({length:8},(ie,pe)=>`(b_quantized_values[${pe}] - ${F?`zero_point${q}`:"zero_point"}) * scale${q}`).join(", ")});`:`(b_quantized_values - ${Y}(${Array(8).fill(`${F?`zero_point${q}`:"zero_point"}`).join(",")})) * scale${q};`};
            workgroup_shared[local_id.x * ${w} + ${Math.floor(q/_)}]${_>1?`[${q%_}]`:""} += ${Array.from({length:8/h},(ie,pe)=>`${h===1?`a_data[${pe}] * b_dequantized_values[${pe}]`:`dot(a_data[${pe}], b_dequantized_values[${pe}])`}`).join(" + ")};
          `;return P},X=()=>{let P=`
            var col_index = col * ${_};
            ${F?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${Z}(8);`}
            `;for(let q=0;q<_*w;q++)P+=`
            let scale${q} = ${j.getByOffset("col_index * nBlocksPerCol + block")};
            ${F?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${F.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${q} = ${Z}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return P},me=()=>{let P=`col_index = col * ${_};`;for(let q=0;q<_*w;q++)P+=`
            let b${q}_data = ${W.getByIndices(`${W.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return P+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${Y};
            var b_dequantized_values: ${Y};`,P};return`
        var<workgroup> workgroup_shared: array<${K.type.value}, ${w*$}>;
        ${k.declareVariables(...H,K)}
        ${k.mainStart([$,1,1])}
          let output_indices = ${K.offsetToIndices(`(global_idx / ${$}) * ${w}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${$}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/h};
            ${X()}
            for (var word: u32 = 0; word < ${d}; word += ${m}) {
              ${me()}
              for (var i: u32 = 0; i < ${m}; i++) {
                ${ae()}
                word_offset += ${8/h};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${w}) {
            var output_value: ${K.type.value} = ${K.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${$}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${w};
            }
            ${K.setByIndices(`${K.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${h};${m};${_};${w};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:g,dataType:c}],dispatchGroup:{x},programUniforms:b}),getShaderSource:E}},rd=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,o=r.slice(0,i-2),u=O.size(o),d=e[1].dims[2]/4,c=e[0].dataType,h=Ce(t.k),m=Ce(d),_=o.concat([n,s]),g=128,w=s%8===0?8:s%4===0?4:1,x=g/w,$=x*m*8,b=$/h,C=$/t.blockSize,T=O.size(_)/w,I=[],E=[u,n,a/h],k=O.convertShape(e[1].dims).slice();k.splice(-1,1,d/m),I.push(...te(E)),I.push(...te(k)),I.push(...te(e[2].dims)),e.length===4&&I.push(...te(O.convertShape(e[3].dims)));let z=[u,n,s];I.push(...te(z));let M=W=>{let j=E.length,H=B("a",e[0].dataType,j,h),F=B("b",12,k.length,m),U=B("scales",e[2].dataType,e[2].dims.length),K=[H,F,U],Z=e.length===4?B("zero_points",12,e[3].dims.length):void 0;Z&&K.push(Z);let Y=z.length,ae=J("output",e[0].dataType,Y),X=ke(e[0].dataType),me=()=>{switch(h){case 1:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${h}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${H.type.value}, ${b}>;
        var<workgroup> inter_results: array<array<${ae.type.value}, ${x}>, ${w}>;
        ${W.declareVariables(...K,ae)}
        ${W.mainStart([x,w,1])}
          let output_indices = ${ae.offsetToIndices(`workgroup_index * ${w}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${C} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${b};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${b}; a_offset += ${g})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${H.getByIndices(`${H.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${H.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${C} + local_id.x;
            ${Z?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${Z.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${X}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${X}(8);`}
            let scale = ${U.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${F.getByIndices(`${F.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/h};
            for (var i: u32 = 0; i < ${m}; i++) {
              ${me()}
              let b_value = ${m===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${X}>(${Array.from({length:4},(P,q)=>`${X}(b_value_lower[${q}]), ${X}(b_value_upper[${q}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${X}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(P,q)=>`${`dot(a_data${q}, b_dequantized_values[${q}])`}`).join(" + ")};
              word_offset += ${8/h};
            }
            workgroupBarrier();
          }

          if (local_idx < ${w}) {
            var output_value: ${ae.type.value} = ${ae.type.value}(0);
            for (var b = 0u; b < ${x}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${ae.setByIndices(`${ae.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${h};${m};${x};${w}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:_,dataType:c}],dispatchGroup:{x:T},programUniforms:I}),getShaderSource:M}},Xh=(e,t)=>{td(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(rd(e.inputs,t)):e.compute(id(e.inputs,t))},Zh=e=>ye(e)}),nd,ad,sd,od,ld,ud,dd,pd,Qh,ry=V(()=>{"use strict";ne(),oe(),le(),nd=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},ad=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
            k = i32(${e.indicesGet("indices",n)}) - ${ee("uniforms.pads",n,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${ee("uniforms.x_shape",n,t)})) {
              break;
            }
            offset += k * i32(${ee("uniforms.x_strides",n,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},sd=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${ee("uniforms.pads",n,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${ee("uniforms.x_shape",n,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${ee("uniforms.x_shape",n,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${ee("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},od=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${ee("uniforms.pads",n,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${ee("uniforms.x_shape",n,t)})) {
                  k = i32(${ee("uniforms.x_shape",n,t)}) - 1;
                }
                offset += k * i32(${ee("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},ld=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${ee("uniforms.pads",n,r)};
                if (k < 0)  {
                  k += i32(${ee("uniforms.x_shape",n,t)}]);
                }
                if (k >= i32(${ee("uniforms.x_shape",n,t)})) {
                  k -= i32(${ee("uniforms.x_shape",n,t)});
                }
                offset += k * i32(${ee("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},ud=(e,t,r)=>{switch(r.mode){case 0:return ad(e,t,r.pads.length);case 1:return sd(e,t,r.pads.length);case 2:return od(e,t,r.pads.length);case 3:return ld(e,t,r.pads.length);default:throw new Error("Invalid mode")}},dd=(e,t)=>{let r=O.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,n=O.size(r),a=[{type:12,data:n},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&a.push({type:s?e[2].dataType:1,data:t.value}),a.push(...te(e[0].dims,r));let o=["rank"],u=d=>{let c=J("output",e[0].dataType,r.length),h=B("x",e[0].dataType,i.length),m=h.type.value,_=ud(c,i.length,t),g=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&g.push({name:"constant_value",type:s?m:"f32"}),`
            ${d.registerUniforms(g).declareVariables(h,c)}
            ${d.mainStart()}
            ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${c.offsetToIndices("global_idx")};

            var value = ${m}(0);
            ${_}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(O.size(r)/64)},programUniforms:a}),getShaderSource:u}},pd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,n=e[0].dims.length,a=new Int32Array(2*n).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)a[Number(o[u])]=Number(r[u]),a[Number(o[u])+n]=Number(r[u+o.length])}else r.forEach((o,u)=>a[Number(u)]=Number(o));let s=[];return a.forEach(o=>s.push(o)),{mode:t.mode,value:i,pads:s}}else return t},Qh=(e,t)=>{nd(e.inputs);let r=pd(e.inputs,t);e.compute(dd(e.inputs,r),{inputs:[0]})}}),wi,Nn,Pn,Ln,Un,cd,hd,Wn,Vn,Jh,ef,qn,tf,rf,Fn,nf,af,sf,of,ny=V(()=>{"use strict";Ge(),ne(),oe(),le(),wi=e=>{if(fe.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Nn=(e,t,r)=>{let i=t.format==="NHWC",n=e.dims.slice();i&&n.splice(1,0,n.pop());let a=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),u=a?t.dilations.slice():[],d=t.pads.slice();hr.adjustPoolAttributes(r,n,s,o,u,d);let c=hr.computePoolOutputShape(r,n,o,u,s,d,t.autoPad),h=Object.assign({},t);a?Object.assign(h,{kernelShape:s,strides:o,pads:d,dilations:u,cacheKey:t.cacheKey}):Object.assign(h,{kernelShape:s,strides:o,pads:d,cacheKey:t.cacheKey});let m=c.slice();return m.push(m.splice(1,1)[0]),[h,i?m:c]},Pn=(e,t)=>{let r=t.format==="NHWC",i=O.size(e),n=O.size(t.kernelShape),a=[{type:12,data:i},{type:12,data:n}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],d=t.pads[t.pads.length/2-1],c=t.pads[t.pads.length-1],h=!!(d+c);a.push({type:12,data:o},{type:12,data:u},{type:12,data:d},{type:12,data:c}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let m=!1;if(t.kernelShape.length===2){let _=t.kernelShape[t.kernelShape.length-2],g=t.strides[t.strides.length-2],w=t.pads[t.pads.length/2-2],x=t.pads[t.pads.length-2];m=!!(w+x),a.push({type:12,data:_},{type:12,data:g},{type:12,data:w},{type:12,data:x}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[a,s,!0,h,m]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=O.computeStrides(t.kernelShape);a.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((d,c)=>d+c);return[a,s,!!u,!1,!1]}},Ln=(e,t,r,i,n,a,s,o,u,d,c,h)=>{let m=n.format==="NHWC",_=t.type.value,g=J("output",t.type.tensor,i);if(n.kernelShape.length<=2){let w="",x="",$="",b=r-(m?2:1);if(c?w=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${b}] = indices[${b}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${b}] < 0 || xIndices[${b}]
                      >= uniforms.x_shape[${b}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`:w=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${b}] = indices[${b}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`,n.kernelShape.length===2){let C=r-(m?3:2);h?x=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${C}] = indices[${C}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${C}] < 0 || xIndices[${C}] >= uniforms.x_shape[${C}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:x=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${C}] = indices[${C}] * uniforms.sh - uniforms.phStart + j;
                `,$=`
              }
            `}return`
            ${e.registerUniforms(u).declareVariables(t,g)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${g.offsetToIndices("global_idx")};
              var xIndices = ${g.offsetToIndices("global_idx")};

              var value = ${_}(${o});
              var pad = 0;
              ${x}
              ${w}
              ${$}
              ${s}

              output[global_idx] = value;
            }`}else{if(m)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let w=n.kernelShape.length,x=n.pads.length,$="";return d?$=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${a}
              }`:$=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${a}
            `,`
            ${e.registerUniforms(u).declareVariables(t,g)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${g.offsetToIndices("global_idx")};
              var xIndices = ${g.offsetToIndices("global_idx")};

              var offsets: array<u32, ${w}>;

              var value = ${_}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${w-1}u; j++) {
                  offsets[j] = offset / ${ee("uniforms.kernelStrides","j",w)};
                  offset -= offsets[j] * ${ee("uniforms.kernelStrides","j",w)};
                }
                offsets[${w-1}] = offset;

                isPad = false;
                for (var j = ${r-w}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${ee("uniforms.strides",`j - ${r-w}u`,w)}
                    + offsets[j - ${r-w}u] - ${ee("uniforms.pads","j - 2u",x)};
                  ${$}
              }
              ${s}

              output[global_idx] = value;
            }`}},Un=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,cd=e=>`${Un(e)};${e.countIncludePad}`,hd=e=>`${Un(e)};${e.storageOrder};${e.dilations}`,Wn=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Vn=(e,t,r,i)=>{let[n,a]=Nn(t,i,r),s=B("x",t.dataType,t.dims.length),o=s.type.value,u="value += x_val;",d="";n.countIncludePad?d+=`value /= ${o}(uniforms.kernelSize);`:d+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[c,h,m,_,g]=Pn(a,n);c.push(...te(t.dims,a));let w=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${m};${_};${g}`,inputDependencies:w},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(O.size(a)/64)},programUniforms:c}),getShaderSource:x=>Ln(x,s,t.dims.length,a.length,n,u,d,0,h,m,_,g)}},Jh=e=>{let t=e.count_include_pad!==0,r=Wn(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:cd(i)}},ef=(e,t)=>{wi(e.inputs),e.compute(Vn("AveragePool",e.inputs[0],!1,t))},qn={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},tf=e=>{let t=e.format;return{format:t,...qn,cacheKey:t}},rf=(e,t)=>{wi(e.inputs),e.compute(Vn("GlobalAveragePool",e.inputs[0],!0,t))},Fn=(e,t,r,i)=>{let[n,a]=Nn(t,i,r),s=`
      value = max(x_val, value);
    `,o="",u=B("x",t.dataType,t.dims.length),d=["rank"],[c,h,m,_,g]=Pn(a,n);return c.push(...te(t.dims,a)),{name:e,shaderCache:{hint:`${i.cacheKey};${m};${_};${g}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(O.size(a)/64)},programUniforms:c}),getShaderSource:w=>Ln(w,u,t.dims.length,a.length,n,s,o,t.dataType===10?-65504:-1e5,h,m,_,g)}},nf=(e,t)=>{wi(e.inputs),e.compute(Fn("MaxPool",e.inputs[0],!1,t))},af=e=>{let t=e.storage_order,r=e.dilations,i=Wn(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let n={storageOrder:t,dilations:r,...i,cacheKey:""};return{...n,cacheKey:hd(n)}},sf=e=>{let t=e.format;return{format:t,...qn,cacheKey:t}},of=(e,t)=>{wi(e.inputs),e.compute(Fn("GlobalMaxPool",e.inputs[0],!0,t))}}),fd,md,lf,uf,ay=V(()=>{"use strict";ne(),oe(),Te(),le(),fd=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((n,a)=>a===t.axis||n===e[0].dims[a]).reduce((n,a)=>n&&a,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},md=(e,t)=>{let r=O.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,n=i===3,a=e[0].dims,s=e[1].dataType,o=O.size(a),u=i===3||i===2,d=u?[Math.ceil(O.size(e[0].dims)/4)]:e[0].dims,c=e[1].dims,h=e.length>2?e[2]:void 0,m=h?u?[Math.ceil(O.size(h.dims)/4)]:h.dims:void 0,_=c.length===0||c.length===1&&c[0]===1,g=_===!1&&c.length===1,w=Ce(o),x=_&&(!u||w===4),$=x?w:1,b=x&&!u?w:1,C=B("input",u?12:i,d.length,b),T=B("scale",s,c.length),I=h?B("zero_point",u?12:i,m.length):void 0,E=J("output",s,a.length,$),k=[C,T];I&&k.push(I);let z=[d,c];h&&z.push(m);let M=[{type:12,data:o/$},{type:12,data:r},{type:12,data:t.blockSize},...te(...z,a)],W=j=>{let H=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${j.registerUniforms(H).declareVariables(...k,E)}
      ${j.mainStart()}
          ${j.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${E.offsetToIndices("global_idx")};

          // Set input x
          ${u?`
            let input = ${C.getByOffset("global_idx / 4")};
            let x_vec = ${n?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${$===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${C.getByOffset("global_idx")};`};

          // Set scale input
          ${_?`let scale_value= ${T.getByOffset("0")}`:g?`
            let scale_index = ${E.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${T.getByOffset("scale_index")};`:`
            var scale_indices: ${T.type.indices} = output_indices;
            let index = ${T.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${T.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${T.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${I?_?u?`
                let zero_point_input = ${I.getByOffset("0")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${I.getByOffset("0")}`:g?u?`
                let zero_point_index = ${E.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${I.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${E.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${I.getByOffset("zero_point_index")};`:u?`
                let zero_point_offset = ${T.indicesToOffset("scale_indices")};
                let zero_point_input = ${I.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${I.getByIndices("scale_indices")};`:`let zero_point_value = ${u?n?"i32":"u32":C.type.value}(0);`};
      // Compute and write output
      ${E.setByOffset("global_idx",`${E.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:W,getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/$/64),y:1,z:1},programUniforms:M})}},lf=(e,t)=>{fd(e.inputs,t),e.compute(md(e.inputs,t))},uf=e=>ye({axis:e.axis,blockSize:e.blockSize})}),gd,_d,df,sy=V(()=>{"use strict";Ge(),ne(),le(),gd=(e,t,r)=>{let i=e===t,n=e<t&&r<0,a=e>t&&r>0;if(i||n||a)throw new Error("Range these inputs' contents are invalid.")},_d=(e,t,r,i)=>{let n=Math.abs(Math.ceil((t-e)/r)),a=[n],s=n,o=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...te(a)],u=d=>{let c=J("output",i,a.length),h=c.type.value,m=[{name:"outputSize",type:"u32"},{name:"start",type:h},{name:"delta",type:h}];return`
        ${d.registerUniforms(m).declareVariables(c)}
        ${d.mainStart()}
        ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${h}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:a,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},df=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),fe.webgpu.validateInputContent&&gd(t,r,i),e.compute(_d(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),yd,bd,pf,cf,oy=V(()=>{"use strict";ne(),oe(),Te(),le(),yd=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let n=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,a=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${n}bitcast<${i}>(oldValue) + (${r})${a}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${n}max(bitcast<f32>(oldValue), (${r}))${a}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${n}min(bitcast<${i}>(oldValue), (${r}))${a}`;case"mul":return`${n}(bitcast<${i}>(oldValue) * (${r}))${a}`;default:throw new Error(`Reduction ${e} is not supported.`)}},bd=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r,a=1,s=Math.ceil(O.sizeToDimension(i,i.length-1)/a),o=i[i.length-1],u=O.sizeFromDimension(r,o),d=[{type:12,data:s},{type:12,data:o},{type:12,data:u},...te(e[1].dims,e[2].dims,n)],c=h=>{let m=B("indices",e[1].dataType,e[1].dims.length),_=B("updates",e[2].dataType,e[2].dims.length,a),g=t.reduction!=="none"&&t.reduction!==""?Lp("output",e[0].dataType,n.length):J("output",e[0].dataType,n.length,a);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(m,_,g)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${yd(t.reduction,"output[data_offset + i]","value",g.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:c}},pf=e=>ye({reduction:e.reduction}),cf=(e,t)=>{e.compute(bd(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),wd,vd,$d,Gn,xd,Cd,Td,Sd,Id,Ed,kd,Ad,jn,zd,Od,Rd,Md,Dd,hf,ff,ly=V(()=>{"use strict";ne(),oe(),Te(),le(),wd=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},vd=(e,t,r)=>{t.every(n=>n>=0&&n<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((n,a)=>i[n]=e[a]),i},$d=(e,t,r,i,n,a)=>{let[s,o,u]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],d=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(c=>a.push(c));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(c=>i.push(c)),i.length!==0&&i.length!==d&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");wd(i,t),t.axes.length>0&&vd(i,t.axes,d).forEach((c,h)=>i[h]=c)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(c=>n.push(Number(c))),n.length!==0&&n.length!==d&&r>=18&&n.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof n<"u"&&i.length>0&&n.length>d)throw new Error("Resize requires only of scales or sizes to be specified")},Gn=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,xd=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Gn("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Gn("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",Cd=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Td=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),n=e.length===0?i:e.slice();return t.length>0?(t.forEach((a,s)=>{i[a]=n[s],i[s+r]=n[t.length+s]}),i):n},Sd=(e,t,r,i)=>{let n=[];if(r.length>0)if(i.length>0){if(e.forEach(a=>n.push(a)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((a,s)=>n[a]=r[s])}else r.forEach(a=>n.push(a));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");n=e.map((a,s)=>Math.round(a*t[s]))}return n},Id=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(a=>t[a]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(a=>t[a]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let n=e.slice();return r.axes.length>0?(r.axes.forEach(a=>t[a]=i),r.axes.forEach(a=>n[a]=Math.round(e[a]*t[a]))):(t.fill(i,0,t.length),n.forEach((a,s)=>n[s]=Math.round(a*t[s]))),n},Ed=(e,t,r,i,n)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${ee("uniforms.scales","i",i)};
        var roi_low = ${ee("uniforms.roi","i",n)};
        var roi_hi = ${ee("uniforms.roi",`i + ${t.length}`,n)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${ee("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${ee("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,kd=(e,t,r,i,n,a,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${ee("uniforms.scales","i",n)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${ee("uniforms.roi","i",a)};
          var roi_hi = ${ee("uniforms.roi",`i + ${r.length}`,a)};
          var input_shape_i = ${ee("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${ee("uniforms.output_shape","i",i.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,Ad=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${ee("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,jn=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",zd=(e,t,r,i,n)=>{let[a,s,o,u]=r.length===2?[-1,0,1,-1]:[0,2,3,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${jn(e,u,a,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${d} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${d} = originalIndices[${s}];
      var col:${d} = originalIndices[${o}];
      ${i?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[o]} - 1)) {
        return ${n};
      }`:""};
      row = max(0, min(row, ${r[s]} - 1));
      col = max(0, min(col, ${r[o]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${u}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${a}])`:"0"};
      var x11: ${d} = getInputValue(batch, channel, row1, col1);
      var x12: ${d} = getInputValue(batch, channel, row1, col2);
      var x21: ${d} = getInputValue(batch, channel, row2, col1);
      var x22: ${d} = getInputValue(batch, channel, row2, col2);
      var dx1: ${d} = abs(row - ${d}(row1));
      var dx2: ${d} = abs(${d}(row2) - row);
      var dy1: ${d} = abs(col - ${d}(col1));
      var dy2: ${d} = abs(${d}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},Od=(e,t,r,i,n,a,s,o,u,d)=>{let c=r.length===2,h=!0,[m,_]=c?[0,1]:h?[2,3]:[1,2],g=e.type.value,w=x=>{let $=x===m?"row":"col";return`
      fn ${$}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${g} {
        var output_index = ${t.indicesGet("output_indices",x)};
        var originalIdx: ${g} = getOriginalCoordinateFromResizedCoordinate(output_index, ${n[x]},
        ${i[x]}, ${r[x]}, ${a[x]}, ${a[x]} + ${r.length});
        var fractOriginalIdx: ${g} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[x]} - 1))) {
          return ${u};
        }
        var data: array<${g}, 4> = array<${g}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${$}: ${g} = originalIdx + ${g}(i);
          if (${$} < 0 || ${$} >= ${r[x]}) {
            ${d?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${$} = max(0, min(${$}, ${r[x]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",x,`u32(${$})`)};
          data[i + 1] = ${x===m?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${w(m)};
    ${w(_)};
  fn getCubicInterpolationCoefs(s: ${g}) -> array<${g}, 4> {
    var absS = abs(s);
    var coeffs: array<${g}, 4> = array<${g}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${g} = 1.0 - absS;
    var twoMinusAbsS: ${g} = 2.0 - absS;
    var onePlusAbsS: ${g} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${g}, 4>, coefs: array<${g}, 4>) -> ${g} {
    var coefsSum: ${g} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${g} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},Rd=(e,t,r,i,n)=>{let[a,s,o,u,d]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],c=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${c} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${r[u]} - 1))`)};
      ${jn(e,d,a,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${c} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${c} = originalIndices[${s}];
      var height:${c} = originalIndices[${o}];
      var width:${c} = originalIndices[${u}];
      ${i?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[o]} - 1) || width < 0 || (width > ${r[u]} - 1)) {
      return ${n};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[o]} - 1));
      width = max(0, min(width, ${r[u]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${d}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${a}])`:"0"};

      var x111: ${c} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${c} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${c} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${c} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${c} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${c} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${c} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${c} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${c} = abs(depth - ${c}(depth1));
      var dx2: ${c} = abs(${c}(depth2) - depth);
      var dy1: ${c} = abs(height - ${c}(height1));
      var dy2: ${c} = abs(${c}(height2) - height);
      var dz1: ${c} = abs(width - ${c}(width1));
      var dz2: ${c} = abs(${c}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},Md=(e,t,r,i,n,a)=>{let s=e.dims,o=Td(a,t.axes,s.length),u=Sd(s,i,n,t.axes),d=i.slice();i.length===0&&(d=s.map((b,C)=>b===0?1:u[C]/b),t.keepAspectRatioPolicy!=="stretch"&&(u=Id(s,d,t)));let c=J("output",e.dataType,u.length),h=B("input",e.dataType,s.length),m=O.size(u),_=s.length===u.length&&s.every((b,C)=>b===u[C]),g=t.coordinateTransformMode==="tf_crop_and_resize",w=t.extrapolationValue,x=h.type.value,$=b=>`
      ${_?"":`
      ${xd(t.coordinateTransformMode,x)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Ad(h,s)};
              ${Cd(t.nearestMode,r,x)};
              ${kd(h,c,s,u,d.length,o.length,g)};
              `;case"linear":return`
              ${Ed(c,s,u,d.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${zd(h,c,s,g,w)}`;if(s.length===3||s.length===5)return`${Rd(h,c,s,g,w)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${Od(h,c,s,u,d,o,t.cubicCoeffA,g,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${b.registerUniform("output_size","u32").registerUniform("scales","f32",d.length).registerUniform("roi","f32",o.length).declareVariables(h,c)}
      ${b.mainStart()}
        ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${_?"output[global_idx] = input[global_idx];":`
        let output_indices = ${c.offsetToIndices("global_idx")};
        var input_indices: ${h.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${h.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${d.length>0?t.mode==="cubic"?d:d.length:""}|${n.length>0?n:""}|${o.length>0?o:""}|${_}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},{type:1,data:d},{type:1,data:o},...te(s,u)]})}},Dd=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},hf=(e,t)=>{let r=[],i=[],n=[],a=Dd(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");$d(e.inputs,t,a,r,i,n),e.compute(Md(e.inputs[0],t,a,r,i,n),{inputs:[0]})},ff=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,n=e.cubicCoeffA,a=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,d=e.nearestMode===""?"simple":e.nearestMode;return ye({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:n,excludeOutside:a,extrapolationValue:s,keepAspectRatioPolicy:o,mode:u,nearestMode:d})}}),Bd,Nd,mf,uy=V(()=>{"use strict";ne(),oe(),le(),Bd=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let n=t.dims[t.dims.length-1],a=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==n)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==a)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==n)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Bias must have the same hidden size as input")}},Nd=(e,t,r,i)=>{let n=t.simplified,a=e[0].dims,s=O.size(a),o=a,u=s,d=a.slice(-1)[0],c=i?a.slice(0,-1).concat(1):[],h=!n&&e.length>3,m=e.length>4,_=i&&r>1,g=i&&r>2,w=r>3,x=64,$=Ce(d),b=[{type:12,data:u},{type:12,data:$},{type:12,data:d},{type:1,data:t.epsilon}],C=I=>{let E=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],k=[B("x",e[0].dataType,e[0].dims,$),B("skip",e[1].dataType,e[1].dims,$),B("gamma",e[2].dataType,e[2].dims,$)];h&&k.push(B("beta",e[3].dataType,e[3].dims,$)),m&&k.push(B("bias",e[4].dataType,e[4].dims,$)),k.push(J("output",e[0].dataType,o,$)),_&&k.push(J("mean_output",1,c)),g&&k.push(J("inv_std_output",1,c)),w&&k.push(J("input_skip_bias_sum",e[0].dataType,o,$));let z=ke(e[0].dataType),M=ke(1,$);return`

      ${I.registerUniforms(E).declareVariables(...k)}
      var<workgroup> sum_shared : array<${M}, ${x}>;
      var<workgroup> sum_squared_shared : array<${M}, ${x}>;

      ${I.mainStart([x,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${x};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${x};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${x-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${m?"bias[offset1d + i]":z+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${w?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Qt(z,$,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${x};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${xt("sum",$)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${xt("square_sum",$)} / f32(uniforms.hidden_size) ${n?"":"- mean * mean"} + uniforms.epsilon);
        ${_?"mean_output[global_idx] = mean;":""}
        ${g?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${n?"":`- ${z}(mean)`}) *
            ${z}(inv_std_dev) * gamma[offset1d + i]
            ${h?"+ beta[offset1d + i]":""};
        }
      }`},T=[{dims:o,dataType:e[0].dataType}];return r>1&&T.push({dims:c,dataType:1}),r>2&&T.push({dims:c,dataType:1}),r>3&&T.push({dims:a,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${$};${_};${g};${w}`,inputDependencies:e.map((I,E)=>"type")},getShaderSource:C,getRunData:()=>({outputs:T,dispatchGroup:{x:Math.ceil(u/d)},programUniforms:b})}},mf=(e,t)=>{Bd(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(Nd(e.inputs,t,e.outputCount,!1),{outputs:r})}}),Pd,vi,Ld,Hn,Ud,Wd,gf,_f,dy=V(()=>{"use strict";ne(),oe(),Te(),le(),Pd=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},vi=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},Ld=(e,t)=>{if(e.length>1){let r=vi(e,1),i=vi(e,2),n=vi(e,3);return n.length===0&&(n=[...Array(e[0].dims.length).keys()]),ye({starts:r,ends:i,axes:n})}else return t},Hn=(e,t,r,i,n)=>{let a=e;return e<0&&(a+=r[i[t]]),n[t]<0?Math.max(0,Math.min(a,r[i[t]]-1)):Math.max(0,Math.min(a,r[i[t]]))},Ud=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${ee("uniforms.input_shape","i",r.length)};
            let steps_i = ${ee("uniforms.steps","i",r.length)};
            let signs_i = ${ee("uniforms.signs","i",r.length)};
            let starts_i = ${ee("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,Wd=(e,t)=>{let r=e[0].dims,i=O.size(r),n=t.axes.length>0?O.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],a=vi(e,4);a.forEach($=>$!==0||(()=>{throw new Error("step cannot be 0")})),a.length===0&&(a=Array(n.length).fill(1));let s=t.starts.map(($,b)=>Hn($,b,r,n,a)),o=t.ends.map(($,b)=>Hn($,b,r,n,a));if(n.length!==s.length||n.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(n.length!==r.length)for(let $=0;$<r.length;++$)n.includes($)||(s.splice($,0,0),o.splice($,0,r[$]),a.splice($,0,1));let u=a.map($=>Math.sign($));a.forEach(($,b,C)=>{if($<0){let T=(o[b]-s[b])/$,I=s[b],E=I+T*a[b];s[b]=E,o[b]=I,C[b]=-$}});let d=r.slice(0);n.forEach(($,b)=>{d[$]=Math.ceil((o[$]-s[$])/a[$])});let c={dims:d,dataType:e[0].dataType},h=J("output",e[0].dataType,d.length),m=B("input",e[0].dataType,e[0].dims.length),_=O.size(d),g=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:a.length}],w=[{type:12,data:_},{type:12,data:s},{type:6,data:u},{type:12,data:a},...te(e[0].dims,d)],x=$=>`
      ${$.registerUniforms(g).declareVariables(m,h)}
        ${Ud(m,h,r)}
        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${h.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${h.setByOffset("global_idx",m.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${s.length}_${a.length}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[c],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:w})}},gf=(e,t)=>{Pd(e.inputs,t);let r=Ld(e.inputs,t);e.compute(Wd(e.inputs,r),{inputs:[0]})},_f=e=>{let t=e.starts,r=e.ends,i=e.axes;return ye({starts:t,ends:r,axes:i})}}),Vd,qd,yf,bf,py=V(()=>{"use strict";ne(),oe(),Te(),Ct(),le(),Vd=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},qd=(e,t)=>{let r=e.inputs[0],i=r.dims,n=O.size(i),a=i.length,s=O.normalizeAxis(t.axis,a),o=s<i.length-1,u,d=[];o?(d=Array.from({length:a},(k,z)=>z),d[s]=a-1,d[a-1]=s,u=e.compute(We(r,d),{inputs:[r],outputs:[-1]})[0]):u=r;let c=u.dims,h=c[a-1],m=n/h,_=Ce(h),g=h/_,w=64;m===1&&(w=256);let x=(k,z)=>z===4?`max(max(${k}.x, ${k}.y), max(${k}.z, ${k}.w))`:z===2?`max(${k}.x, ${k}.y)`:z===3?`max(max(${k}.x, ${k}.y), ${k}.z)`:k,$=B("x",u.dataType,u.dims,_),b=J("result",u.dataType,u.dims,_),C=$.type.value,T=ke(u.dataType)==="f32"?`var threadMax = ${C}(-3.402823e+38f);`:`var threadMax = ${C}(-65504.0h);`,I=k=>`
      var<workgroup> rowMaxShared : ${C};
      var<workgroup> rowSumShared : ${C};
      var<workgroup> threadShared : array<${C}, ${w}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${C} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${C}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${k.registerUniform("packedCols","i32").declareVariables($,b)}
      ${k.mainStart(w)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${w};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${T}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${C}(${x("threadShared[0]",_)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${C}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${C}(${xt("threadShared[0]",_)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${C}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,E=e.compute({name:"Softmax",shaderCache:{hint:`${_};${w}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:c,dataType:u.dataType}],dispatchGroup:{x:m},programUniforms:[{type:6,data:g}]}),getShaderSource:I},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(We(E,d),{inputs:[E]})},yf=(e,t)=>{Vd(e.inputs),qd(e,t)},bf=e=>ye({axis:e.axis})}),Kn,Fd,Gd,jd,wf,cy=V(()=>{"use strict";ne(),oe(),le(),Kn=e=>Array.from(e.getBigInt64Array(),Number),Fd=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Kn(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},Gd=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},jd=(e,t)=>{let r=e[0].dims,i=t??Kn(e[1]),n=Gd(r,i),a=O.size(n),s=e[0].dataType,o=B("input",s,r.length),u=J("output",s,n.length),d=c=>`
      const inputShape = ${o.indices(...r)};
      ${c.registerUniform("output_size","u32").declareVariables(o,u)}
      ${c.mainStart()}
      ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${u.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${u.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},...te(e[0].dims,n)]}),getShaderSource:d}},wf=e=>{Fd(e.inputs),e.compute(jd(e.inputs),{inputs:[0]})}}),Hd,Kd,vf,hy=V(()=>{"use strict";ne(),oe(),le(),Hd=(e,t,r,i,n)=>{let a=J("output_data",n,r.length,4),s=B("a_data",t[1].dataType,t[1].dims.length,4),o=B("b_data",t[2].dataType,t[2].dims.length,4),u=B("c_data",t[0].dataType,t[0].dims.length,4),d,c=(h,m,_)=>`select(${m}, ${h}, ${_})`;if(!i)d=a.setByOffset("global_idx",c(s.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let h=(m,_,g="")=>{let w=`a_data[index_a${_}][component_a${_}]`,x=`b_data[index_b${_}][component_b${_}]`,$=`bool(c_data[index_c${_}] & (0xffu << (component_c${_} * 8)))`;return`
            let output_indices${_} = ${a.offsetToIndices(`global_idx * 4u + ${_}u`)};
            let offset_a${_} = ${s.broadcastedIndicesToOffset(`output_indices${_}`,a)};
            let offset_b${_} = ${o.broadcastedIndicesToOffset(`output_indices${_}`,a)};
            let offset_c${_} = ${u.broadcastedIndicesToOffset(`output_indices${_}`,a)};
            let index_a${_} = offset_a${_} / 4u;
            let index_b${_} = offset_b${_} / 4u;
            let index_c${_} = offset_c${_} / 4u;
            let component_a${_} = offset_a${_} % 4u;
            let component_b${_} = offset_b${_} % 4u;
            let component_c${_} = offset_c${_} % 4u;
            ${m}[${_}] = ${g}(${c(w,x,$)});
          `};n===9?d=`
            var data = vec4<u32>(0);
            ${h("data",0,"u32")}
            ${h("data",1,"u32")}
            ${h("data",2,"u32")}
            ${h("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:d=`
            ${h("output_data[global_idx]",0)}
            ${h("output_data[global_idx]",1)}
            ${h("output_data[global_idx]",2)}
            ${h("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(u,s,o,a)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${d}
      }`},Kd=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,n=e[1].dataType,a=!(O.areEqual(t,r)&&O.areEqual(r,i)),s=t,o=O.size(t);if(a){let d=Jt.calcShape(Jt.calcShape(t,r,!1),i,!1);if(!d)throw new Error("Can't perform where op on the given tensors");s=d,o=O.size(s)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:d=>Hd(d,e,s,a,n),getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...te(i,t,r,s)]})}},vf=e=>{e.compute(Kd(e.inputs))}}),$f,fy=V(()=>{"use strict";E_(),Aa(),k_(),A_(),z_(),O_(),R_(),P_(),U_(),W_(),V_(),q_(),F_(),G_(),j_(),H_(),K_(),Y_(),X_(),Z_(),Q_(),J_(),ey(),ty(),iy(),Uh(),ry(),ny(),ay(),sy(),oy(),ka(),ly(),Gh(),uy(),dy(),py(),qh(),cy(),Ct(),za(),hy(),$f=new Map([["Abs",[fc]],["Acos",[mc]],["Acosh",[gc]],["Add",[Xc]],["ArgMax",[dc,aa]],["ArgMin",[uc,aa]],["Asin",[_c]],["Asinh",[yc]],["Atan",[bc]],["Atanh",[wc]],["Attention",[pc]],["AveragePool",[ef,Jh]],["BatchNormalization",[cc]],["BiasAdd",[hc]],["BiasSplitGelu",[Yc]],["Cast",[$c,vc]],["Ceil",[Cc]],["Clip",[xc]],["Concat",[sh,oh]],["Conv",[pa,da]],["ConvTranspose",[_h,gh]],["Cos",[Tc]],["Cosh",[Sc]],["CumSum",[yh,bh]],["DepthToSpace",[wh,vh]],["DequantizeLinear",[lf,uf]],["Div",[Zc]],["Einsum",[$h,xh]],["Elu",[Ic,Si]],["Equal",[Qc]],["Erf",[Ec]],["Exp",[kc]],["Expand",[Ch]],["FastGelu",[Th]],["Floor",[Ac]],["FusedConv",[pa,da]],["Gather",[Ih,Sh]],["GatherElements",[Rh,Oh]],["GatherBlockQuantized",[Ah,zh]],["GatherND",[Eh,kh]],["Gelu",[zc]],["Gemm",[Dh,Mh]],["GlobalAveragePool",[rf,tf]],["GlobalMaxPool",[of,sf]],["Greater",[ih]],["GreaterOrEqual",[nh]],["GridSample",[Bh,Nh]],["GroupQueryAttention",[jh]],["HardSigmoid",[Lc,Pc]],["InstanceNormalization",[Hh]],["LayerNormalization",[Kh]],["LeakyRelu",[Oc,Si]],["Less",[rh]],["LessOrEqual",[ah]],["Log",[Hc]],["MatMul",[Yh]],["MatMulNBits",[Xh,Zh]],["MaxPool",[nf,af]],["Mul",[Jc]],["MultiHeadAttention",[Lh,Ph]],["Neg",[Mc]],["Not",[Rc]],["Pad",[Qh]],["Pow",[eh]],["QuickGelu",[Kc,Si]],["Range",[df]],["Reciprocal",[Dc]],["ReduceMin",[nc]],["ReduceMean",[Jp]],["ReduceMax",[rc]],["ReduceSum",[sc]],["ReduceProd",[ac]],["ReduceL1",[ec]],["ReduceL2",[tc]],["ReduceLogSum",[lc]],["ReduceLogSumExp",[ic]],["ReduceSumSquare",[oc]],["Relu",[Bc]],["Resize",[hf,ff]],["RotaryEmbedding",[Fh]],["ScatterND",[cf,pf]],["Sigmoid",[Nc]],["Sin",[Uc]],["Sinh",[Wc]],["Slice",[gf,_f]],["SkipLayerNormalization",[mf]],["Split",[Wh,Vh]],["Sqrt",[Vc]],["Softmax",[yf,bf]],["Sub",[th]],["Tan",[qc]],["Tanh",[Fc]],["ThresholdedRelu",[jc,Si]],["Tile",[wf]],["Transpose",[Wp,Vp]],["Where",[vf]]])}),xf,my=V(()=>{"use strict";Ge(),pt(),le(),xf=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,n){Je(e.programInfo.name);let a=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let d of t)o.push({binding:o.length,resource:{buffer:d.buffer}});for(let d of r)o.push({binding:o.length,resource:{buffer:d.buffer}});n&&o.push({binding:o.length,resource:n});let u=a.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let d={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(d)}s.setPipeline(e.computePipeline),s.setBindGroup(0,u),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),Fe(e.programInfo.name)}dispose(){}build(e,t){Je(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(d=>{r.features.has(d.feature)&&i.push(`enable ${d.extension};`)});let n=Up(t,this.backend.device.limits),a=e.getShaderSource(n),s=`${i.join(`
`)}
${n.additionalImplementations}
${a}`,o=r.createShaderModule({code:s,label:e.name});ce("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let u=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return Fe(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:n.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,n=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=n&&r<=n&&i<=n)return[t,r,i];let a=t*r*i,s=Math.ceil(Math.sqrt(a));if(s>n){if(s=Math.ceil(Math.cbrt(a)),s>n)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Cf={};ti(Cf,{WebGpuBackend:()=>Tf});var Yd,Xd,Zd,Tf,gy=V(()=>{"use strict";Ge(),ne(),pt(),Dp(),S_(),fy(),my(),Yd=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let n=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${n}`);break}case"rank":{let a=e[i].dims.length;r.push(`${n};${a}`);break}case"dims":{let a=e[i].dims.join(",");r.push(`${n};${a}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},Xd=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${Yd(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},Zd=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Tf=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},n=a=>t.features.has(a)&&r.push(a)&&!0;n("chromium-experimental-timestamp-query-inside-passes")||n("timestamp-query"),n("shader-f16"),n("subgroups"),this.device=await t.requestDevice(i),this.adapterInfo=new Zd(t.info||await t.requestAdapterInfo()),this.gpuDataManager=Pp(this),this.programManager=new xf(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Ta(e.logLevel,!!e.debug),this.device.onuncapturederror=a=>{a.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${a.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Je(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let n=r[i],a=n.kernelId,s=this.kernels.get(a),o=s.kernelType,u=s.kernelName,d=n.programName,c=n.inputTensorViews,h=n.outputTensorViews,m=t[i*2],_=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=m);let g=Number(m-this.queryTimeBase),w=Number(_-this.queryTimeBase);if(!Number.isSafeInteger(g)||!Number.isSafeInteger(w))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:c.map(x=>({dims:x.dims,dataType:dt(x.dataType)})),outputsMetadata:h.map(x=>({dims:x.dims,dataType:dt(x.dataType)})),kernelId:a,kernelType:o,kernelName:u,programName:d,startTime:g,endTime:w});else{let x="";c.forEach((b,C)=>{x+=`input[${C}]: [${b.dims}] | ${dt(b.dataType)}, `});let $="";h.forEach((b,C)=>{$+=`output[${C}]: [${b.dims}] | ${dt(b.dataType)}, `}),console.log(`[profiling] kernel "${a}|${o}|${u}|${d}" ${x}${$}start time: ${g} ns, execution time: ${w-g} ns`)}Ai("GPU",`${d}::${m}::${_}`)}e.unmap(),this.pendingQueries.delete(e)}),Fe()}run(e,t,r,i,n,a){Je(e.name);let s=[];for(let b=0;b<t.length;++b){let C=t[b].data;if(C===0)continue;let T=this.gpuDataManager.get(C);if(!T)throw new Error(`no GPU data for input: ${C}`);s.push(T)}let{outputs:o,dispatchGroup:u,programUniforms:d}=e.getRunData(t),c=r.length===0?o.map((b,C)=>C):r;if(c.length!==o.length)throw new Error(`Output size ${c.length} must be equal to ${o.length}.`);let h=[],m=[];for(let b=0;b<o.length;++b){if(!Number.isInteger(c[b])||c[b]<-3||c[b]>=a)throw new Error(`Invalid output index: ${c[b]}`);if(c[b]===-3)continue;let C=c[b]===-1,T=c[b]===-2,I=C||T?n(o[b].dataType,o[b].dims):i(c[b],o[b].dataType,o[b].dims);if(h.push(I),I.data===0)continue;let E=this.gpuDataManager.get(I.data);if(!E)throw new Error(`no GPU data for output: ${I.data}`);if(C&&this.temporaryData.push(E),T){let k=this.kernelPersistentData.get(this.currentKernelId);k||(k=[],this.kernelPersistentData.set(this.currentKernelId,k)),k.push(E)}m.push(E)}if(s.length!==t.length||m.length!==h.length){if(m.length===0)return Fe(e.name),h;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let _;if(d){let b=0,C=[];d.forEach(k=>{let z=typeof k.data=="number"?[k.data]:k.data;if(z.length===0)return;let M=k.type===10?2:4,W,j;k.type===10?(j=z.length>4?16:z.length>2?8:z.length*M,W=z.length>4?16:M*z.length):(j=z.length<=2?z.length*M:16,W=16),b=Math.ceil(b/j)*j,C.push(b);let H=k.type===10?8:4;b+=z.length>4?Math.ceil(z.length/H)*W:z.length*M});let T=16;b=Math.ceil(b/T)*T;let I=new ArrayBuffer(b);d.forEach((k,z)=>{let M=C[z],W=typeof k.data=="number"?[k.data]:k.data;if(k.type===6)new Int32Array(I,M,W.length).set(W);else if(k.type===12)new Uint32Array(I,M,W.length).set(W);else if(k.type===10)new Uint16Array(I,M,W.length).set(W);else if(k.type===1)new Float32Array(I,M,W.length).set(W);else throw new Error(`Unsupported uniform type: ${dt(k.type)}`)});let E=this.gpuDataManager.create(b,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(E.buffer,0,I,0,b),this.gpuDataManager.release(E.id),_={offset:0,size:b,buffer:E.buffer}}let g=this.programManager.normalizeDispatchGroupSize(u),w=g[1]===1&&g[2]===1,x=Xd(e,t,w),$=this.programManager.getArtifact(x);if($||($=this.programManager.build(e,g),this.programManager.setArtifact(x,$),ce("info",()=>`[artifact] key: ${x}, programName: ${e.name}`)),d&&$.uniformVariablesInfo){if(d.length!==$.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${$.uniformVariablesInfo.length}, got ${d.length} in program "${$.programInfo.name}".`);for(let b=0;b<d.length;b++){let C=d[b],T=C.type,I=typeof C.data=="number"?1:C.data.length,[E,k]=$.uniformVariablesInfo[b];if(T!==E||I!==k)throw new Error(`Uniform variable ${b} mismatch: expect type ${E} with size ${k}, got type ${T} with size ${I} in program "${$.programInfo.name}".`)}}if(ce("info",()=>`[ProgramManager] run "${e.name}" (key=${x}) with ${g[0]}x${g[1]}x${g[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let b={kernelId:this.currentKernelId,programName:$.programInfo.name,inputTensorViews:t,outputTensorViews:h};this.pendingKernels.push(b),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(b)}return this.programManager.run($,s,m,g,_),Fe(e.name),h}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let n=$f.get(e);if(!n)throw new Error(`kernel not implemented: ${e}`);let a={kernelType:e,kernelName:i,kernelEntry:n[0],attributes:[n[1],r]};this.kernels.set(t,a)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let n=i.kernelType,a=i.kernelName,s=i.kernelEntry,o=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${n}] ${a}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),ce("info",()=>`[WebGPU] Start to run kernel "[${n}] ${a}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(d){return r.push(Promise.resolve(`[WebGPU] Kernel "[${n}] ${a}" failed. ${d}`)),1}finally{u&&r.push(this.device.popErrorScope().then(d=>d?`GPU validation error for kernel "[${n}] ${a}": ${d.message}`:null));for(let d of this.temporaryData)this.gpuDataManager.release(d.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let n=this.sessionExternalDataMapping.get(e);n||(n=new Map,this.sessionExternalDataMapping.set(e,n));let a=n.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,a);return n.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await ia(this,e,t);return Sa(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){ce("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){ce("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){ce("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let n=this.getComputePassEncoder(),a=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),n.setPipeline(a.computePipeline),n.setBindGroup(0,a.bindGroup),n.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Sf={};ti(Sf,{init:()=>If});var sr,Qd,If,_y=V(()=>{"use strict";ne(),pt(),oe(),T_(),sr=class Ef{constructor(t,r,i,n){this.module=t,this.dataType=r,this.data=i,this.dims=n}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(O.size(t)!==O.size(this.dims))throw new Error("Invalid new shape");return new Ef(this.module,this.dataType,this.data,t)}},Qd=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,n=r/e.PTR_SIZE,a=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*n++,a));let s=Number(e.getValue(i*n++,a));this.outputCount=Number(e.getValue(i*n++,a)),this.customDataOffset=Number(e.getValue(i*n++,"*")),this.customDataSize=Number(e.getValue(i*n++,a));let o=[];for(let u=0;u<s;u++){let d=Number(e.getValue(i*n++,a)),c=Number(e.getValue(i*n++,"*")),h=Number(e.getValue(i*n++,a)),m=[];for(let _=0;_<h;_++)m.push(Number(e.getValue(i*n++,a)));o.push(new sr(e,d,c,m))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,i=t?.outputs??[],n=(s,o,u)=>new sr(this.module,o,this.output(s,u),u),a=(s,o)=>{let u=Ut(s,o);if(!u)throw new Error(`Unsupported data type: ${s}`);let d=u>0?this.backend.gpuDataManager.create(u).id:0;return new sr(this.module,s,d,o)};return this.backend.run(e,r,i,n,a,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,n=i===4?"i32":"i64",a=this.module.stackAlloc((1+t.length)*i);this.module.setValue(a,t.length,n);for(let s=0;s<t.length;s++)this.module.setValue(a+i*(s+1),t[s],n);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},If=async(e,t,r,i)=>{let n=t.jsepInit;if(!n)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let a=(gy(),ki(Cf)).WebGpuBackend,s=new a;await s.initialize(r,i),n("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,u,d,c=!1)=>{if(c)ce("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(d)}`),s.memcpy(Number(o),Number(u));else{ce("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(d)}`);let h=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(d));s.upload(Number(u),h)}},async(o,u,d)=>{ce("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${d}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+d)>>>0))},(o,u,d)=>s.createKernel(o,Number(u),d,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>s.releaseKernel(o),(o,u,d,c)=>{ce("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${d}, kernel=${o}, contextDataOffset=${u}`);let h=new Qd(t,s,Number(u));return s.computeKernel(Number(o),h,c)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let a=new Np(r);n("webnn",[a,()=>a.reserveTensorId(),s=>a.releaseTensorId(s),async(s,o,u,d,c)=>a.ensureTensor(s,o,u,d,c),(s,o)=>{a.uploadTensor(s,o)},async(s,o)=>a.downloadTensor(s,o),(s,o)=>a.registerMLContext(s,o),!!r.trace])}}}),Jd,Na,Pa,bt,ep,Yn,_r,La,Ua,Xn,Wa,Va,qa,kf=V(()=>{"use strict";Ge(),$_(),x_(),ne(),Gt(),va(),zp(),Jd=(e,t)=>{we()._OrtInit(e,t)!==0&&be("Can't initialize onnxruntime.")},Na=async e=>{Jd(e.wasm.numThreads,cr(e.logLevel))},Pa=async(e,t)=>{we().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let n=e.webgpu.forceFallbackAdapter;if(n!==void 0&&typeof n!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${n}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:n}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=(_y(),ki(Sf)).init;t==="webgpu"&&await i("webgpu",we(),e,r),t==="webnn"&&await i("webnn",we(),e)}},bt=new Map,ep=e=>{let t=we(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,n,n+i)!==0&&be("Can't get session input/output count.");let a=i===4?"i32":"i64";return[Number(t.getValue(n,a)),Number(t.getValue(n+i,a))]}finally{t.stackRestore(r)}},Yn=(e,t)=>{let r=we(),i=r.stackSave(),n=0;try{let a=r.PTR_SIZE,s=r.stackAlloc(2*a);r._OrtGetInputOutputMetadata(e,t,s,s+a)!==0&&be("Can't get session input/output metadata.");let o=Number(r.getValue(s,"*"));n=Number(r.getValue(s+a,"*"));let u=r.HEAP32[n/4];if(u===0)return[o,0];let d=r.HEAPU32[n/4+1],c=[];for(let h=0;h<d;h++){let m=Number(r.getValue(n+8+h*a,"*"));c.push(m!==0?r.UTF8ToString(m):Number(r.getValue(n+8+(h+d)*a,"*")))}return[o,u,c]}finally{r.stackRestore(i),n!==0&&r._OrtFree(n)}},_r=e=>{let t=we(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},La=async(e,t)=>{let r,i,n=we();Array.isArray(e)?[r,i]=e:e.buffer===n.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=_r(e);let a=0,s=0,o=0,u=[],d=[],c=[];try{if([s,u]=await Ap(t),t?.externalData&&n.mountExternalData){let T=[];for(let I of t.externalData){let E=typeof I=="string"?I:I.path;T.push(Ca(typeof I=="string"?I:I.data).then(k=>{n.mountExternalData(E,k)}))}await Promise.all(T)}for(let T of t?.executionProviders??[])if((typeof T=="string"?T:T.name)==="webnn"){if(n.shouldTransferToMLTensor=!1,typeof T!="string"){let I=T,E=I?.context,k=I?.gpuDevice,z=I?.deviceType,M=I?.powerPreference;E?n.currentContext=E:k?n.currentContext=await n.webnnCreateMLContext(k):n.currentContext=await n.webnnCreateMLContext({deviceType:z,powerPreference:M})}else n.currentContext=await n.webnnCreateMLContext();break}a=await n._OrtCreateSession(r,i,s),n.webgpuOnCreateSession?.(a),a===0&&be("Can't create a session."),n.jsepOnCreateSession?.(),n.currentContext&&(n.webnnRegisterMLContext(a,n.currentContext),n.currentContext=void 0,n.shouldTransferToMLTensor=!0);let[h,m]=ep(a),_=!!t?.enableGraphCapture,g=[],w=[],x=[],$=[],b=[];for(let T=0;T<h;T++){let[I,E,k]=Yn(a,T);I===0&&be("Can't get an input name."),d.push(I);let z=n.UTF8ToString(I);g.push(z),x.push(E===0?{name:z,isTensor:!1}:{name:z,isTensor:!0,type:dt(E),shape:k})}for(let T=0;T<m;T++){let[I,E,k]=Yn(a,T+h);I===0&&be("Can't get an output name."),c.push(I);let z=n.UTF8ToString(I);w.push(z),$.push(E===0?{name:z,isTensor:!1}:{name:z,isTensor:!0,type:dt(E),shape:k});{if(_&&t?.preferredOutputLocation===void 0){b.push("gpu-buffer");continue}let M=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[z]??"cpu",W=n.webnnIsGraphOutput;if(M==="cpu"&&W&&W(a,z)){b.push("ml-tensor-cpu-output");continue}if(M!=="cpu"&&M!=="cpu-pinned"&&M!=="gpu-buffer"&&M!=="ml-tensor")throw new Error(`Not supported preferred output location: ${M}.`);if(_&&M!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${M}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);b.push(M)}}let C=null;return b.some(T=>T==="gpu-buffer"||T==="ml-tensor"||T==="ml-tensor-cpu-output")&&(o=n._OrtCreateBinding(a),o===0&&be("Can't create IO binding."),C={handle:o,outputPreferredLocations:b,outputPreferredLocationsEncoded:b.map(T=>T==="ml-tensor-cpu-output"?"ml-tensor":T).map(T=>ea(T))}),bt.set(a,[a,d,c,C,_,!1]),[a,g,w,x,$]}catch(h){throw d.forEach(m=>n._OrtFree(m)),c.forEach(m=>n._OrtFree(m)),o!==0&&n._OrtReleaseBinding(o)!==0&&be("Can't release IO binding."),a!==0&&n._OrtReleaseSession(a)!==0&&be("Can't release session."),h}finally{n._free(r),s!==0&&n._OrtReleaseSessionOptions(s)!==0&&be("Can't release session options."),u.forEach(h=>n._free(h)),n.unmountExternalData?.()}},Ua=e=>{let t=we(),r=bt.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,n,a,s,o]=r;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&be("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&be("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),n.forEach(u=>t._OrtFree(u)),a.forEach(u=>t._OrtFree(u)),t._OrtReleaseSession(i)!==0&&be("Can't release session."),bt.delete(e)},Xn=async(e,t,r,i,n,a,s=!1)=>{if(!e){t.push(0);return}let o=we(),u=o.PTR_SIZE,d=e[0],c=e[1],h=e[3],m=h,_,g;if(d==="string"&&(h==="gpu-buffer"||h==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&h!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${a} when enableGraphCapture is true.`);if(h==="gpu-buffer"){let $=e[2].gpuBuffer;g=Ut(Lt(d),c);{let b=o.jsepRegisterBuffer;if(!b)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');_=b(i,a,$,g)}}else if(h==="ml-tensor"){let $=e[2].mlTensor;g=Ut(Lt(d),c);let b=o.webnnRegisterMLTensor;if(!b)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');_=b(i,$,Lt(d),c)}else{let $=e[2];if(Array.isArray($)){g=u*$.length,_=o._malloc(g),r.push(_);for(let b=0;b<$.length;b++){if(typeof $[b]!="string")throw new TypeError(`tensor data at index ${b} is not a string`);o.setValue(_+b*u,Ze($[b],r),"*")}}else{let b=o.webnnIsGraphInput,C=o.webnnIsGraphOutput;if(d!=="string"&&b&&C){let T=o.UTF8ToString(n);if(b(i,T)||C(i,T)){let I=Lt(d);g=Ut(I,c),m="ml-tensor";let E=o.webnnCreateTemporaryTensor,k=o.webnnUploadTensor;if(!E||!k)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let z=await E(i,I,c);k(z,new Uint8Array($.buffer,$.byteOffset,$.byteLength)),_=z}else g=$.byteLength,_=o._malloc(g),r.push(_),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,g),_)}else g=$.byteLength,_=o._malloc(g),r.push(_),o.HEAPU8.set(new Uint8Array($.buffer,$.byteOffset,g),_)}}let w=o.stackSave(),x=o.stackAlloc(4*c.length);try{c.forEach((b,C)=>o.setValue(x+C*u,b,u===4?"i32":"i64"));let $=o._OrtCreateTensor(Lt(d),_,g,x,c.length,ea(m));$===0&&be(`Can't create tensor for input/output. session=${i}, index=${a}.`),t.push($)}finally{o.stackRestore(w)}},Wa=async(e,t,r,i,n,a)=>{let s=we(),o=s.PTR_SIZE,u=bt.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let d=u[0],c=u[1],h=u[2],m=u[3],_=u[4],g=u[5],w=t.length,x=i.length,$=0,b=[],C=[],T=[],I=[],E=s.stackSave(),k=s.stackAlloc(w*o),z=s.stackAlloc(w*o),M=s.stackAlloc(x*o),W=s.stackAlloc(x*o);try{[$,b]=kp(a),vt("wasm prepareInputOutputTensor");for(let U=0;U<w;U++)await Xn(r[U],C,I,e,c[t[U]],t[U],_);for(let U=0;U<x;U++)await Xn(n[U],T,I,e,h[i[U]],w+i[U],_);$t("wasm prepareInputOutputTensor");for(let U=0;U<w;U++)s.setValue(k+U*o,C[U],"*"),s.setValue(z+U*o,c[t[U]],"*");for(let U=0;U<x;U++)s.setValue(M+U*o,T[U],"*"),s.setValue(W+U*o,h[i[U]],"*");if(m&&!g){let{handle:U,outputPreferredLocations:K,outputPreferredLocationsEncoded:Z}=m;if(c.length!==w)throw new Error(`input count from feeds (${w}) is expected to be always equal to model's input count (${c.length}).`);vt("wasm bindInputsOutputs");for(let Y=0;Y<w;Y++){let ae=t[Y];await s._OrtBindInput(U,c[ae],C[Y])!==0&&be(`Can't bind input[${Y}] for session=${e}.`)}for(let Y=0;Y<x;Y++){let ae=i[Y];n[Y]?.[3]?s._OrtBindOutput(U,h[ae],T[Y],0)!==0&&be(`Can't bind pre-allocated output[${Y}] for session=${e}.`):s._OrtBindOutput(U,h[ae],0,Z[ae])!==0&&be(`Can't bind output[${Y}] to ${K[Y]} for session=${e}.`)}$t("wasm bindInputsOutputs"),bt.set(e,[d,c,h,m,_,!0])}s.jsepOnRunStart?.(d),s.webnnOnRunStart?.(d);let j;m?j=await s._OrtRunWithBinding(d,m.handle,x,M,$):j=await s._OrtRun(d,z,k,w,W,x,M,$),j!==0&&be("failed to call OrtRun().");let H=[],F=[];vt("wasm ProcessOutputTensor");for(let U=0;U<x;U++){let K=Number(s.getValue(M+U*o,"*"));if(K===T[U]){H.push(n[U]);continue}let Z=s.stackSave(),Y=s.stackAlloc(4*o),ae=!1,X,me=0;try{s._OrtGetTensorData(K,Y,Y+o,Y+2*o,Y+3*o)!==0&&be(`Can't access output tensor data on index ${U}.`);let P=o===4?"i32":"i64",q=Number(s.getValue(Y,P));me=s.getValue(Y+o,"*");let ie=s.getValue(Y+o*2,"*"),pe=Number(s.getValue(Y+o*3,P)),N=[];for(let ge=0;ge<pe;ge++)N.push(Number(s.getValue(ie+ge*o,P)));s._OrtFree(ie)!==0&&be("Can't free memory for tensor dims.");let ue=N.reduce((ge,ve)=>ge*ve,1);X=dt(q);let Me=m?.outputPreferredLocations[i[U]];if(X==="string"){if(Me==="gpu-buffer"||Me==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let ge=[];for(let ve=0;ve<ue;ve++){let Ee=s.getValue(me+ve*o,"*"),Ae=s.getValue(me+(ve+1)*o,"*"),ct=ve===ue-1?void 0:Ae-Ee;ge.push(s.UTF8ToString(Ee,ct))}H.push([X,N,ge,"cpu"])}else if(Me==="gpu-buffer"&&ue>0){let ge=s.jsepGetBuffer;if(!ge)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let ve=ge(me),Ee=Ut(q,ue);if(Ee===void 0||!$a(X))throw new Error(`Unsupported data type: ${X}`);ae=!0,H.push([X,N,{gpuBuffer:ve,download:s.jsepCreateDownloader(ve,Ee,X),dispose:()=>{s._OrtReleaseTensor(K)!==0&&be("Can't release tensor.")}},"gpu-buffer"])}else if(Me==="ml-tensor"&&ue>0){let ge=s.webnnEnsureTensor,ve=s.webnnIsGraphInputOutputTypeSupported;if(!ge||!ve)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Ut(q,ue)===void 0||!xa(X))throw new Error(`Unsupported data type: ${X}`);if(!ve(e,X,!1))throw new Error(`preferredLocation "ml-tensor" for ${X} output is not supported by current WebNN Context.`);let Ee=await ge(e,me,q,N,!1);ae=!0,H.push([X,N,{mlTensor:Ee,download:s.webnnCreateMLTensorDownloader(me,X),dispose:()=>{s.webnnReleaseTensorId(me),s._OrtReleaseTensor(K)}},"ml-tensor"])}else if(Me==="ml-tensor-cpu-output"&&ue>0){let ge=s.webnnCreateMLTensorDownloader(me,X)(),ve=H.length;ae=!0,F.push((async()=>{let Ee=[ve,await ge];return s.webnnReleaseTensorId(me),s._OrtReleaseTensor(K),Ee})()),H.push([X,N,[],"cpu"])}else{let ge=yr(X),ve=new ge(ue);new Uint8Array(ve.buffer,ve.byteOffset,ve.byteLength).set(s.HEAPU8.subarray(me,me+ve.byteLength)),H.push([X,N,ve,"cpu"])}}finally{s.stackRestore(Z),X==="string"&&me&&s._free(me),ae||s._OrtReleaseTensor(K)}}m&&!_&&(s._OrtClearBoundOutputs(m.handle)!==0&&be("Can't clear bound outputs."),bt.set(e,[d,c,h,m,_,!1]));for(let[U,K]of await Promise.all(F))H[U][2]=K;return $t("wasm ProcessOutputTensor"),H}finally{s.webnnOnRunEnd?.(d),s.stackRestore(E),C.forEach(j=>s._OrtReleaseTensor(j)),T.forEach(j=>s._OrtReleaseTensor(j)),I.forEach(j=>s._free(j)),$!==0&&s._OrtReleaseRunOptions($),b.forEach(j=>s._free(j))}},Va=e=>{let t=we(),r=bt.get(e);if(!r)throw new Error("invalid session id");let i=r[0],n=t._OrtEndProfiling(i);n===0&&be("Can't get an profile file name."),t._OrtFree(n)},qa=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),wt,qe,Zt,$i,xi,or,Zn,lr,Bt,Nt,tp,Af,zf,Of,Rf,Mf,Df,Bf,Nf=V(()=>{"use strict";Ge(),kf(),Gt(),ba(),wt=()=>!!fe.wasm.proxy&&typeof document<"u",Zt=!1,$i=!1,xi=!1,lr=new Map,Bt=(e,t)=>{let r=lr.get(e);r?r.push(t):lr.set(e,[t])},Nt=()=>{if(Zt||!$i||xi||!qe)throw new Error("worker not ready")},tp=e=>{switch(e.data.type){case"init-wasm":Zt=!1,e.data.err?(xi=!0,Zn[1](e.data.err)):($i=!0,Zn[0]()),or&&(URL.revokeObjectURL(or),or=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=lr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}default:}},Af=async()=>{if(!$i){if(Zt)throw new Error("multiple calls to 'initWasm()' detected.");if(xi)throw new Error("previous call to 'initWasm()' failed.");if(Zt=!0,wt())return new Promise((e,t)=>{qe?.terminate(),Ip().then(([r,i])=>{try{qe=i,qe.onerror=a=>t(a),qe.onmessage=tp,Zn=[e,t];let n={type:"init-wasm",in:fe};!n.in.wasm.wasmPaths&&(r||Jn)&&(n.in.wasm.wasmPaths={wasm:new URL("ort-wasm-simd-threaded.jsep.wasm",import.meta.url).href}),qe.postMessage(n),or=r}catch(n){t(n)}},t)});try{await wa(fe.wasm),await Na(fe),$i=!0}catch(e){throw xi=!0,e}finally{Zt=!1}}},zf=async e=>{if(wt())return Nt(),new Promise((t,r)=>{Bt("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:fe}};qe.postMessage(i)});await Pa(fe,e)},Of=async e=>wt()?(Nt(),new Promise((t,r)=>{Bt("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};qe.postMessage(i,[e.buffer])})):_r(e),Rf=async(e,t)=>{if(wt()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Nt(),new Promise((r,i)=>{Bt("create",[r,i]);let n={type:"create",in:{model:e,options:{...t}}},a=[];e instanceof Uint8Array&&a.push(e.buffer),qe.postMessage(n,a)})}else return La(e,t)},Mf=async e=>{if(wt())return Nt(),new Promise((t,r)=>{Bt("release",[t,r]);let i={type:"release",in:e};qe.postMessage(i)});Ua(e)},Df=async(e,t,r,i,n,a)=>{if(wt()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(n.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Nt(),new Promise((s,o)=>{Bt("run",[s,o]);let u=r,d={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:i,options:a}};qe.postMessage(d,qa(u))})}else return Wa(e,t,r,i,n,a)},Bf=async e=>{if(wt())return Nt(),new Promise((t,r)=>{Bt("end-profiling",[t,r]);let i={type:"end-profiling",in:e};qe.postMessage(i)});Va(e)}}),Qn,ip,Pf,yy=V(()=>{"use strict";Ge(),Nf(),ne(),ya(),zp(),Qn=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},ip=e=>{switch(e[3]){case"cpu":return new Qe(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!$a(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:n}=e[2];return Qe.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:n})}case"ml-tensor":{let t=e[0];if(!xa(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:n}=e[2];return Qe.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:n})}default:throw new Error(`invalid data location: ${e[3]}`)}},Pf=class{async fetchModelAndCopyToWasmMemory(e){return Of(await Ca(e))}async loadModel(e,t){Je();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Rf(r,t),Fe()}async dispose(){return Mf(this.sessionId)}async run(e,t,r){Je();let i=[],n=[];Object.entries(e).forEach(h=>{let m=h[0],_=h[1],g=this.inputNames.indexOf(m);if(g===-1)throw new Error(`invalid input '${m}'`);i.push(_),n.push(g)});let a=[],s=[];Object.entries(t).forEach(h=>{let m=h[0],_=h[1],g=this.outputNames.indexOf(m);if(g===-1)throw new Error(`invalid output '${m}'`);a.push(_),s.push(g)});let o=i.map((h,m)=>Qn(h,()=>`input "${this.inputNames[n[m]]}"`)),u=a.map((h,m)=>h?Qn(h,()=>`output "${this.outputNames[s[m]]}"`):null),d=await Df(this.sessionId,n,o,s,u,r),c={};for(let h=0;h<d.length;h++)c[this.outputNames[s[h]]]=a[h]??ip(d[h]);return Fe(),c}startProfiling(){}endProfiling(){Bf(this.sessionId)}}}),Lf={};ti(Lf,{OnnxruntimeWebAssemblyBackend:()=>fa,initializeFlags:()=>ha,wasmBackend:()=>Uf});var ha,fa,Uf,by=V(()=>{"use strict";Ge(),Nf(),yy(),ha=()=>{(typeof fe.wasm.initTimeout!="number"||fe.wasm.initTimeout<0)&&(fe.wasm.initTimeout=0);let e=fe.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),fe.wasm.simd=!1),typeof fe.wasm.proxy!="boolean"&&(fe.wasm.proxy=!1),typeof fe.wasm.trace!="boolean"&&(fe.wasm.trace=!1),typeof fe.wasm.numThreads!="number"||!Number.isInteger(fe.wasm.numThreads)||fe.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)fe.wasm.numThreads=1;else{let t=typeof navigator>"u"?a_("node:os").cpus().length:navigator.hardwareConcurrency;fe.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},fa=class{async init(e){ha(),await Af(),await zf(e)}async createInferenceSessionHandler(e,t){let r=new Pf;return await r.loadModel(e,t),r}},Uf=new fa});Ge();Ge();Ge();var wy="1.23.2",vy=vp;{let e=(by(),ki(Lf)).wasmBackend;Wt("webgpu",e,5),Wt("webnn",e,5),Wt("cpu",e,10),Wt("wasm",e,10)}Object.defineProperty(fe.versions,"web",{value:wy,enumerable:!0});var se="https://huggingface.co/snowfluke/ppu-paddle-ocr-models/resolve/main",xe="https://huggingface.co/snowfluke/ppu-paddle-ocr-models/resolve/main",Fa=`${se}/correction/UVDoc_grid.onnx`,$y="https://github.com/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr-models/raw/main";function Wf(e){let t=globalThis.process?.env?.PPU_PADDLE_OCR_MODEL_MIRROR;return!t||t==="0"||t==="false"||!e.startsWith(se)?null:$y+e.slice(se.length)}var xy={detection:`${se}/detection/ort/PP-OCRv6_small_det.ort`,recognition:`${se}/recognition/ort/PP-OCRv6_small_rec.ort`,charactersDictionary:`${xe}/recognition/ppocrv6_dict.txt`},Cy={detection:`${se}/detection/ort/PP-OCRv6_medium_det.ort`,recognition:`${se}/recognition/ort/PP-OCRv6_medium_rec.ort`,charactersDictionary:`${xe}/recognition/ppocrv6_dict.txt`},Ga={detection:`${se}/detection/ort/PP-OCRv6_tiny_det.ort`,recognition:`${se}/recognition/ort/PP-OCRv6_tiny_rec.ort`,charactersDictionary:`${xe}/recognition/ppocrv6_tiny_dict.txt`},Ty={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.ort`,recognition:`${se}/recognition/multi/en/v5/en_PP-OCRv5_mobile_rec_infer.ort`,charactersDictionary:`${xe}/recognition/multi/en/v5/ppocrv5_en_dict.txt`},Sy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.ort`,recognition:`${se}/recognition/multi/en/v5/en_PP-OCRv5_mobile_rec_infer_int8.ort`,charactersDictionary:`${xe}/recognition/multi/en/v5/ppocrv5_en_dict.txt`},Iy={detection:`${se}/detection/PP-OCRv5_server_det_infer.onnx`,recognition:`${se}/recognition/PP-OCRv5_server_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/ppocrv5_dict.txt`},Ey={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/ppocrv5_dict.txt`},ky={detection:`${se}/detection/PP-OCRv5_server_det_infer.onnx`,recognition:`${se}/recognition/PP-OCRv5_server_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/ppocrv5_dict.txt`},Ay={detection:`${se}/detection/PP-OCRv4_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/en/v4/en_PP-OCRv4_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/en/v4/en_dict.txt`},zy={detection:`${se}/detection/PP-OCRv4_mobile_det_infer.onnx`,recognition:`${se}/recognition/PP-OCRv4_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/ppocrv4_dict.txt`},Oy={detection:`${se}/detection/PP-OCRv4_server_det_infer.onnx`,recognition:`${se}/recognition/PP-OCRv4_server_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/ppocrv4_dict.txt`},Ry={detection:`${se}/detection/PP-OCRv4_server_det_infer.onnx`,recognition:`${se}/recognition/PP-OCRv4_server_rec_doc_infer.onnx`,charactersDictionary:`${xe}/recognition/ppocrv4_doc_dict.txt`},My={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/PP-OCRv3_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/ppocrv3_dict.txt`},Dy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/japan/v3/japan_PP-OCRv3_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/japan/v3/japan_dict.txt`},By={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/arabic/v5/arabic_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/arabic/v5/ppocrv5_arabic_dict.txt`},Ny={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/cyrillic/v5/cyrillic_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/cyrillic/v5/ppocrv5_cyrillic_dict.txt`},Py={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/devanagari/v5/devanagari_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/devanagari/v5/ppocrv5_devanagari_dict.txt`},Ly={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/el/v5/el_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/el/v5/ppocrv5_el_dict.txt`},Uy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/eslav/v5/eslav_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/eslav/v5/ppocrv5_eslav_dict.txt`},Wy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/korean/v5/korean_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/korean/v5/ppocrv5_korean_dict.txt`},Vy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/latin/v5/latin_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/latin/v5/ppocrv5_latin_dict.txt`},qy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/ta/v5/ta_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/ta/v5/ppocrv5_ta_dict.txt`},Fy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/te/v5/te_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/te/v5/ppocrv5_te_dict.txt`},Gy={detection:`${se}/detection/PP-OCRv5_mobile_det_infer.onnx`,recognition:`${se}/recognition/multi/th/v5/th_PP-OCRv5_mobile_rec_infer.onnx`,charactersDictionary:`${xe}/recognition/multi/th/v5/ppocrv5_th_dict.txt`},Vf=Ga,Tt=Vf;var St={verbose:!1,debug:!1,debugFolder:"out"},br={mean:[.485,.456,.406],stdDeviation:[.229,.224,.225],maxSideLength:"auto",minimumAreaThreshold:20,paddingVertical:.4,paddingHorizontal:.6},Oi={imageHeight:48,strategy:"per-line",crossLineWidthFactor:1,minimumConfidence:.5,charactersDictionary:[],maxCropSourceSideLength:2e3,mainThreadYieldMs:0,recBatchSize:6,rotateVerticalCrops:!0,spaceRecovery:!1},qf=10,jy={executionProviders:["cpu"],graphOptimizationLevel:"all",enableCpuMemArena:!0,enableMemPattern:!0,executionMode:"sequential",interOpNumThreads:0,intraOpNumThreads:0},wr="opencv",Ff={engine:wr},Gf={enabled:!1},Ri={model:{},detection:br,recognition:Oi,debugging:St,session:jy,processing:Ff,unwarping:Gf};function vr(e,...t){if(!t.length)return e;let r=t.shift();if(ja(r)){for(let i in r)if(Object.prototype.hasOwnProperty.call(r,i)){if(i==="__proto__"||i==="constructor"||i==="prototype")continue;let n=r[i],a=e[i];ja(n)?((!a||!ja(a))&&(e[i]={}),vr(e[i],n)):n!==void 0&&(e[i]=n)}}return vr(e,...t)}var jf=6e4;function Hy(e,t){if(!e)return null;let r=e.trim();if(r==="")return null;let i=Number(r);if(Number.isFinite(i))return i<=0?0:Math.min(i*1e3,jf);let n=Date.parse(r);return Number.isNaN(n)?null:Math.min(Math.max(n-t,0),jf)}function Ky(e){let t=500*2**e;return t+Math.random()*t}async function Ha(e,t={}){let{timeoutMs:r=3e5,retries:i=2,fallbackUrl:n=Wf(e)}=t,a;for(let o=0;o<=i;o++){let u=null;try{let d=await fetch(e,{signal:AbortSignal.timeout(r),referrerPolicy:"no-referrer"});if(!d.ok)throw u=Hy(d.headers.get("retry-after"),Date.now()),new Error(`HTTP ${d.status} ${d.statusText}`);return await d.arrayBuffer()}catch(d){a=d,o<i&&await new Promise(c=>setTimeout(c,u??Ky(o)))}}let s=new Error(`Failed to fetch ${e} after ${i+1} attempt(s): ${String(a)}`);if(!n)throw s;console.warn(`[ppu-paddle-ocr] ${s.message}
  retrying on ${n}`);try{return await Ha(n,{timeoutMs:r,retries:i,fallbackUrl:null})}catch(o){throw new Error(`${s.message}; mirror also failed: ${String(o)}`,{cause:s})}}function Mi(e){return(typeof e=="string"?e:new TextDecoder("utf-8").decode(e)).split(/\r?\n/)}function ja(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)&&!(e instanceof Date)&&!(e instanceof RegExp)&&!(e instanceof ArrayBuffer)&&!ArrayBuffer.isView(e)}function Hf(e,t){return e!=="auto"?e:Math.min(1920,Math.max(960,Math.round(t*.75/32)*32))}function ri(e,t,r){let i=e,n=t,a=1;return Math.max(n,i)>r&&(a=r/(n>i?n:i),i=Math.round(i*a),n=Math.round(n*a)),{width:i,height:n,ratio:a}}function Yy(e,t,r,i,n){let a=Math.round(e.height*i),s=Math.round(e.height*n),o=e.x-s,u=e.y-a;o=Math.max(0,o),u=Math.max(0,u);let d=Math.min(t,e.x+e.width+s),c=Math.min(r,e.y+e.height+a),h=d-o,m=c-u;return{x:o,y:u,width:h,height:m}}function Xy(e,t,r,i){let n=e.x/t,a=e.y/t,s=e.width/t,o=e.height/t,u=Math.max(0,Math.round(n)),d=Math.max(0,Math.round(a)),c=Math.min(r-u,Math.round(s)),h=Math.min(i-d,Math.round(o));return{x:u,y:d,width:c,height:h}}function Kf(e,t,r,i,n,a,s,o,u){let d=[];return e.iterate(c=>{try{let h=e.getRect(c);if(h.width*h.height<=s)return;let m=Yy(h,t,r,o,u),_=Xy(m,i,n,a);_.width>5&&_.height>5&&d.push(_)}finally{c.delete()}}),d}function Yf(e,t,r){let i=[];for(let n of e){let{bbox:a}=n,s={x:Math.max(0,a.x0),y:Math.max(0,a.y0),width:a.x1-a.x0,height:a.y1-a.y0};s.x+s.width>t&&(s.width=t-s.x),s.y+s.height>r&&(s.height=r-s.y),s.width>5&&s.height>5&&i.push(s)}return i}var Zy=3;function Xf(e,t,r,i,n){let o=e.getContext("2d").getImageData(0,0,t,r).data,u=r*t,d=new Float32Array(Zy*u),c=i[0]??.485,h=i[1]??.456,m=i[2]??.406,_=n[0]??.229,g=n[1]??.224,w=n[2]??.225,x=1/(255*_),$=1/(255*g),b=1/(255*w),C=c/_,T=h/g,I=m/w,E=u,k=u*2;for(let z=0,M=0;z<u;z++,M+=4){let W=o[M],j=o[M+1],H=o[M+2];d[z]=W*x-C,d[E+z]=j*$-T,d[k+z]=H*b-I}return d}function Ka(e,t,r,i){let n=i(t,r),a=n.getContext("2d"),s=a.createImageData(t,r),o=s.data,u=t*r;for(let d=0;d<u;d++){let c=e[d]||0,h=Math.round(c*255),m=d*4;o[m]=h,o[m+1]=h,o[m+2]=h,o[m+3]=255}return a.putImageData(s,0,0),n}var ni=class{options;debugging;session;platform;engine;lastDetectionCanvas=null;constructor(t,r,i={},n={},a="opencv"){this.platform=t,this.session=r,this.options={...br,...i},this.debugging={...St,...n},a==="opencv"&&!this.platform.imageProcessor?this.engine="canvas-native":this.engine=a}log(t){this.debugging.verbose&&console.log(`[DetectionService] ${t}`)}async run(t){this.log("Starting text detection process");try{let r;this.platform.isCanvas(t)?r=t:this.engine==="opencv"&&this.platform.imageProcessor?r=await this.platform.imageProcessor.prepareCanvas(t):r=await this.platform.canvas.prepareCanvas(t);let i=await this.preprocessDetection(r),n=await this.runInference(i.tensor,i.width,i.height);if(!n)return console.error("Text detection failed (output tensor is null)"),[];let a=this.postprocessDetection(n,i);if(this.debugging.debug&&this.debugging.debugFolder&&this.lastDetectionCanvas)try{await this.debugDetectionCanvas(this.lastDetectionCanvas,i.width,i.height),await this.debugDetectedBoxes(r,a)}catch(s){this.log(`Debug dump failed: ${s instanceof Error?s.message:String(s)}`)}return this.log(`Detected ${a.length} text boxes in image`),a}catch(r){return console.error("Error during text detection:",r instanceof Error?r.message:String(r)),[]}}async preprocessDetection(t){let{width:r,height:i}=t,n=Hf(this.options.maxSideLength??"auto",Math.max(r,i)),{width:a,height:s,ratio:o}=ri(r,i,n),u=Math.ceil(a/32)*32,d=Math.ceil(s/32)*32,c=this.platform.createCanvas(u,d);c.getContext("2d").drawImage(t,0,0,r,i,0,0,a,s);let m=this.options.mean??[.485,.456,.406],_=this.options.stdDeviation??[.229,.224,.225],g=Xf(c,u,d,m,_);return this.log(`Detection preprocessed: original(${r}x${i}), model_input(${u}x${d}), resize_ratio: ${o.toFixed(4)}, engine: ${this.engine}`),{tensor:g,width:u,height:d,resizeRatio:o,originalWidth:r,originalHeight:i}}async runInference(t,r,i){let n;try{this.log("Running detection inference..."),n=new this.platform.ort.Tensor("float32",t,[1,3,i,r]);let a={x:n},o=(await this.session.run(a))[this.session.outputNames[0]||"sigmoid_0.tmp_0"];return this.log("Detection inference complete!"),o?o.data:(console.error(`Output tensor ${this.session.outputNames[0]} not found in detection results`),null)}catch(a){throw console.error("Error during model inference:",a instanceof Error?a.message:String(a)),a}finally{n?.dispose()}}postprocessDetection(t,r,i=this.options.minimumAreaThreshold??50,n=this.options.paddingVertical||.4,a=this.options.paddingHorizontal||.6){this.log("Post-processing detection results...");let{width:s,height:o,resizeRatio:u,originalWidth:d,originalHeight:c}=r;if(this.engine==="opencv"&&this.platform.imageProcessor)return this.lastDetectionCanvas=this.debugging.debug&&this.debugging.debugFolder?Ka(t,s,o,this.platform.createCanvas.bind(this.platform)):null,this.postprocessWithOpenCV(t,s,o,u,d,c,i,n,a);let h=Ka(t,s,o,this.platform.createCanvas.bind(this.platform));return this.lastDetectionCanvas=h,this.postprocessWithCanvasNative(h,u,d,c,i,n,a)}postprocessWithOpenCV(t,r,i,n,a,s,o,u,d){let c=this.platform.imageProcessor,h=new c.cv.Mat(i,r,c.cv.CV_8UC1),m=h.data,_=r*i;for(let w=0;w<_;w++){let x=t[w]||0;m[w]=Math.round(Math.min(Math.max(x,0),1)*255)}let g=new c.ImageProcessor(h);try{let w=new c.Contours(g.toMat(),{mode:c.cv.RETR_LIST,method:c.cv.CHAIN_APPROX_SIMPLE});try{let x=Kf(w,r,i,n,a,s,o,u,d);return this.log(`Found ${x.length} potential text boxes (opencv)`),x}finally{w.destroy()}}finally{g.destroy()}}postprocessWithCanvasNative(t,r,i,n,a,s,o){let d=this.platform.canvas.createProcessor(t).grayscale().threshold({thresh:0}).findRegions({foreground:"light",minArea:a,thresh:0,padding:{vertical:s,horizontal:o},scale:1/r}),c=Yf(d,i,n);return this.log(`Found ${c.length} potential text boxes (canvas-native)`),c}async debugDetectionCanvas(t,r,i){let n=this.debugging.debugFolder??"";await this.platform.saveDebugImage(t,"detection-debug",n),this.log(`Probability map visualized and saved to: ${n}`)}async debugDetectedBoxes(t,r){let i=this.platform.isCanvas(t)?t:await this.platform.canvas.prepareCanvas(t),n=this.platform.createCanvas(i.width,i.height),a=n.getContext("2d");a.drawImage(i,0,0);for(let o of r){let{x:u,y:d,width:c,height:h}=o;this.platform.canvas.getToolkit().drawLine({ctx:a,x:u,y:d,width:c,height:h})}let s=this.debugging.debugFolder??"";await this.platform.saveDebugImage(n,"boxes-debug",s),this.log(`Boxes visualized and saved to: ${s}`)}};function Zf(e){return e.reason instanceof Error?e.reason:new DOMException("The batch operation was aborted.","AbortError")}function Qy(e){if(Symbol.asyncIterator in e)return e[Symbol.asyncIterator]();let t=e[Symbol.iterator]();return{next:()=>Promise.resolve(t.next()),return:r=>Promise.resolve(t.return?.(r)??{done:!0,value:void 0})}}async function Ya(e,t,r,i){let{settle:n,signal:a}=t,s=Math.max(1,Math.floor(t.concurrency));if(a?.aborted)throw Zf(a);let o=0,u=0,d=!1,c=!1,h,m=Array.isArray(e)?e:null,_=m?null:Qy(e),g=Promise.resolve(),w=async()=>{let b=g,C;g=new Promise(T=>{C=T}),await b;try{return await _.next()}finally{C()}},x=()=>{d=!0};a?.addEventListener("abort",x,{once:!0});let $=async()=>{for(;!d;){let b,C;if(m){if(o>=m.length)return;C=o++,b=m[C]}else{let T=await w();if(T.done||d)return;C=o++,b=T.value}try{let T=await r(b,C);if(d)return;i({index:C,status:"fulfilled",value:T})}catch(T){if(n)i({index:C,status:"rejected",reason:T});else{d=!0,c=!0,h=T;return}}finally{u++,t.onProgress?.(u,t.total)}}};try{await Promise.all(Array.from({length:s},()=>$()))}finally{a?.removeEventListener("abort",x),await _?.return?.()}if(a?.aborted)throw Zf(a);if(c)throw h}function Qf(){let e=[],t=null,r=!1,i=null,n=()=>{let a=t;t=null,a?.()};return{push(a){e.push(a),n()},close(){r=!0,n()},fail(a){i={error:a},r=!0,n()},async*drain(){for(;;){for(;e.length>0;)yield e.shift();if(i)throw i.error;if(r)return;await new Promise(a=>{t=a})}}}}var Jy=4;function Xa(e,t){return typeof e=="number"&&e>0?Math.floor(e):(t??[]).some(i=>{let n=(typeof i=="string"?i:i.name).toLowerCase();return n!=="cpu"&&n!=="wasm"})?1:Jy}async function Jf(e,t,r,i){let n=e.canvas.getToolkit(),a=[];for(let[s,o]of r.entries()){let u=n.crop({bbox:{x0:o.x,y0:o.y,x1:o.x+o.width,y1:o.y+o.height},canvas:t});if(i.saveCropsTo&&e.saveImage){let d=`crop_${String(s).padStart(3,"0")}.png`;await e.saveImage(u,[i.saveCropsTo,d].join(e.pathSeparator))}i.crop&&a.push(await e0(u))}return a}async function e0(e){let t=e;if(typeof t.toBuffer=="function"){let r=t.toBuffer("image/png");return r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength)}if(typeof t.convertToBlob=="function")return(await t.convertToBlob({type:"image/png"})).arrayBuffer();if(typeof t.toBlob=="function"){let r=t.toBlob.bind(t);return(await new Promise((n,a)=>r(s=>s?n(s):a(new Error("Canvas toBlob() returned null")),"image/png"))).arrayBuffer()}throw new Error("Canvas cannot be encoded to a PNG buffer on this platform")}async function em(e,t){let r=typeof t=="string"?await e.loadResource(t,t):t,i=Mi(new TextDecoder("utf-8").decode(r));if(i.length===0)throw new Error("Custom character dictionary is empty or could not be loaded.");return i}function im(e){if(e.length===0)return{text:"",results:[],confidence:0};let t=e.map(i=>i.text).join(" "),r=e.reduce((i,n)=>i+n.confidence,0)/e.length;return{text:t,results:e,confidence:r}}function rm(e){if(e.length===0)return{text:"",lines:[],confidence:0};let t=[],r=[],i=e[0];if(!i)return{text:"",lines:[],confidence:0};let n=i.box.y,a=i.box.height;for(let d of e){let{box:c}=d;Math.abs(c.y-n)<a/2?(r.push(d),a=(a*(r.length-1)+c.height)/r.length):(r.sort((h,m)=>h.box.x-m.box.x),t.push(r),r=[d],n=c.y,a=c.height)}r.length>0&&(r.sort((d,c)=>d.box.x-c.box.x),t.push(r));let s=t.map(d=>d.map(c=>c.text).join(" ")).join(`
`),o=t.reduce((d,c)=>d+c.reduce((h,m)=>h+m.confidence,0),0),u=t.reduce((d,c)=>d+c.length,0);return{text:s,lines:t,confidence:u>0?o/u:0}}function Za(e){if(e.length===0)return[];let t=[...e].sort((o,u)=>o.box.y-u.box.y||o.box.x-u.box.x),r=[],i=t[0];if(!i)return[];let n=[i],a=i.box.height,s=i.box.height;for(let o=1;o<t.length;o++){let u=t[o],d=t[o-1];if(!u||!d)continue;let c=Math.abs(u.box.y-d.box.y),h=s*.5;c<=h?(n.push(u),a+=u.box.height,s=a/n.length):(n.sort((m,_)=>m.box.x-_.box.x),r.push(n),n=[u],a=u.box.height,s=u.box.height)}return n.length>0&&(n.sort((o,u)=>o.box.x-u.box.x),r.push(n)),r}var t0=4,tm=16384;function Qa(e,t,r,i){let n=Math.min(...t.map(b=>b.box.x)),a=Math.min(...t.map(b=>b.box.y)),s=Math.max(...t.map(b=>b.box.x+b.box.width)),o=Math.max(...t.map(b=>b.box.y+b.box.height)),u={x:n,y:a,width:s-n,height:o-a},d=o-a,c=Math.max(1,Math.round(d*.4)),h=t.map(({box:b})=>Math.max(1,Math.round(b.width*Math.min(d/b.height,t0)))),m=h.reduce((b,C)=>b+C,0)+c*(t.length-1);if(m>tm){let b=tm/m;h=h.map(C=>Math.max(1,Math.round(C*b))),c=Math.max(1,Math.floor(c*b))}let _=h.reduce((b,C)=>b+C,0)+c*(t.length-1),g=r(_,d),w=g.getContext("2d");w.fillStyle="white",w.fillRect(0,0,_,d);let x=0,$=[];for(let b=0;b<t.length;b++){let C=t[b],T=h[b];if(!C||T===void 0)continue;let{box:I}=C,E=i.getToolkit().crop({bbox:{x0:I.x,y0:I.y,x1:I.x+I.width,y1:I.y+I.height},canvas:e});w.drawImage(E,0,0,I.width,I.height,x,0,T,d);let k=b<t.length-1?c:0;$.push(T+k),x+=T+k}return{mergedCanvas:g,mergedBox:u,cropWidths:$}}function Ja(e,t,r){let i=[...e];if(t.length!==i.length||r.length===0)return r0(e,r);let n=r.reduce((u,d)=>u+d,0),a=r.map(()=>""),s=0,o=(r[0]??0)/n;for(let u=0;u<i.length;u++){let d=t[u]??0;for(;d>=o&&s<r.length-1;)s++,o+=(r[s]??0)/n;a[s]+=i[u]??""}return a}var i0=4;function r0(e,t){if(t.length===1)return[e];let r=t.reduce((o,u)=>o+u,0),i=[...e],n=i.length>0?r/i.length:0,a=[],s=0;for(let o=0;o<t.length;o++){if(o===t.length-1){a.push(i.slice(s).join(""));break}let u=Math.min(s+Math.round((t[o]??0)/n),i.length),d=u,c=!1;for(let h=0;h<=i0&&!c;h++)for(let m of[u-h,u+h]){let _=i[m];if(m>s&&m<i.length&&_!==void 0&&/\s/.test(_)){d=m,c=!0;break}}a.push(i.slice(s,d).join("")),s=c?d+1:d}return a}function nm(e,t,r,i){let n=[...e].sort((o,u)=>t(u)-t(o)),a=[],s=[];for(let o of n){let u=!1;for(let d=0;d<a.length;d++){let c=a[d],h=s[d];if(c===void 0||h===void 0)continue;let m=i*c.length;if(h+m+t(o)<=r){c.push(o),s[d]=h+t(o),u=!0;break}}u||(a.push([o]),s.push(t(o)))}return a}var Di=class{cache=new Map;maxSize;constructor(t=10){this.maxSize=t}get(t){let r=this.cache.get(t);if(r!==void 0)return this.cache.delete(t),this.cache.set(t,r),r}set(t,r){if(this.cache.has(t))this.cache.delete(t);else if(this.cache.size>=this.maxSize){let i=this.cache.keys().next().value;i!==void 0&&this.cache.delete(i)}this.cache.set(t,r)}clear(){this.cache.clear()}static generateKey(t){let r=new Uint8Array(t);if(r.length===0)return"0_0";let i=Math.min(r.length,n0),n=r.length-1,a=0;for(let s=0;s<i;s++){let o=i===1?0:Math.round(s*n/(i-1));a=(a<<5)-a+(r[o]??0),a=a&a}return`${a}_${r.length}`}},n0=4096,am=new WeakMap,a0=1;function Bi(e){if(!e)return"none";let t=am.get(e);return t===void 0&&(t=a0++,am.set(e,t)),String(t)}var es=new Di;function ts(e){return!!(e?.noCache||e?.dictionary||e?.strategy!==void 0||e?.minimumConfidence!==void 0||e?.spaceRecovery!==void 0||e?.rotateVerticalCrops!==void 0||e?.recBatchSize!==void 0)}var s0="Invalid image string format. Must be an HTTP URL, an absolute path, ArrayBuffer, or Canvas";async function sm(e,t){if(!t.startsWith("http")&&!t.startsWith("/"))throw new Error(s0);return e.loadResource(t,t)}async function om(e,t){if(typeof t=="string")return sm(e,t);if(t instanceof ArrayBuffer)return t;if(typeof t.toBuffer=="function"){let o=t.toBuffer("image/png");return o.buffer.slice(o.byteOffset,o.byteOffset+o.byteLength)}let r=t,a=r.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,r.width,r.height).data;return a.buffer.slice(a.byteOffset,a.byteOffset+a.byteLength)}async function is(e,t){return typeof t=="string"?e.canvas.prepareCanvas(await sm(e,t)):t instanceof ArrayBuffer?e.canvas.prepareCanvas(t):t}var o0=.2,lm=.02;function dm(e,t){let[r,i,n,a]=t;if(t.length!==4||r!==1||i!==2||n===void 0||a===void 0||n<2||a<2)throw new Error(`Unwarping model returned shape [${t.join(", ")}], expected [1, 2, rows, columns]. The model must output the deformation grid, not a corrected image.`);let s=n*a,o=new Float32Array(s),u=new Float32Array(s);for(let d=0;d<s;d++)o[d]=(e[d]+1)/2,u[d]=(e[s+d]+1)/2;return{columns:a,rows:n,x:o,y:u}}function rs(e,t,r){let{columns:i,rows:n,x:a,y:s}=e,o=t*(i-1),u=r*(n-1),d=Math.min(i-2,Math.max(0,Math.floor(o))),c=Math.min(n-2,Math.max(0,Math.floor(u))),h=o-d,m=u-c,_=c*i+d,g=_+i,w=x=>(x[_]*(1-h)+x[_+1]*h)*(1-m)+(x[g]*(1-h)+x[g+1]*h)*m;return{x:w(a),y:w(s)}}function ns(e,t){let{columns:r,rows:i,x:n,y:a}=e,s=t.width-1,o=t.height-1,u=new Float64Array(i);for(let c=0;c<i;c++){let h=0;for(let m=1;m<r;m++){let _=c*r+m;h+=Math.hypot((n[_]-n[_-1])*s,(a[_]-a[_-1])*o)}u[c]=h}let d=new Float64Array(r);for(let c=0;c<r;c++){let h=0;for(let m=1;m<i;m++){let _=m*r+c;h+=Math.hypot((n[_]-n[_-r])*s,(a[_]-a[_-r])*o)}d[c]=h}return{width:Math.max(1,Math.round(um(u))+1),height:Math.max(1,Math.round(um(d))+1)}}function as(e){return l0(e)?"folded":u0(e)>o0?"out-of-frame":null}function ss(e,t){let{columns:r,rows:i,x:n,y:a}=e,s=t.width-1,o=t.height-1,u=0,d=0;for(let c=0;c<i;c++)for(let h=0;h<r;h++){let m=c*r+h;if(h>0){let _=Math.atan2((a[m]-a[m-1])*o,(n[m]-n[m-1])*s);u+=_*_,d++}if(c>0){let _=Math.atan2((n[m]-n[m-r])*s,(a[m]-a[m-r])*o);u+=_*_,d++}}return Math.sqrt(u/d)*180/Math.PI}function pm(e,t){let r=t.x.length,i=new Float32Array(r),n=new Float32Array(r);for(let a=0;a<r;a++){let s=rs(e,t.x[a],t.y[a]);i[a]=s.x,n[a]=s.y}return{columns:t.columns,rows:t.rows,x:i,y:n}}function l0(e){let{columns:t,rows:r,x:i,y:n}=e,a=(s,o,u)=>(i[o]-i[s])*(n[u]-n[s])-(n[o]-n[s])*(i[u]-i[s]);for(let s=0;s<r-1;s++)for(let o=0;o<t-1;o++){let u=s*t+o,d=u+1,c=u+t,h=c+1;if(a(u,d,c)<=0||a(h,c,d)<=0)return!0}return!1}function u0(e){let{x:t,y:r}=e,i=-lm,n=1+lm,a=0;for(let s=0;s<t.length;s++)(t[s]<i||t[s]>n||r[s]<i||r[s]>n)&&a++;return a/t.length}function um(e){let t=Float64Array.from(e).sort(),r=t.length>>1;return t.length%2===1?t[r]:(t[r-1]+t[r])/2}var Ht=488,Kt=712,d0=3;function os(e,t,r){let i=Ht*Kt,n=new Float32Array(d0*i),a=Ht>1?(t-1)/(Ht-1):0,s=Kt>1?(r-1)/(Kt-1):0,o=t-1,u=r-1,d=i,c=i*2,h=1/255;for(let m=0,_=0;m<Kt;m++){let g=m*s,w=Math.min(u,Math.floor(g)),x=Math.min(u,w+1),$=g-w,b=w*t*4,C=x*t*4;for(let T=0;T<Ht;T++,_++){let I=T*a,E=Math.min(o,Math.floor(I)),k=Math.min(o,E+1),z=I-E,M=(1-z)*(1-$)*h,W=z*(1-$)*h,j=(1-z)*$*h,H=z*$*h,F=b+E*4,U=b+k*4,K=C+E*4,Z=C+k*4;n[_]=e[F+2]*M+e[U+2]*W+e[K+2]*j+e[Z+2]*H,n[d+_]=e[F+1]*M+e[U+1]*W+e[K+1]*j+e[Z+1]*H,n[c+_]=e[F]*M+e[U]*W+e[K]*j+e[Z]*H}}return n}function cm(e,t,r){let i=t.width-1,n=t.height-1,a=[],s=[],o=[];for(let d=0;d<r.x.length;d++){let c=Math.round(r.x[d]*i),h=Math.round(r.y[d]*n);if(c<0||h<0||c>i||h>n)continue;let m=(h*t.width+c)*4;a.push(e[m]),s.push(e[m+1]),o.push(e[m+2])}if(a.length===0)return[255,255,255];let u=d=>d.sort((c,h)=>c-h)[d.length>>1];return[u(a),u(s),u(o)]}function ls(e,t,r,i,n){let{columns:a,rows:s,x:o,y:u}=r,{width:d,height:c}=t,{width:h,height:m}=i,_=new Uint8ClampedArray(h*m*4),g=new Uint32Array(_.buffer);_[0]=n[0],_[1]=n[1],_[2]=n[2],_[3]=255;let w=g[0],x=d-1,$=c-1,b=d*4,C=new Float64Array(a),T=new Float64Array(a),I=new Int32Array(a),E=h>1?(a-1)/(h-1):0;for(let z=1;z<a;z++)I[z]=z===a-1||E===0?h:Math.min(h,Math.ceil(z/E-1e-9));let k=m>1?(s-1)/(m-1):0;for(let z=0;z<m;z++){let M=z*k,W=Math.min(s-2,Math.floor(M)),j=M-W,H=W*a,F=H+a;for(let K=0;K<a;K++)C[K]=(o[H+K]*(1-j)+o[F+K]*j)*x,T[K]=(u[H+K]*(1-j)+u[F+K]*j)*$;let U=z*h;for(let K=0;K<a-1;K++){let Z=I[K],Y=I[K+1];if(Z>=Y)continue;let ae=(C[K+1]-C[K])*E,X=(T[K+1]-T[K])*E,me=Z*E-K,P=C[K]+(C[K+1]-C[K])*me,q=T[K]+(T[K+1]-T[K])*me;for(let ie=Z;ie<Y;ie++,P+=ae,q+=X){if(P<0||q<0||P>x||q>$){g[U+ie]=w;continue}let pe=P|0,N=q|0,ue=P-pe,Me=q-N,ge=N*b+pe*4,ve=pe<x?ge+4:ge,Ee=N<$?ge+b:ge,Ae=pe<x?Ee+4:Ee,ct=(1-ue)*(1-Me),Et=ue*(1-Me),rt=(1-ue)*Me,nt=ue*Me,kt=(U+ie)*4;_[kt]=e[ge]*ct+e[ve]*Et+e[Ee]*rt+e[Ae]*nt,_[kt+1]=e[ge+1]*ct+e[ve+1]*Et+e[Ee+1]*rt+e[Ae+1]*nt,_[kt+2]=e[ge+2]*ct+e[ve+2]*Et+e[Ee+2]*rt+e[Ae+2]*nt,_[kt+3]=255}}}return _}var ds=class{grid;page;source;constructor(t,r,i){this.grid=t,this.page=r,this.source=i}pointToSource(t,r){let i=this.page.width>1?t/(this.page.width-1):0,n=this.page.height>1?r/(this.page.height-1):0,a=rs(this.grid,i,n);return{x:a.x*(this.source.width-1),y:a.y*(this.source.height-1)}}itemsToSource(t){return t.map(r=>({...r,box:this.boxToSource(r.box)}))}boxToSource(t){let r=Number.POSITIVE_INFINITY,i=Number.POSITIVE_INFINITY,n=Number.NEGATIVE_INFINITY,a=Number.NEGATIVE_INFINITY;for(let[u,d]of h0){let c=this.pointToSource(t.x+t.width*u,t.y+t.height*d);c.x<r&&(r=c.x),c.x>n&&(n=c.x),c.y<i&&(i=c.y),c.y>a&&(a=c.y)}let s=Math.max(0,Math.floor(r+$r)),o=Math.max(0,Math.floor(i+$r));return{x:s,y:o,width:Math.max(0,Math.min(this.source.width,Math.ceil(n-$r))-s),height:Math.max(0,Math.min(this.source.height,Math.ceil(a-$r))-o)}}},xr=class{platform;session;debugging;constructor(t,r,i={}){this.platform=t,this.session=r,this.debugging={...St,...i}}log(t){this.debugging.verbose&&console.log(`[UnwarpingService] ${t}`)}async run(t,r){let i={width:t.width,height:t.height},n=this.buildWorkCanvas(t,r),a={width:n.width,height:n.height},s=n.getContext("2d").getImageData(0,0,n.width,n.height).data,o=await this.predictGrid(os(s,a.width,a.height)),u=as(o);if(u)return this.skipped(t,u);let d=ss(o,a);if(d<p0)return this.skipped(t,"flat");let c=cm(s,a,o),h=ls(s,a,o,us,c),m=await this.predictGrid(os(h,us.width,us.height)),_=ss(m,ns(o,a));if(this.log(`Distortion ${d.toFixed(2)} deg, ${_.toFixed(2)} deg after one step`),_>c0*d)return this.skipped(t,"no-gain");let g=pm(o,m),w=as(g)===null?g:o,x=ns(w,a),$=ls(s,a,w,x,c),b=this.platform.createCanvas(x.width,x.height),C=b.getContext("2d"),T=C.createImageData(x.width,x.height);if(T.data.set($),C.putImageData(T,0,0),this.log(`Unwarped ${i.width}x${i.height} photo to ${x.width}x${x.height} page`),this.debugging.debug&&this.debugging.debugFolder)try{await this.platform.saveDebugImage(b,"unwarped-debug",this.debugging.debugFolder)}catch(I){this.log(`Debug dump failed: ${I instanceof Error?I.message:String(I)}`)}return{status:"unwarped",canvas:b,mapping:new ds(w,x,i)}}skipped(t,r){return this.log(`Skipped: ${r}`),{status:"skipped",reason:r,canvas:t}}buildWorkCanvas(t,r){if(r===void 0)return t;let{width:i,height:n,ratio:a}=ri(t.width,t.height,r);if(a===1)return t;let s=this.platform.createCanvas(i,n);return s.getContext("2d").drawImage(t,0,0,t.width,t.height,0,0,i,n),s}async predictGrid(t){let r=this.session.inputNames[0],i=this.session.outputNames[0];if(r===void 0||i===void 0)throw new Error("Unwarping model declares no input or no output.");let n=new this.platform.ort.Tensor("float32",t,[1,3,Kt,Ht]);try{let s=(await this.session.run({[r]:n}))[i];if(!s||!(s.data instanceof Float32Array))throw new Error(`Unwarping model output "${i}" is missing or not float32.`);let o=dm(s.data,s.dims);return s.dispose(),o}finally{n.dispose()}}},p0=1,c0=.95,$r=.001,us={width:Ht,height:Kt},h0=[[0,0],[.5,0],[1,0],[1,.5],[1,1],[.5,1],[0,1],[0,.5]];var Cr=class{options=Ri;detectionSession=null;recognitionSession=null;detector=null;recognitor=null;unwarpingSession=null;unwarper=null;platform;constructor(t,r){this.platform=t,this.options=vr({},Ri,r),this.options.session=this.options.session||Ri.session}log(t){this.options.debugging?.verbose&&console.log(`[PaddleOcrService:Base] ${t}`)}isInitialized(){return this.detectionSession!==null&&this.recognitionSession!==null&&(!this.options.unwarping?.enabled||this.unwarpingSession!==null)}async destroy(){await this.detectionSession?.release(),await this.recognitionSession?.release(),await this.unwarpingSession?.release(),this.detectionSession=null,this.recognitionSession=null,this.unwarpingSession=null,this.detector=null,this.recognitor=null,this.unwarper=null}async initializeUnwarping(t,r){if(!this.options.unwarping?.enabled)return;let i=await t(this.options.model?.unwarping,Fa);this.unwarpingSession=await r(new Uint8Array(i)),this.unwarper=new xr(this.platform,this.unwarpingSession,this.options.debugging),this.log(`Unwarping ONNX model loaded successfully
	input: ${this.unwarpingSession.inputNames}
	output: ${this.unwarpingSession.outputNames}`)}async unwarp(t){return this.requireUnwarper().run(await is(this.platform,t))}requireUnwarper(){if(!this.unwarper)throw new Error("Unwarping is not available on this service. Construct it with `unwarping: { enabled: true }` and call initialize().");return this.unwarper}async runUnwarping(t,r){return this.wantsUnwarping(r)?this.requireUnwarper().run(t,this.options.recognition?.maxCropSourceSideLength):null}wantsUnwarping(t){return t??this.options.unwarping?.enabled??!1}cacheKeyFor(t,r){return[Di.generateKey(t),Bi(this.detectionSession),Bi(this.recognitionSession),Bi(this.options.recognition?.charactersDictionary),r?Bi(this.unwarpingSession):"plain"].join("|")}async recognize(t,r){(!this.detector||!this.recognitor)&&await this.initSessions();try{let i=await om(this.platform,t),n=this.cacheKeyFor(i,this.wantsUnwarping(r?.unwarp));if(!ts(r)){let $=es.get(n);if($)return this.log("Using cached OCR result"),r?.flatten?{text:$.text,results:$.lines.flat(),confidence:$.confidence}:$}let a=typeof t=="string"||t instanceof ArrayBuffer?await this.platform.canvas.prepareCanvas(i):t,s=await this.runUnwarping(a,r?.unwarp),o=s?s.canvas:a,u=await this.detector.run(o);if(u.length===0)return r?.flatten?{text:"",results:[],confidence:0}:{text:"",lines:[],confidence:0};let d=r?.dictionary?await em(this.platform,r.dictionary):this.options.recognition?.charactersDictionary,c=r?.strategy??this.options.recognition?.strategy??"per-line",h=await this.recognitor.run(o,u,d,c,r),m=s?.status==="unwarped"?s.mapping:null,_=rm(h),g=$=>m?m.itemsToSource($):$,w={..._,lines:_.lines.map(g)};if(ts(r)||es.set(n,w),!r?.flatten)return w;let x=im(h);return{...x,results:g(x.results)}}catch(i){if(this.options.debugging?.verbose){let n=i instanceof Error?i:new Error(String(i));console.error("recognize: error",n.message,n.stack)}throw i}}async detect(t,r){this.detector||await this.initSessions();let{crop:i,saveCropsTo:n,unwarp:a,...s}=r??{},o=Object.keys(s).length>0?new ni(this.platform,this.detectionSession,{...this.options.detection,...s},this.options.debugging,this.options.processing?.engine??wr):this.detector,u=await is(this.platform,t),d=await this.runUnwarping(u,a),c=d?d.canvas:u,h=d?.status==="unwarped"?d.mapping:null,m=(await o.run(c)).filter(w=>w.width>0&&w.height>0),_=h?m.map(w=>h.boxToSource(w)):m;if(!i&&!n)return{boxes:_};let g=await Jf(this.platform,c,m,{crop:i,saveCropsTo:n});return i?{boxes:_,crops:g}:{boxes:_}}async batchRecognize(t,r){let i=r?.settle??!1,n=[];return await Ya(t,{concurrency:Xa(r?.concurrency,this.options.session?.executionProviders),settle:i,signal:r?.signal,onProgress:r?.onProgress,total:Array.isArray(t)?t.length:void 0},a=>this.recognize(a,r),a=>{n[a.index]=a}),i?n:n.map(a=>a.status==="fulfilled"?a.value:void 0)}async*batchRecognizeStream(t,r){let i=Qf(),n=(async()=>{try{await Ya(t,{concurrency:Xa(r?.concurrency,this.options.session?.executionProviders),settle:r?.settle??!1,signal:r?.signal,onProgress:r?.onProgress,total:Array.isArray(t)?t.length:void 0},a=>this.recognize(a,r),a=>i.push(a)),i.close()}catch(a){i.fail(a)}})();yield*i.drain(),await n}};var hm=new Set(["cpu","wasm"]);function f0(e){return typeof e=="string"?e:e.name}async function fm(e,t,r,i,n){let{onSessionFallback:a,...s}=r??{};try{return await e.InferenceSession.create(t,s)}catch(o){let d=(s.executionProviders??[]).map(f0);if(d.every(x=>hm.has(x))||d.length===0)throw o;let m=d.find(x=>hm.has(x))??(d.includes("wasm")?"wasm":"cpu"),_=o instanceof Error?o.message:String(o);i(`executionProviders=${JSON.stringify(d)} failed (${_}); falling back to ["${m}"].`);let g={...s,executionProviders:[m]};n?.({...g,onSessionFallback:a});let w=await e.InferenceSession.create(t,g);return a?.(o),w}}var ps=null;function cs(e){ps=e}function Ne(){if(!ps)throw new Error('No canvas platform registered. Import "ppu-ocv" (Node), "ppu-ocv/web" (browser), "ppu-ocv/canvas" (Node canvas-only), "ppu-ocv/canvas-web" (browser canvas-only), or "ppu-ocv/canvas-mobile" (React Native / Skia) to auto-register.');return ps}function mm(e){return typeof e=="object"&&e!==null&&typeof e.getContext=="function"&&typeof e.width=="number"&&typeof e.height=="number"}var Tr={createCanvas(e,t){if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(e,t);if(typeof document<"u"){let r=document.createElement("canvas");return r.width=e,r.height=t,r}throw new Error("No canvas implementation available in this environment.")},async loadImage(e){let t;if(e instanceof ArrayBuffer)t=new Blob([e]);else if(typeof e=="string")t=await(await fetch(e)).blob();else throw new Error("loadImage: unsupported source type");let r=await createImageBitmap(t),i=Tr.createCanvas(r.width,r.height);return i.getContext("2d").drawImage(r,0,0),r.close(),i},isCanvas(e){return typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof OffscreenCanvas<"u"&&e instanceof OffscreenCanvas}};var ai=class e{static _baseInstance=null;step=0;constructor(){}static getInstance(){return e._baseInstance||(e._baseInstance=new e),e._baseInstance}crop(t){let{bbox:r,canvas:i}=t,n=Ne().createCanvas(r.x1-r.x0,r.y1-r.y0);return n.getContext("2d").drawImage(i,r.x0,r.y0,r.x1-r.x0,r.y1-r.y0,0,0,n.width,n.height),n}isDirty(t){let{canvas:r,threshold:i=127.5,majorColorThreshold:n=.97}=t,a=0,s=0,o=this.crop({bbox:{x0:r.width*.1,y0:r.height*.1,x1:r.width*.9,y1:r.height*.9},canvas:r}),d=o.getContext("2d").getImageData(0,0,o.width,o.height).data;for(let h=0;h<d.length;h+=4){let m=d[h],_=d[h+1],g=d[h+2];m>=i&&_>=i&&g>=i?a++:s++}return Math.max(a,s)/(s+a)<n}drawLine(t){let{ctx:r,x:i,y:n,width:a,height:s,lineWidth:o=2,color:u="blue"}=t;r.beginPath(),r.strokeStyle=u,r.lineWidth=o,r.strokeRect(i,n,a,s),r.closePath()}drawContour(t){let{ctx:r,contour:i,strokeStyle:n="red",lineWidth:a=2}=t,s=i.data32S;if(!(s.length<4)){r.strokeStyle=n,r.lineWidth=a,r.beginPath(),r.moveTo(s[0]??0,s[1]??0);for(let o=2;o<s.length;o+=2)r.lineTo(s[o]??0,s[o+1]??0);r.closePath(),r.stroke()}}};async function gm(e){return mm(e)?e:Ne().loadImage(e)}async function _m(e){if(e instanceof ArrayBuffer)return e;if(typeof e.toBuffer=="function"){let a=e.toBuffer("image/png"),s=new ArrayBuffer(a.byteLength);return new Uint8Array(s).set(new Uint8Array(a)),s}let t=e.toBlob;if(typeof t=="function")return(await new Promise((s,o)=>{t.call(e,u=>u?s(u):o(new Error("toBlob returned null")),"image/png")})).arrayBuffer();if(typeof e.convertToBlob=="function")return(await e.convertToBlob({type:"image/png"})).arrayBuffer();if(typeof e.toDataURL=="function"){let s=e.toDataURL("image/png").replace(/^data:image\/png;base64,/,""),o=atob(s),u=new ArrayBuffer(o.length),d=new Uint8Array(u);for(let c=0;c<o.length;c++)d[c]=o.charCodeAt(c);return u}let i=e.getContext("2d").getImageData(0,0,e.width,e.height),n=new ArrayBuffer(i.data.byteLength);return new Uint8Array(n).set(new Uint8Array(i.data.buffer,i.data.byteOffset,i.data.byteLength)),n}function ym(e,t,r,i={}){let{foreground:n="light",thresh:a=127,minArea:s=1,maxArea:o=1/0,padding:u,scale:d=1}=i,c=new Uint8Array(t*r),h=[],m=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],_=g=>{let w=e[g]??0;return n==="light"?w>a:w<=a};for(let g=0;g<r;g++)for(let w=0;w<t;w++){let x=g*t+w;if(c[x]||(c[x]=1,!_(x*4)))continue;let $=[x],b=w,C=w,T=g,I=g,E=0;for(;$.length>0;){let k=$.pop();if(k===void 0)break;E++;let z=k%t,M=(k-z)/t;z<b?b=z:z>C&&(C=z),M<T?T=M:M>I&&(I=M);for(let[W,j]of m){let H=z+W,F=M+j;if(H<0||H>=t||F<0||F>=r)continue;let U=F*t+H;c[U]||(c[U]=1,_(U*4)&&$.push(U))}}if(E>=s&&E<=o){let k=b,z=T,M=C+1,W=I+1;if(u){let j=W-z,H=Math.round(j*(u.vertical??0)),F=Math.round(j*(u.horizontal??0));k=Math.max(0,k-F),z=Math.max(0,z-H),M=Math.min(t,M+F),W=Math.min(r,W+H)}d!==1&&(k=Math.max(0,Math.round(k*d)),z=Math.max(0,Math.round(z*d)),M=Math.round(M*d),W=Math.round(W*d)),h.push({bbox:{x0:k,y0:z,x1:M,y1:W},area:E})}}return h}var si=class{_canvas;constructor(t){this._canvas=t}get width(){return this._canvas.width}get height(){return this._canvas.height}resize(t){let{width:r,height:i}=t,n=Ne().createCanvas(r,i);return n.getContext("2d").drawImage(this._canvas,0,0,r,i),this._canvas=n,this}grayscale(){let{width:t,height:r}=this._canvas,i=this._canvas.getContext("2d").getImageData(0,0,t,r),n=i.data;for(let s=0;s<n.length;s+=4){let o=Math.round(.299*(n[s]??0)+.587*(n[s+1]??0)+.114*(n[s+2]??0));n[s]=o,n[s+1]=o,n[s+2]=o}let a=Ne().createCanvas(t,r);return a.getContext("2d").putImageData(i,0,0),this._canvas=a,this}convert(t={}){let{alpha:r=1,beta:i=0}=t;if(r===1&&i===0)return this;let{width:n,height:a}=this._canvas,s=this._canvas.getContext("2d").getImageData(0,0,n,a),o=s.data;for(let d=0;d<o.length;d+=4)o[d]=Math.round((o[d]??0)*r+i),o[d+1]=Math.round((o[d+1]??0)*r+i),o[d+2]=Math.round((o[d+2]??0)*r+i);let u=Ne().createCanvas(n,a);return u.getContext("2d").putImageData(s,0,0),this._canvas=u,this}invert(){let{width:t,height:r}=this._canvas,i=this._canvas.getContext("2d").getImageData(0,0,t,r),n=i.data;for(let s=0;s<n.length;s+=4)n[s]=255-(n[s]??0),n[s+1]=255-(n[s+1]??0),n[s+2]=255-(n[s+2]??0);let a=Ne().createCanvas(t,r);return a.getContext("2d").putImageData(i,0,0),this._canvas=a,this}threshold(t={}){let{thresh:r=127,maxValue:i=255}=t,{width:n,height:a}=this._canvas,s=this._canvas.getContext("2d").getImageData(0,0,n,a),o=s.data;for(let d=0;d<o.length;d+=4){let h=(o[d]===o[d+1]&&o[d+1]===o[d+2]?o[d]??0:Math.round(.299*(o[d]??0)+.587*(o[d+1]??0)+.114*(o[d+2]??0)))>r?i:0;o[d]=h,o[d+1]=h,o[d+2]=h}let u=Ne().createCanvas(n,a);return u.getContext("2d").putImageData(s,0,0),this._canvas=u,this}border(t={}){let{size:r=10,color:i="white"}=t,{width:n,height:a}=this._canvas,s=Ne().createCanvas(n+r*2,a+r*2),o=s.getContext("2d");return o.fillStyle=i,o.fillRect(0,0,s.width,s.height),o.drawImage(this._canvas,r,r),this._canvas=s,this}rotate(t){let{angle:r,cx:i=this._canvas.width/2,cy:n=this._canvas.height/2}=t;if(r===0)return this;let{width:a,height:s}=this._canvas,o=Ne().createCanvas(a,s),u=o.getContext("2d");return u.save(),u.translate(i,n),u.rotate(-r*Math.PI/180),u.drawImage(this._canvas,-i,-n),u.restore(),this._canvas=o,this}findRegions(t={}){let{width:r,height:i}=this._canvas,n=this._canvas.getContext("2d").getImageData(0,0,r,i).data;return ym(n,r,i,t)}toCanvas(){return this._canvas}static async prepareCanvas(t){return gm(t)}static async prepareBuffer(t){return _m(t)}};cs(Tr);var It=class{pathSeparator="/";ort=ii;createCanvas(t,r){let i=Ne().createCanvas(t,r);return i.getContext.bind(i)("2d",{willReadFrequently:!0}),i}isCanvas(t){return!!t&&typeof t.getContext=="function"}async loadResource(t,r){if(t instanceof ArrayBuffer)return t;let i=typeof t=="string"?t:r,n=await fetch(i,{referrerPolicy:"no-referrer"});if(!n.ok)throw new Error(`Failed to fetch resource from ${i}`);return n.arrayBuffer()}async saveDebugImage(t,r,i){return Promise.resolve()}canvas={prepareCanvas:t=>si.prepareCanvas(t),createProcessor:t=>new si(t),getToolkit:()=>ai.getInstance()}};function m0(){return`https://cdn.jsdelivr.net/npm/onnxruntime-web@${fe.versions.web??fe.versions.common}/dist/`}function Sr(){return typeof globalThis.WorkerGlobalScope=="function"}function g0(){!(typeof window<"u"||Sr())||fe.wasm.wasmPaths||(fe.wasm.wasmPaths=m0())}g0();async function bm(){if(typeof navigator>"u")return!1;let e=navigator;if(!e.gpu||typeof e.gpu.requestAdapter!="function")return!1;try{let t=await e.gpu.requestAdapter();return t!=null}catch{return!1}}async function hs(){return await bm()?["webgpu","wasm"]:["wasm"]}var oi=class extends ni{constructor(t,r={},i={}){super(new It,t,r,i,"canvas-native")}};var _0=0,y0="<unk>",Ni=8,b0=1.5,w0=2.5;function wm(e){return/\p{L}/u.test(e)?0:/\p{N}/u.test(e)?1:2}function v0(e,t){if(e.length<4)return;let r=[];for(let s=1;s<t.length;s++)r.push((t[s]??0)-(t[s-1]??0));let i=[...r].sort((s,o)=>s-o),n=i[Math.floor(i.length/2)]??0;if(n<=0)return;let a=i.find(s=>s>0)??0;if(!(a<=0))for(let s=e.length-1;s>=1;s--){let o=t[s-1]??0,u=t[s]??0,d=wm(e[s]??"")===wm(e[s-1]??"")?w0:b0;u-o>n+d*a&&e[s]!==" "&&e[s-1]!==" "&&e[s]!==e[s-1]&&(e.splice(s,0," "),t.splice(s,0,(o+u)/2))}}var $0=65248,x0=/[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;function C0(e,t){for(let r=e.length-1;r>=1;r--)e[r]===" "&&e[r-1]===" "&&(e.splice(r,1),t.splice(r,1));if(!x0.test(e.join("")))for(let r=0;r<e.length;r++){let i=e[r]?.codePointAt(0)??0;i>=65281&&i<=65374?e[r]=String.fromCodePoint(i-$0):i===12288&&(e[r]=" ")}}function vm(e,t,r,i,n=!1){let a=i.length,s=a-1,o=[],u=-1,d=0,c=0,h=[];for(let _=0;_<t;_++){let g=_*r,w=e[g],x=0;for(let $=1;$<r;$++){let b=e[g+$];b>w&&(w=b,x=$)}if(x===_0||x===u){u=x;continue}if(x>=0&&x<a){n&&x!==s&&(e[g+s]??0)>.001&&o[o.length-1]!==" "&&(o.push(" "),h.push((_+.5)/t));let $=i[x]??"";x===s?$!==y0&&(o.push(" "),d+=w,c++,h.push((_+.5)/t)):(o.push($),d+=w,c++,h.push((_+.5)/t))}u=x}v0(o,h),C0(o,h);let m=c>0?d/c:0;return{text:o.join(""),confidence:m,positions:h}}function T0(e){let t=e.length;for(;t>0&&e[t-1]==="";)t--;return e.slice(0,t)}function $m(e,t){if(e.length===t)return e;let r=T0(e);if(r.length===t)return r;let i=["",...r[0]===""?r.slice(1):r];return i.length===t-1&&i.push(""),i}function xm(e,t,r,i=!1,n=!1){let a=e.data,s=e.dims,o=s[1],u=s[2]??r;if(!t)return{text:"",confidence:0,positions:[]};let d=$m(t,u);return d.length!==u&&i&&console.warn(`Warning: Model output classes (${u}) does not match dictionary length (${t.length}).
 Consider using our model & dictionary catalogue at https://github.com/PT-Perkasa-Pilar-Utama/ppu-paddle-ocr-models.`),vm(a,o,u,d,n)}function Cm(e,t,r,i,n=!1){let a=$m(i,r);return vm(e,t,r,a,n)}async function Ir(e,t,r,i){let n=e.width,a=e.height;if(a===0||n===0)throw new Error(`Crop dimensions are zero: ${n}x${a}`);let s=n/a,o=Math.max(Ni,Math.round(t*s));if(r){let c=new r.ImageProcessor(e);try{c.resize({width:o,height:t});let h=c.toMat();return h.isContinuous()&&(h.channels()===4||h.channels()===1)?{imageTensor:I0(h,o,t),tensorWidth:o,tensorHeight:t}:{imageTensor:Tm(c.toCanvas(),o,t),tensorWidth:o,tensorHeight:t}}finally{c.destroy()}}let u=i(e).resize({width:o,height:t});return{imageTensor:S0(u,o,t),tensorWidth:o,tensorHeight:t}}function S0(e,t,r){let i=e.toCanvas();return Tm(i,t,r)}function Tm(e,t,r){let a=e.getContext("2d").getImageData(0,0,t,r).data,s=r*t,o=new Float32Array(3*s),u=1/127.5;for(let d=0,c=0;d<s;d++,c+=4)o[d]=(a[c]??0)*u-1;return o.copyWithin(s,0,s),o.copyWithin(s*2,0,s),o}function I0(e,t,r){let i=e.channels(),n=e.data,a=r*t,s=new Float32Array(3*a),o=1/127.5;for(let u=0,d=0;u<a;u++,d+=i)s[u]=n[d]*o-1;return s.copyWithin(a,0,a),s.copyWithin(a*2,0,a),s}async function Pi(e,t,r){let i=t.options.imageHeight??48,n=Math.max(1,t.options.recBatchSize??6),a=r??t.options.charactersDictionary??[],s=t.options.spaceRecovery??!1,o=t.engine==="opencv"?t.platform.imageProcessor:void 0,u=await Promise.all(e.map(h=>Ir(h,i,o,t.platform.canvas.createProcessor.bind(t.platform.canvas)))),d=u.map((h,m)=>m).sort((h,m)=>{let _=u[h]?.tensorWidth??0,g=u[m]?.tensorWidth??0;return _-g}),c=Array.from({length:e.length});for(let h=0;h<d.length;h+=n){let m=d.slice(h,h+n),_=Math.max(...m.map($=>u[$]?.tensorWidth??1)),g=i*_,w=new Float32Array(m.length*3*g);m.forEach(($,b)=>{let C=u[$];if(!C)return;let T=b*3*g;for(let I=0;I<3;I++)for(let E=0;E<i;E++){let k=(I*i+E)*C.tensorWidth,z=T+(I*i+E)*_;w.set(C.imageTensor.subarray(k,k+C.tensorWidth),z);let M=C.imageTensor[k+C.tensorWidth-1]??0;w.fill(M,z+C.tensorWidth,z+_)}});let x;try{x=new t.platform.ort.Tensor("float32",w,[m.length,3,i,_]);let $=await t.runInference(x),[,b,C]=$.dims,T=$.data,I=(b??0)*(C??0);m.forEach((E,k)=>{let z=(u[E]?.tensorWidth??_)/_,M=Math.max(1,Math.min(b??0,Math.ceil((b??0)*z)));c[E]=Cm(T.subarray(k*I,k*I+M*(C??0)),M,C??0,a,s)})}finally{x?.dispose()}}return c}function Sm(e){let r=e.inputMetadata?.[0]?.shape?.[0];return typeof r!="number"||r<0}function kr(e,t){if(!(t.options.rotateVerticalCrops??!0)||e.height/e.width<1.5)return e;let r=t.platform.createCanvas(e.height,e.width),i=r.getContext("2d");return i.translate(0,e.width),i.rotate(-Math.PI/2),i.drawImage(e,0,0),r}function Li(e,t,r){return r.getToolkit().crop({bbox:{x0:t.x,y0:t.y,x1:t.x+t.width,y1:t.y+t.height},canvas:e})}async function E0(e,t,r){let i=t.options.imageHeight??48,n=t.engine==="opencv"?t.platform.imageProcessor:void 0,{imageTensor:a,tensorWidth:s,tensorHeight:o}=await Ir(e,i,n,t.platform.canvas.createProcessor.bind(t.platform.canvas)),u;try{u=new t.platform.ort.Tensor("float32",a,[1,3,o,s]);let d=await t.runInference(u),c=r??t.options.charactersDictionary??[];return xm(d,c,s,t.debugging.verbose)}finally{u?.dispose()}}function Er(e){return[...e].sort((t,r)=>Math.abs(t.box.y-r.box.y)<(t.box.height+r.box.height)/4?t.box.x-r.box.x:t.box.y-r.box.y)}async function Im(e,t,r,i,n){let a=r.debugging.debugFolder?`${r.debugging.debugFolder}${r.platform.pathSeparator}crops`:"";if(r.debugging.debug&&a){let o=r.platform.canvas.getToolkit();"clearOutput"in o&&typeof o.clearOutput=="function"&&o.clearOutput(a)}if(!r.debugging.debug){let o=t.map(({box:c})=>kr(Li(e,c,r.platform.canvas),r)),u=await Pi(o,r,n),d=t.map(({box:c},h)=>({text:u[h]?.text??"",box:c,confidence:u[h]?.confidence??0}));return Er(d)}let s=[];for(let{box:o,index:u}of t){let d=await i(e,o,u,t.length,a,n);d!==null&&s.push(d)}return Er(s)}async function Em(e,t,r,i){let n=Za(t),a=[],s=[];for(let d of n){let c=d[0];if(c)if(d.length===1)s.push(kr(Li(e,c.box,r.platform.canvas),r)),a.push({lineBoxes:d,cropWidths:null});else{let{mergedCanvas:h,cropWidths:m}=Qa(e,d,r.platform.createCanvas.bind(r.platform),r.platform.canvas);s.push(h),a.push({lineBoxes:d,cropWidths:m})}}let o=await Pi(s,r,i),u=[];return a.forEach((d,c)=>{let h=o[c];if(h)if(d.cropWidths===null){let m=d.lineBoxes[0];m&&u.push({text:h.text,box:m.box,confidence:h.confidence})}else{let m=Ja(h.text,h.positions,d.cropWidths);for(let _=0;_<d.lineBoxes.length;_++){let g=d.lineBoxes[_];g&&u.push({text:(m[_]??"").trim(),box:g.box,confidence:h.confidence})}}}),Er(u)}async function km(e,t,r,i){let n=Za(t),a=r.options.imageHeight??48,s=20,o=[];for(let g of n)if(g.length===1){let w=g[0];if(!w)continue;let x=Li(e,w.box,r.platform.canvas);o.push({canvas:x,boxes:g,cropWidths:[x.width]})}else{let{mergedCanvas:w,cropWidths:x}=Qa(e,g,r.platform.createCanvas.bind(r.platform),r.platform.canvas);o.push({canvas:w,boxes:g,cropWidths:x})}let u=o.map(({canvas:g,boxes:w,cropWidths:x},$)=>{let b=g.width/g.height,C=Math.max(Ni,Math.round(a*b));return{canvas:g,boxes:w,cropWidths:x,resizedWidth:C,originalHeight:g.height,index:$}}),d=Math.max(...u.map(g=>g.resizedWidth)),c=r.options.crossLineWidthFactor??1.5,h=Math.round(d*c),m=nm(u,g=>g.resizedWidth,h,s),_=[];for(let g of m){let w=[...g].sort((F,U)=>F.index-U.index),x=Math.max(...w.map(F=>F.originalHeight)),$=w.map(F=>{if(F.originalHeight>=x)return F.resizedWidth;let U=x/F.originalHeight;return Math.max(Ni,Math.round(F.resizedWidth*U))}),C=$.reduce((F,U)=>F+U,0)+s*(w.length-1),T=r.platform.createCanvas(C,a),I=T.getContext("2d");I.fillStyle="white",I.fillRect(0,0,C,a);let E=0;for(let F=0;F<w.length;F++){let U=w[F],K=$[F];U===void 0||K===void 0||(I.drawImage(U.canvas,0,0,U.canvas.width,U.canvas.height,E,0,K,a),E+=K,F<w.length-1&&(E+=s))}let{text:k,confidence:z,positions:M}=await E0(T,r,i),W=[],j=[];for(let F=0;F<w.length;F++){let U=w[F],K=$[F];if(!U||K===void 0)continue;let Z=K/U.canvas.width;for(let Y=0;Y<U.boxes.length;Y++){let ae=U.boxes[Y];if(!ae)continue;let X=(U.cropWidths[Y]??0)*Z;Y===U.boxes.length-1&&F<w.length-1&&(X+=s),W.push(X),j.push(ae)}}let H=Ja(k,M,W);for(let F=0;F<j.length;F++){let U=j[F];U&&_.push({text:(H[F]??"").trim(),box:U.box,confidence:z})}}return Er(_)}var Ar=class{options;debugging;session;platform;engine;constructor(t,r,i={},n={},a="opencv"){this.platform=t,this.session=r,this.options={...Oi,...i},this.debugging={...St,...n},a==="opencv"&&!this.platform.imageProcessor?this.engine="canvas-native":this.engine=a}log(t){this.debugging.verbose&&console.log(`[RecognitionService] ${t}`)}async run(t,r,i,n="per-line",a){this.log("Starting text recognition process");try{let s;this.platform.isCanvas(t)?s=t:this.engine==="opencv"&&this.platform.imageProcessor?s=await this.platform.imageProcessor.prepareCanvas(t):s=await this.platform.canvas.prepareCanvas(t);let o=this.filterValidBoxes(r);if(o.length===0)return[];let{canvas:u,ratio:d}=this.buildCropCanvas(s),c=d===1?o:o.map(g=>({...g,box:zm(g.box,d)})),h=this.buildContext(a),m;switch(n){case"cross-line":m=await km(u,c,h,i);break;case"per-line":m=await Em(u,c,h,i);break;default:m=await Im(u,c,h,(g,w,x,$,b,C)=>this.processBox(g,w,x,$,b,h,C),i)}d!==1&&(m=m.map(g=>({...g,box:zm(g.box,1/d)})));let _=a?.minimumConfidence??this.options.minimumConfidence??Oi.minimumConfidence??Am;return _>Am?m.filter(g=>{let w=/[\p{L}\p{N}]/u.test(g.text)?_:Math.min(k0,_+z0);return g.confidence>=w}):m}catch(s){return console.error("Error during text recognition:",s instanceof Error?s.message:String(s)),[]}}buildContext(t){let r={...this.options,...t?.spaceRecovery!==void 0?{spaceRecovery:t.spaceRecovery}:{},...t?.rotateVerticalCrops!==void 0?{rotateVerticalCrops:t.rotateVerticalCrops}:{},...t?.recBatchSize!==void 0?{recBatchSize:t.recBatchSize}:{}};return{platform:this.platform,options:Sm(this.session)?r:{...r,recBatchSize:A0},debugging:this.debugging,engine:this.engine,runInference:i=>this.runInference(i)}}filterValidBoxes(t){return t.map((r,i)=>({box:r,index:i})).filter(({box:r,index:i})=>this.isValidBox(r,i))}buildCropCanvas(t){let{width:r,height:i}=t,n=this.options.maxCropSourceSideLength??2e3,{width:a,height:s,ratio:o}=ri(r,i,n);if(o===1)return{canvas:t,ratio:1};let u=this.platform.createCanvas(a,s);return u.getContext("2d").drawImage(t,0,0,r,i,0,0,a,s),{canvas:u,ratio:o}}async processBox(t,r,i,n,a,s,o){let u=Date.now();try{let d=kr(Li(t,r,this.platform.canvas),s),[c]=await Pi([d],s,o),h=c?.text??"",m=c?.confidence??0;if(this.debugging.debug&&a){await this.platform.saveDebugImage(d,`crop_${String(i).padStart(3,"0")}.png`,a);let _=Date.now()-u;this.log(`Box ${i+1}/${n}: [x:${r.x}, y:${r.y}, w:${r.width}, h:${r.height}]
	 -> "${h}" (processed in ${_}ms)
`)}return{text:h,box:r,confidence:m}}catch(d){let c=d instanceof Error?d:new Error(String(d));return console.error(`Error processing box ${i+1}: ${c.message}`,c.stack),null}}isValidBox(t,r){return t.width<=0||t.height<=0?(console.warn(`Skipping invalid box ${r+1}: w=${t.width}, h=${t.height}`),!1):!0}async runInference(t){let r=this.options.mainThreadYieldMs??0;r>0&&await new Promise(o=>setTimeout(o,r));let i={x:t},n=await this.session.run(i),a=Object.keys(n)[0],s=a?n[a]:void 0;if(!s)throw new Error(`Recognition output tensor '${a}' not found. Available keys: ${Object.keys(n)}`);return s}},Am=0,k0=1,A0=1,z0=.3;function zm(e,t){return{x:Math.round(e.x*t),y:Math.round(e.y*t),width:Math.max(1,Math.round(e.width*t)),height:Math.max(1,Math.round(e.height*t))}}function O0(e,t=typeof window<"u"&&!Sr()){return t?{mainThreadYieldMs:qf,...e}:e}var li=class extends Ar{constructor(t,r={},i={}){super(new It,t,O0(r),i,"canvas-native")}};var R0={graphOptimizationLevel:"all"},ui=class extends Cr{constructor(t){super(new It,t),(this.options.session===void 0||Object.keys(this.options.session).length===0)&&(this.options.session=R0)}async initSessions(){throw new Error("Initialization is handled proactively in PaddleOcrService. Call initialize() instead.")}async _loadResource(t,r){if(t instanceof ArrayBuffer)return this.log("Loading resource from ArrayBuffer"),t;let i=typeof t=="string"?t:r;return this.log(`Fetching resource from URL: ${i}`),Ha(i)}async _resolveSessionExecutionProviders(){let t=this.options.session??{};if(t.executionProviders&&t.executionProviders.length>0){this.log(`Using user-provided executionProviders: ${JSON.stringify(t.executionProviders)}`);return}let r=await hs();this.options.session={...t,executionProviders:r},this.log(`Resolved executionProviders: ${JSON.stringify(r)}`)}async _createSession(t){return fm(ii,t,this.options.session,r=>console.warn(`[PaddleOcrService] ${r}`),r=>this.options.session=r)}async initialize(){try{this.log("Initializing PaddleOcrService (Web)..."),await this._resolveSessionExecutionProviders();let[t,r,i]=await Promise.all([this._loadResource(this.options.model?.detection,Tt.detection),this._loadResource(this.options.model?.recognition,Tt.recognition),this._loadResource(this.options.model?.charactersDictionary,Tt.charactersDictionary)]),[n,a]=await Promise.all([this._createSession(new Uint8Array(t)),this._createSession(new Uint8Array(r)),this.initializeUnwarping((o,u)=>this._loadResource(o,u),o=>this._createSession(o))]);this.detectionSession=n,this.recognitionSession=a,this.options.model&&(this.options.model.detection=t),this.options.model&&(this.options.model.recognition=r),this.log(`Detection ONNX model loaded successfully
	input: ${n.inputNames}
	output: ${n.outputNames}`),this.log(`Recognition ONNX model loaded successfully
	input: ${a.inputNames}
	output: ${a.outputNames}`);let s=Mi(i);if(s.length===0)throw new Error("Character dictionary is empty or could not be loaded.");this.options.model&&(this.options.model.charactersDictionary=i),this.options.recognition&&(this.options.recognition.charactersDictionary=s),this.log(`Character dictionary loaded with ${s.length} entries.`),this.detector=new oi(n,this.options.detection,this.options.debugging),this.recognitor=new li(a,this.options.recognition,this.options.debugging),this.options.model&&(this.options.model.detection=void 0),this.options.model&&(this.options.model.recognition=void 0)}catch(t){throw console.error("Failed to initialize PaddleOcrService Web:",t),t}}async changeDetectionModel(t){this.log("Changing detection model...");let r=await this._loadResource(t,Tt.detection);await this.detectionSession?.release(),this.detectionSession=await this._createSession(new Uint8Array(r)),this.detector=new oi(this.detectionSession,this.options.detection,this.options.debugging),this.options.model&&(this.options.model.detection=r),this.log("Detection model changed successfully.")}async changeRecognitionModel(t){this.log("Changing recognition model...");let r=await this._loadResource(t,Tt.recognition);await this.recognitionSession?.release(),this.recognitionSession=await this._createSession(new Uint8Array(r)),this.recognitor=new li(this.recognitionSession,this.options.recognition,this.options.debugging),this.options.model&&(this.options.model.recognition=r),this.log("Recognition model changed successfully.")}async changeTextDictionary(t){this.log("Changing text dictionary...");let r=await this._loadResource(t,Tt.charactersDictionary),i=Mi(r);if(i.length===0)throw new Error("Character dictionary is empty or could not be loaded.");this.options.model&&(this.options.model.charactersDictionary=r),this.options.recognition&&(this.options.recognition.charactersDictionary=i),this.log(`Character dictionary changed successfully with ${i.length} entries.`)}async recognize(t,r){return super.recognize(t,r)}};function Jw(e){let t=typeof document<"u"&&document.baseURI||import.meta.url;fe.wasm.wasmPaths=new URL(e,t).href}var ev=ui;export{ui as PaddleOcrService,Ga as V6_TINY_MODEL,ev as default,ii as ort,Jw as setLocalWasmPaths};
/*! Bundled license information:

onnxruntime-web/dist/ort.bundle.min.mjs:
  (*!
   * ONNX Runtime Web v1.23.2
   * Copyright (c) Microsoft Corporation. All rights reserved.
   * Licensed under the MIT License.
   *)

onnxruntime-web/dist/ort.bundle.min.mjs:
  (**
   * @license
   * Copyright 2021 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
  (**
   * @license
   * Copyright 2020 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
  (**
   * @license
   * Copyright 2019 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
*/
