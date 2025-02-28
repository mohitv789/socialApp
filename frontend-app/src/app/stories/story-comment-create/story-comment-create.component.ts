import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-story-comment-create',
  templateUrl: './story-comment-create.component.html',
  styleUrls: ['./story-comment-create.component.css']
})
export class StoryCommentCreateComponent implements OnInit{
  startIndex = 0;
  commentForm = this.fb.group({
    storycomment: ['', Validators.required]
  });
  constructor(
    private fb: FormBuilder,private dialogRef: MatDialogRef<StoryCommentCreateComponent>,@Inject(MAT_DIALOG_DATA) data: any) {}

  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close();
  }
  onSave() {

    this.dialogRef.close({data:this.commentForm.get("storycomment")!.value});

  }
}
