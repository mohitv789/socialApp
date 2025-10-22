import { Component, OnInit } from '@angular/core';
import { Observable, firstValueFrom, lastValueFrom } from 'rxjs';
import { Story } from '../../models/Story';
import { ReelDialogComponent } from '../../reel/reel-dialog/reel-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, NavigationExtras, Params, Router } from '@angular/router';
import { StoryHTTPService } from '../../services/stories.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StoryComment } from '../../models/StoryComment';
import { StoryCommentCreateComponent } from '../../story-comment-create/story-comment-create.component';
import * as uuid from 'uuid';
import { ReactionInfoDialogComponent } from '../../reaction-info-dialog/reaction-info-dialog.component';
import { FriendHTTPService } from 'src/app/friends/services/friend.service';
import { ProfileHTTPService } from 'src/app/auth/services/profile.service';
import { Profile } from 'src/app/auth/models/profile';
import { ChatroomDialogComponent } from 'src/app/webchat/chatroom-dialog/chatroom-dialog.component';
import { ChatroomHTTPService } from 'src/app/webchat/services/chatroom.service';
@Component({
  selector: 'app-pushed-detail',
  templateUrl: './pushed-detail.component.html',
  styleUrls: ['./pushed-detail.component.css']
})
export class PushedDetailComponent implements OnInit{
  likes: number[] = [];
  loves: number[] = [];
  celebrates: number[] = [];
  storyId!: string;
  user: any;
  story$!: Observable<Story>;
  story!: Story;
  loggedInUserId!: number;
  comments: any[] = [];
  totalLikes: number = 0;
  totalLoves: number = 0;
  totalCelebrates: number = 0;
  showLike: boolean = true;
  showLove: boolean = true;
  showCelebrate: boolean = true;
  storyOwner!: number;
  friends$!: Observable<any[]>;
  isFriend: boolean = false;
  loggedInEmail: string = "";
  profile!: Profile;
  fullName: string = "";
  publicUser: any;
  friends: any;
  chatroomID!: number;
  showINITChatroom: boolean = true;
  canshowJoinChatroom: boolean = false;
  showLeaveChatroom: boolean = false;
  chatroom_membership: boolean = false;
  can_delete_charoom: boolean = false;
  chatroom_owner!:number;
  isBlockingResult: any;
  isBlocking: boolean = false;
  constructor(private route: ActivatedRoute,private sService: StoryHTTPService, private router: Router,
    private dialog: MatDialog,private authService: AuthService, private chatService: ChatroomHTTPService,
    private fService: FriendHTTPService, private pService: ProfileHTTPService) {}

  ngOnInit(): void {
    this.route.params
      .subscribe(
        (params: Params) => {
          this.storyId = params['storyId'];
        }
      )

      this.loadData();

  }

