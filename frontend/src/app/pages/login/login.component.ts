import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {FormsModule} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {AuthenticationRequest, AuthenticationResponse, ErrorResponse} from "../../interfaces";
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent} from "../../components/error-dialog/error-dialog.component";
import { Router } from '@angular/router';
import {MatTableModule} from "@angular/material/table";


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, FormsModule, MatTableModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent implements OnInit {
  requestBody: AuthenticationRequest = {username: '', password: ''};
  passwordVisible = true;
  constructor(private http: HttpClient, public dialog: MatDialog, private router: Router) {
  }

  ngOnInit() {
  }

  ValidateUser() {
    if (this.requestBody.username === "" || this.requestBody.password === "") {
      console.log('Validation error!')
    }
    else {
      this.http.post<AuthenticationResponse | ErrorResponse>(
        'http://localhost:5000/user-authentication',
        this.requestBody,
        {responseType: 'json'}).subscribe({
        next: data  => {
          if (data.status === "success") {
            localStorage.setItem('username', data.username);
            localStorage.setItem('ticket', data.ticket);
            console.log('Pass');
            if (data.rights === "admin") {
              this.router.navigateByUrl('/admin-menu', { state: { isAdmin: true } });
            }
            else {
              this.router.navigateByUrl('/user-menu', { state: { isAdmin: false } });
            }
          }
          else {
            this.dialog.open(ErrorDialogComponent);
          }
        },
        error: err => {
          this.dialog.open(ErrorDialogComponent, {
            data: { message: err.error.message},
          });
        }
      });
    }
  }
}
