// src/app/services/feed.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CombinedFeedResponse {
  activities: any[];
  activities_page: number;
  activities_has_next: boolean;
  stories: any[];
  reels: any[];
  friend_activities: any[];
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private base = 'http://localhost:4500/story/combined-feed/';

  constructor(private http: HttpClient) {}

  getCombinedFeed(page = 1, per_page = 20): Observable<CombinedFeedResponse> {
    let params = new HttpParams().set('page', String(page)).set('per_page', String(per_page));
    return this.http.get<CombinedFeedResponse>(this.base, { params });
  }
}
