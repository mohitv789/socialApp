import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Injectable } from '@angular/core';

import { Location } from '@angular/common';
import { AuthService } from './auth.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    router: RouterStateSnapshot
  ): boolean{
    if (this.authService.checkValidity()) {
      console.log("Authenticated");
      AuthService.authEmitter.emit(true);
      return true;
    } else {
      console.log("Unauthenticated");
      this.router.navigate(["/auth/login"]);
      AuthService.authEmitter.emit(false);
      return false;
    }
  }
}
