import { Component, EventEmitter, Input, OnInit, Output, Optional } from '@angular/core';
import { UtilService } from '../../util.service';

export interface AiResponse {
  edited_url?: string;
  url?: string;
  // other metadata...
}

@Component({
  selector: 'app-ai-tools',
  templateUrl: './ai-tools.component.html',
  styleUrls: ['./ai-tools.component.css']
})
export class AiToolsComponent implements OnInit {
  aiCollapsed = true;

  /** Indicates whether there's an image loaded that AI can operate on */
  @Input() imageAvailable = false;
  /** Optional: current image URL */
  @Input() imageUrl?: string;

  /** Outputs to parent component for AI actions and other notifications */
  @Output() aiAction = new EventEmitter<{ action: string, prompt?: string }>();
  @Output() aiUndo = new EventEmitter<void>();
  @Input() undoStack: any[] = [];
  @Output() closeSignal = new EventEmitter<any>(); // used when child wants to notify parent

  constructor(private utilService: UtilService) { }

  ngOnInit(): void { }

  applyAIFilter(action: string, prompt?: string) {
    const p = typeof prompt === 'string' ? prompt.trim() : undefined;
    // Emit to parent so parent app-level logic can listen
    this.aiAction.emit({ action, prompt: p });

    // Also try to process locally if aiService is available
    this.onAiAction({ action, prompt: p });
  }

  undoAIEdit() {
    this.aiUndo.emit();
    this.onAiUndo();
  }

  // ------------------------- internal handlers -------------------------

  onAiAction(event: { action: string; prompt?: string }) {
    const { action, prompt } = event;
    if (!this.imageAvailable && !['llm_parse'].includes(action)) {
      this.utilService.openSnackBar('No image loaded for AI action', 1800);
      return;
    }

    this.utilService.openSnackBar('AI processing started...', 1200);

    if (this.utilService && typeof this.utilService.process === 'function') {
      // aiService.process(action, prompt, imageUrl) should return an Observable/Promise
      this.utilService.process(action, prompt, this.imageUrl).subscribe({
        next: (resp: any) => {
          const url = resp?.edited_url || resp?.url;
          if (url) {
            // Use UtilService to add/replace image on canvas
            this.utilService.addImageToCanvas(url);
            // Push previous state to undoStack if you keep states here
            this.utilService.openSnackBar('AI edit applied', 1400);
          } else {
            this.utilService.openSnackBar('AI returned no image', 2500);
            console.warn('aiService response had no url', resp);
          }
        },
        error: (err: any) => {
          console.error('AI error', err);
          this.utilService.openSnackBar('AI edit failed', 3000);
        }
      });
    } else {
      // No aiService, fallback: notify user and let parent handle (aiAction emitted above)
      this.utilService.openSnackBar(`AI action queued: ${action}${prompt ? ' — ' + prompt : ''}`, 1600);
    }
  }

  onAiUndo() {
    this.utilService.openSnackBar('Undo AI (attempting)', 1200);
    // If utilService keeps canvas states, call:
    if (typeof (this.utilService as any).canvasCommand === 'function') {
      (this.utilService as any).canvasCommand('UNDO_AI', null);
    } else {
      this.utilService.openSnackBar('Undo not available in this build', 1800);
    }
  }

  // ------------------------- UI helpers -------------------------

  toggleAIPanel(ev?: Event) {
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    this.aiCollapsed = !this.aiCollapsed;
  }

  /**
   * Forward notification from child tools to parent.
   */
  getNotification(evt: any) {
    this.closeSignal.emit(evt);
  }
}
