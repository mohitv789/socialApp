import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-reel-comment-create',
  templateUrl: './reel-comment-create.component.html',
  styleUrls: ['./reel-comment-create.component.css']
})
export class ReelCommentCreateComponent implements OnInit{
  startIndex = 0;
  commentForm = this.fb.group({
    reelcomment: ['', Validators.required]
  });
  constructor(
    private fb: FormBuilder,private dialogRef: MatDialogRef<ReelCommentCreateComponent>,@Inject(MAT_DIALOG_DATA) data: any) {}

  ngOnInit(): void {
  }

  onClose() {
    this.dialogRef.close();
  }
  onSave() {

    this.dialogRef.close({data:this.commentForm.get("reelcomment")!.value});

  }
}
