import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReelFileTransferService {
  fileFieldList: { id: string,image: File, caption: string }[] = [];
}
