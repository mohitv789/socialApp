import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ReelFileTransferService } from '../../services/reel-file-transfer.service';
import { ReelsHTTPService } from '../../services/reels.service';

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
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.imageUrl = URL.createObjectURL(this.selectedFile);
  }

  onUploadButtonTrigger(fileInput:Element){
    let element: HTMLElement = fileInput as HTMLElement;
    element.click();
  }
  onSave() {
    let returnedData;
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    this.rService.addReel({ reel_owner: this.user_id , caption: this.reelForm.value.caption!}).subscribe((res:any) => {
      this.rService.addReelImage(res.id,formData).subscribe((resp:any) => {
        returnedData = {
          id: res.id,
          caption: this.reelForm.value.caption,
          image: resp.image
        }
        console.log(resp.image);

        this.fileTransferService.fileFieldList.push({ id: returnedData.id, image: resp.image, caption: returnedData.caption!});
        this.dialogRef.close({id:returnedData["id"],caption: returnedData["caption"],image: returnedData["image"]});
      })
    })


  }

}
