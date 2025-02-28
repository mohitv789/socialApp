import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Reel } from '../models/Reel';
import { StoryHTTPService } from '../services/stories.service';
import * as uuid from 'uuid';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/auth/services/auth.service';
import { StoryFileTransferService } from '../services/story-file-transfer.service';
import { ReelFileTransferService } from '../services/reel-file-transfer.service';
@Component({
  selector: 'app-story-new',
  templateUrl: './story-new.component.html',
  styleUrls: ['./story-new.component.css']
})
export class StoryNewComponent implements OnInit, AfterContentChecked{
  user_id!: number;
  selectedStoryImage!: File;
  reelfileFieldList: { id: string,image: File, caption: string }[] = [];
  constructor(private router: Router,private sService: StoryHTTPService,private cdref: ChangeDetectorRef,private authService: AuthService,private fileTransferService: StoryFileTransferService,private rfileTransferService: ReelFileTransferService) {}

  ngOnInit(): void {
    this.authService.user().subscribe((result: any) => {
      this.user_id = result["id"];
    })
  }
  ngAfterContentChecked() {
    this.cdref.detectChanges();

  }
  onCancel() {

    this.router.navigateByUrl("/story");
  }
  submit(step1: any, step2: any) {

    // this.reelfileFieldList.forEach((reel: any) => {
    //   console.log(reel.image);

    //   reels.push(JSON.stringify({
    //     id: uuid.v4(),
    //     caption: reel.caption,
    //     image: reel.image,
    //     reel_owner: this.user_id
    //   }))
    // })
    // const story = {
    //   id: uuid.v4(),
    //   title: step1["title"],
    //   description: step1["description"],
    //   image: this.fileTransferService.image,
    //   longDescription: step1["longDescription"],
    //   tags: step1["tags"],
    //   reels: reels,
    //   owner: this.user_id
    // }
    const formData = new FormData();
    this.reelfileFieldList = this.rfileTransferService.fileFieldList;

    formData.append('id', uuid.v4());
    formData.append('owner', this.user_id.toString());
    formData.append('title', step1["title"]);
    formData.append('description', step1["description"]);
    formData.append('longDescription', step1["longDescription"]);
    formData.append('tags', JSON.stringify(step1["tags"]));
    const reels: any[] = []; // Initialize the reels array

    this.reelfileFieldList.forEach((relatedModel, index) => {
      const reel: any = {
        id: relatedModel.id,
        caption: relatedModel.caption,
        image: relatedModel.image,
        reel_owner: this.user_id
      };

      reels.push(reel);
    });

    // Append the reels array as JSON string to formData
    formData.append('reels', JSON.stringify(reels));

    setTimeout(() => {
      // this.reelfileFieldList.forEach((relatedModel, index) => {
      //   formData.append(`reels[${index}].caption`, relatedModel.caption);
      //   formData.append(`reels[${index}].image`, relatedModel.image);
      //   formData.append(`reels[${index}].id`, uuid.v4());
      //   formData.append(`reels[${index}].reel_owner`, this.user_id.toString());
      // });
      let returnedData;
      const imageformData = new FormData();
      imageformData.append('image', this.fileTransferService.image!);

      this.sService.addStory(formData).subscribe((result:any) => {
        this.sService.addStoryImage(result.id,imageformData).subscribe((resp:any) => {
        console.log(resp);

        this.rfileTransferService.fileFieldList = [];
        localStorage.removeItem('STEP_1');
        this.router.navigateByUrl("/story");
      });
      })
    }, 100);
  }
}
