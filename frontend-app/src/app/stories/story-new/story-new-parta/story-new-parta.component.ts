import { AfterViewInit, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoryHTTPService } from '../../services/stories.service';
import * as uuid from 'uuid';
import { HttpClient } from '@angular/common/http';
import { StoryFileTransferService } from '../../services/story-file-transfer.service';

@Component({
  selector: 'app-story-new-parta',
  templateUrl: './story-new-parta.component.html',
  styleUrls: ['./story-new-parta.component.css']
})
export class StoryNewPartaComponent implements OnInit{
  storyId!: number;
  private fileInputElement: any;
  id!: number;
  editMode = false;
  storyStartForm!: FormGroup;
  selectedFile!: File;
  imageUrl!: string;
  validForm: boolean = false;
  @Output() uploaded = new EventEmitter<string>();

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.imageUrl = URL.createObjectURL(this.selectedFile);
    this.fileTransferService.image = this.selectedFile;
    event.target.value = ''
  }
  onUpload() {
    console.log(!!this.fileTransferService.image);
  }
  get tags() {
    return this.storyStartForm.controls["tags"] as FormArray;
  }

  constructor(
    private route: ActivatedRoute,
    private sService: StoryHTTPService,
    private router: Router,
    private fileTransferService: StoryFileTransferService
  ) {
  }

  ngOnInit() {



    this.storyStartForm = new FormGroup({
      title: new FormControl("", Validators.required),
      description: new FormControl("", Validators.required),
      longDescription: new FormControl("", Validators.required),
      image:  new FormControl(null, Validators.required),
      tags: new FormArray([]),
    });

  }

  ngAfterViewInit() {
    this.fileInputElement = document.getElementById('upload-file-input');
  }
  onUploadButtonTrigger():void{
    this.fileInputElement.click();

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

}
