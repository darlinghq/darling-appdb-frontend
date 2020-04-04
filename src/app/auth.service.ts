import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userInfo;

  constructor(private httpClient: HttpClient) {
    this.fetchUserInfo(true);
    
  }

  private fetchUserInfo(setupTimer: boolean) {
    this.httpClient.get<UserInfo>('/api/user').subscribe(
      data => {
        this._userInfo = data;

        if (setupTimer) {
          window.setInterval(() => {
            this.fetchUserInfo(false);
          }, 5*60*1000);
        }
      },
      error => {
        console.error("Cannot get auth'd user info", error);
        this._userInfo = null;
      }
    );
  }

  get userInfo(): UserInfo {
    return this._userInfo;
  }

  get authenticated(): boolean {
    return !!this._userInfo;
  }
}

export class UserInfo {
  email: string;
  name: string;
  provider: string;
}
