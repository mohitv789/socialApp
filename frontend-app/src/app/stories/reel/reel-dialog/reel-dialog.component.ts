import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgxGalleryAnimation, NgxGalleryImage, NgxGalleryOptions } from '@kolkov/ngx-gallery';

@Component({
  selector: 'app-reel-dialog',
  templateUrl: './reel-dialog.component.html',
  styleUrls: ['./reel-dialog.component.css']
})
export class ReelDialogComponent implements OnInit, AfterViewInit{
  startIndex = 0;
  galleryOptions: NgxGalleryOptions[] = [];
  galleryImages: NgxGalleryImage[] = [];
  constructor(@Inject(MAT_DIALOG_DATA) public images: any[],private dialogRef: MatDialogRef<ReelDialogComponent>) {}

  ngOnInit(): void {
    this.galleryOptions = [
      {
        width: '1000px',
        height: '800px',
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        imageArrows: true,
        previewFullscreen: true,
        previewCloseOnClick: true,
        imageBullets: true
      },
      // max-width 800
      {
        breakpoint: 800,
        width: '100%',
        height: '600px',
        imagePercent: 90,
        thumbnailsPercent: 10,
        thumbnailsMargin: 20,
        thumbnailMargin: 20
      }
    ];

    this.images.forEach((data:any) => {

      this.galleryImages.push({small : data.image,medium: data.image, big: data.image,description: data.caption})
    })
  }
  show = false;
  ngAfterViewInit() {
    // let Angular finish attaching the view
    setTimeout(() => this.show = true, 0);
  }
  onClose() {
    this.dialogRef.close();
  }

}
