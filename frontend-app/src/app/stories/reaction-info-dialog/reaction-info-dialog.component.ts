import { Component, OnInit } from '@angular/core';
import { Inject } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-reaction-info-dialog',
  templateUrl: './reaction-info-dialog.component.html',
  styleUrls: ['./reaction-info-dialog.component.css']
})
export class ReactionInfoDialogComponent implements OnInit{
  background: any;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ReactionInfoDialogComponent>) {}

  ngOnInit(): void {
    console.log(this.data);

  }
  onClose() {
    this.dialogRef.close();
  }
}
