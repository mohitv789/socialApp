import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Konva from 'konva';
import { ReelsHTTPService } from '../../services/reels.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ReelFileTransferService } from '../../services/reel-file-transfer.service';


@Component({
  selector: 'app-reel-edit',
  templateUrl: './reel-edit.component.html',
  styleUrls: ['./reel-edit.component.css']
})
export class ReelEditComponent implements OnInit{
  sources : any = {};
  reelId! : string;
  caption!: string;
  stage!: Konva.Stage;
  user_id: any;

  constructor(private dialogRef: MatDialogRef<ReelEditComponent>,@Inject(MAT_DIALOG_DATA) public data: any, private rService: ReelsHTTPService,private authService: AuthService,
  private fileTransferService: ReelFileTransferService) {}


  ngOnInit(): void {
    console.log(this.data);

    this.sources["imageSRC"] = this.data["image"];
    this.reelId = this.data["id"];
    this.caption = this.data["caption"];
    this.authService.user().subscribe((result: any) => {
      this.user_id = result["id"];
    })
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

  }

  onClose() {
    this.dialogRef.close();
  }

  onSave() {
    const dataURL = this.stage.toDataURL();
    const formData = new FormData();
    formData.append('image', dataURL);

    this.rService.editReelImage(this.reelId,formData).subscribe((resp:any) => {
      const returnedData = {
        id: resp.id,
        image: resp.image,
        caption: this.caption
      }
      const index = this.fileTransferService.fileFieldList.findIndex(element => element.id === resp.id);
      if (index !== -1) {
        this.fileTransferService.fileFieldList[index] = returnedData;
      }

      this.dialogRef.close({id:returnedData["id"],caption: returnedData["caption"],image: returnedData["image"]});


    })

  }
}

