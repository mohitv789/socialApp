import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';
import { BASE_URL } from '../../config';

import { WebSocketService } from '../../webchat/services/websocket.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  static authEmitter = new EventEmitter<boolean>();
  constructor(private http: HttpClient, private router: Router,private wService: WebSocketService) {}

  login(email: string, password: string) {
    return this.http
      .post(
        `${BASE_URL}/auth/token`,
        {
          email: email,
          password: password
        },
        {withCredentials: true}
      )
      .pipe(
        tap((resData:any) => {
          AuthService.authEmitter.emit(true);

          const userId = resData.user_id;
          localStorage.setItem("UserID",userId);
          this.getUserDetails(userId);

          const access_token_expiry = resData.access_token_expiry;
          localStorage.setItem("expiry",access_token_expiry);
        })
      );
  }

  signup(email: string, password: string,first_name: string,last_name: string,password_confirm: string) {
    return this.http
    .post(
      `${BASE_URL}/auth/register`,
      {
        email: email,
        password: password,
        first_name: first_name,
        last_name: last_name,
        password_confirm:password_confirm
      }
    );

  }

  autoLogin() {
    const token_expiry = parseInt(localStorage.getItem('expiry')!);
    if (!token_expiry) {
      return;
    }
    if ((token_expiry - new Date().getSeconds()) > 0 ) {
      this.refresh().subscribe();
    } else {
      this.logout();
    }
  }

  logout() {

    localStorage.removeItem('UserID');
    localStorage.removeItem('Username');
    localStorage.removeItem('expiry');
    AuthService.authEmitter.emit(false);
    this.wService.closeWebSocket();
    try {
      this.http.post(`${BASE_URL}/auth/logout`,{},{withCredentials: true}).subscribe();
    } catch(error) {
      console.log(error);
    }

    this.router.navigate(["/login"]);
  }

  getUserDetails(user_id:number) {
    const user_details = this.http
        .get(`${BASE_URL}/auth/user/${user_id}`, {withCredentials: true})
        .pipe(map(
          (data:any) => {
            if (data === null) {
              return new Error("Some error occured! No data found!");
            };
            return data;
        }
      )
    );
    user_details.subscribe(
      (data) => {
        if (data.email.length > 0) {
          localStorage.setItem("email",data.email);
        }
      });
  }

  checkValidity() {
    const token_expiry = parseInt(localStorage.getItem('expiry')!);
    if (!token_expiry) {
      return;
    }
    if (token_expiry - (new Date().getSeconds()) > 0) {
      return true;
    } else {
      localStorage.removeItem('UserID');
      localStorage.removeItem('Username');
      localStorage.removeItem('expiry');
      return false;
    }
  }

  refresh() {
    return this.http.post(`${BASE_URL}/auth/token/refresh`, {}, {withCredentials: true});
  }

  publicUser(userId: number) {
    return this.http.get(`${BASE_URL}/auth/user/${userId}`, {withCredentials: true});
  }
  user() {
    return this.http.get(`${BASE_URL}/auth/user`, {withCredentials: true});
  }

}
