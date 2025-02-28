import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit{
  authenticated = false;

  constructor(
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    AuthService.authEmitter.subscribe(authenticated => {
      this.authenticated = authenticated;
    });
    console.log();

  }

  logout() {
    this.authService.logout();
  }
}
