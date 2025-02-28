import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { StoryHTTPService } from '../services/stories.service';
import { Story } from '../models/Story';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ReelsHTTPService } from '../services/reels.service';
import { Reel } from '../models/Reel';
import { ReelFileTransferService } from '../services/reel-file-transfer.service';
import { StoryFileTransferService } from '../services/story-file-transfer.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-story-edit',
  templateUrl: './story-edit.component.html',
  styleUrls: ['./story-edit.component.css']
})
export class StoryEditComponent implements OnInit{
  selectedFile!: File;
  imageUrl!: string;
  reelselectedFile: File[] = [];
  reelImageUrls: string[] = [];
  id!: string;
  story!: Story;
  storyForm!: FormGroup;
  user_id!: number;
  reelsData: any[] = [];
  reelfileFieldList: { id: string,image: File, caption: string }[] = [];
  validForm: boolean = false;

  story$!: Observable<Story>;
  constructor(
    private route: ActivatedRoute,
    private sService: StoryHTTPService,
    private rService: ReelsHTTPService,
    private authService: AuthService,
    private router: Router,
    private rfileTransferService: ReelFileTransferService,
    private sfileTransferService: StoryFileTransferService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.id = params['id'];
    });
    this.authService.user().subscribe((result: any) => {
      this.user_id = result["id"];
    })
    //
    // setTimeout(() => {
    //   this.sService.fetchStory(this.id).subscribe((story: Story) => {
    //     this.story = {
    //       id: story.id,
    //       title: story.title,
    //       description: story.description,
    //       longDescription: story.longDescription,
    //       image: story.image,
    //       reels: story.reels,
    //       tags: story.tags,
    //       owner: story.owner
    //     }
    //     story.reels.forEach((reel: Reel) => {
    //       let reelData = {
    //         id: reel.id,
    //         caption: reel.caption,
    //         image: reel.image
    //       }
    //       this.reelsData.push(reelData);
    //     })
    //   });
    // }, 300);
    this.loadData();

  }
  private async loadData() {



    this.story$ = this.sService.fetchStory(this.id);
    const loadedStory = await lastValueFrom(this.story$);
    this.story = {
      id: loadedStory.id,
      title: loadedStory.title,
      description: loadedStory.description,
      longDescription: loadedStory.longDescription,
      image: loadedStory.image,
      reels: loadedStory.reels,
      tags: loadedStory.tags,
      owner: loadedStory.owner
    }
    loadedStory.reels.forEach((reel: Reel) => {
      let reelData = {
        id: reel.id,
        caption: reel.caption,
        image: reel.image
      }
      this.reelsData.push(reelData);
    })
    // !!step1.storyStartForm.value.title && !!step1.storyStartForm.value.description && !!step1.storyStartForm.value.longDescription && !!(!!step1.storyStartForm.value.
  }
  submit(step1: any, step2: any) {
    const formData = new FormData();
    this.reelfileFieldList = this.rfileTransferService.fileFieldList;

    formData.append('id', this.story.id);
    formData.append('owner', this.story.owner.toString());
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

    formData.append('reels', JSON.stringify(reels));

    setTimeout(() => {

      const imageformData = new FormData();
      if (!!this.sfileTransferService.image) {
        imageformData.append('image', this.sfileTransferService.image);
      }

      this.sService.updateStory(this.story.id,formData).subscribe((result:any) => {
        if (!!this.sfileTransferService.image) {
          this.sService.addStoryImage(result.id,imageformData).subscribe(() => {
            console.log("story image updated");
            this.sfileTransferService.image = null;
          })
        }
        console.log(formData.get("reels"));

        this.rfileTransferService.fileFieldList = [];
        this.router.navigateByUrl("/story");

      })
    }, 100);
  }


  onCancel() {

    this.router.navigateByUrl("/story/"+this.id);
  }


}

