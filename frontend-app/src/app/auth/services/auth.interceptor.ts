import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse
} from '@angular/common/http';
import {catchError, Observable, switchMap, throwError} from 'rxjs';
import {AuthService} from "./auth.service";
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  refresh = false;


  constructor(private authService: AuthService,private router: Router) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const req = request.clone({withCredentials: true});

    return next.handle(req).pipe(catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !this.refresh) {
        this.refresh = true;

        return this.authService.refresh().pipe(
          switchMap((res: any) => {
            console.log("Calling Interceptor for refresh!!")
            return next.handle(request.clone({withCredentials: true}));
          })
        );
      }
      this.refresh = false;
      return throwError(() => err);
    }));
  }
}
