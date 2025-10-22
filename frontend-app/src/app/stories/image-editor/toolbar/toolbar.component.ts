import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { UtilService } from '../util.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit{
  selectedToolTypeList:string[] = [
    'MAIN',
    'TEXT',
    'TEXT:EDITING',
    'CROP',
    'PREVIEW',
    'FILTER:ALL',
    'FILTER:SINGLE',
    'SHAPE_MASK',
    'PEN',
    'DEACTIVATE'
  ];
  selectedToolType:string;
  activeObjectProps:any;
  selection:any;
  selectionType!:string;
  fileInputElement: any;
  fileUrlList: string[] = [];
  loadingFiles!: boolean;
  index: number;
  orientation: string;
  // ---------------------------- Subscription ------------------------------
  onChangeToolTypeSubscription:Subscription;
  onSelectionCreatedSubscription:Subscription;
  @Output() closeSignal: EventEmitter<any> = new EventEmitter();



  /** emits when an AI action is requested from the toolbar */
  @Output() aiRequest = new EventEmitter<{ action: string, prompt?: string }>();

  /** emits when undo is requested */
  @Output() undoRequested = new EventEmitter<void>();

  /**
   * Called by template buttons: emits an aiRequest event for parent to handle.
   * action: string => one of 'remove_bg'|'enhance'|'restore'|'llm_parse' etc.
   * prompt: optional prompt for LLM-based actions
   */
  applyAIFilter(action: string, prompt?: string): void {
    // defensive: normalize params
    const payload: { action: string, prompt?: string } = { action };
    if (prompt && prompt.trim().length) payload.prompt = prompt.trim();
    this.aiRequest.emit(payload);
  }

  /**
   * Called by the "Undo AI" button in the template.
   * Emits undoRequested which parent should handle (e.g. call undoAIEdit())
   */
  undoAIEdit(): void {
    this.undoRequested.emit();
  }


  onChangeToolType(toolType:string):void {
    this.selectedToolType = toolType;
  }

  cleanSelect(){
    this.utilService.canvasCommand('CLEAN_SELECT',{});
    this.onChangeToolType('MAIN');
  }

  backToMainMenu(){
    this.utilService.canvasCommand('BACK_TO_MAIN_MENU',{});
    this.onChangeToolType('MAIN');
  }

  bringForward(){
    this.utilService.canvasCommand('BRING_FORWARD',{});
  }

  sendBackward(){
    this.utilService.canvasCommand('SEND_BACKWARD',{});
  }

  constructor(private utilService:UtilService) {
      this.selectedToolType = this.selectedToolTypeList[0];
      this.onChangeToolTypeSubscription = utilService.changeToolType$.subscribe(
        ({toolType,activeObjectProps})=>{
          if(activeObjectProps){
              this.activeObjectProps = activeObjectProps;
          }
          this.onChangeToolType(toolType);
        }
      )
      this.onSelectionCreatedSubscription = utilService.onSelectionCreated$.subscribe(
        ({selection,selectionType}) => {
          this.selectionType = selectionType;
          this.selection = selection;
        }
      )
      this.selection = undefined;
      this.onSelectionCreatedSubscription = utilService.onSelectionCreated$.subscribe(
        ({selection}) => {
          this.selection = selection;
        }
      )

      this.index = 1;
      this.orientation = 'LANDSCAPE';
   }

  ngOnInit() {
    this.fileInputElement = document.getElementById('upload-file-input');
  }

  ngOnDestroy(){
    this.onChangeToolTypeSubscription.unsubscribe();
    this.onSelectionCreatedSubscription.unsubscribe();

  }
  onClearByIndex(indexToRemove:number):void{
    this.fileUrlList = this.fileUrlList.filter(
      (url,index) => index !== indexToRemove
    )
  }

  onClearAll(){
    this.fileUrlList = [];
  }

  onRemoveObjectFromCanvas(){
    this.utilService.canvasCommand('DELETE',{});
  }

  addImageOnCanvas(url:string):void{
    this.utilService.addImageToCanvas(url);
  }

  changeOrientation(orientation: string){
    this.orientation = orientation;
    this.utilService.changeCanvasSize(orientation,this.index);
  }

  getNotification(evt: any) {
    console.log(evt);
    this.closeSignal.emit(evt);
  }
}
