import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import 'fabric';
import { UtilService } from '../util.service';

declare const fabric: any;
@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit, AfterViewInit{


  compare(a:any,b:any) {

    // If length is not equal
    if (a.length != b.length)
        return "False";
    else {

        // Comparing each element of array
        for (let i = 0; i < a.length; i++)
            if (a[i] != b[i])
                return "False";
        return "True";
    }
  }


  canvas: any;
  toolType!: string;
  activeObjectType!: string;
  activeObject: any;
  activeObjectList: any;

  // Croping
  overlay:any;
  croppingWindow:any;

  // Editor properties
  screenReductionFactor:number = 180;
  aspectRatioList: number[] = [(6/6),(8/6),(7/5),(6/4)]

  // Global Scope Tool values
  globalFilterValues = {
    brightness:0,
    contrast:0,
    saturation:0,
    hue:0,
    noise:0,
    blur:0,
    pixelate:0,
    sharpen:false,
    emboss:false,
    grayscale:false,
    vintage:false,
    sepia:false,
    polaroid:false
  };

  // Tool default values
  defaultTextProps = {
    text:'Sample Text',
    color:'#7F7F7F',
    opacity:1,
    fontFamily:'Roboto',
    fontSize:24,
    fontWeight:'normal',
    fontStyle:'normal',
    underline:false,
    linethrough:false,
    textAlign:'left',
    lineHeight:1.6,
    charSpacing:0
  }

  // canvas size preperty
  size: any = {
    height: Math.round(window.innerHeight - this.screenReductionFactor),
    width: Math.round((window.innerHeight - this.screenReductionFactor) * this.aspectRatioList[3]),
  };

  // private json: any;
  // private selected: any;

  // ------------------------------- subscribtion ------------------------------
  // private windowResizeSubscription:Subscription;
  // private objectResizeSubscription:Subscription;
  addImageSubscription:Subscription;
  addImageFilterSubscription:Subscription;
  onUpdateTextSubscription:Subscription;
  onUpdateShapeMaskSubscription:Subscription;
  canvasCommandSubscription:Subscription;
  changeCanvasSizeSubscription:Subscription;
  @ViewChild('myCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  // ------------------------------- image --------------------------------------

  onSelectImage(imageObject: any):void{
    this.utilService.changeToolType('FILTER:SINGLE',this.getActiveFilter(imageObject));
  }

  addImageOnCanvas(url:string):void{
    if (url) {

      fabric.Image.fromURL(url, (image: any) => {
        let scaleXFactor = (this.size.width - 20)/image.width;
        let scaleYFactor = scaleXFactor;
        image.set({
          left: 10,
          top: 10,
          scaleX: scaleXFactor,
          scaleY: scaleYFactor,
          angle: 0,
          cornersize: 10,
          hasRotatingPoint: true
        });
        image.crossOrigin = 'Anonymous';

        image.setSrc(image.getSrc(), () => {

          this.extend(image, this.randomId());
          this.canvas.add(image);
          this.selectItemAfterAdded(image);

        },{crossOrigin: "anonymous"});
      });
    }
  }

  applyFilterOnSingle(filterProps:any):void{
    if(this.activeObjectType === 'image'){
      this.activeObject.filters = this.generateFilterArray(filterProps);

      this.activeObject.setSrc(this.activeObject.getSrc(), () => {
        console.log("changed");
        this.activeObject.applyFilters();
        this.canvas.renderAll();
      },{crossOrigin: "anonymous"});

    }
  }

  applyFilterOnAll(filterProps:any):void{
    this.globalFilterValues = filterProps;
    const globalFilter = this.generateFilterArray(filterProps);
    this.canvas.forEachObject((object: any)=>{
      if(object.type === 'image'){
        object.filters = globalFilter;
        object.setSrc(object.getSrc(), () => {
          console.log("changed");
          object.applyFilters();
          this.canvas.renderAll();
        },{crossOrigin: "anonymous"});

      }
    })
    this.canvas.renderAll();
  }

  // ------------------------------- image flip --------------------------------

  flipSelectedImage(){
    if(this.activeObjectType === 'image'){
      this.activeObject.setSrc(this.activeObject.getSrc(), () => {
        console.log("changed");
        this.activeObject.flipX = this.activeObject.flipX ? !this.activeObject.flipX : true;
        this.canvas.renderAll();
      },{crossOrigin: "anonymous"});
    }
    else{
      this.utilService.openSnackBar("No image selected",800);
    }
  }

  startCrop(){
    console.log('cropping started');
    this.cleanSelect();
    this.overlay = new fabric.Rect({
      left: 0,
      top: 0,
      fill: '#000000',
      opacity:0.5,
      width: this.size.width,
      height: this.size.height,
    });
    this.canvas.add(this.overlay);
    this.canvas.forEachObject((object:any)=>{
      object.selectable = false;
    })
    this.croppingWindow = new fabric.Rect({
      left: 100,
      top: 100,
      fill: 'transparent',
      borderColor:'#ffffff',
      cornerColor:'#ffffff',
      borderOpacityWhenMoving:1,
      hasRotatingPoint:false,
      padding:0,
      width: 200,
      height: 200,
    });
    this.canvas.add(this.croppingWindow);
    this.selectItemAfterAdded(this.croppingWindow);
    this.canvas.renderAll();
  }

  cropSelectedWindow() {
    if (!this.croppingWindow) {
      console.error('No cropping window');
      return;
    }

    // For each image object, set a clipPath based on cropping window
    this.canvas.forEachObject((object: any) => {
      if (object.type === 'image') {
        // Create clipRect with same size as cropping window (in canvas coords)
        const clipRect = new fabric.Rect({
          left: this.croppingWindow.left,
          top: this.croppingWindow.top,
          width: this.croppingWindow.getScaledWidth(),
          height: this.croppingWindow.getScaledHeight(),
          originX: 'left',
          originY: 'top',
          absolutePositioned: true // crucial: use canvas coordinates
        });

        // Attach clipPath to the image (absolutePositioned ensures clip rect uses canvas coordinates)
        object.set({
          clipPath: clipRect
        });

        // update coords and render
        object.setCoords();
        this.canvas.requestRenderAll();
      }
    });

    // Remove cropping UI
    this.stopCrop();
  }

  // cropSelectedWindow(){

  //   const width = this.croppingWindow.getScaledWidth()
  //   const height = this.croppingWindow.getScaledHeight()
  //   this.canvas.forEachObject(
  //     (object:any)=>{

  //       console.log(object.type);
  //       if(object.type === 'image'){
  //         const objectWidth = object.getScaledWidth();
  //         const objectHeight = object.getScaledHeight();

  //         const x = (objectWidth / 2) - (this.croppingWindow.left - object.left);
  //         const y = (objectHeight / 2) - (this.croppingWindow.top - object.top);

  //         object.clipTo = (ctx: any) => {
  //           ctx.rect(
  //             (object.flipX ? 1 : -1) * x,
  //             (object.flipY ? -1 : 1) * y,
  //             (object.flipX ? -1 : 1) * width * object.scaleX,
  //             height * object.scaleY
  //           );
  //         };
  //         this.canvas.add(object)
  //       }
  //     }
  //   )
  //   this.stopCrop();
  // }

  // cropSelectedWindow() {
  //   const activeObject = this.canvas.getActiveObject();

  //   if (activeObject) {
  //     const width = this.croppingWindow.getScaledWidth();
  //     const height = this.croppingWindow.getScaledHeight();

  //     const objectWidth = activeObject.getScaledWidth();
  //     const objectHeight = activeObject.getScaledHeight();

  //     const x = (objectWidth / 2) - (this.croppingWindow.left - activeObject.left);
  //     const y = (objectHeight / 2) - (this.croppingWindow.top - activeObject.top);

  //     // Create a rectangle to be used as a clip path
  //     const clipPathRect = new fabric.Rect({
  //       left: (activeObject.flipX ? 1 : -1) * x,
  //       top: (activeObject.flipY ? -1 : 1) * y,
  //       width: (activeObject.flipX ? -1 : 1) * width * activeObject.scaleX,
  //       height: height * activeObject.scaleY,
  //       originX: 'center',
  //       originY: 'center',
  //     });

  //     // Set the created rectangle as a clip path for the active object
  //     activeObject.set({
  //       clipPath: clipPathRect,
  //     });

  //     // Apply changes to the canvas
  //     activeObject.setCoords(); // Recalculate coordinates after clipPath change
  //     this.canvas.renderAll();

  //     this.stopCrop();
  //   } else {
  //     console.error('No active object on the canvas.');
  //   }
  // }

  stopCrop(){
    this.canvas.remove(this.overlay);
    this.canvas.remove(this.croppingWindow);
    this.canvas.forEachObject((object:any)=>{
      object.selectable = true;
    });
    this.canvas.renderAll();

    this.croppingWindow = undefined;
    this.overlay = undefined;
  }
  // ------------------------------- cropping -----------------------------------

  // startCrop(){
  //   console.log('cropping started');
  //   this.cleanSelect();
  //   this.overlay = new fabric.Rect({
  //     left: 0,
  //     top: 0,
  //     fill: '#000000',
  //     opacity:0.5,
  //     width: this.size.width,
  //     height: this.size.height,
  //   });
  //   this.canvas.add(this.overlay);
  //   this.canvas.forEachObject((object:any)=>{
  //     object.selectable = false;
  //   })
  //    this.croppingWindow = new fabric.Rect({
  //     left: 100,
  //     top: 100,
  //     fill: 'transparent',
  //     borderColor:'#ffffff',
  //     cornerColor:'#ffffff',
  //     borderOpacityWhenMoving:1,
  //     hasRotatingPoint:false,
  //     padding:0,
  //     width: 300,
  //     height: 300,
  //   });
  //   this.canvas.add(this.croppingWindow);
  //   this.selectItemAfterAdded(this.croppingWindow);
  //   this.canvas.renderAll();
  // }

  // cropSelectedWindow(){
  //   const width = this.croppingWindow.getScaledWidth()
  //   const height = this.croppingWindow.getScaledHeight()
  //   this.canvas.forEachObject(
  //     (object:any)=>{
  //       console.log(object.type);

  //       if(object.type === 'image'){
  //         console.log(object);

  //         const objectWidth = object.getScaledWidth(); //
  //         const objectHeight = object.getScaledHeight(); //
  //         let x = (objectWidth/2) - (this.croppingWindow.left - object.left);
  //         let y = (objectHeight/2) - (this.croppingWindow.top - object.top);
  //         x = x * (1/object.scaleX);
  //         y = y * (1/object.scaleY);

  //         object.clipTo = (ctx:any) =>{
  //           ctx.rect((object.flipX ? 1 : -1) * x, -y, (object.flipX ? -1 : 1) * width * (1/object.scaleX), height * (1/object.scaleY));
  //         }
  //       } else {
  //         console.log("Error on object type!!");

  //       }
  //     }
  //   )
  //   this.stopCrop();
  // }

  // stopCrop(){
  //   this.canvas.remove(this.overlay);
  //   this.canvas.remove(this.croppingWindow);
  //   this.canvas.forEachObject((object:any)=>{
  //     object.selectable = true;
  //   })
  //   this.canvas.renderAll();

  //   this.croppingWindow = undefined;
  //   this.overlay = undefined;
  // }

  // ------------------------------- image cloning ------------------------------

  clone() {
    if(this.activeObjectType==='image'){
      const clone = fabric.util.object.clone(this.activeObject);
      clone.set({ left: 10, top: 10 });
      this.activeObject.setSrc(this.activeObject.getSrc(), () => {
        console.log("changed");
        this.canvas.add(clone);
        this.selectItemAfterAdded(clone);
      },{crossOrigin: "anonymous"});

    }
    else{
      this.utilService.openSnackBar('No image selected',800);
    }
  }

  // ------------------------------- text -------------------------------------

  onSelectText(textObject: any):void{
    this.utilService.changeToolType(this.toolType,{
      fontFamily:textObject['fontFamily'],
      fontSize:textObject['fontSize'],
      fontWeight:textObject['fontWeight'],
      fontStyle:textObject['fontStyle'],
      color:textObject['fill'],
      opacity:textObject['opacity'],
      underline:textObject['underline'],
      linethrough:textObject['linethrough'],
      textAlign:textObject['textAlign'],
      lineHeight:textObject['lineHeight'],
      charSpacing:textObject['charSpacing']
    });
  }

  onSelectTextEditing(textObject: any):void{
    if(textObject.isEditing){
      const startIndex = textObject.selectionStart;
      const endIndex = textObject.selectionEnd;
      if(startIndex!==endIndex){
        this.utilService.changeToolType(this.toolType,textObject.getSelectionStyles()[0]);
      }
      else{
        this.utilService.changeToolType(this.toolType,{
          isSelectionInactive:true
        });
      }
    }
  }

  onAddText():void {
    const textObject = new fabric.IText(this.defaultTextProps['text'], {
      left: 10,
      top: 10,
      angle: 0,
      fontFamily: this.defaultTextProps['fontFamily'],
      fontSize:this.defaultTextProps['fontSize'],
      fontWeight: this.defaultTextProps['fontWeight'],
      fontStyle: this.defaultTextProps['fontStyle'],
      fill: this.defaultTextProps['color'],
      opacity : this.defaultTextProps['opacity'],
      underline: this.defaultTextProps['underline'],
      linethrough: this.defaultTextProps['linethrough'],
      textAlign: this.defaultTextProps['textAlign'],
      hasRotatingPoint: true,
      lockScalingX:true,
      lockScalingY:true,
    });
    this.extend(textObject, this.randomId());
    this.canvas.add(textObject);
    this.selectItemAfterAdded(textObject);
  }

  onUpdateText(textProps: any):void{
    if(this.activeObjectType==='i-text'){
      this.activeObject.set('fontFamily',textProps.fontFamily);
      this.activeObject.set('fontSize',textProps.fontSize);
      this.activeObject.set('fontWeight',textProps.fontWeight);
      this.activeObject.set('fontStyle', textProps.fontStyle);
      this.activeObject.set('fill',textProps.color);
      this.activeObject.set('opacity',textProps.opacity);
      this.activeObject.set('underline',textProps.underline);
      this.activeObject.set('linethrough',textProps.linethrough);
      this.activeObject.set('textAlign',textProps.textAlign);
      this.activeObject.set('lineHeight',textProps.lineHeight);
      this.activeObject.set('charSpacing',textProps.charSpacing);
    }
    this.canvas.renderAll();
  }

  onUpdateTextEditing(textProps: any):void{
    if(this.activeObjectType==='i-text'){
      if( this.activeObject.isEditing ){
        this.activeObject.setSelectionStyles(textProps);
      }
    }
    this.canvas.renderAll();
  }

  // ------------------------------- shape mask -------------------------------

  addShapeMask(shapeMaskProps: any){
    let shapeToAdd;
    switch (shapeMaskProps.shape) {
      case 'RECTANGLE':
        shapeToAdd = new fabric.Rect({
          top: 25,
          left: 25,
          height: 100,
          width: 100,
          fill: shapeMaskProps.color,
          opacity: shapeMaskProps.opacity
        });
        break;
      case 'TRIANGLE':
        shapeToAdd = new fabric.Triangle({
          top: 25,
          left: 25,
          height: 100,
          width: 100,
          fill: shapeMaskProps.color,
          opacity: shapeMaskProps.opacity
        });
        break;
      case 'CIRCLE':
        shapeToAdd = new fabric.Circle({
          top: 25,
          left: 25,
          radius: 50,
          fill: shapeMaskProps.color,
          opacity: shapeMaskProps.opacity
        });
        break;
      default:
        break;
    }

    shapeToAdd.set("shadow",new fabric.Shadow({
      color: `rgba(0,0,0,${shapeMaskProps.shadowAmount})`,
      blur: shapeMaskProps.shadowBlur,
      offsetX: shapeMaskProps.shadowOffsetX,
      offsetY: shapeMaskProps.shadowOffsetY
    }));
    this.canvas.add(shapeToAdd);
    this.selectItemAfterAdded(shapeToAdd);
  }

  onSelectShapeMask(){
    if(this.activeObject){
      console.log(this.activeObject.shadow);
      this.utilService.changeToolType('SHAPE_MASK',{
        color: this.activeObject.fill,
        opacity: this.activeObject.opacity,
        shadowAmount: this.activeObject.shadow.color.split(',')[3].split(')')[0],
        shadowBlur: this.activeObject.shadow.blur,
        shadowOffsetX: this.activeObject.shadow.offsetX,
        shadowOffsetY: this.activeObject.shadow.offsetY
      });
    }
  }

  onUpdateShapeMask(shapeMaskProps: any){
    if(this.activeObject && this.activeObjectType === 'shape-mask'){
      this.activeObject.set('fill',shapeMaskProps.color);
      this.activeObject.set('opacity',shapeMaskProps.opacity);
      this.activeObject.set("shadow",new fabric.Shadow({
        color: `rgba(0,0,0,${shapeMaskProps.shadowAmount})`,
        blur: shapeMaskProps.shadowBlur,
        offsetX: shapeMaskProps.shadowOffsetX,
        offsetY: shapeMaskProps.shadowOffsetY
      }));
      this.canvas.renderAll();
    }
  }

  // ------------------------------- Pen --------------------------------------

  startPenMode(){
    this.canvas.isDrawingMode = true;
    this.canvas.forEachObject((object: any)=>{
      // keep the drawing objects selectable
      object.selectable = false;
    })
    this.cleanSelect();
    this.utilService.changeToolType('PEN',{});
  }

  stopPenMode(){
    this.canvas.isDrawingMode = false;
  }

  // ------------------------------- utility ----------------------------------

  getActiveFilter(imageObject: any){
    let activeFilter = {
      brightness:0,
      contrast:0,
      saturation:0,
      hue:0,
      noise:0,
      blur:0,
      pixelate:0,
      sharpen:false,
      emboss:false,
      grayscale:false,
      vintage:false,
      sepia:false,
      polaroid:false
    };
    imageObject.filters.map((filter: any)=>{
      switch (filter.type) {
        case 'Brightness':
          activeFilter = {...activeFilter,brightness:filter.brightness}
          break;
        case 'Contrast':
          activeFilter = {...activeFilter,contrast:filter.contrast}
          break;
        case 'Saturation':
          activeFilter = {...activeFilter,saturation:filter.saturation}
          break;
        case 'HueRotation':
          activeFilter = {...activeFilter,hue:filter.rotation}
          break;
        case 'Noise':
          activeFilter = {...activeFilter,noise:filter.noise}
          break;
        case 'Blur':
          activeFilter = {...activeFilter,blur:filter.blur}
          break;
        case 'Pixelate':
          activeFilter = {...activeFilter,pixelate:filter.blocksize}
          break;
        case 'Grayscale':
          activeFilter = {...activeFilter,grayscale:true}
          break;
        case 'Vintage':
          activeFilter = {...activeFilter,vintage:true}
          break;
        case 'Sepia':
          activeFilter = {...activeFilter,sepia:true}
          break;
        case 'Polaroid':
          activeFilter = {...activeFilter,polaroid:true}
          break;
        // case 'Convolute':
        //   const sharpenArray: number[][] = [];
        //   sharpenArray.push([ 0, -1,  0, -1,  5, -1, 0, -1,  0 ])
        //   console.log(filter.matrix);

        //   if(this.compare(filter.matrix , sharpenArray)){
        //     activeFilter = {...activeFilter,sharpen:true};
        //     console.log("Sharpened");

        //   }
        //   if(this.compare(filter.matrix , [ 1,   1,  1, 1, 0.7, -1, -1,  -1, -1 ])){
        //     activeFilter = {...activeFilter,emboss:true};
        //     console.log("Embossed");
        //   }
        //   break;
        default:
          break;
      }
    })
    return activeFilter;
  }

  generateFilterArray(filterProps:any):any[]{
    let filterArray = [];
    if(filterProps.brightness !== 0){
      filterArray.push(
        new fabric.Image.filters.Brightness({
          brightness:filterProps.brightness
        }
      ));
    }
    if(filterProps.contrast !== 0){
      filterArray.push(
        new fabric.Image.filters.Contrast({
          contrast:filterProps.contrast
        }
      ));
    }
    if(filterProps.saturation !== 0){
      filterArray.push(
        new fabric.Image.filters.Saturation({
          saturation:filterProps.saturation
        }
      ));
    }
    if(filterProps.hue !== 0){
      filterArray.push(
        new fabric.Image.filters.HueRotation({
          rotation:filterProps.hue
        }
      ));
    }
    if(filterProps.noise !== 0){
      filterArray.push(
        new fabric.Image.filters.Noise({
          noise:filterProps.noise
        }
      ));
    }
    if(filterProps.blur !== 0){
      filterArray.push(
        new fabric.Image.filters.Blur({
          blur:filterProps.blur
        }
      ));
    }
    if(filterProps.pixelate !== 0){
      filterArray.push(
        new fabric.Image.filters.Pixelate({
          blocksize:filterProps.pixelate
        }
      ));
    }
    // if(filterProps.sharpen){
    //   filterArray.push(
    //     new fabric.Image.filters.Convolute({
    //       matrix: [ 0, -1,  0,
    //                -1,  5, -1,
    //                 0, -1,  0 ]
    //     }
    //   ));
    // }
    // if(filterProps.emboss){
    //   filterArray.push(
    //     new fabric.Image.filters.Convolute({
    //       matrix: [ 1,   1,  1,
    //                 1, 0.7, -1,
    //                -1,  -1, -1 ]
    //     }
    //   ));
    // }
    if(filterProps.grayscale){
      filterArray.push(
        new fabric.Image.filters.Grayscale({
          mode:'lightness'
        }
      ));
    }
    if(filterProps.vintage){
      filterArray.push(
        new fabric.Image.filters.Vintage()
      );
    }
    if(filterProps.sepia){
      filterArray.push(
        new fabric.Image.filters.Sepia()
      );
    }
    if(filterProps.polaroid){
      filterArray.push(
        new fabric.Image.filters.Polaroid()
      );
    }
    return filterArray;
  }

  selectItemAfterAdded(obj: any) {
    this.canvas.discardActiveObject();
    this.canvas.setActiveObject(obj).renderAll();
  }

  getActiveSelection():any{
    const selectionList = this.canvas.getActiveObjects();
    if(selectionList.length === 1){
      const activeObject = selectionList[0];
      switch (activeObject.type) {
        case 'image':
          return {
            type:'image',
            activeObject: activeObject
          };
        case 'i-text':
          return {
            type:'i-text',
            activeObject: activeObject
          };
        case 'rect':
          if(this.croppingWindow === undefined){
            return {
              type:'shape-mask',
              activeObject: activeObject
            }
          }
          else{
            return {
              type:'cropping-window',
              activeObject: activeObject
            }
          }
        case 'triangle':
          return {
            type:'shape-mask',
            activeObject: activeObject
          }
        case 'circle':
          return {
            type:'shape-mask',
            activeObject: activeObject
          }
        default:
          return {
            type:'UNKNOWN'
          }
      }
    }
    else{
      return {
        type:'group',
        activeObjectList: selectionList
      }
    }
  }

  cleanSelect() {
    this.canvas.discardActiveObject().renderAll();
  }

  removeSelection(){
    if(this.activeObjectType === 'group'){
      this.activeObjectList.map((activeObject: any,index: any)=>{
        this.canvas.remove(activeObject);
      },this)
    }
    else{
      this.canvas.remove(this.activeObject);
    }
    this.cleanSelect();
  }

  randomId() {
    return Math.floor(Math.random() * 999999) + 1;
  }

  extend(obj: any, id: any) {
    obj.toObject = ((toObject) => {
      return () => {
        return fabric.util.object.extend(toObject.call(this), {
          id: id
        });
      };
    })(obj.toObject);
  }

  bringForward(){
    if(this.activeObjectType !== 'group' && this.activeObject !== undefined ){
      this.activeObject.bringForward();
      this.canvas.discardActiveObject().renderAll();
    }
  }

  sendBackward(){
    if(this.activeObjectType !== 'group' && this.activeObject !== undefined ){
      this.activeObject.sendBackwards();
      this.canvas.discardActiveObject().renderAll();
    }
  }

  downloadCurrentCanvas(){
    const multiplier = 1080/this.size.height;

    const url = this.canvas.toDataURL({
      format: 'jpeg',
      quality: 1,
      multiplier: multiplier
    }, {
      crossOrigin: "anonymous"
    })

    this.utilService.editedImageURL = url;
  }

  // ------------------------- Canvas Event Handlers --------------------------

  onObjectSelected():void{
    const activeObjectSelection = this.getActiveSelection();
    this.activeObjectType = activeObjectSelection.type;

    if(this.activeObjectType === 'group'){
      this.activeObjectList = activeObjectSelection.activeObjectList;
      this.utilService.onSelectionCreated(this.activeObjectList,this.activeObjectType,{});
      this.utilService.changeToolType('DEACTIVATE',{});
    }
    else{
      this.activeObject = activeObjectSelection.activeObject;
      switch (this.activeObjectType) {
        case 'i-text':
          this.toolType = 'TEXT'
          this.onSelectText(this.activeObject);
          break;
        case 'image':
          if(this.toolType === 'FILTER:ALL'){
            this.toolType = 'FILTER:SINGLE';
            this.onSelectImage(this.activeObject)
          }
          break;
        case 'shape-mask':
          this.toolType = 'SHAPE_MASK';
          this.onSelectShapeMask();
          break;
        default:
          break;
      }
      this.utilService.onSelectionCreated(this.activeObject,this.activeObjectType,{});
    }
  }

  onObjectDeselected():void{
    // Turn off crop mode
    if(this.croppingWindow){
      this.stopCrop();
    }

    switch (this.activeObjectType) {
      case 'image':
        // Don't change to MAIN menu for image
        if(this.toolType === 'FILTER:SINGLE'){
          this.toolType = 'FILTER:ALL';
        }
        this.activeObjectType = '';
        this.activeObject = undefined;
        this.activeObjectList = [];
        this.utilService.changeToolType(this.toolType,this.activeObject);
        this.utilService.onSelectionCreated(this.activeObject,this.activeObjectType,{});
        break;
      default:
        this.toolType = 'MAIN';
        this.activeObjectType = '';
        this.activeObject = undefined;
        this.activeObjectList = [];
        this.utilService.changeToolType(this.toolType,this.activeObject);
        this.utilService.onSelectionCreated(this.activeObject,this.activeObjectType,{});
        break;
    }
  }

  onEnterningTextEditingMode(){
    const activeObjectSelection = this.getActiveSelection();
    this.toolType = 'TEXT:EDITING'
    this.activeObjectType = activeObjectSelection.type;
    this.activeObject = activeObjectSelection.activeObject;
    if(this.activeObjectType === 'i-text'){
      this.onSelectTextEditing(this.activeObject);
    }
  }

  onExitingTextEditingMode(){
    this.toolType = 'MAIN';
    this.activeObjectType = '';
    this.activeObject = undefined;
    this.activeObjectList = [];
    this.utilService.changeToolType(this.toolType,undefined);
  }

  onTextSelectionChange(){
    if(this.activeObjectType === 'i-text'){
      this.onSelectTextEditing(this.activeObject);
    }
  }


  constructor(private utilService: UtilService) {
    this.addImageSubscription = utilService.addImageToCanvas$.subscribe(
      url => {
        this.addImageOnCanvas(url);
      }
    )

    this.addImageFilterSubscription = utilService.addImageFilter$.subscribe(
      ({filterScope,filterProps})=>{
        switch (filterScope) {
          case 'SINGLE':
            this.applyFilterOnSingle(filterProps);
            break;
          case 'ALL':
            this.applyFilterOnAll(filterProps);
            break;
          default:
            break;
        }
      }
    )

    this.onUpdateTextSubscription = utilService.onUpdateText$.subscribe(
      (textProps) => {
        switch (this.toolType) {
          case 'TEXT':
            this.onUpdateText(textProps);
            break;
          case 'TEXT:EDITING':
            this.onUpdateTextEditing(textProps);
            break;
          default:
            break;
        }
      }
    )

    this.onUpdateShapeMaskSubscription = utilService.onUpdateShapeMask$.subscribe(
      (shapeMaskProps: any)=>{
        this.onUpdateShapeMask(shapeMaskProps);
      }
    );

    this.canvasCommandSubscription = utilService.canvasCommand$.subscribe(
      ({toolType,option}) => {
        switch (toolType) {
          case 'ADD_FILTER':
            if(this.activeObjectType==='image'){
              this.toolType = 'FILTER:SINGLE';
              this.utilService.changeToolType('FILTER:SINGLE',this.getActiveFilter(this.activeObject));
            }
            else if(this.activeObjectType===''){
              this.toolType = 'FILTER:ALL';
              this.utilService.changeToolType('FILTER:ALL',this.globalFilterValues);
            }
            break;
          case 'FILTER:ALL':
            this.cleanSelect();
            this.toolType='FILTER:ALL';
            this.utilService.changeToolType('FILTER:ALL',this.globalFilterValues);
            break;
          case 'ADD_TEXT':
            this.onAddText();
            break;
          case 'CLEAN_SELECT':
            this.cleanSelect();
            break;
          case 'BACK_TO_MAIN_MENU':
            // turn off drawing mode
            this.stopPenMode();

            // if object type is image and in filter single mode, don't clear selection
            if(this.activeObjectType!=='image' && this.toolType !== 'FILTER:ALL'){
              this.cleanSelect();
            }

            this.toolType = 'MAIN';
            break;
          case 'DELETE':
            this.removeSelection();
            this.onObjectDeselected();
            break;
          case 'BRING_FORWARD':
            this.bringForward();
            break;
          case 'SEND_BACKWARD':
            this.sendBackward();
            break;
          case 'START_CROP':
            this.startCrop();
            this.utilService.changeToolType('CROP',{});
            break;
          case 'STOP_CROP':
            this.onObjectDeselected();
            break;
          case 'FINISH_CROP':
            this.cropSelectedWindow();
            break;
          case 'FLIP:X':
            this.flipSelectedImage();
            break;
          case 'CLONE':
            this.clone();
            break;
          case 'ADD_SHAPE_MASK':
            this.addShapeMask(option);
            break;
          case 'DOWNLOAD_CURRENT_CANVAS':
            this.downloadCurrentCanvas();
            break;
          case 'PEN':
            this.startPenMode();
            break;
          default:
            break;
        }
      }
    )

    this.changeCanvasSizeSubscription = utilService.changeCanvasSize$.subscribe(
      ({ orientation, aspectRatio })=>{

        if(orientation === 'LANDSCAPE'){
          this.size.height = Math.round(window.innerHeight - this.screenReductionFactor);
          this.size.width = Math.round((window.innerHeight - this.screenReductionFactor) * this.aspectRatioList[aspectRatio])
        }
        else{
          this.size.height = Math.round(window.innerHeight - this.screenReductionFactor);
          this.size.width = Math.round((window.innerHeight - this.screenReductionFactor) * Math.pow(this.aspectRatioList[aspectRatio],-1));
        }

        this.canvas.setWidth(this.size.width);
        this.canvas.setHeight(this.size.height);
      }
    );

    // this.windowResizeSubscription = Observable.fromEvent(window,'resize').filter(()=>(window.innerHeight>720)).throttleTime(100).subscribe(
    //   ()=>{
    //       this.size.height = Math.round(window.innerHeight - this.screenReductionFactor);
    //       this.size.width = Math.round((window.innerHeight - this.screenReductionFactor) * this.aspectRatioList[1]);
    //       this.canvas.setWidth(this.size.width);
    //       this.canvas.setHeight(this.size.height);
    //   }
    // )

    // this.objectResizeSubscription = Observable.fromEvent(window,'resize').filter(()=>(window.innerHeight>720)).debounceTime(50).subscribe(
    //   ()=>{
    //     this.oldSize = this.size;
    //     this.resizeAllObjects();
    //   }
    // )
  }

  ngOnInit() {
    // keep lightweight init only (do NOT create fabric.Canvas here)
    this.toolType = 'MAIN';
    this.activeObjectType = '';
    this.activeObject = undefined;
    this.activeObjectList = [];
    // other non-DOM dependent subscriptions/initialisation (already in constructor)
  }
  // ngOnInit() {
  //   // Setting up editor default setting
  //   this.toolType = 'MAIN';
  //   this.activeObjectType = ''
  //   this.activeObject = undefined;
  //   this.activeObjectList = [];

  //   // Setting up fabric object on canvas
  //   this.canvas = new fabric.Canvas('canvas', {
  //     hoverCursor: 'pointer',
  //     selection: true,
  //     selectionBorderColor: '#B3E5FC',
  //     backgroundColor:'#ffffff'
  //   });
  //   fabric.textureSize = 4096;

  //   // Initializing backend
  //   var webglBackend = new fabric.WebglFilterBackend();
  //   // var canvas2dBackend = new fabric.Canvas2dFilterBackend()
  //   fabric.filterBackend = fabric.initFilterBackend();

  //   // Default size of canvas
  //   this.canvas.setWidth(this.size.width);
  //   this.canvas.setHeight(this.size.height);
  //   this.utilService.addImageToCanvas(this.utilService.uploadedImageURL);

  //   // Setup event listeners for canvas
  //   this.canvas.on({
  //     'selection:created':(event:any)=>{
  //       console.log('selection active');
  //       this.onObjectSelected();
  //     },
  //     'selection:updated':(event:any)=>{
  //       // same things as in created
  //       console.log('selection updated');
  //       this.onObjectSelected();
  //     },
  //     'selection:cleared':(event:any)=>{
  //       console.log('selection inactive');
  //       this.onObjectDeselected();
  //     },
  //     'object:modified':(event:any)=>{
  //       console.log('object modified');
  //     },
  //     'text:editing:entered':(event:any)=>{
  //       console.log('editing entered');
  //       this.onEnterningTextEditingMode();
  //     },
  //     'text:editing:exited':(event:any)=>{
  //       console.log('editing exit');
  //       this.onExitingTextEditingMode();
  //     },
  //     'text:selection:changed':(event:any)=>{
  //       // using preselected text object to optimize
  //       console.log('selection change');
  //       this.onTextSelectionChange();
  //     },
  //     'text:changed':(event:any)=>{
  //       console.log('text changed');
  //     },
  //   })
  // }

  ngAfterViewInit(): void {
  // Defensive: ensure template element exists
    const el = this.canvasRef?.nativeElement;
    if (!el) {
      console.error('Canvas element not found in ngAfterViewInit');
      return;
    }

    // Prevent double-initialisation
    if (this.canvas && this.canvas.dispose) {
      try { this.canvas.dispose(); } catch(e) { console.warn('dispose failed', e); }
    }

    // Create fabric canvas safely
    try {
      this.canvas = new fabric.Canvas(el, {
        hoverCursor: 'pointer',
        selection: true,
        selectionBorderColor: '#B3E5FC',
        backgroundColor: '#ffffff'
      });
    } catch (err) {
      console.error('Fabric canvas init failed', err);
      return;
    }

    // // Create Fabric canvas using the element (not an id string)
    // this.canvas = new fabric.Canvas(el, {
    //   hoverCursor: 'pointer',
    //   selection: true,
    //   selectionBorderColor: '#B3E5FC',
    //   backgroundColor: '#ffffff'
    // });

    fabric.textureSize = 4096;

    // Setup filter backend robustly: prefer fabric.initFilterBackend(), fallback to Canvas2d
    try {
      // initFilterBackend is the public safe API; it will pick the best backend available.
      (fabric as any).filterBackend = (fabric as any).initFilterBackend();
    } catch (initErr) {
      // If initFilterBackend throws for any reason, fall back silently to Canvas2dFilterBackend
      console.warn('fabric.initFilterBackend() failed — falling back to Canvas2dFilterBackend', initErr);
      try {
        (fabric as any).filterBackend = new (fabric as any).Canvas2dFilterBackend();
      } catch (fallbackErr) {
        console.error('Fatal: could not initialize any fabric filter backend', fallbackErr);
        // At this point continue without filters — canvas will still work for non-filter ops.
        (fabric as any).filterBackend = undefined;
      }
    }

    // default size of canvas
    this.canvas.setWidth(this.size.width);
    this.canvas.setHeight(this.size.height);

    // add existing image url if any
    if (this.utilService.uploadedImageURL) {
      this.utilService.addImageToCanvas(this.utilService.uploadedImageURL);
    }

    // Setup event listeners (moved from earlier)
    this.canvas.on({
      'selection:created': () => this.onObjectSelected(),
      'selection:updated': () => this.onObjectSelected(),
      'selection:cleared': () => this.onObjectDeselected(),
      'object:modified': () => console.log('object modified'),
      'text:editing:entered': () => this.onEnterningTextEditingMode(),
      'text:editing:exited': () => this.onExitingTextEditingMode(),
      'text:selection:changed': () => this.onTextSelectionChange(),
      'text:changed': () => console.log('text changed'),
    });
  }


  ngOnDestroy(){
    this.canvas.off();
    // this.windowResizeSubscription.unsubscribe();
    // this.objectResizeSubscription.unsubscribe();
    this.addImageSubscription.unsubscribe();
    this.addImageFilterSubscription.unsubscribe();
    this.onUpdateTextSubscription.unsubscribe();
    this.onUpdateShapeMaskSubscription.unsubscribe();
    this.canvasCommandSubscription.unsubscribe();
  }
}