  addComment() {
    const dialogConfig = new MatDialogConfig();
    
    dialogConfig.panelClass = ['comment-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;

    this.dialog.open(StoryCommentCreateComponent, dialogConfig)
      .afterClosed()
      .subscribe((val:any) => {
        if (val) {
          let comment: any = {}
          if (!!this.isFriend) {
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
            const newComment: any = {
              id: comment.id,
              storycomment: comment.storycomment,
              story: comment.story,
              commented_by: comment.commented_by,
              approval: "app"
            };
            this.comments.push(newComment);
          });
        }
      }
    )
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

// Maintain reaction local copy
  addLike() {

    this.sService.addStoryLike(this.storyId).subscribe(() => {
      if (!this.likes.includes(this.loggedInUserId)) {
        this.totalLikes += 1;
        this.likes.push(this.loggedInUserId);
      }
      this.showLike = false;
    });

  }
  addLove() {

    this.sService.addStoryLove(this.storyId).subscribe(() => {
      if (!this.loves.includes(this.loggedInUserId)) {
        this.totalLoves += 1;
        this.loves.push(this.loggedInUserId);
      }
      this.showLove = false;
    });
  }
  addCelebrate() {

    this.sService.addStoryCelebrate(this.storyId).subscribe(() => {
      if (!this.celebrates.includes(this.loggedInUserId)) {
        this.totalCelebrates += 1;
        this.celebrates.push(this.loggedInUserId);
      }
    });
    this.showCelebrate = false;
  }

  deleteLike() {
    this.sService.removeStoryLike(this.storyId).subscribe(() => {
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
    this.sService.removeStoryLove(this.storyId).subscribe(() => {
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
    this.sService.removeStoryCelebrate(this.storyId).subscribe(() => {
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


  private async loadData() {


    const user$ = this.authService.user()
    this.user = await lastValueFrom(user$);
    this.loggedInUserId = this.user.id;
    this.loggedInEmail = this.user.email;


    this.story$ = this.sService.fetchFeedStory(this.storyId);
    this.story = await lastValueFrom(this.story$);
    this.storyOwner = this.story.owner;
    try {
      const publicUser$ = this.authService.publicUser(this.storyOwner);
      this.publicUser = await lastValueFrom(publicUser$);
      this.fullName = this.publicUser.first_name + " " + this.publicUser.last_name;
      const profile$ = this.pService.fetchPublicProfile(this.storyOwner);
      this.profile = await lastValueFrom(profile$);
    } catch {
      console.log("No Profile Data Found!!");

    }

    this.friends$ = this.fService.listFriends();

    this.friends = await lastValueFrom(this.friends$)
    this.friends.forEach((friend: any) => {
      if (friend.id ===this.storyOwner) {
        this.isFriend = true;
      }
    })

    const comments$ = this.sService.fetchComments(this.storyId);
    this.comments = await lastValueFrom(comments$);

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

    // try {
    //   this.pService.findisBlocking(this.storyOwner).subscribe((msg:any)=>{
    //     if (!!msg) {
    //       console.log(msg);

    //       this.isBlocking = true;
    //     }
    //   });

    // } catch (error) {
    //   console.log(error);
    // }

    this.loadChatRelatedData();
  }

  private async loadChatRelatedData() {
    this.chatService.showChatRooms().subscribe((resp:any) => {
      if (resp) {
        resp.forEach((data:any)=>{
          if (!!data.story) {
            if (this.storyId == data.story) {
              this.chatroom_owner = data.owner;
              // Checked for participants of chatroom
              data.participants.forEach((participant:any)=>{
                if (participant.id == this.loggedInUserId) {
                  this.showINITChatroom = false;
                  this.chatroomID = data.id;

                }
              })
              // checked for ownership of story being same as visitng user
              if (this.story.owner == +this.loggedInUserId) {
                this.chatroom_membership = false;
                this.canshowJoinChatroom = false;
                this.showLeaveChatroom = false;
                this.showINITChatroom = false;
              } else {
                // checked for story owner being friend of visitng user and not in participant list
                this.fService.isFriend(this.storyOwner).subscribe((resp:any)=>{

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
              // Think how chat admin can block
              // try {
              //   this.pService.isBlocking(data.owner).subscribe((msg:any)=>{
              //     if (!!msg) {
              //       console.log(msg);
              //       this.isBlocking = true;
              //     }
              //   });

              // } catch (error) {
              //   console.log(error);
              // }
            }
          }
        })
      }
    });
  }
  createStoryChatRoom() {
    const dialogConfig = new MatDialogConfig();
    
    dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
    let storyObj: any = {}
    storyObj = {...this.story}
    dialogConfig.data = {
      status: "creating",
      story: storyObj
    }
    this.dialog.open(ChatroomDialogComponent, dialogConfig)
      .afterClosed()
      .subscribe(val => {
        if (!!val.start) {
          let story_chatroom_post_object = {};
          let participants : any[] = []
          participants.push(this.loggedInUserId);
          participants.push(this.story.owner);
          story_chatroom_post_object = {
            "participants": participants,
            "story": this.story.id
          }
          this.chatService.startChatRoom(story_chatroom_post_object).subscribe((resp: any) => {
            if (!!resp["id"]) {
              const navigationExtras: NavigationExtras = {state: {object_type: "story",object_id:this.storyId,chatroom_owner: this.loggedInUserId}};
              this.router.navigate(['/chat/' + resp["id"]],navigationExtras);
            } else {
              console.log(resp);
            }
          });
        }
    });

  }

  goToChatRoom() {
    const navigationExtras: NavigationExtras = {state: {object_type: "story",object_id:this.storyId,chatroom_owner: this.chatroom_owner}};
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
        let storyObj: any = {}
        storyObj = {...this.story}
        dialogConfig.data = {
          status: "adding",
          story: storyObj
        }
        this.dialog.open(ChatroomDialogComponent, dialogConfig)
          .afterClosed()
          .subscribe(val => {
            if (!!val.start) {
              this.goToChatRoom();
            }})
      } else if (resp["error"] === "User is already a member") {
        console.log(resp["error"]);
      } else {
        console.log(resp);
      }
    });
  }
  leaveChatRoom() {
    this.chatService.leaveserver(this.chatroomID).subscribe((resp:any)=>{
      if (resp["message"] === "User removed from Chatroom..."){
        this.chatroom_membership = false;
        this.showLeaveChatroom = false;
        this.canshowJoinChatroom = true;
      } else if (resp["error"] === "User is not a member") {
        console.log(resp["error"]);
      } else if (resp["error"] === "Owners cannot be removed as a member") {
        console.log(resp["error"]);
      } else {
        console.log(resp);
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
