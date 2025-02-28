import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription, lastValueFrom } from 'rxjs';
import { StoryHTTPService } from 'src/app/stories/services/stories.service';
import { WebSocketService } from '../services/websocket.service';
import { ChatroomHTTPService } from '../services/chatroom.service';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.component.html',
  styleUrl: './chat-history.component.css'
})
export class ChatHistoryComponent implements OnInit {
  @Input() chatroomId!: number;
  @Input() chatroom_deleted!: boolean;
  @Input() chatroom_object!: string;
  @Input() chatroom_object_id!: string;
  chat_history$!: Observable<any>;
  chat_history: string[] = [];
  channel_chats: any[] = [];
  private messageSubscription!: Subscription;
  constructor(private aService: AuthService,public chatroomService: ChatroomHTTPService,public wService: WebSocketService,private route: ActivatedRoute) {}

  ngOnInit(): void {
    if (!this.chatroom_deleted) {
      this.messageSubscription = this.wService.getMessageObservable().subscribe(
        (msg: any) => {
          this.handleNewMessages(msg);
        }
      );
    }
    this.loadData();
  }
  private async loadData() {
    this.chat_history = [];
    this.channel_chats = [];


    try {
      this.chat_history$ = this.chatroomService.fetchChatData(this.chatroomId);
      this.chat_history = await lastValueFrom(this.chat_history$);
      if (this.chat_history) {
        this.chat_history.forEach((chat_item:any)=>{
          let fullname:string;
          this.aService.publicUser(chat_item["sender"]).subscribe((res: any) => {


            fullname = res.first_name + " " + res.last_name;
            let pushed_obj = {
              "msg": JSON.parse(chat_item["content"])["content"],
              "user": fullname,
              "timestamp":chat_item["timestamp"],
            }
            this.channel_chats.push(pushed_obj);


          })

        });
      }
    } catch (error) {
      console.log(error);
    }


    // this.channel_chats.sort(function(x, y){
    //   return x.timestamp - y.timestamp;
    // }).reverse();

    this.channel_chats.sort((x, y) => new Date(x.timestamp) < new Date(y.timestamp) ? 1 : -1);

  }

  private handleNewMessages(msg: any): void {
    const messageExists = this.channel_chats.some((chat) => chat.timestamp === msg["new_message"]["timestamp"]);

    if (!messageExists) {
      let pushed_obj = {
        "msg": JSON.parse(msg["new_message"]["content"])["content"],
        "user": msg["new_message"]["sender"],
        "timestamp": msg["new_message"]["timestamp"],
      };
      this.channel_chats.push(pushed_obj); // Add the message to chat_content
      this.channel_chats.sort((x, y) => new Date(x.timestamp) < new Date(y.timestamp) ? 1 : -1);
      console.log(this.channel_chats);
    } else {
      console.log("Message already exists");
    }
  }
  ngOnDestroy() {
    console.log("Destroyed!");

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
