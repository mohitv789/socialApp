import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProfileFileTransferService {
  avatar: File | null = null;
}
