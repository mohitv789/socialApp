import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('GlobalErrorHandler caught:', error);
    try { alert('GlobalError: ' + (error && error.message ? error.message : error)); } catch(e) {}
    throw error;
  }
}
