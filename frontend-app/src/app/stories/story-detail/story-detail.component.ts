import { Component, Inject, OnInit } from '@angular/core';
import { Story } from '../models/Story';
import { StoryHTTPService } from '../services/stories.service';
import { ActivatedRoute, NavigationExtras, Params, Router } from '@angular/router';
import { Observable, lastValueFrom } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReelDialogComponent } from '../reel/reel-dialog/reel-dialog.component';
import { Reel } from '../models/Reel';
import { StoryComment } from '../models/StoryComment';
import { StoryCommentItemComponent } from '../story-comment-item/story-comment-item.component';
import { StoryCommentCreateComponent } from '../story-comment-create/story-comment-create.component';
import { AuthService } from '../../auth/services/auth.service';
import * as uuid from 'uuid';
import { ReactionInfoDialogComponent } from '../reaction-info-dialog/reaction-info-dialog.component';
import { FriendHTTPService } from 'src/app/friends/services/friend.service';
import { ChatroomHTTPService } from 'src/app/webchat/services/chatroom.service';

@Component({
  selector: 'app-story-detail',
  templateUrl: './story-detail.component.html',
  styleUrls: ['./story-detail.component.css']
})

export class StoryDetailComponent implements OnInit{
  storyId!: string;
  loggedInUserId!: number;
  user: any;
  story$!: Observable<Story>;
  story!: Story;
  reels: object[] = [];
  comments: StoryComment[] = [];
  canShowButton: boolean = false;
  totalLikes: number = 0;
  totalLoves: number = 0;
  totalCelebrates: number = 0;
  likes: number[] = [];
  loves: number[] = [];
  celebrates: number[] = [];
  showLike: boolean = true;
  showLove: boolean = true;
  showCelebrate: boolean = true;
  friends$!: Observable<any[]>;
  isFriend: boolean = false;
  chatroomID!: number;
  chatroom_owner!: number;
  constructor(private router: Router, private route: ActivatedRoute,private sService: StoryHTTPService,
    private dialog: MatDialog,private authService: AuthService,private fService: FriendHTTPService,
    private chatService: ChatroomHTTPService) {}

  ngOnInit(): void {
    this.route.params
    .subscribe(
      (params: Params) => {
        this.storyId = params['id'];
        this.friends$ = this.fService.listFriends();
      }
    )

    this.loadData();

  }
  onEditStory() {
    this.router.navigate(['edit'], {relativeTo: this.route});
  }

  showReels() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = false;
    dialogConfig.minWidth = "800px";
    dialogConfig.panelClass = 'custom-modalbox';
    dialogConfig.disableClose = true;
    dialogConfig.data = this.reels;

    this.dialog.open(ReelDialogComponent, dialogConfig);
  }

  addComment() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = false;
    dialogConfig.minWidth = "800px";
    dialogConfig.disableClose = true;
    this.friends$.subscribe((friendList: any) => {
      friendList.forEach((friendItem: any) => {
        if (friendItem.id == this.loggedInUserId) {
          this.isFriend = true;
        }
      })

    })

    this.dialog.open(StoryCommentCreateComponent, dialogConfig)
      .afterClosed()
      .subscribe((val:any) => {
        if (val) {
          let comment: any = {}
          if (!!this.canShowButton) {
            comment = {
              id : uuid.v4(),
              storycomment: val.data,
              story: this.storyId,
              commented_by: this.loggedInUserId,
              approval: "app"
            }
          } else {
            comment = {
              id : uuid.v4(),
              storycomment: val.data,
              story: this.storyId,
              commented_by: this.loggedInUserId,
              approval: "rej"
            }
          }

          this.sService.addStoryComment(this.storyId,comment).subscribe(() => {
            // Update the comments array with the new comment
            const newComment: StoryComment = {
              id: comment.id,
              storycomment: comment.storycomment,
              story: comment.story,
              commented_by: comment.commented_by,
              approval: "app"
            };
            this.comments.push(newComment);
          });
        }
    });
  }
  showReactionInfo() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = false;
    dialogConfig.minWidth = "800px";
    dialogConfig.minHeight = "600px";
    dialogConfig.panelClass = 'custom-dialogbox';
    let likeObj: any = {}
    this.likes.forEach((like_user: number) => {
      let fullName;
      this.authService.publicUser(like_user).subscribe((res: any) => {
        fullName = res.first_name + " " + res.last_name;
        likeObj[like_user] = fullName
      });
    })
    let loveObj: any = {}
    this.loves.forEach((love_user: number) => {
      let fullName;
      this.authService.publicUser(love_user).subscribe((res: any) => {
        fullName = res.first_name + " " + res.last_name;

        loveObj[love_user] = fullName
      });
    })
    let celebrateObj: any = {}
    this.celebrates.forEach((celebrate_user: number) => {
      let fullName;
      this.authService.publicUser(celebrate_user).subscribe((res: any) => {
        fullName = res.first_name + " " + res.last_name;

        celebrateObj[celebrate_user] = fullName
      });
    })
    dialogConfig.data = {
      likes: likeObj,
      loves: loveObj,
      celebrates: celebrateObj,
    }
    this.dialog.open(ReactionInfoDialogComponent, dialogConfig);

  }

  private async loadData() {

    const user$ = this.authService.user()
    this.user = await lastValueFrom(user$);
    this.loggedInUserId = this.user.id;


    const comments$ = this.sService.fetchComments(this.storyId);
    this.comments = await lastValueFrom(comments$);

    this.story$ = this.sService.fetchStory(this.storyId);
    this.story = await lastValueFrom(this.story$);

    if (this.story.owner == this.loggedInUserId) {
      this.canShowButton = true;
    }

    this.story.reels.forEach((reelItem: Reel) => {
      this.reels.push({
        image: reelItem.image,
        thumbImage: reelItem.image,
        title: reelItem.caption
      })
    })
    this.story.likes?.forEach((res: any) => {
      this.likes.push(res.id);
    })
    this.story.loves?.forEach((res: any) => {
      this.loves.push(res.id);
    })
    this.story.celebrates?.forEach((res: any) => {
      this.celebrates.push(res.id);
    })

    this.totalLikes = this.likes.length;
    this.totalLoves = this.loves.length;
    this.totalCelebrates = this.celebrates.length;
    this.likes.forEach((liked_by_id: number) => {
      if (liked_by_id == +this.loggedInUserId) {
        this.showLike = false;
      }
    });
    this.loves.forEach((loved_by_id: number) => {
      if (loved_by_id == +this.loggedInUserId) {
        this.showLove = false;
      }
    });
    this.celebrates.forEach((celebrated_by_id: number) => {
      if (celebrated_by_id == +this.loggedInUserId) {
        this.showCelebrate = false;
      }
    });

    this.chatService.showChatRooms().subscribe((resp:any) => {
      if (resp) {
        resp.forEach((data:any)=>{
          if (data.story) {
            if (this.storyId == data.story && this.story.owner == this.loggedInUserId) {

              this.chatroom_owner = data.owner;
              data.participants.forEach((participant:any)=>{
                if (participant.id === this.loggedInUserId) {
                  this.chatroomID = data.id;
                  console.log("Has Chatroom");
                }
              })
            }
          }
        })
      }
    })
  }

  goToChatRoom() {
    const navigationExtras: NavigationExtras = {state: {object_type: "story",object_id:this.storyId,chatroom_owner: this.chatroom_owner}};
    this.router.navigate(['/chat/' + this.chatroomID],navigationExtras);
  }

}

