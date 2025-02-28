import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../auth/services/auth.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-chatroom-dialog',
  templateUrl: './chatroom-dialog.component.html',
  styleUrl: './chatroom-dialog.component.css'
})
export class ChatroomDialogComponent implements OnInit {
  activity!: string;
  publicUser: any;
  user: any;
  fullName: string = "";
  loggedInUserId!: number;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<ChatroomDialogComponent>, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadData();
  }
  onSave() {
    this.dialogRef.close({
      start: true
    });
  }
  onClose() {
    this.dialogRef.close();
  }

  private async loadData() {

    if (this.data.status === "creating") {
      this.activity = "starting"
    }

    if (this.data.status === "adding") {
      this.activity = "joining"
    }
    if (!!this.data.story) {
      const publicUser$ = this.authService.publicUser(this.data.story.owner);
      this.publicUser = await lastValueFrom(publicUser$);
      this.fullName = this.publicUser.first_name + " " + this.publicUser.last_name;
    } else {
      const publicUser$ = this.authService.publicUser(this.data.reel.reel_owner);
      this.publicUser = await lastValueFrom(publicUser$);
      this.fullName = this.publicUser.first_name + " " + this.publicUser.last_name;
    }

    const user$ = this.authService.user()
    this.user = await lastValueFrom(user$);
    this.loggedInUserId = this.user.id;
  }
}
