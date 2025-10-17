
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatroomHTTPService {

  constructor(
    private http: HttpClient
  ) {}

  showChatRooms() {
    return this.http.get(
      "http://localhost:4500/webchat/chat", {withCredentials: true}
    )
  }

  startChatRoom(post_obj: any) {
    console.log(post_obj);
    return this.http.post(
      "http://localhost:4500/webchat/chat/", post_obj ,{withCredentials: true}
    )
  }

  fetchChatData(chatroomId: number) {
    return this.http.get(`http://localhost:4500/webchat/messages/?chatroom_id=${chatroomId}`,{withCredentials: true});
  }

  isMember(chatroomId:number) {
    return this.http.get(`http://localhost:4500/webchat/chatroom/${chatroomId}/membership/is_member`,{withCredentials: true});
  }

  joinserver(chatroomId: number) {
    return this.http.post(`http://localhost:4500/webchat/chatroom/${chatroomId}/membership/`, {}, {withCredentials: true});
  }

  leaveserver(chatroomId: number) {
    return this.http.delete(`http://localhost:4500/webchat/chatroom/${chatroomId}/membership/remove_member/`, { withCredentials: true });
  }

  removeChatRoom(chatroomId: number) {
    return this.http.delete(`http://localhost:4500/webchat/chat/${chatroomId}/`, { withCredentials: true })
  }

  getConversationChatroomStatus(conversationId: number) {
    return this.http.get("http://localhost:4500/webchat/conversation/" + conversationId + "/get_chatroom_status/",{withCredentials: true});
  }


}
