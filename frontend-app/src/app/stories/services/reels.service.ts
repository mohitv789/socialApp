
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reel } from '../models/Reel';
import { ReelComment } from '../models/ReelComment';

@Injectable({ providedIn: 'root' })
export class ReelsHTTPService {

  constructor(
    private http: HttpClient
  ) {}

  fetchReelPersonal(userId: number): Observable<Reel[]> {
    return this.http.get<Reel[]>(
      "http://localhost:4500/story/reels",{withCredentials: true}
    )
  }

  fetchReel(reelId: string): Observable<Reel> {

    return this.http.get<Reel>(
      "http://localhost:4500/story/reels/" + reelId + "/",{withCredentials: true}
    )
  }

  fetchReelforFeed(reelId: string): Observable<Reel> {
    console.log(reelId);

    return this.http.get<Reel>(
      "http://localhost:4500/story/s_feed/reels/" + reelId,{withCredentials: true}
    )
  }

  fetchReelComments(reelId: string) {
    return this.http.get<ReelComment[]>(
      "http://localhost:4500/story/reelcomments/" + reelId + "/",{withCredentials: true}
    )
  }

  updateReelComment(reelId: string, comment: ReelComment): Observable<ReelComment> {


    return this.http.put<ReelComment>(
      "http://localhost:4500/story/reelcomments/" + reelId + "/" + comment.id + "/",
      comment,{withCredentials: true})
  }

  addReelComment(reelId: string,comment: ReelComment): Observable<ReelComment> {

    return this.http.post<ReelComment>(
      "http://localhost:4500/story/reelcomments/"+ reelId + "/",
      comment,{withCredentials: true})
  }
  addReelLike(reelId: string): Observable<Reel> {
    return this.http.post<Reel>(
      "http://localhost:4500/story/reelreact/"+ reelId + "/like/",{withCredentials: true})
  }

  removeReelLike(reelId: string): Observable<Reel> {
    return this.http.delete<Reel>(
      "http://localhost:4500/story/reelreact/"+ reelId + "/like/",{withCredentials: true})
  }
  addReelLove(reelId: string): Observable<Reel> {
    return this.http.post<Reel>(
      "http://localhost:4500/story/reelreact/"+ reelId + "/love/",{withCredentials: true})
  }

  removeReelLove(reelId: string): Observable<Reel> {
    return this.http.delete<Reel>(
      "http://localhost:4500/story/reelreact/"+ reelId + "/love/",{withCredentials: true})
  }
  addReelCelebrate(reelId: string): Observable<Reel> {
    return this.http.post<Reel>(
      "http://localhost:4500/story/reelreact/"+ reelId + "/celebrate/",{withCredentials: true})
  }

  removeReelCelebrate(reelId: string): Observable<Reel> {
    return this.http.delete<Reel>(
      "http://localhost:4500/story/reelreact/"+ reelId + "/celebrate/",{withCredentials: true})
  }
  addReel(reel: any): Observable<Reel> {

    return this.http.post<Reel>(
      "http://localhost:4500/story/reels/",
      reel,{withCredentials: true})
  }
  updateReel(reelId: string, reel: any): Observable<Reel> {


    return this.http.patch<Reel>(
      "http://localhost:4500/story/reels/" + reelId + "/",
      reel,{withCredentials: true})
  }
  addReelImage(reelId: string, formData: FormData) {

    return this.http.post<Reel>(
      "http://localhost:4500/story/reels/" + reelId + "/upload-image/",
      formData,{withCredentials: true})
  }

  editReelImage(reelId: string, image: any) {

    return this.http.put<Reel>(
      "http://localhost:4500/story/reels/" + reelId + "/edit-image/",
      image,{withCredentials: true})
  }

  deleteReel(reelId: string) {

    return this.http.delete<Reel>(
      "http://localhost:4500/story/reels/" + reelId + "/",{withCredentials: true})
  }
}
