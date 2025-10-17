
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../models/profile';

@Injectable({ providedIn: 'root' })
export class ProfileHTTPService {
  token = JSON.parse(localStorage.getItem("access")!);
  httpOptions = {
    headers: new HttpHeaders(
    {
       'Authorization': 'Bearer ' + this.token,
       'Content-Type': 'application/json'
    })
  }

  constructor(
    private http: HttpClient
  ) {}


  fetchPrivateProfile(): Observable<Profile> {

    return this.http.get<Profile>(
      "http://localhost:4500/profile/private/",{withCredentials: true}
    )
  }

  fetchPrivateProfileById(profileId: number): Observable<Profile> {

    return this.http.get<Profile>(
      "http://localhost:4500/profile/private/" + profileId + "/",{withCredentials: true}
    )
  }
  addProfile(profile: Profile): Observable<Profile> {

    return this.http.post<Profile>(
      "http://localhost:4500/profile/private/",
      profile,{withCredentials: true})
  }
  addProfileImage(profileId: string, avatar: any) {
    let httpOptions = {
      headers: new HttpHeaders(
      {
         'Authorization': 'Bearer ' + this.token
      })
    }
    return this.http.post<Profile>(
      "http://localhost:4500/profile/private/" + profileId + "/upload-avatar/",
      avatar,{withCredentials: true})
  }
  updateProfile(profileId: number, profile: any): Observable<Profile> {
    let httpOptions = {
      headers: new HttpHeaders(
      {
         'Authorization': 'Bearer ' + this.token
      })
    }

    return this.http.patch<Profile>(
      "http://localhost:4500/profile/private/" + profileId + "/",
      profile,{withCredentials: true})
  }
  fetchPublicProfile(userId: number): Observable<Profile> {

    return this.http.get<Profile>(
      "http://localhost:4500/profile/" + userId,{withCredentials: true}
    )
  }

  sendFriendRequest(friendRequest: any) {
    return this.http.post(
      "http://localhost:4500/profile/friends/add_friend/",
      friendRequest,{withCredentials: true}
    )
  }

  acceptFriendRequest(requestInfo: any) {
    return this.http.post(
      "http://localhost:4500/profile/friends/accept_request/",
      requestInfo,{withCredentials: true}
    )
  }

  rejectFriendRequest(requestInfo: any) {
    return this.http.post(
      "http://localhost:4500/profile/friends/reject_request/",
      requestInfo,{withCredentials: true}
    )
  }

  removeFriend(requestInfo: any) {
    return this.http.post(
      "http://localhost:4500/profile/friends/remove_friend/",
      requestInfo,{withCredentials: true}
    )
  }

  pendingReceivedFriendRequests() {
    return this.http.get(
      "http://localhost:4500/profile/friends/requests/",{withCredentials: true}
    )
  }



  listFriends() {
    return this.http.get(
      "http://localhost:4500/profile/friends/",{withCredentials: true}
    )
  }

  pendingSentFriendRequests() {
    return this.http.get(
      "http://localhost:4500/profile/friends/sent_requests/",{withCredentials: true}
    )
  }


  rejectedSentFriendRequests(user: number) {
    const params = new HttpParams().append('user', user);
    return this.http.get(
      "http://localhost:4500/profile/friends/rejected_received_requests/",
      {withCredentials: true,params}
    )
  }

  rejectedReceivedFriendRequests() {
    return this.http.get(
      "http://localhost:4500/profile/friends/rejected_requests/",{withCredentials: true}
    )
  }


  fetchStoryReactionActivityFeed() {
    return this.http.get(
      "http://localhost:4500/story/s_notifications",{withCredentials: true}
    )
  }


  fetchStoryCommentActivityFeed() {
    return this.http.get(
      "http://localhost:4500/story/sc_notifications",{withCredentials: true}
    )
  }

  fetchReelReactionActivityFeed() {
    return this.http.get(
      "http://localhost:4500/story/r_notifications",{withCredentials: true}
    )
  }

  fetchReelCommentActivityFeed() {
    return this.http.get(
      "http://localhost:4500/story/rc_notifications",{withCredentials: true}
    )
  }

  fetchPhotos() {
    return this.http.get(
      "http://localhost:4500/story/photos",{withCredentials: true}
    )
  }

  fetchWall() {
    return this.http.get(
      "http://localhost:4500/profile/wall",{withCredentials: true}
    )
  }
  findisFollower(id: number) {
    const params = new HttpParams().append('requested_user_id', id);
    return this.http.get(
      "http://localhost:4500/profile/follow/is_follower/",{withCredentials: true,params}
    )
  }
  findisFollowing(id: number) {
    const params = new HttpParams().append('requested_user_id', id);
    return this.http.get(
      "http://localhost:4500/profile/follow/is_following/",{withCredentials: true,params}
    )
  }
  findisBlocked(id: number) {
    const params = new HttpParams().append('requested_user_id', id);
    return this.http.get(
      "http://localhost:4500/profile/block/is_blocked/",{withCredentials: true,params}
    )
  }
  findisBlocking(id: number) {
    const params = new HttpParams().append('requested_user_id', id);
    return this.http.get(
      "http://localhost:4500/profile/block/is_blocking/",{withCredentials: true,params}
    )
  }

}
