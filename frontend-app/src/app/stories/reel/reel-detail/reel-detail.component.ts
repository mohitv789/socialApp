import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Params, Router } from '@angular/router';
import {ReelsHTTPService} from "../../services/reels.service";
import { Observable, debounceTime, fromEvent, lastValueFrom, of } from 'rxjs';
import { Reel } from '../../models/Reel';
import * as uuid from 'uuid';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ReelCommentCreateComponent } from '../../reel-comment-create/reel-comment-create.component';
import { ReelComment } from '../../models/ReelComment';
import { AuthService } from '../../../auth/services/auth.service';
import { ReactionInfoDialogComponent } from '../../reaction-info-dialog/reaction-info-dialog.component';
import { FriendHTTPService } from 'src/app/friends/services/friend.service';
import { ImageEditorComponent } from '../../image-editor/image-editor.component';
import { ChatroomHTTPService } from 'src/app/webchat/services/chatroom.service';
import { Overlay } from '@angular/cdk/overlay';
@Component({
  selector: 'app-reel-detail',
  templateUrl: './reel-detail.component.html',
  styleUrls: ['./reel-detail.component.css']
})
export class ReelDetailComponent implements OnInit{
  reelId!: string;
  reel$!: Observable<Reel>;
  reel!: Reel;
  comments: ReelComment[] = [];
  loggedInUserId!: number;
  likes: number[] = [];
  loves: number[] = [];
  celebrates: number[] = [];
  totalLikes: number = 0;
  totalLoves: number = 0;
  totalCelebrates: number = 0;
  showLike: boolean = true;
  showLove: boolean = true;
  showCelebrate: boolean = true;
  friends$!: Observable<any[]>;
  isFriend: boolean = false;
  canShowButton: boolean = false;
  storyId!: string;
  reelData: any = {}
  user: any;
  chatroomID!:number;
  chatroom_owner!:number;
  constructor(private route: ActivatedRoute,private router: Router,private rService: ReelsHTTPService,private dialog: MatDialog,private authService: AuthService,private fService: FriendHTTPService,private cdr: ChangeDetectorRef, private overlay:Overlay,
    private chatService: ChatroomHTTPService) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation!.extras.state as {example: string};
    this.storyId = state.example;
  }

  ngOnInit(): void {
    this.route.params
      .subscribe(
        (params: Params) => {
          this.reelId = params['reelId'];
        }
      )

    console.log(this.storyId);

    this.loadData();

  }


  addComment() {
    if (this.dialog.openDialogs.length > 0) {
      this.dialog.closeAll();
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['comment-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
    
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.reposition();

    this.dialog.open(ReelCommentCreateComponent, dialogConfig)
      .afterClosed()
      .subscribe((val:any) => {
        if (val) {
          let comment: any = {}
          if (!!this.canShowButton) {
            comment = {
              id : uuid.v4(),
              reelcomment: val.data,
              reel: this.reelId,
              commented_by: this.loggedInUserId,
              approval: "app"
            }
          } else {
            comment = {
              id : uuid.v4(),
              reelcomment: val.data,
              reel: this.reelId,
              commented_by: this.loggedInUserId,
              approval: "rej"
            }
          }
          this.rService.addReelComment(this.reelId,comment).subscribe(() => {
            // Update the comments array with the new comment
            const newComment: ReelComment = {
              id : uuid.v4(),
              reelcomment: val.data,
              reel: this.reelId,
              commented_by: this.loggedInUserId,
              approval: "app"
            };
            this.comments.push(newComment);
          });

        }
    });
  }
  showReactionInfo() {
    if (this.dialog.openDialogs.length > 0) {
      this.dialog.closeAll();
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = ['reaction-dialog', 'center-dialog'];
    dialogConfig.hasBackdrop = false;
    dialogConfig.disableClose = true;
    
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.reposition();
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
  deleteReel() {
    this.rService.deleteReel(this.reelId).subscribe(() => {
      this.router.navigate(["story/" , this.storyId]);
    })
  }
  editReel() {
    // Close other dialogs first (as you had)
    if (this.dialog.openDialogs.length > 0) {
      this.dialog.closeAll();
    }

    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '95vw';
    dialogConfig.height = '92vh';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.maxHeight = '100vh';
    dialogConfig.panelClass = ['full-editor-dialog', 'creation-dialog'];
    dialogConfig.hasBackdrop = true;
    dialogConfig.backdropClass = 'watch-reel-backdrop';
    dialogConfig.disableClose = true;
    dialogConfig.scrollStrategy = this.overlay.scrollStrategies.reposition();

    const img = this.reelData?.image || '';
    if (!img.startsWith('http://') && !img.startsWith('https://')) {
      this.reelData.image = `http://localhost:4500/${img}`;
    }

    dialogConfig.data = {
      id: this.reelData.id,
      image: this.reelData.image,
      caption: this.reelData.caption
    };

    const ref: MatDialogRef<ImageEditorComponent> = this.dialog.open(ImageEditorComponent, dialogConfig);

    // 1) Adjust scale once opened
    ref.afterOpened().subscribe(() => {
      this.adjustDialogScale(ref);

      // 2) Recalculate on viewport resize (debounced)
      const resize$ = fromEvent(window, 'resize').pipe(debounceTime(120));
      const sub = resize$.subscribe(() => this.adjustDialogScale(ref));

      // When dialog closes, unsubscribe resize listener and remove zoom styles
      ref.afterClosed().subscribe(() => {
        sub.unsubscribe();
        this.clearDialogScale(ref);
      });
    });

    ref.afterClosed().subscribe(val => {
      if (val) {
        console.log('Editor returned:', val);
        this.ngOnInit();
      }
    });
  }

/**
 * Measures the dialog content and if content height > available height, sets a CSS variable
 * --dialog-scale on the overlay pane to scale the content down (min scale 0.7).
 */
  adjustDialogScale(ref: MatDialogRef<any>) {
    try {
      // find the overlay pane for this dialog
      const pane = document.querySelector('.cdk-overlay-pane.full-editor-dialog') as HTMLElement;
      if (!pane) return;

      // The actual surface/shell that holds .mat-dialog-container can differ between versions:
      const surface = pane.querySelector('.mat-dialog-container, .mat-mdc-dialog-container') as HTMLElement;
      if (!surface) return;

      // Measure visible height (the pane's clientHeight) vs content height
      const availH = pane.clientHeight || window.innerHeight * 0.92; // fallback to viewport
      const contentH = surface.scrollHeight;

      // if content fits, reset scale to 1
      if (contentH <= availH || contentH === 0) {
        pane.style.removeProperty('--dialog-scale');
        pane.classList.remove('zoomed-dialog');
        surface.style.removeProperty('transform-origin');
        surface.style.removeProperty('will-change');
        return;
      }

      // compute scale and constrain to sensible range
      const rawScale = availH / contentH;
      const scale = Math.max(0.70, Math.min(1, rawScale)); // keep >= 0.7 to avoid tiny UI
      pane.style.setProperty('--dialog-scale', `${scale}`);
      pane.classList.add('zoomed-dialog');

      // set transform origin to top center so it appears to zoom out from header area
      surface.style.setProperty('transform-origin', 'top center');
      surface.style.setProperty('will-change', 'transform');
    } catch (err) {
      console.warn('adjustDialogScale error', err);
    }
    }


/** Clear the CSS variable when dialog closes */
  clearDialogScale(ref: MatDialogRef<any>) {
    const pane = document.querySelector('.cdk-overlay-pane.full-editor-dialog') as HTMLElement;
    const surface = pane?.querySelector('.mat-dialog-container, .mat-mdc-dialog-container') as HTMLElement;
    if (pane) {
      pane.style.removeProperty('--dialog-scale');
      pane.classList.remove('zoomed-dialog');
    }
    if (surface) {
      surface.style.removeProperty('transform-origin');
      surface.style.removeProperty('will-change');
      surface.style.removeProperty('transform');
    }
  
  }

  private async loadData(): Promise<void> {
    try {
      console.log('--- loadData start ---');

      // 1) user
      const user$ = this.authService.user();
      this.user = await lastValueFrom(user$);
      this.loggedInUserId = Number(this.user?.id);
      console.log('loggedInUserId:', this.loggedInUserId, 'user raw:', this.user);

      // 2) reel id guard
      if (!this.reelId) {
        console.warn('No reelId available (route param).');
        return;
      }
      console.log('reelId (param):', this.reelId);

      // 3) fetch reel
      this.reel$ = this.rService.fetchReel(this.reelId);
      this.reel = await lastValueFrom(this.reel$);
      console.log('reel response:', this.reel);

      if (!this.reel) {
        console.warn('fetchReel returned no reel for id', this.reelId);
        return;
      }

      // extract reel owner id robustly (backend may return object or id)
      let reelOwnerId: number | null = null;
      if (this.reel.reel_owner == null) {
        reelOwnerId = null;
      } else if (typeof this.reel.reel_owner === 'object') {
        reelOwnerId = Number(this.reel.reel_owner ?? this.reel.reel_owner ?? null);
      } else {
        reelOwnerId = Number(this.reel.reel_owner);
      }
      console.log('reelOwnerId (normalized):', reelOwnerId);

      // fill reelData and normalize image if needed
      this.reelData = {
        id: this.reel.id,
        caption: this.reel.caption,
        image: this.reel.image
      };
      if (this.reelData.image && typeof this.reelData.image === 'string' &&
          !this.reelData.image.startsWith('http://') &&
          !this.reelData.image.startsWith('https://')) {
        this.reelData.image = `http://localhost:4500/${this.reelData.image}`;
      }

      this.canShowButton = reelOwnerId === this.loggedInUserId;

      // 4) comments
      this.comments = await lastValueFrom(this.rService.fetchReelComments(this.reelId)) || [];
      console.log('comments count:', this.comments.length);

      // 5) reactions -> normalize to id arrays
      this.likes = Array.isArray(this.reel.likes) ? this.reel.likes.map((x:any) => Number(x?.id ?? x)) : [];
      this.loves = Array.isArray(this.reel.loves) ? this.reel.loves.map((x:any) => Number(x?.id ?? x)) : [];
      this.celebrates = Array.isArray(this.reel.celebrates) ? this.reel.celebrates.map((x:any) => Number(x?.id ?? x)) : [];

      this.totalLikes = this.likes.length;
      this.totalLoves = this.loves.length;
      this.totalCelebrates = this.celebrates.length;

      this.showLike = !this.likes.includes(this.loggedInUserId);
      this.showLove = !this.loves.includes(this.loggedInUserId);
      this.showCelebrate = !this.celebrates.includes(this.loggedInUserId);

      // 6) friends observable
      this.friends$ = this.fService.listFriends();

      // 7) find chatroom: log returned payload and try multiple matching rules
      this.chatroomID = undefined as any;
      this.chatroom_owner = undefined as any;

      const chatroomsResp: any = await lastValueFrom(this.chatService.showChatRooms());
      console.log('chatroomsResp (raw):', chatroomsResp);

      if (Array.isArray(chatroomsResp)) {

        
        for (const data of chatroomsResp) {
          // log each entry
          const normalizedReelId = String(this.reelId);
          console.log('chatroom candidate:', data.reel);
          if (data.reel != null) {
            // normalize data.reel to string
            const dataReelStr = data?.reel != null ? String(data.reel) : null;
            const dataOwnerNum = data?.owner != null ? Number(data.owner) : null;
            console.log(' -> data.reel:', dataReelStr, 'data.owner:', dataOwnerNum);

          // participants normalization:
            const participants = Array.isArray(data.participants) ? data.participants : [];
            const participantIds = participants.map((p:any) => Number(p?.id ?? p)).filter((n:any) => !isNaN(n));
            console.log(' -> participantIds:', participantIds);

            // Rule A: reel id match + participant membership (current user included)
            const participantMatch = participantIds.includes(this.loggedInUserId);

            // Rule B: reel id match + owner equals loggedInUser (if you want owner-only)
            const ownerMatch = dataOwnerNum === this.loggedInUserId;

            // Rule C: reel id match regardless of ownership/participants (fallback)
            const reelMatch = dataReelStr === normalizedReelId;

            // Decide
            if (reelMatch && (participantMatch || ownerMatch)) {
              // Found the chatroom where current user is involved
              this.chatroomID = data.id;
              this.chatroom_owner = dataOwnerNum as number;
              console.log('=> MATCH: chatroomID set to', this.chatroomID, 'owner=', this.chatroom_owner);
              break;
            }

            // fallback: if reelMatch but neither participant nor owner matched, you may still want to use it:
            if (reelMatch && (this.chatroomID == null)) {
              console.log('=> fallback: reel matched but user not participant/owner — saving as fallbackChatroom');
              this.chatroomID = data.id;
              this.chatroom_owner = dataOwnerNum as number;
              // do NOT break here if you prefer to find a participant-owned match later
            }

          } else {
            console.log(' -> data.reel is null/undefined or content is story, skipping');
          }

        }

      } else {
        console.warn('chatService.showChatRooms() did not return array');
      }

      console.log('loadData finished, chatroomID=', this.chatroomID, 'chatroom_owner=', this.chatroom_owner);

      // 8) final CD update
      this.cdr.detectChanges();
      console.log('--- loadData end ---');

    } catch (err) {
      console.error('loadData error', err);
    }
  }


  // private async loadData() {


  //   const user$ = this.authService.user()
  //   this.user = await lastValueFrom(user$);
  //   this.loggedInUserId = this.user.id;


  //   this.reel$ = this.rService.fetchReel(this.reelId);
  //   this.reel = await lastValueFrom(this.reel$);

  //   if (this.reel.reel_owner == this.loggedInUserId) {
  //     this.canShowButton = true;
  //   }
  //   this.reelData.id = this.reel.id;
  //   this.reelData.caption = this.reel.caption;
  //   this.reelData.image = this.reel.image;

  //   this.friends$ = this.fService.listFriends();

  //   const comments$ = this.rService.fetchReelComments(this.reelId);
  //   this.comments = await lastValueFrom(comments$);

  //   this.reel.likes?.forEach((res: any) => {
  //     this.likes.push(res.id);
  //   })
  //   this.reel.loves?.forEach((res: any) => {
  //     this.loves.push(res.id);
  //   })
  //   this.reel.celebrates?.forEach((res: any) => {
  //     this.celebrates.push(res.id);
  //   })

  //   this.totalLikes = this.likes.length;
  //   this.totalLoves = this.loves.length;
  //   this.totalCelebrates = this.celebrates.length;
  //   this.likes.forEach((liked_by_id: number) => {
  //     if (liked_by_id == +this.loggedInUserId) {
  //       this.showLike = false;
  //     } else {
  //       console.log(liked_by_id);
  //     }
  //   });
  //   this.loves.forEach((loved_by_id: number) => {
  //     if (loved_by_id == +this.loggedInUserId) {
  //       this.showLove = false;
  //     } else {
  //       console.log(loved_by_id);
  //     }
  //   });
  //   this.celebrates.forEach((celebrated_by_id: number) => {
  //     if (celebrated_by_id == +this.loggedInUserId) {
  //       this.showCelebrate = false;
  //     } else {
  //       console.log(celebrated_by_id);
  //     }
  //   });
  // const chatroomsResp: any = await lastValueFrom(this.chatService.showChatRooms());

  // if (Array.isArray(chatroomsResp)) {
  //   for (const data of chatroomsResp) {
  //     // normalize IDs to strings for safe comparison
  //     const reelIdStr = String(this.reelId);
  //     const dataReelStr = String(data?.reel ?? '');

  //     // ✅ handle reel match
  //     if (dataReelStr === reelIdStr) {
  //       // reel matched

  //       // ✅ handle owner (backend returns numeric id)
  //       this.chatroom_owner = Number(data.owner);

  //       // ✅ check if current user is participant
  //       const isParticipant = Array.isArray(data.participants) &&
  //         data.participants.some((p: any) => Number(p.id) === this.loggedInUserId);

  //       if (isParticipant) {
  //         this.chatroomID = data.id;
  //         console.log('✅ Found Chatroom:', data.id);
  //         break; // stop searching
  //       }
  //     }
  //   }
  // }
  // console.log('loadData finished, chatroomID=', this.chatroomID, 'chatroom_owner=', this.chatroom_owner);


  //   // this.chatService.showChatRooms().subscribe((resp:any) => {
  //   //   console.log(resp);

  //   //   if (resp) {
  //   //     resp.forEach((data:any)=>{
  //   //       if (data.reel) {
  //   //         if (this.reelId == data.reel  && this.reel.reel_owner == this.loggedInUserId) {
  //   //           this.chatroom_owner = data.owner;
  //   //           data.participants.forEach((participant:any)=>{
  //   //             console.log(participant.id);
  //   //             if (participant.id === this.loggedInUserId) {
  //   //               this.chatroomID = data.id;
  //   //               console.log("Has Chatroom");
  //   //             }
  //   //           })
  //   //         }
  //   //       }
  //   //     })
  //   //   }

  //   //   console.log(this.chatroomID);
  //   // })
  // }

  goToChatRoom() {
    const navigationExtras: NavigationExtras = {state: {object_type: "story",object_id:this.storyId,chatroom_owner: this.chatroom_owner}};
    this.router.navigate(['/chat/' + this.chatroomID],navigationExtras);
  }

}
