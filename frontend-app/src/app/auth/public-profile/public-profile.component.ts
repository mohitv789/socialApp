import { Component, OnInit } from '@angular/core';
import { ProfileHTTPService } from '../services/profile.service';
import { Profile } from '../models/profile';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DatePipe } from '@angular/common';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
@Component({
  selector: 'app-public-profile',
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.css'],
  providers: [DatePipe]
})
export class PublicProfileComponent implements OnInit {
  profile!: Profile;
  userId!: number;
  user: any;
  friends: any;
  pendingFriends: any;
  rejSentFriends: any;
  rejRecievedFriends: any;
  fullName: string = "";
  loggedUserName: string = "";
  loggedInUserId!: number;
  profileUserEmail: string = "";
  showAddFriendButton: boolean = true;
  pendingAddFriendButton: boolean = false;
  canShow: boolean = false;
  rejectedOnSent: any;
  rejectedOnReceived: any;
  form!: FormGroup;
  receivedRequest: boolean = false;
  constructor(private router: Router,private route: ActivatedRoute,private pService: ProfileHTTPService,private aService: AuthService,private datePipe:DatePipe) {}

  ngOnInit(): void {
    this.route.params
    .subscribe(
      (params: Params) => {
        this.userId = +params['userId'];
      }
    );
    this.aService.user().subscribe((user: any) => {
      this.loggedInUserId = +user.id;
      this.loggedUserName = user.first_name + " " + user.last_name
    })
    this.pService.fetchPublicProfile(this.userId).subscribe((res: any) => {
      this.profile = {...res};
      this.canShow = true;
    },
    (err:any) => {
        if(err.status == 404) {
          this.canShow = false;
        }
    })

    this.aService.publicUser(this.userId).subscribe((res: any) => {
      this.fullName = res.first_name + " " + res.last_name;
      this.profileUserEmail = res.email;
    })


    this.loadButtonStates();

    this.form = new FormGroup({
      message_field: new FormControl()
    });
  }

  addFriend(data:any) {

    this.form.reset();
    this.pService.sendFriendRequest(
      {
        "to_user":this.userId,
        "message": data["message_field"]
      }).subscribe(() => {
        this.pendingAddFriendButton = true;
      });
  }

  viewFriend() {
    this.router.navigateByUrl('/friends/' + this.userId);
  }

  private async loadButtonStates() {
    const friends$ = this.pService.listFriends();
    this.friends = await lastValueFrom(friends$);
    this.friends.forEach((frnItem:any) => {
      console.log(this.profile);

      if (!!this.profile) {
        if (frnItem.id == +this.profile.user) {
          this.showAddFriendButton = false;
        }
      }
    })

    const pendingFriends$ = this.pService.pendingSentFriendRequests();
    this.pendingFriends = await lastValueFrom(pendingFriends$);
    this.pendingFriends.forEach((frnItem:any) => {
      console.log(frnItem)
      if (frnItem.to_user == this.fullName) {
        console.log("Pending");
        this.pendingAddFriendButton = true;

      }
    })

    const rejSentFriends$ = this.pService.rejectedSentFriendRequests(this.userId);
    this.rejSentFriends = await lastValueFrom(rejSentFriends$);
    if (!!this.rejSentFriends) {


      this.rejSentFriends.forEach((resItem: any) => {
        if (resItem.to_user == this.fullName && resItem.from_user == this.loggedUserName) {
          console.log("Sent Rejected");
          this.rejectedOnSent = this.datePipe.transform(this.rejSentFriends[0]["rejected"], "yyyy-MM-dd");

        }

      })
    }

    const rejRecievedFriends$ = this.pService.rejectedReceivedFriendRequests();
    this.rejRecievedFriends = await lastValueFrom(rejRecievedFriends$);
    if (!!this.rejRecievedFriends ) {
      this.rejRecievedFriends.forEach((resItem: any) => {
        if (resItem.from_user == this.fullName && resItem.to_user == this.loggedUserName) {
          console.log("Received Rejected");
          this.rejectedOnReceived = this.datePipe.transform(this.rejRecievedFriends [0]["rejected"], "yyyy-MM-dd");

        }

      })
    }
  }

}
