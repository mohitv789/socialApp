import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UtilService } from '../../util.service';
import { ReelFileTransferService } from 'src/app/stories/services/reel-file-transfer.service';

@Component({
  selector: 'app-main-tool',
  templateUrl: './main-tool.component.html',
  styleUrls: ['./main-tool.component.css']
})
export class MainToolComponent implements OnInit, AfterViewInit{
  @Input() selectedToolType : any;
  selectedFile!: File;
  caption: string = "";
  id: string = "";
  fileUrlList!: string;
  @Output() closeSignal: EventEmitter<any> = new EventEmitter();
  onChangeToolType(toolType:string):void{
    this.utilService.changeToolType(toolType,{});
  }

  canvasCommand(toolType:string):void{
    this.utilService.canvasCommand(toolType,{});
  }

  editPhoto(event: any) {
    this.canvasCommand('DOWNLOAD_CURRENT_CANVAS');
    this.id = this.utilService.uploadedId;

    if (this.utilService.editedImageURL && this.id) {
      const dataUrl: string = this.utilService.editedImageURL;

      // convert dataURL -> Blob -> File
      const blob = this.dataURLToBlob(dataUrl);
      // create a File so backend can see a filename (optional but helpful)
      const file = new File([blob], `edited_${Date.now()}.jpg`, { type: blob.type });

      const imageformData = new FormData();
      // 'image' must match the server-side expected field name
      imageformData.append('image', file, file.name);

      // Make sure your utilService.editUserImage does NOT set Content-Type header manually.
      this.utilService.editUserImage(this.id, imageformData).subscribe((resp: any) => {
        const returnedData = {
          id: resp.id,
          image: resp.image,
          caption: this.caption
        };
        const index = this.fileTransferService.fileFieldList.findIndex(element => element.id === resp.id);
        if (index !== -1) {
          this.fileTransferService.fileFieldList[index] = returnedData;
        }

        this.utilService.dataPostUpdate = { id: returnedData["id"], caption: returnedData["caption"], image: returnedData["image"] };
        this.closeSignal.emit("True");
      }, err => {
        console.error('Upload error', err);
      });

    } else {
      console.log("Some Error: missing editedImageURL or id");
    }
  }

  // helper (put inside the same component)
  dataURLToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // editPhoto(event:any) {
  //   this.canvasCommand('DOWNLOAD_CURRENT_CANVAS');
  //   this.id = this.utilService.uploadedId;
  //   if (this.utilService.editedImageURL && this.id) {
  //     let imageformData = new FormData();
  //     console.log(this.utilService.editedImageURL);

  //     imageformData.append('image', this.utilService.editedImageURL);
  //     this.utilService.editUserImage(this.id , imageformData).subscribe((resp:any) => {
  //       const returnedData = {
  //         id: resp.id,
  //         image: resp.image,
  //         caption: this.caption
  //       }
  //       const index = this.fileTransferService.fileFieldList.findIndex(element => element.id === resp.id);
  //       if (index !== -1) {
  //         this.fileTransferService.fileFieldList[index] = returnedData;
  //       }

  //       this.utilService.dataPostUpdate = {id:returnedData["id"],caption: returnedData["caption"],image: returnedData["image"]}
  //       this.closeSignal.emit("True");
  //     })

  //   } else {
  //     console.log("Some Error");

  //   }
  // }

  constructor(private utilService: UtilService,private fileTransferService: ReelFileTransferService) { }

  ngOnInit() {
    this.caption = this.utilService.originalCaption;
  }
  showSliders = false;
  ngAfterViewInit() { setTimeout(()=> this.showSliders = true, 0); }
}
