import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { StoryHTTPService } from '../../services/stories.service';
import { StoryFileTransferService } from '../../services/story-file-transfer.service';
import { Story } from '../../models/Story';
import { ReelFileTransferService } from '../../services/reel-file-transfer.service';
import { Reel } from '../../models/Reel';
import { Observable, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-story-edit-parta',
  templateUrl: './story-edit-parta.component.html',
  styleUrls: ['./story-edit-parta.component.css']
})
export class StoryEditPartaComponent implements OnInit {
  storyId!: string;
  fileInputElement: any;
  editMode = false;
  storyStartForm!: FormGroup;
  story!: Story;
  selectedFile!: File;
  imageUrl!: string;
  story$!: Observable<Story>;
  @Output() uploaded = new EventEmitter<string>();

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.imageUrl = URL.createObjectURL(this.selectedFile);
    this.fileTransferService.image = this.selectedFile;
  }

  onUploadButtonTrigger(fileInput:Element){
    let element: HTMLElement = fileInput as HTMLElement;
    element.click();
  }
  get tags() {
    return this.storyStartForm.controls["tags"] as FormArray;
  }

  constructor(
    private route: ActivatedRoute,
    private sService: StoryHTTPService,
    private router: Router,
    private fileTransferService: StoryFileTransferService,
    private rfileTransferService: ReelFileTransferService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.storyId = params['id'];
    });

    this.loadData();


  }


  ngAfterViewInit() {
    this.fileInputElement = document.getElementById('upload-file-input');
  }
  onAddTag() {
    (<FormArray>this.storyStartForm.get('tags')).push(
      new FormGroup({
        name: new FormControl("", Validators.required),
      })
    );
  }

  onDeleteTag(index: number) {
    (<FormArray>this.storyStartForm.get('tags')).removeAt(index);
  }

  onCancel() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
  private async loadData() {



    this.story$ = this.sService.fetchStory(this.storyId);
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
      this.rfileTransferService.fileFieldList.push({ id: reel.id, image: reel.image, caption: reel.caption!});
    })

    this.initForm();
  }
  private initForm() {
    let storyTitle = '';
    let storyDescription = '';
    let storyLongDescription = '';
    let storyImage;
    let storyOwner;
    let storyTags = new FormArray<FormGroup>([]);


    if (!!this.story) {
      storyTitle = this.story.title;
      storyDescription = this.story.description;
      storyLongDescription = this.story.longDescription;
      storyImage = this.story.image;
      storyOwner = this.story.owner
    }



    if (this.story['tags']) {
      for (let tag of this.story.tags) {
        storyTags.push(
          new FormGroup({
            name: new FormControl(tag.name, Validators.required)
          })
        );
      }
    }
    this.storyStartForm = new FormGroup({
      title: new FormControl(storyTitle, Validators.required),
      image: new FormControl(storyImage, Validators.required),
      description: new FormControl(storyDescription, Validators.required),
      longDescription: new FormControl(storyLongDescription, Validators.required),
      tags: storyTags,
      owner: new FormControl(storyOwner, Validators.required)
    });
  }
}
