import { Component, OnInit } from '@angular/core';
import { FriendHTTPService } from './services/friend.service';
import { ProfileHTTPService } from '../auth/services/profile.service';


@Component({
  selector: 'app-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.css']
})
export class FriendsComponent implements OnInit{

  receivedRequests: any[] = [];
  sentRequests: any[] = [];
  rejectedRequests: any[] = [];
  constructor(private pService: ProfileHTTPService) {}

  ngOnInit(): void {
    this.pService.pendingReceivedFriendRequests().subscribe(
      (result:any)=>{
        this.receivedRequests = result;
      }
    );
    this.pService.pendingSentFriendRequests().subscribe(
      (result:any)=>{
        this.sentRequests = result;
      }
    );

    this.pService.rejectedReceivedFriendRequests().subscribe(
      (result:any)=>{

        this.rejectedRequests = result;
      }
    );
  }

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

}
