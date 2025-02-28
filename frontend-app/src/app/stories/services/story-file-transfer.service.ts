import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StoryFileTransferService {
  image: File | null = null;
}
