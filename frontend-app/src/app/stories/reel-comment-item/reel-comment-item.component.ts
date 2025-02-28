import { Component, Input, OnInit } from '@angular/core';
import { ReelComment } from '../models/ReelComment';
import { ReelsHTTPService } from '../services/reels.service';
import { AuthService } from '../../auth/services/auth.service';
import { FormControl } from '@angular/forms';
import { ProfileHTTPService } from 'src/app/auth/services/profile.service';
import { Profile } from 'src/app/auth/models/profile';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-reel-comment-item',
  templateUrl: './reel-comment-item.component.html',
  styleUrls: ['./reel-comment-item.component.css']
})
export class ReelCommentItemComponent implements OnInit{
  @Input() comment!: ReelComment;
  @Input() index!: number;
  loggedInUserId!: number ;
  showEditButton: boolean = false;
  commentEditForm : any;
  reelcomment: string = "";
  fullName: string = "";
  profile!: Profile;
  user: any;
  publicUser: any;
  constructor(private authService: AuthService, private pService: ProfileHTTPService , private rService: ReelsHTTPService) {}
  ngOnInit() {

    this.loadData();
    // setTimeout(() => {
    //   this.pService.fetchPublicProfile(this.comment.commented_by).subscribe((res: any) => {
    //     this.profile = {...res};
    //   })
    // }, 100);
    // setTimeout(() => {

    //   this.authService.user().subscribe((user: any) => {
    //     this.loggedInUserId = +user.id;

    //   })
    // },100)

    // setTimeout(() => {
    //   this.authService.publicUser(this.comment.commented_by).subscribe((res: any) => {
    //     this.fullName = res.first_name + " " + res.last_name;
    //   })
    // }, 200);

    // setTimeout(() => {

    //   if (+this.loggedInUserId == +this.comment.commented_by) {
    //     this.showEditButton = true;
    //   }
    //   console.log(this.showEditButton);

    //   this.reelcomment = this.comment.reelcomment;
    //   this.commentEditForm = new FormControl(this.comment.reelcomment);
    // },200)
  }

  editComment() {
    let comment: ReelComment = {
      id : this.comment.id,
      reelcomment: this.commentEditForm.value!,
      reel: this.comment.reel,
      commented_by : this.comment.commented_by,
      approval : "app"
    }
    this.reelcomment = this.commentEditForm.value;
    this.rService.updateReelComment(this.comment.reel,comment).subscribe((result: ReelComment) => {
      this.comment.reelcomment = this.commentEditForm.value;
    });
  }

  private async loadData() {


    const user$ = this.authService.user()
    this.user = await lastValueFrom(user$);
    this.loggedInUserId = this.user.id;
    try {
      const profile$ = this.pService.fetchPublicProfile(this.comment.commented_by);
      this.profile = await lastValueFrom(profile$);

      const publicUser$ = this.authService.publicUser(this.comment.commented_by);
      this.publicUser = await lastValueFrom(publicUser$);
      this.fullName = this.publicUser.first_name + " " + this.publicUser.last_name;

    } catch {
      console.log("No Profile Data Found!!");

    }

    if (+this.loggedInUserId == +this.comment.commented_by) {
      this.showEditButton = true;
    }
    this.reelcomment = this.comment.reelcomment;
    this.commentEditForm = new FormControl(this.comment.reelcomment);
  }
}
