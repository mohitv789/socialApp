import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit{
  form!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirm: '',
    });
  }

  submit() {
    this.authService.signup(
        this.form.getRawValue().email,
        this.form.getRawValue().password,
        this.form.getRawValue().first_name,
        this.form.getRawValue().last_name,
        this.form.getRawValue().password_confirm
      )
      .subscribe(
        () => this.router.navigate(['/login'])
      );
  }
}
