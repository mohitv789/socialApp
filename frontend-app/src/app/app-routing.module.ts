import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoriesComponent } from './stories/stories.component';
import { StoryListComponent } from './stories/story-list/story-list.component';
import { StoryNewComponent } from './stories/story-new/story-new.component';
import { StoryEditComponent } from './stories/story-edit/story-edit.component';
import { StoryDetailComponent } from './stories/story-detail/story-detail.component';
import { ReelListComponent } from './stories/reel/reel-list/reel-list.component';
import { ReelDetailComponent } from './stories/reel/reel-detail/reel-detail.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotComponent } from './auth/forgot/forgot.component';
import { ResetComponent } from './auth/reset/reset.component';
import { ReelPersonalComponent } from './stories/reel/reel-personal/reel-personal.component';
import { StoryPushedComponent } from './stories/story-pushed/story-pushed.component';
import { AuthGuard } from './auth/services/auth.guard';
import { PushedDetailComponent } from './stories/story-pushed/pushed-detail/pushed-detail.component';
import { PushedReelDetailComponent } from './stories/story-pushed/pushed-reel-detail/pushed-reel-detail.component';
import { PrivateProfileComponent } from './auth/private-profile/private-profile.component';
import { PublicProfileComponent } from './auth/public-profile/public-profile.component';
import { PrivateProfileEditComponent } from './auth/private-profile/private-profile-edit/private-profile-edit.component';
import { FriendsComponent } from './friends/friends.component';
import { FriendListComponent } from './friends/friend-list/friend-list.component';
import { FriendDetailComponent } from './friends/friend-detail/friend-detail.component';
import { WebchatComponent } from './webchat/webchat.component';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'forgot', component: ForgotComponent},
  {path: 'reset/:token', component: ResetComponent},
  {
    path: 'feed',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: StoryPushedComponent
      },
      {
        path: ':storyId',
        component: PushedDetailComponent,
      },
      {
        path: 'reel/:reelId',
        component: PushedReelDetailComponent,
      },
    ]
  },
  {
    path: 'story',
    component: StoriesComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: StoryListComponent
      },
      {
        path: 'new',
        component: StoryNewComponent
      },
      {
        path: ':id',
        component: StoryDetailComponent,
      },
      {
        path: ':id/edit',
        component: StoryEditComponent,
      }
    ]
  },
  {
    path: 'reel',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'personal/:userId',
        component: ReelPersonalComponent,
      },
      {
        path: 'story/:storyId',
        component: ReelListComponent,
      },
      {
        path: 'detail/:reelId',
        component: ReelDetailComponent,
      }
    ]
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'personal',
        component: PrivateProfileComponent,
      },
      {
        path: 'personal/:profileId',
        component: PrivateProfileEditComponent,
      },
      {
        path: ':userId',
        component: PublicProfileComponent,
      }
    ]
  },
  {
    path: 'friends',
    component: FriendsComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: FriendListComponent
      }
    ]
  },
  {
    path: 'friends/:friendId',
    canActivate: [AuthGuard],
    component: FriendDetailComponent,
  },
  {
    path: 'chat/:chatroom_id',
    canActivate: [AuthGuard],
    component: WebchatComponent,
  },
  { path: '**', redirectTo: 'feed' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
