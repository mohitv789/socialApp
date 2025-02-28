import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { StoryNewReelComponent } from '../story-new-reel/story-new-reel.component';
import { ReelImageEditComponent } from '../reel-image-edit/reel-image-edit.component';
import { ReelFileTransferService } from '../../services/reel-file-transfer.service';
import { ReelsHTTPService } from '../../services/reels.service';
import { ImageEditorComponent } from '../../image-editor/image-editor.component';

@Component({
  selector: 'app-story-new-partb',
  templateUrl: './story-new-partb.component.html',
  styleUrls: ['./story-new-partb.component.css']
})
export class StoryNewPartbComponent implements OnInit{
  storyDetailForm = this.fb.group({
    reels: this.fb.array([])
  });

constructor(private fb:FormBuilder,
  private dialog: MatDialog,private fileTransferService: ReelFileTransferService,private rService: ReelsHTTPService) {

}
ngOnInit(): void {
}
get reels() {
  return this.storyDetailForm.controls["reels"] as FormArray;
}

addReel() {

  const dialogConfig = new MatDialogConfig();
  dialogConfig.autoFocus = true;
  dialogConfig.minWidth = "800px";
  dialogConfig.disableClose = true;

  this.dialog.open(StoryNewReelComponent, dialogConfig)
    .afterClosed()
    .subscribe(val => {
      if (val) {
        console.log(val);
        const newReelGroup = this.fb.group({
          id: [val.id],
          caption: [val.caption],
          image: [val.image]
        });
        this.reels.push(newReelGroup);
      }
  });
}

  deleteReel(sectionIndex: number) {
    const reelId = this.reels.controls[sectionIndex].value.id;
    this.rService.deleteReel(reelId).subscribe(() => {
      this.reels.removeAt(sectionIndex);
    })
  }

  onEdit(sectionIndex: number) {
    console.log(this.reels.value[sectionIndex]);
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.minWidth = "1200px";
    dialogConfig.disableClose = true;
    if (!this.reels.value[sectionIndex]["image"].split(":")[0]) {
      this.reels.value[sectionIndex]["image"] = "http://localhost:8000/" + this.reels.value[sectionIndex]["image"];
    }
    dialogConfig.data = {
      id: this.reels.value[sectionIndex]["id"],
      image: this.reels.value[sectionIndex]["image"],
      caption: this.reels.value[sectionIndex]["caption"],
    }
    this.dialog.open(ImageEditorComponent, dialogConfig)
      .afterClosed()
      .subscribe(val => {
        if (val) {
          this.reels.at(sectionIndex).patchValue({
            image: "http://localhost:8000/" + val["image"],
            caption: val["caption"]
          });
          const newElement = {
            id: this.reels.value[sectionIndex]["id"],
            image: val["image"],
            caption: this.reels.value[sectionIndex]["caption"]
          };
          const index = this.fileTransferService.fileFieldList.findIndex(element => element.id === newElement.id);
          if (index !== -1) {
            this.fileTransferService.fileFieldList[index] = newElement;
          }
        }
    });
  }
}
