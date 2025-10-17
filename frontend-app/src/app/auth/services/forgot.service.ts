import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ForgotService {
  apiUrl = "http://localhost:4500/a"
  constructor(private http: HttpClient) {
  }

  forgot(body: any) {
    return this.http.post(`${this.apiUrl}/forgot`, body);
  }

  reset(body: any) {
    return this.http.post(`${this.apiUrl}/reset`, body);
  }
}
