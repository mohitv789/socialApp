import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Profile } from 'src/app/auth/models/profile';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ProfileHTTPService } from 'src/app/auth/services/profile.service';
import { FriendHTTPService } from '../services/friend.service';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-friend-detail',
  templateUrl: './friend-detail.component.html',
  styleUrls: ['./friend-detail.component.css']
})
export class FriendDetailComponent implements OnInit {
  profile!: Profile;
  friendId!: number;
  fullName: string = "";
  isAuth: boolean = false;
  storyFeed: any[] = [];
  reelFeed: any[] = [];
  isFollowerResult: any;
  isFollowingResult: any;
  isBlockedResult: any;
  isBlockingResult: any;
  isFollowing: boolean = false;
  isFollower: boolean = false;
  isBlocked: boolean = false;
  isBlocking: boolean = false;
  constructor(private route: ActivatedRoute, private pService: ProfileHTTPService,private aService: AuthService, private fService: FriendHTTPService,private router: Router) {}



  ngOnInit(): void {
    this.route.params
      .subscribe(
        (params: Params) => {
          this.friendId = +params['friendId'];
          console.log(this.friendId);

        }
      );
    setTimeout(() => {
      this.pService.fetchPublicProfile(this.friendId).subscribe((res: Profile) => {
        this.profile = {...res}
      })
    }, 50);

    setTimeout(() => {
      this.aService.publicUser(this.friendId).subscribe((res: any) => {
        this.fullName = res.first_name + " " + res.last_name;
      })
    }, 50);
    this.isAuth = !!AuthService.authEmitter;
    setTimeout(() => {
      this.fetchFriendStoryFeed();
      this.fetchFriendReelFeed();
    }, 250);
    this.loadRelationState();
  }

  fetchFriendStoryFeed() {
    this.fService.friendstoryActivity(this.friendId).subscribe((data:any) => {
      data.forEach((dataItem: any) => {
        let dataObj: any = {}
        dataObj["story"] = {...dataItem.story}
        dataObj["action"] = dataItem.action
        this.storyFeed.push(dataObj)
      })
    })
  }
  fetchFriendReelFeed() {
    this.fService.friendreelActivity(this.friendId).subscribe((data:any) => {
      data.forEach((dataItem: any) => {
        let dataObj: any = {}
        dataObj["reel"] = {...dataItem.reel}
        dataObj["action"] = dataItem.action
        this.reelFeed.push(dataObj)
      })
    })
  }

  goToStoryDetail(storyId: string) {
    this.router.navigateByUrl('/feed/' + storyId);
  }

  goToReelDetail(reelId: string) {
    this.router.navigateByUrl('/feed/reel/' + reelId);
  }

  removeFriend() {
    this.pService.removeFriend(
      {
        "to_user": this.friendId,
      }).subscribe(()=>this.router.navigateByUrl('/friends'));
  }

  private async loadRelationState() {
    // try {
    //   const isFollowing$ = this.pService.findisFollowing(this.friendId);
    //   this.isFollowingResult = await lastValueFrom(isFollowing$);
    //   if (this.isFollowingResult["message"] == "Follow relationship not found for user." ) {
    //     this.isFollowing = false;
    //   }
    //   this.isFollowing = true;
    // } catch (error) {
    //   console.log(error);
    // }

    // try {
    //   const isFollower$ = this.pService.findisFollower(this.friendId);
    //   this.isFollowerResult = await lastValueFrom(isFollower$);
    //   if (this.isFollowerResult["message"] == "Follow relationship not found for user." ) {
    //     this.isFollower = false;
    //   }
    //   this.isFollower = true;
    // } catch (error) {
    //   console.log(error);
    // }

    // try {
    //   const isBlocked$ = this.pService.findisBlocked(this.friendId);
    //   this.isBlockedResult = await lastValueFrom(isBlocked$);
    //   if (this.isBlockedResult["message"] == "Block relationship not found for user." ) {
    //     this.isBlocked = false;
    //   }
    //   this.isBlocked = true;
    // } catch (error) {
    //   console.log(error);
    // }

    // try {
    //   const isBlocking$ = this.pService.findisBlocking(this.friendId);
    //   this.isBlockingResult = await lastValueFrom(isBlocking$);
    //   if (this.isBlockingResult["message"] == "Block relationship not found for user." ) {
    //     this.isBlocking = false;
    //   }
    //   this.isBlocking = true;
    // } catch (error) {
    //   console.log(error);
    // }
  }
}
