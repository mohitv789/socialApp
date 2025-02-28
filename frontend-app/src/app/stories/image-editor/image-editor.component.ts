import { Component, Inject, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UtilService } from './util.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReelsHTTPService } from '../services/reels.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css'],
})
export class ImageEditorComponent implements OnInit{

  user_id: any;

  private openSnackBarSubscription:Subscription;

  constructor(private authService: AuthService,private utilService: UtilService, private snackBar: MatSnackBar,private dialogRef: MatDialogRef<ImageEditorComponent>,@Inject(MAT_DIALOG_DATA) public data: any, private rService: ReelsHTTPService, ) {
    this.openSnackBarSubscription = utilService.openSnackBar$.subscribe(
      (({message,duration})=>{
        this.snackBar.open(message,undefined,{
          duration: duration
        });
      })
    );
  }

  ngOnInit() {
    this.authService.user().subscribe((result: any) => {
      this.user_id = result["id"];
    })

    console.log(this.data);
    this.utilService.uploadedImageURL = this.data.image;
    this.utilService.uploadedId = this.data.id;
    this.utilService.originalCaption = this.data.caption;
  }

  ngOnDestroy(){
    this.openSnackBarSubscription.unsubscribe();
  }

  onClose() {

    this.dialogRef.close(this.utilService.dataPostUpdate);
  }
  getNotification(evt: any) {
    console.log(evt);
    if (evt === "True") {
      this.onClose();
    }
  }
}
