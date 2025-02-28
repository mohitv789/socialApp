import { Component, OnInit } from '@angular/core';
import { WebSocketService } from './services/websocket.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription, lastValueFrom } from 'rxjs';
import { StoryHTTPService } from '../stories/services/stories.service';
import { AuthService } from '../auth/services/auth.service';
import { ReelsHTTPService } from '../stories/services/reels.service';
import { ChatroomHTTPService } from './services/chatroom.service';

@Component({
  selector: 'app-webchat',
  templateUrl: './webchat.component.html',
  styleUrl: './webchat.component.css'
})
export class WebchatComponent implements OnInit {
  chatroomId!: number;
  chatroomRouteParams!: Params;
  chatroom_obj!: string;
  chatroom_obj_id!: string;
  chatroom_title!: string;
  chatroom_obj_owner!: number;
  chatroom_obj_owner_name!: string;
  fullName: string = "";
  publicUser: any;
  navigation: any;
  image: any;
  chatroom_deleted: boolean = false;
  chatroom_data: any = {};
  chatroom_owner!: number;
  chatroom_publicUser: any;
  chatroom_owner_name: string = "";
  count: number = 0;
  private routeParamsSubscription!: Subscription;
  constructor(private wService: WebSocketService,private chatService: ChatroomHTTPService,private route: ActivatedRoute,private router: Router,private sService: StoryHTTPService,private authService: AuthService,private rService: ReelsHTTPService) {
    this.navigation = this.router.getCurrentNavigation();
  }

  ngOnInit(): void {
    const state = this.navigation!.extras.state as {chatroom_owner:number,object_type: string,object_id:string};
    console.log(state)
    this.chatroom_obj = state["object_type"];
    this.chatroom_obj_id = state["object_id"];
    this.chatroom_owner = state["chatroom_owner"];
    this.routeParamsSubscription = this.route.params.subscribe(params => {
      this.chatroomRouteParams = params;
      if (this.count == 0) {
        this.handleRouteParamsChanges();
      }

    });
    this.chatroomId = this.chatroomRouteParams['chatroom_id'];
    console.log(this.chatroomId);


    this.chatService.showChatRooms().subscribe((resp:any) => {
      if (resp) {
        console.log(resp);

        resp.forEach((data:any)=>{
          if (data.id === +this.chatroomId) {
            this.wService.startWebSocket(this.chatroomId);
            this.count = 1;
            this.chatroom_data = {...data}
            console.log(this.chatroom_data);
          }
        })
      }
    });

    if (this.chatroom_obj === "story") {
      this.sService.fetchFeedStory(this.chatroom_obj_id).subscribe((resp:any)=>{
        console.log(resp);

        if (resp.story_conversation.length > 0) {
          resp.story_conversation.forEach((story_conv:any)=>{
            this.chatroom_title = resp.title;
            this.chatroom_obj_owner = resp.owner;
            this.image = resp.image;
            this.chatService.getConversationChatroomStatus(story_conv.id).subscribe((resp:any)=>{
              if (!resp["chatroom_status"]) {
                this.chatroom_deleted = true;
              }

            })
            this.loadData();
          })

        } else {
          console.log("No conversation for story");
        }
        console.log(this.chatroom_obj_owner);
        console.log(this.chatroom_owner);

      });
    }

    if (this.chatroom_obj === "reel") {
      this.rService.fetchReelforFeed(this.chatroom_obj_id).subscribe((resp:any)=>{
        console.log(resp);
        if (resp.reel_conversation.length > 0) {
          resp.reel_conversation.forEach((reel_conv:any)=>{
            this.chatroom_title = resp.caption;
            this.chatroom_obj_owner = resp.reel_owner;
            this.image = resp.image;
            this.chatService.getConversationChatroomStatus(reel_conv.id).subscribe((resp:any)=>{
              if (!resp["chatroom_status"]) {
                this.chatroom_deleted = true;
              }
            })
            this.loadData();
          })
        } else {
          console.log("No conversation for reel");
        }
        console.log(this.chatroom_obj_owner);
        console.log(this.chatroom_owner);
      });
    }
  }

  handleRouteParamsChanges(): void {
    this.wService.closeWebSocket();
    this.chatroomId = this.chatroomRouteParams['chatroom_id'];
    this.wService.startWebSocket(this.chatroomId);
    this.count = 2;
  }

  ngOnDestroy() {
    console.log("Destroyed!");
    this.routeParamsSubscription.unsubscribe();
    this.wService.closeWebSocket();
  }

  private async loadData() {
    const publicUser$ = this.authService.publicUser(this.chatroom_obj_owner);
    this.publicUser = await lastValueFrom(publicUser$);
    this.fullName = this.publicUser.first_name + " " + this.publicUser.last_name;

    const ownerUser$ = this.authService.publicUser(this.chatroom_owner);
    this.chatroom_publicUser = await lastValueFrom(ownerUser$);
    this.chatroom_owner_name = this.chatroom_publicUser.first_name + " " + this.chatroom_publicUser.last_name;
  }
}
