import { Component, OnInit } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { Reel } from '../../models/Reel';
import { ActivatedRoute, NavigationExtras, Params, Router } from '@angular/router';
import { ReelsHTTPService } from '../../services/reels.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AuthService } from '../../../auth/services/auth.service';
import { ReelComment } from '../../models/ReelComment';
import { ReelCommentCreateComponent } from '../../reel-comment-create/reel-comment-create.component';
import * as uuid from 'uuid';
import { ReactionInfoDialogComponent } from '../../reaction-info-dialog/reaction-info-dialog.component';
import { FriendHTTPService } from 'src/app/friends/services/friend.service';
import { ChatroomHTTPService } from 'src/app/webchat/services/chatroom.service';
import { ChatroomDialogComponent } from 'src/app/webchat/chatroom-dialog/chatroom-dialog.component';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-pushed-reel-detail',
  templateUrl: './pushed-reel-detail.component.html',
  styleUrls: ['./pushed-reel-detail.component.css']
})
export class PushedReelDetailComponent implements OnInit{

  reelId!: string;
  reel$!: Observable<Reel>;
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
  fullName: string = "";
  reelOwner!: number;
  isFriend: boolean = false;
  friends$!: Observable<any[]>;
  user: any;
  reel!: Reel;
  friends!: any[];
  publicUser: any;
  showreactionAction: boolean = true;
  can_delete_charoom: boolean = false;
  chatroomID!: number;
  showINITChatroom: boolean = true;
  canshowJoinChatroom: boolean = false;
  showLeaveChatroom: boolean = false;
  chatroom_membership: boolean = false;
  chatroom_owner!:number;
  constructor(private route: ActivatedRoute,private rService: ReelsHTTPService,private dialog: MatDialog,private router: Router,
    private authService: AuthService,private fService: FriendHTTPService, private chatService: ChatroomHTTPService,
    private cd: ChangeDetectorRef,) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe((params: Params) => {
      this.reelId = params['reelId'];
    });
    try {
      await this.loadData();
    } catch (err) {
      console.error('loadData error', err);
    }
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
          if (!!this.isFriend) {
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
              id: comment.id,
              reelcomment: comment.reelcomment,
              reel: comment.reel,
              commented_by: comment.commented_by,
              approval: "app"
            };
            this.comments.push(newComment);
            this.cd.markForCheck();
          });
        }
      }
    )
  }

  

  addLike() {

    this.rService.addReelLike(this.reelId).subscribe(() => {
      if (!this.likes.includes(this.loggedInUserId)) {
        this.totalLikes += 1;
        this.likes.push(this.loggedInUserId);
      }
      this.showLike = false;
    });

  }
  addLove() {

    this.rService.addReelLove(this.reelId).subscribe(() => {
      if (!this.loves.includes(this.loggedInUserId)) {
        this.totalLoves += 1;
        this.loves.push(this.loggedInUserId);
      }
      this.showLove = false;
    });
  }
  addCelebrate() {

    this.rService.addReelCelebrate(this.reelId).subscribe(() => {
      if (!this.celebrates.includes(this.loggedInUserId)) {
        this.totalCelebrates += 1;
        this.celebrates.push(this.loggedInUserId);
      }
    });
    this.showCelebrate = false;
  }

  deleteLike() {
    this.rService.removeReelLike(this.reelId).subscribe(() => {
      if (this.likes.includes(this.loggedInUserId)) {
        this.totalLikes -= 1;
        this.likes.forEach((userId:number,index:number) => {
          if (this.loggedInUserId == userId) {
            this.likes.splice(index, 1);
          }
        })
      }
    });
    this.showLike = true;
  }
  deleteLove() {
    this.rService.removeReelLove(this.reelId).subscribe(() => {
      if (this.loves.includes(this.loggedInUserId)) {
        this.totalLoves -= 1;
        this.loves.forEach((userId:number,index:number) => {
          if (this.loggedInUserId == userId) {
            this.loves.splice(index, 1);
          }
        })
      }
    });
    this.showLove = true;
  }
  deleteCelebrate() {
    this.rService.removeReelCelebrate(this.reelId).subscribe(() => {
      if (this.celebrates.includes(this.loggedInUserId)) {
        this.totalCelebrates -= 1;
        this.celebrates.forEach((userId:number,index:number) => {
          if (this.loggedInUserId == userId) {
            this.celebrates.splice(index, 1);
          }
        })
      }
    });
    this.showCelebrate = true;
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

  // private async loadData() {


  //   const user$ = this.authService.user()
  //   this.user = await lastValueFrom(user$);
  //   this.loggedInUserId = this.user.id;


  //   this.reel$ = this.rService.fetchReelforFeed(this.reelId);
  //   this.reel = await lastValueFrom(this.reel$);
  //   this.reelOwner = this.reel.reel_owner;
  //   if (this.reelOwner === +this.loggedInUserId) {
  //     this.showreactionAction = false;
  //   }
  //   const publicUser$ = this.authService.publicUser(this.reelOwner);
  //   this.publicUser = await lastValueFrom(publicUser$);
  //   this.fullName = this.publicUser.first_name + " " + this.publicUser.last_name;

  //   this.friends$ = this.fService.listFriends();
  //   this.friends = await lastValueFrom(this.friends$)
  //   this.friends.forEach((friend: any) => {
  //     if (friend.id ===this.reelOwner) {
  //       this.isFriend = true;
  //     }
  //   })


  //   const comments$ = this.rService.fetchReelComments(this.reelId);
  //   this.comments = await lastValueFrom(comments$);

  //   this.reel.likes?.forEach((res: any) => {
  //     this.likes.push(res.id);
  //   })
  //   this.reel.loves?.forEach((res: any) => {
  //     this.loves.push(res.id);
  //   })
  //   this.reel.celebrates?.forEach((res: any) => {
  //     this.celebrates.push(res.id);
  //   })

  //   this.totalLikes = this.likes.length;
  //   this.totalLoves = this.loves.length;
  //   this.totalCelebrates = this.celebrates.length;
  //   this.likes.forEach((liked_by_id: number) => {
  //     if (liked_by_id == +this.loggedInUserId) {
  //       this.showLike = false;
  //     } else {
  //       console.log(liked_by_id);
  //     }
  //   });
  //   this.loves.forEach((loved_by_id: number) => {
  //     if (loved_by_id == +this.loggedInUserId) {
  //       this.showLove = false;
  //     } else {
  //       console.log(loved_by_id);
  //     }
  //   });
  //   this.celebrates.forEach((celebrated_by_id: number) => {
  //     if (celebrated_by_id == +this.loggedInUserId) {
  //       this.showCelebrate = false;
  //     } else {
  //       console.log(celebrated_by_id);
  //     }
  //   });

  //   this.loadChatRelatedData();
  // }

  // 

  private async loadData() {
  // get user
    const user$ = this.authService.user();
    this.user = await lastValueFrom(user$);
    this.loggedInUserId = this.user.id;

    // fetch reel (observable + concrete object)
    this.reel$ = this.rService.fetchReelforFeed(this.reelId);
    this.reel = await lastValueFrom(this.reel$);
    this.reelOwner = Number(this.reel.reel_owner);

    // hide reaction controls if owner
    if (this.reelOwner === this.loggedInUserId) {
      this.showreactionAction = false;
    }

    // public user
    const publicUser$ = this.authService.publicUser(this.reelOwner);
    this.publicUser = await lastValueFrom(publicUser$);
    this.fullName = `${this.publicUser.first_name} ${this.publicUser.last_name}`;

    // friends: set local array & lookup
    this.friends$ = this.fService.listFriends();
    this.friends = await lastValueFrom(this.friends$);
    this.isFriend = this.friends.some((f: any) => Number(f.id) === this.reelOwner);

    // comments
    const comments$ = this.rService.fetchReelComments(this.reelId);
    this.comments = await lastValueFrom(comments$);

    // reactions arrays
    this.likes = [];
    this.loves = [];
    this.celebrates = [];
    (this.reel.likes || []).forEach((res: any) => this.likes.push(Number(res.id)));
    (this.reel.loves || []).forEach((res: any) => this.loves.push(Number(res.id)));
    (this.reel.celebrates || []).forEach((res: any) => this.celebrates.push(Number(res.id)));

    this.totalLikes = this.likes.length;
    this.totalLoves = this.loves.length;
    this.totalCelebrates = this.celebrates.length;

    this.showLike = !this.likes.includes(this.loggedInUserId);
    this.showLove = !this.loves.includes(this.loggedInUserId);
    this.showCelebrate = !this.celebrates.includes(this.loggedInUserId);

    // load chatroom related info
    await this.loadChatRelatedData();

    // ensure template updates (important if OnPush or complex async)
    this.cd.markForCheck();
  }

  // ---- replace loadChatRelatedData with this version ----
  // private async loadChatRelatedData() {
  //   try {
  //     const resp: any = await lastValueFrom(this.chatService.showChatRooms());
  //     if (!Array.isArray(resp)) return;

  //     // default flags
  //     this.chatroomID = -1;
  //     this.chatroom_owner = -1;
  //     this.chatroom_membership = false;
  //     this.canshowJoinChatroom = false;
  //     this.showINITChatroom = true;
  //     this.showLeaveChatroom = false;
  //     this.can_delete_charoom = false;

  //     for (const data of resp) {
  //       // only consider entries that reference a reel
  //       if (!data || data.reel == null) continue;

  //       // data.reel may be number or string, compare as strings
  //       if (String(data.reel) !== String(this.reelId)) continue;

  //       // matched
  //       this.chatroom_owner = Number(data.owner);
  //       this.chatroomID = Number(data.id);

  //       // determine if current user is participant
  //       const participantIds = (data.participants || []).map((p: any) => Number(p.id));
  //       const amMember = participantIds.includes(this.loggedInUserId);
  //       this.chatroom_membership = amMember;

  //       // if the visiting user is owner of the reel, don't show join/init
  //       if (Number(this.reel.reel_owner) === this.loggedInUserId) {
  //         this.showINITChatroom = false;
  //         this.canshowJoinChatroom = false;
  //         this.showLeaveChatroom = false;
  //       } else {
  //         // only show join hint if the reel owner is your friend and you're not already a member
  //         if (!amMember) {
  //           // reuse existing friend check (isFriend was computed in loadData)
  //           if (this.isFriend) {
  //             this.showINITChatroom = false;
  //             this.canshowJoinChatroom = true;
  //           }
  //         } else {
  //           this.showLeaveChatroom = true;
  //         }
  //       }

  //       // ownership grants delete permission
  //       if (Number(data.owner) === this.loggedInUserId) {
  //         this.can_delete_charoom = true;
  //       }

  //       // once we've found the matching room for this reel, break (assuming single room per reel)
  //       break;
  //     }

  //     // ensure view updates
  //     this.cd.markForCheck();
  //   } catch (err) {
  //     console.error('loadChatRelatedData error', err);
  //   }
  // }

  private async loadChatRelatedData() {
    this.chatService.showChatRooms().subscribe((resp:any) => {
      if (resp) {
        resp.forEach((data:any)=>{
          if (!!data.reel) {
            if (this.reelId == data.reel) {

              this.chatroom_owner = data.owner;
              console.log("Matched!");
              // Checked for participants of chatroom
              data.participants.forEach((participant:any)=>{
                if (participant.id == this.loggedInUserId) {
                  this.showINITChatroom = false;
                  this.chatroomID = data.id;
                  console.log("Member: ",participant.id);
                }
              })
              // checked for ownership of story being same as visitng user
              if (this.reel.reel_owner == +this.loggedInUserId) {
                this.chatroom_membership = false;
                this.canshowJoinChatroom = false;
                this.showLeaveChatroom = false;
                this.showINITChatroom = false;
              } else {
                // checked for story owner being friend of visitng user and not in participant list
                this.fService.isFriend(this.reelOwner).subscribe((resp:any)=>{
                  console.log(resp);
                  if (!!resp["is_friend"]) {
                    this.showINITChatroom = false;
                    this.canshowJoinChatroom = true;
                    this.chatroomID = data.id;
                    console.log("Is Friend but not in chatroom!");
                  }
                })
              }
              // checked for visitng user being a member of chatroom
              this.chatService.isMember(data.id).subscribe((resp:any)=>{
                this.chatroom_membership = resp["is_member"]
                if (!!this.chatroom_membership) {
                  this.showLeaveChatroom = true;
                }
              })
              if (data.owner == this.loggedInUserId) {
                this.can_delete_charoom = true;
              }
            }
          }
        })
      }
    });
  }
  // ---- small cleanup in addComment: do NOT resubscribe to friends$ there ----
  
  createReelChatRoom() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
    let reelObj: any = {}
    reelObj = {...this.reel}
    dialogConfig.data = {
      status: "creating",
      reel: reelObj
    }
    this.dialog.open(ChatroomDialogComponent, dialogConfig)
      .afterClosed()
      .subscribe(val => {
        if (!!val.start) {
          let reel_chatroom_post_object = {};
          let participants : any[] = []
          participants.push(this.loggedInUserId);
          participants.push(this.reel.reel_owner);
          reel_chatroom_post_object = {
            "participants": participants,
            "reel": this.reel.id
          }
          this.chatService.startChatRoom(reel_chatroom_post_object).subscribe((resp: any) => {
            if (!!resp["id"]) {
              const navigationExtras: NavigationExtras = {state: {object_type: "reel",object_id:this.reelId,chatroom_owner: this.loggedInUserId}};
              this.router.navigate(['/chat/' + resp["id"]],navigationExtras);
            } else {
              console.log(resp);
            }
          });
        }
    });

  }

  goToChatRoom() {
    const navigationExtras: NavigationExtras = {state: {object_type: "reel",object_id:this.reelId,chatroom_owner: this.chatroom_owner}};
    console.log(navigationExtras);

    this.router.navigate(['/chat/' + this.chatroomID],navigationExtras);
  }

  joinChatRoom() {
    this.chatService.joinserver(this.chatroomID).subscribe((resp:any)=>{
      if (resp["message"] === "User joined Chatroom successfully"){
        this.chatroom_membership = true;
        this.showLeaveChatroom = true;
        this.canshowJoinChatroom = false;
        const dialogConfig = new MatDialogConfig();
        
        dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
        dialogConfig.hasBackdrop = false;
        dialogConfig.disableClose = true;
        let reelObj: any = {}
        reelObj = {...this.reel}
        dialogConfig.data = {
          status: "adding",
          reel: reelObj
        }
        this.dialog.open(ChatroomDialogComponent, dialogConfig)
          .afterClosed()
          .subscribe(val => {
            if (!!val.start) {
              this.goToChatRoom();
            }})
      }
    });
  }
  leaveChatRoom() {
    this.chatService.leaveserver(this.chatroomID).subscribe((resp:any)=>{
      if (resp["message"] === "User removed from Chatroom..."){
        this.chatroom_membership = false;
        this.showLeaveChatroom = false;
        this.canshowJoinChatroom = true;
      }
    });
  }

  deleteChatroom() {
    this.chatService.removeChatRoom(this.chatroomID).subscribe((resp)=>{
      console.log(resp);
      this.router.navigate(['/feed/']);
    });
  }
}
