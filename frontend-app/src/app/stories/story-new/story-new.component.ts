import { AfterContentChecked, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StoryHTTPService } from '../services/stories.service';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
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
  // Get reels from the ReelFileTransferService (already populated by child dialogs)
  this.reelfileFieldList = this.rfileTransferService.fileFieldList || [];

  // Build payload object (JSON)
  const reelsPayload = this.reelfileFieldList.map((relatedModel) => ({
    id: relatedModel.id,
    caption: relatedModel.caption,
    // Do NOT include image File here — images are uploaded separately when creating the reel earlier,
    // or provide only URL/identifier. Including a File forces FormData/multipart.
    // If your flows expect to upload reel images too, they should have been uploaded earlier
    // and image replaced by a URL or image path.
    image: relatedModel.image,
    reel_owner: this.user_id
  }));

  const payload = {
    // id typically created server-side — you can omit it; your backend will generate UUID
    // id: uuid.v4(),
    title: step1["title"],
    description: step1["description"],
    longDescription: step1["longDescription"],
    // tags should be an array (not a string)
    tags: step1["tags"] || [],
    // reels should be an array of objects (not FormData)
    reels: reelsPayload,
    owner: this.user_id
  };

  // Prepare story image FormData (if user selected a story image)
  const imageformData = new FormData();
  if (this.fileTransferService.image) {
    imageformData.append('image', this.fileTransferService.image);
  }

  // POST create story (JSON), then upload image (multipart) if there is an image
  this.sService.addStory(payload).pipe(
    switchMap((result: any) => {
      // result should include created story id
      const storyId = result?.id;
      if (!storyId) {
        console.error('Create story did not return id', result);
        return of(null);
      }

      // If no image provided, just return result to subscriber
      if (!this.fileTransferService.image) {
        return of({ storyId, imageResp: null });
      }

      // Otherwise upload the image using the story id
      return this.sService.addStoryImage(storyId, imageformData).pipe(
        // attach storyId so subscriber can handle both
        switchMap((imageResp: any) => of({ storyId, imageResp })),
        catchError(err => {
          console.error('Error uploading story image', err);
          return of({ storyId, imageResp: null });
        })
      );
    }),
    catchError(err => {
      console.error('Error creating story', err);
      return of(null);
    })
  ).subscribe((finalResult: any) => {
    if (!finalResult) {
      // error handled above
      return;
    }

    // cleanup & navigate
    this.rfileTransferService.fileFieldList = [];
    localStorage.removeItem('STEP_1');
    this.router.navigateByUrl("/story");
  });
}
  // submit(step1: any, step2: any) {

  //   // this.reelfileFieldList.forEach((reel: any) => {
  //   //   console.log(reel.image);

  //   //   reels.push(JSON.stringify({
  //   //     id: uuid.v4(),
  //   //     caption: reel.caption,
  //   //     image: reel.image,
  //   //     reel_owner: this.user_id
  //   //   }))
  //   // })
  //   // const story = {
  //   //   id: uuid.v4(),
  //   //   title: step1["title"],
  //   //   description: step1["description"],
  //   //   image: this.fileTransferService.image,
  //   //   longDescription: step1["longDescription"],
  //   //   tags: step1["tags"],
  //   //   reels: reels,
  //   //   owner: this.user_id
  //   // }
  //   const formData = new FormData();
  //   this.reelfileFieldList = this.rfileTransferService.fileFieldList;

  //   formData.append('id', uuid.v4());
  //   formData.append('owner', this.user_id.toString());
  //   formData.append('title', step1["title"]);
  //   formData.append('description', step1["description"]);
  //   formData.append('longDescription', step1["longDescription"]);
  //   formData.append('tags', JSON.stringify(step1["tags"]));
  //   const reels: any[] = []; // Initialize the reels array

  //   this.reelfileFieldList.forEach((relatedModel, index) => {
  //     const reel: any = {
  //       id: relatedModel.id,
  //       caption: relatedModel.caption,
  //       image: relatedModel.image,
  //       reel_owner: this.user_id
  //     };

  //     reels.push(reel);
  //   });

  //   // Append the reels array as JSON string to formData
  //   formData.append('reels', JSON.stringify(reels));

  //   setTimeout(() => {
  //     // this.reelfileFieldList.forEach((relatedModel, index) => {
  //     //   formData.append(`reels[${index}].caption`, relatedModel.caption);
  //     //   formData.append(`reels[${index}].image`, relatedModel.image);
  //     //   formData.append(`reels[${index}].id`, uuid.v4());
  //     //   formData.append(`reels[${index}].reel_owner`, this.user_id.toString());
  //     // });
  //     let returnedData;
  //     const imageformData = new FormData();
  //     imageformData.append('image', this.fileTransferService.image!);

  //     this.sService.addStory(formData).subscribe((result:any) => {
  //       this.sService.addStoryImage(result.id,imageformData).subscribe((resp:any) => {
  //       console.log(resp);

  //       this.rfileTransferService.fileFieldList = [];
  //       localStorage.removeItem('STEP_1');
  //       this.router.navigateByUrl("/story");
  //     });
  //     })
  //   }, 100);
  // }


}
