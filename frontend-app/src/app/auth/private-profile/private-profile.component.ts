import { Component, OnInit } from '@angular/core';
import { Profile } from '../models/profile';
import { ProfileHTTPService } from '../services/profile.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PrivateProfileCreateComponent } from './private-profile-create/private-profile-create.component';
import * as uuid from 'uuid';
import { AuthService } from '../services/auth.service';
import { NavigationExtras, Router } from '@angular/router';
import { ProfileFileTransferService } from '../services/profile-file-transfer.service';
import { lastValueFrom } from 'rxjs';
import { ChatroomHTTPService } from 'src/app/webchat/services/chatroom.service';
import { StoryHTTPService } from 'src/app/stories/services/stories.service';
import { ReelsHTTPService } from 'src/app/stories/services/reels.service';
import { Story } from 'src/app/stories/models/Story';
import { Reel } from 'src/app/stories/models/Reel';

@Component({
  selector: 'app-private-profile',
  templateUrl: './private-profile.component.html',
  styleUrls: ['./private-profile.component.css']
})
export class PrivateProfileComponent implements OnInit{
  profile!: Profile;
  profileId!: string;
  loggedInUserId!: number;
  isAuth: boolean = false;
  showProfileAdd: boolean = false;
  showProfileEdit: boolean = false;
  profileAvailable: boolean = false;
  fullname : string = "";
  pendingRequests: any = [];
  friends: any = [];
  emailId: string = "";
  selectedProfileAvatar!: File;
  storyfeeddata: any;
  reelfeeddata: any;
  storycommentdata: any;
  reelcommentdata: any;
  s_activity:any = []
  r_activity:any = []
  chatrooms: any[] = []
  related_chatrooms: any[] = []
  constructor(private pService: ProfileHTTPService,private dialog: MatDialog,private authService: AuthService,
    private router: Router,private pFileTransferService: ProfileFileTransferService,
    private chatService: ChatroomHTTPService,private sService: StoryHTTPService, private rService: ReelsHTTPService) {}

  ngOnInit(): void {

    this.authService.user().subscribe((user: any) => {
      this.loggedInUserId = +user.id;
      this.fullname = user.first_name + " " + user.last_name;
      this.emailId = user.email;

    })

    this.isAuth = !!AuthService.authEmitter;
    this.loadChatroomData();
    this.loadPersonalStoryChatroom();
    this.loadPersonalReelChatroom();
    this.pService.fetchPrivateProfile().subscribe((res: any) => {

      if (res.length > 0) {
        this.profile = {...res[0]};
        this.profileAvailable = true;
        this.showProfileEdit = true;
      } else {
        this.profileAvailable = false;
        this.showProfileAdd = true;
      }
    });

    setTimeout(() => {
      this.loadFriendStates();
      this.loadFeedData();
    }, 100);

    setTimeout(() => {
      this.s_activity.sort((a:any, b:any) => {
        a.story.updated_at.localeCompare(b.story.updated_at);
      })
      this.r_activity.sort((a:any, b:any) => {
        a.reel.updated_at.localeCompare(b.reel.updated_at);
      })
    }, 300);

    this.visitedItem();
  }

