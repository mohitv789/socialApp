import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UtilService } from '../../util.service';

@Component({
  selector: 'app-ai-tools',
  templateUrl: './ai-tools.component.html',
  styleUrls: ['./ai-tools.component.css']
})
export class AiToolsComponent implements OnInit {


  aiCollapsed = true;
    /** Outputs to parent component for AI actions and other notifications */
  @Output() aiAction = new EventEmitter<{ action: string, prompt?: string }>();
  @Output() aiUndo = new EventEmitter<void>();
  @Input() undoStack: any[] = [];
  @Output() closeSignal = new EventEmitter<any>(); // used when child wants to notify parent
  ngOnInit(): void {
    // Initialization logic here
  }

  constructor(private utilService: UtilService) { }

  applyAIFilter(action: string, prompt?: string) {
    const p = typeof prompt === 'string' ? prompt.trim() : undefined;
    this.aiAction.emit({ action, prompt: p });
  }

  undoAIEdit() {
    this.aiUndo.emit();
  }

  // ------------------------- UI helpers -------------------------

  toggleAIPanel(ev?: Event) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    this.aiCollapsed = !this.aiCollapsed;
  }

  /**
   * Template sometimes expects getNotification callback from child components
   * (e.g. <app-main-tool (closeSignal)="getNotification($event)">). Implement it
   * here and forward upward to the parent via closeSignal Output.
   */
  getNotification(evt: any) {
    // simply re-emit to parent so parent (ImageEditorComponent) can handle it
    this.closeSignal.emit(evt);
  }

  onAiAction(event: { action: string; prompt?: string }) {
    // Minimal safe handler: show a snackbar and forward to ai service if available.
    const { action, prompt } = event;
    console.log('AI Action requested:', action, prompt);

    // If you have an AIImageService that returns edited URL, call it and update canvas:
    if ((this as any).aiService && typeof (this as any).aiService.process === 'function') {
      // Example: aiService.process(action, prompt, imageBlob) -> returns { edited_url }
      // Use utilService.uploadedImageURL or editedImageURL as source image
      const sourceUrl = this.utilService.uploadedImageURL || this.utilService.editedImageURL;
      this.utilService.openSnackBar('AI processing started...', 2000);
      // you need to implement process(action, prompt, imageUrl) on your AI service
      (this as any).aiService.process(action, prompt, sourceUrl).subscribe({
        next: (resp: any) => {
          const url = resp?.edited_url || resp?.url;
          if (url) {
            // replace current canvas image by publishing addImageToCanvas
            this.utilService.addImageToCanvas(url);
            this.utilService.openSnackBar('AI edit applied', 1500);
          } else {
            this.utilService.openSnackBar('AI returned no image', 3000);
          }
        },
        error: (err: any) => {
          console.error('AI error', err);
          this.utilService.openSnackBar('AI edit failed', 3000);
        }
      });
    } else {
      // fallback action: just log and show toast
      this.utilService.openSnackBar(`AI action: ${action} ${prompt ? '- ' + prompt : ''}`, 1600);
    }
  }

  onAiUndo() {
    // If you keep an undo stack in a service, trigger it:
    // For now just notify user — implement actual undo logic in canvas or by storing previous dataURLs.
    this.utilService.openSnackBar('Undo AI (not yet implemented)', 1200);
    // If CanvasComponent or service supports undoAIEdit(), call it:
    if ((this as any).utilService && typeof (this as any).utilService.canvasCommand === 'function') {
      (this as any).utilService.canvasCommand('UNDO_AI', null);
    }
  }

}
