import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Params, Router } from '@angular/router';
import {ReelsHTTPService} from "../../services/reels.service";
import { Observable, lastValueFrom, of } from 'rxjs';
import { Reel } from '../../models/Reel';
import * as uuid from 'uuid';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReelCommentCreateComponent } from '../../reel-comment-create/reel-comment-create.component';
import { ReelComment } from '../../models/ReelComment';
import { AuthService } from '../../../auth/services/auth.service';
import { ReactionInfoDialogComponent } from '../../reaction-info-dialog/reaction-info-dialog.component';
import { FriendHTTPService } from 'src/app/friends/services/friend.service';
import { ImageEditorComponent } from '../../image-editor/image-editor.component';
import { ChatroomHTTPService } from 'src/app/webchat/services/chatroom.service';
@Component({
  selector: 'app-reel-detail',
  templateUrl: './reel-detail.component.html',
  styleUrls: ['./reel-detail.component.css']
})
export class ReelDetailComponent implements OnInit{
  reelId!: string;
  reel$!: Observable<Reel>;
  reel!: Reel;
  comments: ReelComment[] = [];
  loggedInUserId!: number;
  likes: number[] = [];
  loves: number[] = [];
  celebrates: number[] = [];
  totalLikes: number = 0;
  totalLoves: number = 0;
  totalCelebrates: number = 0;
  showLike: boolean = true;
  showLove: boolean = true;
  showCelebrate: boolean = true;
  friends$!: Observable<any[]>;
  isFriend: boolean = false;
  canShowButton: boolean = false;
  storyId!: string;
  reelData: any = {}
  user: any;
  chatroomID!:number;
  chatroom_owner!:number;
  constructor(private route: ActivatedRoute,private router: Router,private rService: ReelsHTTPService,private dialog: MatDialog,private authService: AuthService,private fService: FriendHTTPService,private cdr: ChangeDetectorRef,
    private chatService: ChatroomHTTPService) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation!.extras.state as {example: string};
    this.storyId = state.example;
  }

  ngOnInit(): void {
    this.route.params
      .subscribe(
        (params: Params) => {
          this.reelId = params['reelId'];
        }
      )

    console.log(this.storyId);

    this.loadData();

  }


  addComment() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['comment-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;

    this.dialog.open(ReelCommentCreateComponent, dialogConfig)
      .afterClosed()
      .subscribe((val:any) => {
        if (val) {
          let comment: any = {}
          if (!!this.canShowButton) {
            comment = {
              id : uuid.v4(),
              reelcomment: val.data,
              reel: this.reelId,
              commented_by: this.loggedInUserId,
              approval: "app"
            }
          } else {
            comment = {
              id : uuid.v4(),
              reelcomment: val.data,
              reel: this.reelId,
              commented_by: this.loggedInUserId,
              approval: "rej"
            }
          }
          this.rService.addReelComment(this.reelId,comment).subscribe(() => {
            // Update the comments array with the new comment
            const newComment: ReelComment = {
              id : uuid.v4(),
              reelcomment: val.data,
              reel: this.reelId,
              commented_by: this.loggedInUserId,
              approval: "app"
            };
            this.comments.push(newComment);
          });

        }
    });
  }
  showReactionInfo() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['reaction-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
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
  deleteReel() {
    this.rService.deleteReel(this.reelId).subscribe(() => {
      this.router.navigate(["story/" , this.storyId]);
    })
  }
  editReel() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
    if (!this.reelData["image"].split(":")[0]) {
      this.reelData["image"] = "http://localhost:4500/" + this.reelData["image"];
    }
    dialogConfig.data = {
      id: this.reelData["id"],
      image: this.reelData["image"],
      caption: this.reelData["caption"]
    }
    this.dialog.open(ImageEditorComponent, dialogConfig)
      .afterClosed()
      .subscribe(val => {
        if (val) {
          console.log(val);

          this.ngOnInit();
        }
    });
  }


  private async loadData() {


    const user$ = this.authService.user()
    this.user = await lastValueFrom(user$);
    this.loggedInUserId = this.user.id;


    this.reel$ = this.rService.fetchReel(this.reelId);
    this.reel = await lastValueFrom(this.reel$);

    if (this.reel.reel_owner == this.loggedInUserId) {
      this.canShowButton = true;
    }
    this.reelData.id = this.reel.id;
    this.reelData.caption = this.reel.caption;
    this.reelData.image = this.reel.image;

    this.friends$ = this.fService.listFriends();

    const comments$ = this.rService.fetchReelComments(this.reelId);
    this.comments = await lastValueFrom(comments$);

    this.reel.likes?.forEach((res: any) => {
      this.likes.push(res.id);
    })
    this.reel.loves?.forEach((res: any) => {
      this.loves.push(res.id);
    })
    this.reel.celebrates?.forEach((res: any) => {
      this.celebrates.push(res.id);
    })

    this.totalLikes = this.likes.length;
    this.totalLoves = this.loves.length;
    this.totalCelebrates = this.celebrates.length;
    this.likes.forEach((liked_by_id: number) => {
      if (liked_by_id == +this.loggedInUserId) {
        this.showLike = false;
      } else {
        console.log(liked_by_id);
      }
    });
    this.loves.forEach((loved_by_id: number) => {
      if (loved_by_id == +this.loggedInUserId) {
        this.showLove = false;
      } else {
        console.log(loved_by_id);
      }
    });
    this.celebrates.forEach((celebrated_by_id: number) => {
      if (celebrated_by_id == +this.loggedInUserId) {
        this.showCelebrate = false;
      } else {
        console.log(celebrated_by_id);
      }
    });


    this.chatService.showChatRooms().subscribe((resp:any) => {
      if (resp) {
        resp.forEach((data:any)=>{
          if (data.reel) {
            if (this.reelId == data.reel  && this.reel.reel_owner == this.loggedInUserId) {
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
