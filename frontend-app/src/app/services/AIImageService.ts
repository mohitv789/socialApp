import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AIImageService {
  private apiBase = '/api/ai'; // adjust to your backend

  constructor(private http: HttpClient) {}

  // Sync request with upload progress (returns numbers while uploading, final body when done)
  processWithProgress(formData: FormData): Observable<number | any> {
    const req = new HttpRequest('POST', `${this.apiBase}/edit/sync`, formData, {
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          return Math.round((100 * (event.loaded || 0)) / (event.total || 1)); // progress %
        } else if (event.type === HttpEventType.Response) {
          return event.body; // final response
        }
        return 0;
      })
    );
  }

  // Start async job (returns job id)
  startJob(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiBase}/edit`, formData);
  }

  // Poll result for async job
  pollResult(jobId: string): Observable<any> {
    return this.http.get(`${this.apiBase}/edit/${jobId}`);
  }
}
