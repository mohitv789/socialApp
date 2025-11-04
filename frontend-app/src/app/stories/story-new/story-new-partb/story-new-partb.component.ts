import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { StoryNewReelComponent } from '../story-new-reel/story-new-reel.component';
import { ReelImageEditComponent } from '../reel-image-edit/reel-image-edit.component';
import { ReelFileTransferService } from '../../services/reel-file-transfer.service';
import { ReelsHTTPService } from '../../services/reels.service';
import { ImageEditorComponent } from '../../image-editor/image-editor.component';
import { Overlay } from '@angular/cdk/overlay';

@Component({
  selector: 'app-story-new-partb',
  templateUrl: './story-new-partb.component.html',
  styleUrls: ['./story-new-partb.component.css']
})
export class StoryNewPartbComponent implements OnInit{
  storyDetailForm = this.fb.group({
    reels: this.fb.array([])
  });

constructor(private fb:FormBuilder, private overlay:Overlay,
  private dialog: MatDialog,private fileTransferService: ReelFileTransferService,private rService: ReelsHTTPService) {

}
ngOnInit(): void {
}
get reels() {
  return this.storyDetailForm.controls["reels"] as FormArray;
}

addReel() {

  if (this.dialog.openDialogs.length > 0) {
    this.dialog.closeAll();
  }

  const dialogConfig = new MatDialogConfig();
  
  dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
  dialogConfig.hasBackdrop = false;
  dialogConfig.disableClose = true;
    
  dialogConfig.scrollStrategy = this.overlay.scrollStrategies.reposition();

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

  // onEdit(sectionIndex: number) {
  //   console.log(this.reels.value[sectionIndex]);
  //   const dialogConfig = new MatDialogConfig();
    
  //   dialogConfig.autoFocus = true;
  //   dialogConfig.minWidth = "800px";
  //   dialogConfig.disableClose = true; 
  //   dialogConfig.panelClass = 'other-dialog-panel';
  //   if (!this.reels.value[sectionIndex]["image"].split(":")[0]) {
  //     this.reels.value[sectionIndex]["image"] = "http://localhost:4500/" + this.reels.value[sectionIndex]["image"];
  //   }
  //   dialogConfig.data = {
  //     id: this.reels.value[sectionIndex]["id"],
  //     image: this.reels.value[sectionIndex]["image"],
  //     caption: this.reels.value[sectionIndex]["caption"],
  //   }
  //   this.dialog.open(ImageEditorComponent, dialogConfig)
  //     .afterClosed()
  //     .subscribe(val => {
  //       if (val) {
  //         this.reels.at(sectionIndex).patchValue({
  //           image: "http://localhost:4500/" + val["image"],
  //           caption: val["caption"]
  //         });
  //         const newElement = {
  //           id: this.reels.value[sectionIndex]["id"],
  //           image: val["image"],
  //           caption: this.reels.value[sectionIndex]["caption"]
  //         };
  //         const index = this.fileTransferService.fileFieldList.findIndex(element => element.id === newElement.id);
  //         if (index !== -1) {
  //           this.fileTransferService.fileFieldList[index] = newElement;
  //         }
  //       }
  //   });
  // }

  onEdit(sectionIndex: number) {
    const reel = this.reels.value[sectionIndex];
    console.log(reel);

    if (this.dialog.openDialogs.length > 0) {
      this.dialog.closeAll();
    }

    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
    
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.reposition();

    // Normalize URL (if it's relative, prefix; if it's absolute, leave as is)
    const imageUrl = reel.image.startsWith('http') 
      ? reel.image 
      : `http://localhost:4500/${reel.image.replace(/^\/+/, '')}`;

    dialogConfig.data = {
      id: reel.id,
      image: imageUrl,
      caption: reel.caption,
    };

    this.dialog.open(ImageEditorComponent, dialogConfig)
      .afterClosed()
      .subscribe(val => {
        if (val) {
          const updatedImage = val.image.startsWith('http')
            ? val.image
            : `http://localhost:4500/${val.image.replace(/^\/+/, '')}`;

          this.reels.at(sectionIndex).patchValue({
            image: updatedImage,
            caption: val.caption
          });

          const updatedReel = {
            id: reel.id,
            image: val.image, // store relative path in backend-friendly format
            caption: val.caption
          };

          const index = this.fileTransferService.fileFieldList.findIndex(e => e.id === reel.id);
          if (index !== -1) {
            this.fileTransferService.fileFieldList[index] = updatedReel;
          }
        }
      });
  }

}
