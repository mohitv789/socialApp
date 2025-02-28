import { AfterViewInit, Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Konva from 'konva';
import { ReelsHTTPService } from '../../services/reels.service';

@Component({
  selector: 'app-reel-image-edit',
  templateUrl: './reel-image-edit.component.html',
  styleUrls: ['./reel-image-edit.component.css']
})
export class ReelImageEditComponent implements OnInit, AfterViewInit{
  sources : any = {};
  reelId! : string;
  stage!: Konva.Stage;

  constructor(private dialogRef: MatDialogRef<ReelImageEditComponent>,@Inject(MAT_DIALOG_DATA) public data: any, private rService: ReelsHTTPService) {}


  ngOnInit(): void {
    this.sources["imageSRC"] = this.data["image"];
    this.reelId = this.data["id"];
  }

  ngAfterViewInit() {
    this.stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight,
    });
    console.log(this.sources["imageSRC"]);

    this.loadImages(this.sources, (images: any) => {
      this.buildStage(images);
    });
  }


  buildStage(images : any): any {


    var layer = new Konva.Layer();

    var image = new Konva.Image({
      image: images,
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      blurRadius: 0
    });

    image.cache();
    image.filters([Konva.Filters.Blur,Konva.Filters.Brighten,Konva.Filters.Contrast,Konva.Filters.Enhance]);
    layer.add(image);
    this.stage.add(layer);

    var blurSlider = document.getElementById('slider-blur') as HTMLInputElement;
    blurSlider!.oninput = function () {
      image.blurRadius(+blurSlider.value);
    };

    var brightSlider = document.getElementById('slider-bright') as HTMLInputElement;
    brightSlider.oninput = function () {
      image.brightness(+brightSlider.value);
    };

    var contrastSlider = document.getElementById('slider-contrast') as HTMLInputElement;
    function update() {
      image.contrast(parseFloat(contrastSlider.value));
    }
    contrastSlider.oninput = update;
    update();

    var enhanceSlider = document.getElementById('slider-enhance') as HTMLInputElement;
    enhanceSlider.oninput = function () {
      image.enhance(parseFloat(enhanceSlider.value));
    };

  }

  loadImages(sources: any, callback: any): any {

    const img = new Image();

    img.crossOrigin = 'Anonymous';
    img.src = this.sources["imageSRC"];

    img.onload = () => {
      callback(img)
    };
    console.log(img);

  }
  onClose() {
    this.dialogRef.close();
  }

  onSave() {
    const dataURL = this.stage.toDataURL();
    // console.log(dataURL);
    const formData = new FormData();
    formData.append('image', dataURL);
    this.rService.editReelImage(this.reelId,formData).subscribe((resp:any) => {
      if (resp["image"]) {
        if (!resp["image"].split(":")[0]) {
          console.log(resp["image"]);

          resp["image"] = "http://localhost:8000/" + resp["image"];
        }
        this.dialogRef.close({image: resp["image"]});
        // console.log(resp);
      }


    })
  }

}


