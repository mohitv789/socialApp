import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable, of, Subject }    from 'rxjs';
import { AiResponse } from './toolbar/ai-tools/ai-tools.component';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  uploadedImageURL: any;
  editedImageURL: any;
  originalCaption: any;
  uploadedId: string = "";
  dataPostUpdate: any ;

  constructor(
    private http: HttpClient
  ) {
  }
  

  private addImageToCanvasSource = new Subject<any>();
  addImageToCanvas$ = this.addImageToCanvasSource.asObservable();
  addImageToCanvas = (url:any) => {
    this.addImageToCanvasSource.next(url);
  }

  // --------------------- Adding Image filter ------------------------------
  private addImageFilterSource = new Subject<any>();
  addImageFilter$ = this.addImageFilterSource.asObservable();
  addImageFilter = (filterScope:any,filterProps:any) => {
    this.addImageFilterSource.next({filterScope,filterProps})
  }

  // --------------------- Edit Text ----------------------------------------
  private onUpdateTextSource = new Subject<any>();
  onUpdateText$ = this.onUpdateTextSource.asObservable();
  onUpdateText = (textProps:any) => {
    this.onUpdateTextSource.next(textProps);
  }

  // ---------------------- Edit shape mask ---------------------------------
  private onUpdateShapeMaskSource = new Subject<any>();
  onUpdateShapeMask$ = this.onUpdateShapeMaskSource.asObservable();
  onUpdateShapeMask = (shapeMaskProps:any) => {
    this.onUpdateShapeMaskSource.next(shapeMaskProps);
  }

    //------------------------ Edit brush props ------------------------------
    private onChangeBrushSource = new Subject<any>();
    onChangeBrush$ = this.onChangeBrushSource.asObservable();
    onChangeBrush = (brushProps:any) => {
      this.onChangeBrushSource.next(brushProps);
    }


  // --------------------- On Change Tool type ------------------------------
  private changeToolTypeSource = new Subject<any>();
  changeToolType$ = this.changeToolTypeSource.asObservable();
  changeToolType = (toolType:any,activeObjectProps:any) => {
    if(activeObjectProps){
      this.changeToolTypeSource.next({
        toolType:toolType,
        activeObjectProps:activeObjectProps
      })
    }
    else{
      this.changeToolTypeSource.next({
        toolType:toolType
      })
    }
  }

  // ----------------------- Object selection ---------------------------------
  private onSelectionCreatedSource = new Subject<any>();
  onSelectionCreated$ = this.onSelectionCreatedSource.asObservable();
  onSelectionCreated = (selection:any,selectionType:any,extraOptions:any) => {
    this.onSelectionCreatedSource.next({selection,selectionType,extraOptions});
  }

  //------------------------ canvas command -----------------------------------
  private canvasCommandSource = new Subject<any>();
  canvasCommand$ = this.canvasCommandSource.asObservable();
  canvasCommand = (toolType:any,option:any) => {
    this.canvasCommandSource.next({toolType,option});
  }

  //------------------------ open snackbar -------------------------------------
  private openSnackBarSource = new Subject<any>();
  openSnackBar$ = this.openSnackBarSource.asObservable();
  openSnackBar = (message:any,duration:any) => {
    this.openSnackBarSource.next({message,duration});
  }

  //------------------------ change canvas size ---------------------------------
  private changeCanvasSizeSource = new Subject<any>();
  changeCanvasSize$ = this.changeCanvasSizeSource.asObservable();
  changeCanvasSize = (orientation:any, aspectRatio:any) => {
    this.changeCanvasSizeSource.next({ orientation, aspectRatio });
  }

  editUserImage(reelId: string, image: any) {

    return this.http.put<any>(
      "http://localhost:4500/story/reels/" + reelId + "/edit-image/",
      image,
      {withCredentials: true})
  }

  process(action: string, prompt?: string, imageUrl?: string): Observable<AiResponse> {
    // Replace with actual endpoint and payload
    const payload = { action, prompt, imageUrl };
    // return this.http.post<AiResponse>('/api/ai/process', payload);

    // STUB: returns same imageUrl after a tiny delay
    return of({ edited_url: imageUrl }).pipe();
  }

}
