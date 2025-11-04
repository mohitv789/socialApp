import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';
import { StoryModule } from './stories/story.module';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatDialogModule} from '@angular/material/dialog';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ResetComponent } from './auth/reset/reset.component';
import { ForgotComponent } from './auth/forgot/forgot.component';
import { AuthInterceptor } from './auth/services/auth.interceptor';
import { FormComponent } from './auth/login/form/form.component';
import { NavigationComponent } from './navigation/navigation.component';
import { PublicProfileComponent } from './auth/public-profile/public-profile.component';
import { PrivateProfileComponent } from './auth/private-profile/private-profile.component';
import { PrivateProfileCreateComponent } from './auth/private-profile/private-profile-create/private-profile-create.component';
import { PrivateProfileEditComponent } from './auth/private-profile/private-profile-edit/private-profile-edit.component';
import { FriendsComponent } from './friends/friends.component';
import { FriendListComponent } from './friends/friend-list/friend-list.component';
import { FriendItemComponent } from './friends/friend-list/friend-item/friend-item.component';
import { FriendDetailComponent } from './friends/friend-detail/friend-detail.component';
import {MatTabsModule} from '@angular/material/tabs';
import { PhotoCarousalComponent } from './auth/private-profile/photo-carousal/photo-carousal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UtilService } from './stories/image-editor/util.service';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatMenuModule} from '@angular/material/menu';
import { SharedModule } from './stories/shared.module';
import { WebchatComponent } from './webchat/webchat.component';
import { ChatroomDialogComponent } from './webchat/chatroom-dialog/chatroom-dialog.component';
import {MatRadioModule} from '@angular/material/radio';
import { ChatHistoryComponent } from './webchat/chat-history/chat-history.component';
import { ChatFormComponent } from './webchat/chat-form/chat-form.component';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { GlobalErrorHandler } from '../global-error-handler';
import { MatCardModule } from '@angular/material/card';

import { IonicModule } from '@ionic/angular';
import { FeedService } from './feed-app/feed.service';
import { FeedAppComponent } from './feed-app/feed-app.component';
import { ChatAppComponent } from './chat-app/chat-app.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    ResetComponent,
    ForgotComponent,
    FormComponent,
    NavigationComponent,
    PublicProfileComponent,
    PrivateProfileCreateComponent,
    PrivateProfileEditComponent,
    FriendsComponent,
    FriendListComponent,
    FriendItemComponent,
    FriendDetailComponent,
    PrivateProfileComponent,
    PhotoCarousalComponent,
    WebchatComponent,
    ChatroomDialogComponent,
    ChatHistoryComponent,
    ChatFormComponent,
    FeedAppComponent,
    ChatAppComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    StoryModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatTabsModule,
    NgbModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    IonicModule.forRoot()
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    UtilService,
    FeedService
    // { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }