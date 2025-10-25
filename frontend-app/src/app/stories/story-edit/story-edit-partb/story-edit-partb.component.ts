  import { Component, Input, OnInit, ViewChild } from '@angular/core';
  import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
  import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
  import { ReelFileTransferService } from '../../services/reel-file-transfer.service';
  import { ReelImageEditComponent } from '../../story-new/reel-image-edit/reel-image-edit.component';
import { MatStepper } from '@angular/material/stepper';
import { StoryNewReelComponent } from '../../story-new/story-new-reel/story-new-reel.component';
import { ReelsHTTPService } from '../../services/reels.service';
import { ReelEditComponent } from '../reel-edit/reel-edit.component';
import { ImageEditorComponent } from '../../image-editor/image-editor.component';
import { UtilService } from '../../image-editor/util.service';

  @Component({
    selector: 'app-story-edit-partb',
    templateUrl: './story-edit-partb.component.html',
    styleUrls: ['./story-edit-partb.component.css']
  })
  export class StoryEditPartbComponent implements OnInit {
    storyDetailForm!: FormGroup;
    @ViewChild(MatStepper) stepper!: MatStepper;
    constructor(private fb:FormBuilder, private rService: ReelsHTTPService,
      private dialog: MatDialog,private rfileTransferService: ReelFileTransferService,private utilService: UtilService) {
        this.storyDetailForm = this.fb.group({
          reels: this.fb.array([])
        });

    }
    @Input() reelsData!:any[];

    ngOnInit(): void {
      setTimeout(() => {
        if (this.reelsData) {
          const reelsArray = this.storyDetailForm.get('reels') as FormArray;
          this.reelsData.forEach(reel => {

            reelsArray.push(this.fb.group({
              id: reel.id,
              caption: reel.caption,
              image: reel.image
            }));
          });
        }
      }, 500);

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

      // Add both overlay-level and component-level classes
      dialogConfig.panelClass = ['other-dialog-panel', 'story-new-reel-panel'];

      this.dialog.open(StoryNewReelComponent, dialogConfig)
        .afterClosed()
        .subscribe((val: any) => {
          if (val) {
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
    clearReels() {
      while (this.reels.length > 0) {
        this.reels.removeAt(0);
      }
    }
    // onEdit(sectionIndex: number) {
    //   console.log(this.reels.value[sectionIndex]);
    //   const dialogConfig = new MatDialogConfig();
      
    //   dialogConfig.autoFocus = true;
    //   dialogConfig.minWidth = "1500px";
    //   dialogConfig.disableClose = true;
    //   dialogConfig.panelClass = 'other-dialog-panel';
    //   if (!this.reels.value[sectionIndex]["image"].split(":")[0]) {
    //     this.reels.value[sectionIndex]["image"] = "http://localhost:4500/" + this.reels.value[sectionIndex]["image"];
    //   }
    //   dialogConfig.data = {
    //     id: this.reels.value[sectionIndex]["id"],
    //     image: this.reels.value[sectionIndex]["image"],
    //     caption: this.reels.value[sectionIndex]["caption"]
    //   }
    //   this.dialog.open(ImageEditorComponent, dialogConfig)
    //     .afterClosed()
    //     .subscribe(val => {
    //       if (val) {
    //         console.log(val);

    //         this.reels.at(sectionIndex).patchValue({
    //           image: "http://localhost:4500/" + val["image"],
    //           caption: val["caption"]
    //         });
    //       }
    //   });
    // }

  onEdit(sectionIndex: number) {
    const reel = this.reels.value[sectionIndex];
    if (this.dialog.openDialogs.length > 0) {
      this.dialog.closeAll();
    }

    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;

    // base url - prefer using environment variable if available
    const baseUrl = (window as any).ENV?.BACKEND_URL || 'http://localhost:4500';

    // normalize stored image -> absolute url for the editor preview
    const imageUrl = typeof reel.image === 'string' && reel.image.startsWith('http')
      ? reel.image
      : `${baseUrl}/${String(reel.image || '').replace(/^\/+/, '')}`;

    dialogConfig.data = {
      id: reel.id,
      image: imageUrl,
      caption: reel.caption
    };

    this.dialog.open(ImageEditorComponent, dialogConfig)
      .afterClosed()
      .subscribe(val => {
        if (!val) return;

        console.log('Image editor returned:', val);

        // normalize returned image (val.image may be absolute or relative)
        const returnedImage = typeof val.image === 'string' && val.image.startsWith('http')
          ? val.image
          : `${baseUrl}/${String(val.image || '').replace(/^\/+/, '')}`;

        // update the form array entry so preview uses an absolute URL
        this.reels.at(sectionIndex).patchValue({
          image: returnedImage,
          caption: val.caption
        });

        // keep fileTransferService.fileFieldList consistent (store relative path if needed)
        // if your backend expects relative path, store val.image (relative). If backend uses absolute, adapt.
        const newElement = {
          id: reel.id,
          image: val.image,       // keep original returned value (relative or absolute) for backend use
          caption: val.caption
        };
    });
  }

  }
