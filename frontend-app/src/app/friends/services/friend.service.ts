
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FriendHTTPService {
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

  listFriends(): Observable<any[]>  {
    return this.http.get<any[]>(
      "http://localhost:4500/profile/friends",{withCredentials: true}
    )
  }

  friendstoryActivity(friend_id: number) {
    const params = new HttpParams().append('friend_id', friend_id);

    return this.http.get(
      "http://localhost:4500/story/fs_notifications",
      {withCredentials: true,params}
    )
  }

  friendreelActivity(friend_id: number) {
    const params = new HttpParams().append('friend_id', friend_id);

    return this.http.get(
      "http://localhost:4500/story/fr_notifications",
      {withCredentials: true,params}
    )
  }

  isFriend(checked_user_id:number) {
    return this.http.get(`http://localhost:4500/profile/friends/is_friend/?checked_user_id=${checked_user_id}`,{withCredentials: true});
  }

}
