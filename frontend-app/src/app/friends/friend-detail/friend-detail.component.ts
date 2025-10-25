import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Profile } from 'src/app/auth/models/profile';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ProfileHTTPService } from 'src/app/auth/services/profile.service';
import { FriendHTTPService } from '../services/friend.service';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChatroomHTTPService } from 'src/app/webchat/services/chatroom.service';
import { StoryHTTPService } from 'src/app/stories/services/stories.service';
import { ReelsHTTPService } from 'src/app/stories/services/reels.service';
import { Reel } from 'src/app/stories/models/Reel';
import { Story } from 'src/app/stories/models/Story';

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
  chatrooms: any[] = [];  
  showConfirm = false;

  confirmRemoveFriend() {
    this.removeFriend(); // call your existing removeFriend() method
    this.showConfirm = false;
  }
  constructor(private chatService: ChatroomHTTPService , private snackBar: MatSnackBar, private route: ActivatedRoute, private pService: ProfileHTTPService,private aService: AuthService, private fService: FriendHTTPService,private router: Router, private sService: StoryHTTPService, private rService: ReelsHTTPService) {}



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
  onClose(input: Boolean) {
    console.log("Dialog closed: ", input);
  }
  removeFriend() {
    this.pService.removeFriend({ "to_user": this.friendId }).subscribe({
      next: () => {
        // ✅ show success toast
        this.snackBar.open('Friendship Removed Successfully!', '', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['chrome-toast']
        });

        console.log('Friendship removed permanently');
        // optional redirect after a short delay
        setTimeout(() => this.router.navigateByUrl('/me/friends'), 5000);
      },
      error: (err) => {
        console.error('Error removing friend:', err);
        // ⚠️ show error toast
        this.snackBar.open('Failed to remove friend. Please try again.', '', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['chrome-toast']
        });
      }
    });
  }




  private async loadRelationState() {
    this.chatrooms = []
      this.chatService.showChatRooms().subscribe((resp:any) => {
        if (!!resp) {
  
          resp.forEach((data:any)=>{
            let pushed_obj: any = {}
            if (data.owner === this.isAuth) {
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
}
