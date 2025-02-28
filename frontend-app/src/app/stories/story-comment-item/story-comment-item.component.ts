import { Component, Input, OnInit } from '@angular/core';
import { StoryComment } from '../models/StoryComment';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StoryHTTPService } from '../services/stories.service';
import { ProfileHTTPService } from 'src/app/auth/services/profile.service';
import { Profile } from 'src/app/auth/models/profile';
import { lastValueFrom } from 'rxjs';
@Component({
  selector: 'app-story-comment-item',
  templateUrl: './story-comment-item.component.html',
  styleUrls: ['./story-comment-item.component.css']
})
export class StoryCommentItemComponent implements OnInit{
  @Input() comment!: StoryComment;
  @Input() index!: number;
  loggedInUserId!: number ;
  showEditButton: boolean = false;
  commentEditForm : any;
  storycomment: string = "";
  fullName: string = "";
  profile!: Profile;
  user: any;
  publicUser: any;
  constructor(private authService: AuthService, private sService: StoryHTTPService, private pService: ProfileHTTPService) {}
  ngOnInit() {

    this.loadData();
    // setTimeout(() => {

    //   this.authService.user().subscribe((user: any) => {
    //     this.loggedInUserId = +user.id;

    //   })
    // },50)
    // setTimeout(() => {
    //   this.pService.fetchPublicProfile(this.comment.commented_by).subscribe((res: any) => {
    //     this.profile = {...res};
    //   })
    // }, 100);
    // setTimeout(() => {
    //   this.authService.publicUser(this.comment.commented_by).subscribe((res: any) => {
    //     this.fullName = res.first_name + " " + res.last_name;
    //   })
    // }, 100);
    // setTimeout(() => {

    //   if (+this.loggedInUserId == +this.comment.commented_by) {
    //     this.showEditButton = true;
    //   }
    //   this.storycomment = this.comment.storycomment;
    //   this.commentEditForm = new FormControl(this.comment.storycomment);
    // },250)
  }

  editComment() {
    let comment: StoryComment = {
      id : this.comment.id,
      storycomment: this.commentEditForm.value!,
      story: this.comment.story,
      commented_by : this.comment.commented_by,
      approval: "app"
    }
    this.storycomment = this.commentEditForm.value;
    this.sService.updateComment(this.comment.story,comment).subscribe((result: StoryComment) => {
      this.comment.storycomment = this.commentEditForm.value;
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
    this.storycomment = this.comment.storycomment;
    this.commentEditForm = new FormControl(this.comment.storycomment);
  }

}
