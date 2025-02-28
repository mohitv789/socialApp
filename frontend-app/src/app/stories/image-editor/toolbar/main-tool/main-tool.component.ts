import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UtilService } from '../../util.service';
import { ReelFileTransferService } from 'src/app/stories/services/reel-file-transfer.service';

@Component({
  selector: 'app-main-tool',
  templateUrl: './main-tool.component.html',
  styleUrls: ['./main-tool.component.css']
})
export class MainToolComponent implements OnInit{
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

  editPhoto(event:any) {
    this.canvasCommand('DOWNLOAD_CURRENT_CANVAS');
    this.id = this.utilService.uploadedId;
    if (this.utilService.editedImageURL && this.id) {
      let imageformData = new FormData();
      console.log(this.utilService.editedImageURL);

      imageformData.append('image', this.utilService.editedImageURL);
      this.utilService.editUserImage(this.id , imageformData).subscribe((resp:any) => {
        const returnedData = {
          id: resp.id,
          image: resp.image,
          caption: this.caption
        }
        const index = this.fileTransferService.fileFieldList.findIndex(element => element.id === resp.id);
        if (index !== -1) {
          this.fileTransferService.fileFieldList[index] = returnedData;
        }

        this.utilService.dataPostUpdate = {id:returnedData["id"],caption: returnedData["caption"],image: returnedData["image"]}
        this.closeSignal.emit("True");
      })

    } else {
      console.log("Some Error");

    }
  }

  constructor(private utilService: UtilService,private fileTransferService: ReelFileTransferService) { }

  ngOnInit() {
    this.caption = this.utilService.originalCaption;
  }
}
