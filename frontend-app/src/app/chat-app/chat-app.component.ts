import { Component, OnInit } from '@angular/core';
import { ChatroomHTTPService } from '../webchat/services/chatroom.service';
import { StoryHTTPService } from '../stories/services/stories.service';
import { Story } from '../stories/models/Story';
import { Reel } from '../stories/models/Reel';
import { ReelsHTTPService } from '../stories/services/reels.service';
import { NavigationExtras, Router } from '@angular/router';
import { Profile } from '../auth/models/profile';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-chat-app',
  templateUrl: './chat-app.component.html',
  styleUrls: ['./chat-app.component.css']
})
export class ChatAppComponent implements OnInit {
  chatrooms: any[] = []
  related_chatrooms: any[] = []
  profile!: Profile;
  profileId!: string;
  loggedInUserId!: number;
  fullname : string = "";
  emailId: string = "";
  constructor(private chatService: ChatroomHTTPService, private authService: AuthService, private sService: StoryHTTPService, private rService: ReelsHTTPService, private router: Router) { }
  ngOnInit(): void {
    this.authService.user().subscribe((user: any) => {
        this.loggedInUserId = +user.id;
        this.fullname = user.first_name + " " + user.last_name;
        this.emailId = user.email;

      })
    this.loadChatroomData();
    this.loadPersonalStoryChatroom();
    this.loadPersonalReelChatroom();
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
                pushed_obj["chatroom_object_title"] = feed_reel.caption
              })
            }

            this.chatrooms.push(pushed_obj);
          }
        })
      }
    })
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
        console.log(this.related_chatrooms);
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
  
}
