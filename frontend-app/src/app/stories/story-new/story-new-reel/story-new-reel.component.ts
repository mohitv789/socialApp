import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ReelFileTransferService } from '../../services/reel-file-transfer.service';
import { ReelsHTTPService } from '../../services/reels.service';
import { of } from 'rxjs';
@Component({
  selector: 'app-story-new-reel',
  templateUrl: './story-new-reel.component.html',
  styleUrls: ['./story-new-reel.component.css']
})
export class StoryNewReelComponent implements OnInit{
  user_id!: number;
  caption!: string;
  imageUrl!: string;
  selectedFile!: File;
  reelForm = this.fb.group({
    caption: ['', Validators.required],
    image: ['', Validators.required],
    reel_owner: this.user_id
  });
  fileInputElement: any;

  constructor(
      private fb: FormBuilder,
      private dialogRef: MatDialogRef<StoryNewReelComponent>,
      private authService: AuthService,
      private rService: ReelsHTTPService,
      private fileTransferService: ReelFileTransferService,
      @Inject(MAT_DIALOG_DATA) data: any) {
  }
  ngOnInit(): void {
    this.authService.user().subscribe((result: any) => {
      this.user_id = result["id"];
    })
  }
  ngAfterViewInit() {
    this.fileInputElement = document.getElementById('upload-file-input');
  }
  onClose() {
      this.dialogRef.close();
  }


  onUploadButtonTrigger(fileInput:Element){
    let element: HTMLElement = fileInput as HTMLElement;
    element.click();
  }


onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.imageUrl = URL.createObjectURL(file);
    this.reelForm.patchValue({ image: file });
  }

  onSave() {
    if (this.reelForm.invalid) {
      // show some UI error
      console.error('Form invalid');
      return;
    }

    if (!this.selectedFile) {
      console.error('No file selected');
      return;
    }

    const payload = {
      reel_owner: this.user_id,
      caption: this.reelForm.value.caption
    };

    // Build FormData for upload-image
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    // Use switchMap to chain requests
    this.rService.addReel(payload).pipe(
      switchMap((res: any) => {
        const reelId = res.id;
        return this.rService.addReelImage(reelId, formData).pipe(
          // map/transform the response if needed
        );
      }),
      catchError(err => {
        console.error('Upload error', err);
        return of(null);
      })
    ).subscribe((imageResp: any) => {
      if (!imageResp) {
        // error handled above
        return;
      }

      // imageResp should be the updated reel object or serializer.data
      const returnedData = {
        id: imageResp.id || imageResp?.id, // depending on backend response
        caption: this.reelForm.value.caption,
        image: imageResp.image
      };

      this.fileTransferService.fileFieldList.push({ id: returnedData.id, image: returnedData.image, caption: returnedData.caption! });
      this.dialogRef.close({ id: returnedData.id, caption: returnedData.caption, image: returnedData.image });
    });
  }

}
