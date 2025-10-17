import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const valid = this.authService.checkValidity();
    if (valid) {
      console.log('AuthGuard: Authenticated');
      AuthService.authEmitter.emit(true);
      return true;
    } else {
      console.log('AuthGuard: Unauthenticated — returning UrlTree to /login');
      AuthService.authEmitter.emit(false);
      // return UrlTree instead of calling router.navigate()
      return this.router.createUrlTree(['/login']);
    }
  }
}
