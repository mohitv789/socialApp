
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Story } from '../models/Story';
import { StoryComment } from '../models/StoryComment';

@Injectable({ providedIn: 'root' })
export class StoryHTTPService {


  constructor(
    private http: HttpClient
    ) {}


  fetchStories(): Observable<Story[]> {

    return this.http.get<Story[]>(
      "http://localhost:4500/story/stories/",{withCredentials: true}
    )
  }

  fetchPushedStories(): Observable<Story[]> {

    return this.http.get<Story[]>(
      "http://localhost:4500/story/s_feed",{withCredentials: true}
    )
  }

  fetchPushedReelStories(): Observable<Story[]> {

    return this.http.get<Story[]>(
      "http://localhost:4500/story/r_feed",{withCredentials: true}
    )
  }



  fetchStory(storyId: string) {

    return this.http.get<Story>(
      "http://localhost:4500/story/stories/" + storyId + "/",{withCredentials: true}
    )

  }

  fetchFeedStory(storyId: string) {

    return this.http.get<Story>(
      "http://localhost:4500/story/s_feed/stories/" + storyId,{withCredentials: true}
    )

  }

  addStory(story: any): Observable<Story> {

    return this.http.post<Story>(
      "http://localhost:4500/story/stories/",
      story,{withCredentials: true})
  }
  addStoryImage(storyId: string, image: any) {

    return this.http.post<Story>(
      "http://localhost:4500/story/stories/" + storyId + "/upload-image/",
      image,{withCredentials: true})
  }
  updateStory(storyId: string, story: any): Observable<Story> {
    return this.http.patch<Story>(
      "http://localhost:4500/story/stories/" + storyId + "/",
      story,{withCredentials: true})
  }

  fetchComments(storyId: string) {
    return this.http.get<StoryComment[]>(
      "http://localhost:4500/story/storycomments/" + storyId + "/",{withCredentials: true}
    )
  }

  updateComment(storyId: string, comment: StoryComment): Observable<StoryComment> {


    return this.http.put<StoryComment>(
      "http://localhost:4500/story/storycomments/" + storyId + "/" + comment.id + "/",
      comment,{withCredentials: true})
  }

  addStoryComment(storyId: string,comment: StoryComment): Observable<StoryComment> {

    return this.http.post<StoryComment>(
      "http://localhost:4500/story/storycomments/"+ storyId + "/",
      comment,{withCredentials: true})
  }

  addStoryLike(storyId: string): Observable<Story> {
    return this.http.post<Story>(
      "http://localhost:4500/story/storyreact/"+ storyId + "/like/",{withCredentials: true})
  }

  removeStoryLike(storyId: string): Observable<Story> {
    return this.http.delete<Story>(
      "http://localhost:4500/story/storyreact/"+ storyId + "/like/",{withCredentials: true})
  }

  addStoryLove(storyId: string): Observable<Story> {
    return this.http.post<Story>(
      "http://localhost:4500/story/storyreact/"+ storyId + "/love/",{withCredentials: true})
  }

  removeStoryLove(storyId: string): Observable<Story> {
    return this.http.delete<Story>(
      "http://localhost:4500/story/storyreact/"+ storyId + "/love/",{withCredentials: true})
  }

  addStoryCelebrate(storyId: string): Observable<Story> {
    return this.http.post<Story>(
      "http://localhost:4500/story/storyreact/"+ storyId + "/celebrate/",{withCredentials: true})
  }

  removeStoryCelebrate(storyId: string): Observable<Story> {
    return this.http.delete<Story>(
      "http://localhost:4500/story/storyreact/"+ storyId + "/celebrate/",{withCredentials: true})
  }

  uploadImage(storyId: string,uploadItem: any) {
    return this.http.post<any>(
      "http://localhost:4500/story/"+ storyId + "/upload-image/",
      uploadItem,{withCredentials: true}
    )
  }

  fetchStoryfromReel(reelId:string) {
    return this.http.get<Story>(
      `http://localhost:4500/story/stories/get-reel-story/?reel_id=${reelId}/`,{withCredentials: true}
    )
  }
}
