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

  openDropdown(event: any) {
    event.preventDefault();
    const el = (event.target as HTMLElement).closest('.dropdown') as HTMLElement | null;
    if (el) {
      const menu = el.querySelector('.dropdown-content') as HTMLElement | null;
      if (menu) {
        menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
      }
    }
  }

  logout() {
    this.authService.logout();
  }
}