  addProfile() {
    if (this.dialog.openDialogs.length > 0) {
      this.dialog.closeAll();
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['creation-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
    this.dialog.open(PrivateProfileCreateComponent, dialogConfig)
      .afterClosed()
      .subscribe((val:any) => {
        if (val) {
          console.log(val.data);
          const imageformData = new FormData();
          imageformData.append('avatar', this.pFileTransferService.avatar!);
          let profile: any = {
            id : uuid.v4(),
            gender: val.data.gender,
            status: val.data.status,
            city: val.data.city,
            bio: val.data.bio,
            url: val.data.url,
            user: this.loggedInUserId
          }
          console.log(profile);

          this.pService.addProfile(profile).subscribe((result:any) => {
            this.pService.addProfileImage(result.id,imageformData).subscribe((resp:any) => {
              console.log(resp);
              this.pFileTransferService.avatar = null;

            });
          });
        }
      });
  }

  onEditProfile() {


    this.router.navigate(["profile/personal" , this.profile.id]);
  }


  //  For Below 3 think on how to refresh on the go !!!

  acceptRequest(requestId: number) {
    this.pService.acceptFriendRequest(
      {
        "id":requestId,
      }).subscribe(()=>this.ngOnInit());
  }

  rejectRequest(requestId: number) {
    this.pService.rejectFriendRequest(
      {
        "id":requestId,
      }).subscribe(()=>this.ngOnInit());
  }

  removeFriend(userId: number) {
    this.pService.removeFriend(
      {
        "to_user":userId
      }).subscribe();
  }

  goToFriendDetail(friendId:number) {
    this.router.navigateByUrl('/friends/' + friendId);
  }

  yourPublicProfile() {
    this.router.navigateByUrl('/profile/' + this.loggedInUserId);
  }

  goToStoryDetail(storyId: string) {
    this.router.navigateByUrl('/story/' + storyId);
  }

  goToReelDetail(reelId: string) {
    this.router.navigateByUrl('/feed/reel/' + reelId);
  }

  goToPublicProfile(userId: any) {
    this.router.navigateByUrl('/profile/' + userId);
  }


  private async loadFriendStates() {

    const pendingRequests$ = this.pService.pendingReceivedFriendRequests();
    this.pendingRequests = await lastValueFrom(pendingRequests$);

    const friends$ = this.pService.listFriends();
    this.friends = await lastValueFrom(friends$);

  }

  private async loadFeedData() {

    const storyfeed$ = this.pService.fetchStoryReactionActivityFeed();
    try {
      this.storyfeeddata = await lastValueFrom(storyfeed$);
      if (!!this.storyfeeddata) {
        this.storyfeeddata.forEach((dataItem: any) => {
          let obj1:any = {}

          obj1["activityUserID"] = dataItem.doneByUser;
          obj1["activityUser"] = dataItem.fullname;
          obj1["story"] = dataItem.story;
          if (dataItem.action === "Liked" || dataItem.action === "Loved" || dataItem.action === "Celebrated")
            {obj1["action"] = dataItem.action}
          else if (dataItem.action === "Unliked")
            {obj1["action"] = "Removed like"}
          else if (dataItem.action === "Unloved")
            {obj1["action"] = "Removed love"}
          else if (dataItem.action === "Uncelebrated")
            {obj1["action"] = "Removed celebration"}
          else
            {console.log(obj1["action"])}
          this.s_activity.push(obj1)
        })
      } else {
        console.log("No Data for Story Activity Feed");
      }
    } catch (error) {
      console.log(error);
    }

    try {
      const storycommentdata$ = this.pService.fetchStoryCommentActivityFeed();
      this.storycommentdata = await lastValueFrom(storycommentdata$);

      if (!!this.storycommentdata) {
        this.storycommentdata.forEach((dataItem: any) => {
          let obj2:any = {}
          obj2["activityUserID"] = dataItem.commentByUser;
          obj2["activityUser"] = dataItem.fullname;;
          obj2["story"] = dataItem.story;
          obj2["action"] = dataItem.action
          if (obj2["activityUser"] !== this.fullname) {
            this.s_activity.push(obj2)
          }
        })

      } else {
        console.log("No Data for Story Comment Feed");
      }
    } catch (error) {
      console.log(error);
    }

    const reelfeed$ = this.pService.fetchReelReactionActivityFeed();
    try {
      this.reelfeeddata = await lastValueFrom(reelfeed$);
      if (!!this.reelfeeddata) {
        this.reelfeeddata.forEach((dataItem: any) => {


          let obj1:any = {}
          obj1["activityUserID"] = dataItem.doneByUser;
          obj1["activityUser"] = dataItem.fullname;;
          obj1["reel"] = dataItem.reel;
          if (dataItem.action === "Liked" || dataItem.action === "Loved" || dataItem.action === "Celebrated")
            {obj1["action"] = dataItem.action}
          else if (dataItem.action === "Unliked")
            {obj1["action"] = "Removed like"}
          else if (dataItem.action === "Unloved")
            {obj1["action"] = "Removed love"}
          else if (dataItem.action === "Uncelebrated")
            {obj1["action"] = "Removed celebration"}
          else
            {console.log(obj1["action"])}
          this.r_activity.push(obj1)
        })
      } else {
        console.log("No Data for Reel Activity Feed");
      }
    } catch (error) {
      console.log(error);
    }


    const reelcommentdata$ = this.pService.fetchReelCommentActivityFeed();
    try {
      this.reelcommentdata = await lastValueFrom(reelcommentdata$);

      if (!!this.reelcommentdata ) {
        this.reelcommentdata .forEach((dataItem: any) => {
          let obj2:any = {}
          obj2["activityUserID"] = dataItem.commentByUser;
          obj2["activityUser"] = dataItem.fullname;;
          obj2["reel"] = dataItem.reel;
          obj2["action"] = dataItem.action
          if (obj2["activityUser"] !== this.fullname) {
            this.r_activity.push(obj2)
          }
        })
      } else {
        console.log("No Data for Reel Comment Feed");
      }
    } catch (error) {
      console.log(error);
    }

  }

  private async loadChatroomData() {
    this.chatrooms = []
    this.chatService.showChatRooms().subscribe((resp:any) => {
      if (!!resp) {

        resp.forEach((data:any)=>{
          let pushed_obj: any = {}
          if (data.owner === this.loggedInUserId) {
            pushed_obj["chatroom_id"] = data.id;
            pushed_obj["chatroom_owner"] = data.owner;
            if (!!data.story) {
              pushed_obj["chatroom_type"] = "story"
              pushed_obj["chatroom_object_id"] = data.story
              const story_data$ = this.sService.fetchFeedStory(data.story);
              story_data$.subscribe((feed_story:Story)=>{
                pushed_obj["chatroom_object_title"] = feed_story.title
              })
            }
            if (!!data.reel) {
              pushed_obj["chatroom_type"] = "reel"
              pushed_obj["chatroom_object_id"] = data.reel
              const reel_data$ = this.rService.fetchReelforFeed(data.reel);
              reel_data$.subscribe((feed_reel:Reel)=>{
                console.log(feed_reel);
                pushed_obj["chatroom_object_title"] = feed_reel.caption
              })
            }

            this.chatrooms.push(pushed_obj);
          }
        })
      }
    })
  }

  goToChatroom(chatroom: any) {
    const navigationExtras: NavigationExtras = {state: {chatroom_owner:chatroom.chatroom_owner,object_type: chatroom.chatroom_type,object_id:chatroom.chatroom_object_id}};
    console.log(navigationExtras);

    this.router.navigate(['/chat/' + chatroom.chatroom_id],navigationExtras);
  }

  gotoStoryFeed(story_id:string) {
    this.router.navigate(['/feed/' + story_id]);
  }

  gotoStoryDetail(story_id:string) {
    this.router.navigate(['/story/' + story_id]);
  }

  gotoReelFeed(reel_id:string) {
    this.router.navigate(['/feed/reel/' + reel_id]);
  }

  gotoReelDetail(reel_id:string,story_id:string) {
    const navigationExtras: NavigationExtras = {state: {example: story_id}};
    this.router.navigate(['/reel/detail/' + reel_id],navigationExtras);
  }

  private async loadPersonalStoryChatroom() {
    this.sService.fetchStories().subscribe((data: Story[])=>{
      if (!!data) {


        data.forEach((story_item: Story)=>{
          let conversations = story_item.story_conversation;
          if (conversations.length > 0) {
            conversations.forEach((conversation: any) => {
              let pushed_obj:any = {};
              pushed_obj["chatroom_id"] = conversation["chatroom_id"];
              pushed_obj["chatroom_object_id"] = story_item.id;
              pushed_obj["chatroom_object_title"] = story_item.title;
              pushed_obj["chatroom_type"] = "story";
              pushed_obj["chatroom_owner"] = conversation["chatroom_owner_id"];
              this.related_chatrooms.push(pushed_obj);
            })

          }
        })
      }
    })
  }

  private async loadPersonalReelChatroom() {
    this.rService.fetchReelPersonal(this.loggedInUserId).subscribe((data: Reel[])=>{


      if (!!data) {
        data.forEach((reel_item: Reel)=>{
          let conversations = reel_item.reel_conversation;
          if (conversations.length > 0) {
            conversations.forEach((conversation: any) => {
              let pushed_obj:any = {};
              this.sService.fetchStoryfromReel(reel_item.id).subscribe((res:any)=>{
                pushed_obj["chatroom_object_parent"] = res["reels_story"];
              })
              pushed_obj["chatroom_id"] = conversation["chatroom_id"];
              pushed_obj["chatroom_object_id"] = reel_item.id;
              pushed_obj["chatroom_object_title"] = reel_item.caption;
              pushed_obj["chatroom_type"] = "reel";
              pushed_obj["chatroom_owner"] = conversation["chatroom_owner_id"];
              this.related_chatrooms.push(pushed_obj);
            })

          }
        })
      }
    })
  }
  private async visitedItem() {
    this.pService.fetchWall().subscribe((data: any)=>{

      console.log(data);
      
      if (!!data) {
        data.forEach((item: any)=>{
          console.log(item);
          
          // let conversations = reel_item.reel_conversation;
          // if (conversations.length > 0) {
          //   conversations.forEach((conversation: any) => {
          //     let pushed_obj:any = {};
          //     this.sService.fetchStoryfromReel(reel_item.id).subscribe((res:any)=>{
          //       pushed_obj["chatroom_object_parent"] = res["reels_story"];
          //     })
          //     pushed_obj["chatroom_id"] = conversation["chatroom_id"];
          //     pushed_obj["chatroom_object_id"] = reel_item.id;
          //     pushed_obj["chatroom_object_title"] = reel_item.caption;
          //     pushed_obj["chatroom_type"] = "reel";
          //     pushed_obj["chatroom_owner"] = conversation["chatroom_owner_id"];
          //     this.related_chatrooms.push(pushed_obj);
          //   })

          // }
        })
      }
    })
  }
}
