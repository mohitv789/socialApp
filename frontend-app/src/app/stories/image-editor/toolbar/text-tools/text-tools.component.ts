import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UtilService } from '../../util.service';

@Component({
  selector: 'app-text-tools',
  templateUrl: './text-tools.component.html',
  styleUrls: ['./text-tools.component.css']
})
export class TextToolsComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() selectedToolType!: any;
  @Input() activeObjectProps!: any;

  color: string = '#7F7F7F';
  opacity: number = 1;
  fontFamily: string = 'Roboto';
  fontSize: number = 24;
  fontWeight: string = 'normal';
  fontStyle: string = 'normal';
  underline: boolean = false;
  linethrough: boolean = false;
  textAlign: string = 'left';
  lineHeight: number = 1.6;
  charSpacing: number = 0;
  isSelectionInactive: boolean = false;

  fontList = ['Roboto','Alegreya Sans'];

  showSliders = false;

  constructor(private utilService: UtilService) {}

  ngOnInit() {
    if (this.activeObjectProps && this.selectedToolType === 'TEXT') {
      this.applyPropsToLocalState(this.activeObjectProps);
    }
    this.isSelectionInactive = false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeObjectProps'] && this.activeObjectProps) {
      // sync incoming active object props to local form state
      this.applyPropsToLocalState(this.activeObjectProps);
    }
  }

  ngAfterViewInit() { 
    // small delay to avoid ExpressionChangedAfterItHasBeenChecked errors
    setTimeout(()=> this.showSliders = true, 0); 
  }

  // ------------------ helpers ------------------

  private applyPropsToLocalState(props: any) {
    // defensive checks and defaults
    this.color = props.color ?? props.fill ?? this.color;
    this.opacity = (typeof props.opacity !== 'undefined') ? props.opacity : this.opacity;
    this.fontFamily = props.fontFamily ?? this.fontFamily;
    this.fontSize = (typeof props.fontSize !== 'undefined') ? props.fontSize : this.fontSize;
    this.fontWeight = props.fontWeight ?? this.fontWeight;
    this.fontStyle = props.fontStyle ?? this.fontStyle;
    this.underline = props.underline ?? this.underline;
    this.linethrough = props.linethrough ?? this.linethrough;
    this.textAlign = props.textAlign ?? this.textAlign;
    this.lineHeight = (typeof props.lineHeight !== 'undefined') ? props.lineHeight : this.lineHeight;
    this.charSpacing = (typeof props.charSpacing !== 'undefined') ? props.charSpacing : this.charSpacing;

    // if the activeObjectProps includes a flag for disabling selection interactions
    this.isSelectionInactive = props.isSelectionInactive ?? false;
  }

  // Normalize or clean any properties that could crash the canvas (eg: invalid baselines)
  private normalizeOutgoingTextProps(raw: any) {
    if (!raw || typeof raw !== 'object') return {};

    const out: any = {};

    // whitelist only known props to avoid accidental propagation of weird keys
    if ('color' in raw || 'fill' in raw) out.color = raw.color ?? raw.fill;
    if ('opacity' in raw) out.opacity = raw.opacity;
    if ('fontFamily' in raw) out.fontFamily = raw.fontFamily;
    if ('fontSize' in raw) out.fontSize = raw.fontSize;
    if ('fontWeight' in raw) out.fontWeight = raw.fontWeight;
    if ('fontStyle' in raw) out.fontStyle = raw.fontStyle;
    if ('underline' in raw) out.underline = raw.underline;
    if ('linethrough' in raw) out.linethrough = raw.linethrough;
    if ('textAlign' in raw) out.textAlign = raw.textAlign;
    if ('lineHeight' in raw) out.lineHeight = raw.lineHeight;
    if ('charSpacing' in raw) out.charSpacing = raw.charSpacing;

    // sanitize any textBaseline-like value if present (defensive)
    if ('textBaseline' in raw) {
      const normalized = this.normalizeBaseline(raw.textBaseline);
      if (normalized) out.textBaseline = normalized;
      else {
        console.warn('TextTools: dropping invalid textBaseline value:', raw.textBaseline);
        // leave it out to avoid Fabric/canvas crash
      }
    }

    return out;
  }

  // Allowed baselines (CanvasRenderingContext2D.textBaseline + common correction)
  private readonly VALID_BASELINES = new Set(['alphabetic','top','hanging','middle','ideographic','bottom']);
  private normalizeBaseline(value: any): string | undefined {
    if (value == null) return undefined;
    const s = String(value).toLowerCase().trim();
    if (s === 'alphabetical') return 'alphabetic'; // common typo -> correct
    if (this.VALID_BASELINES.has(s)) return s;
    return undefined;
  }

  // ------------------ UI actions ------------------

  onUpdateText(): void {
    // Build raw payload from local component state (what user changed)
    const rawPayload = {
      color: this.color,
      opacity: this.opacity,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      underline: this.underline,
      linethrough: this.linethrough,
      textAlign: this.textAlign,
      lineHeight: this.lineHeight,
      charSpacing: this.charSpacing
    };

    // If editing text (selection editing), the earlier code used a slightly different shape.
    // We'll keep the same behavior: for TEXT:EDITING send fill + font props only.
    let payloadToSend: any;
    if (this.selectedToolType === 'TEXT') {
      payloadToSend = this.normalizeOutgoingTextProps(rawPayload);
    } else if (this.selectedToolType === 'TEXT:EDITING') {
      const editRaw = {
        fill: this.color,
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        fontWeight: this.fontWeight,
        fontStyle: this.fontStyle,
        underline: this.underline,
        linethrough: this.linethrough
      };
      payloadToSend = this.normalizeOutgoingTextProps(editRaw);
    } else {
      // unknown mode: do nothing
      return;
    }

    // If there are suspicious values (e.g., someone set a weird baseline), log the object so you can trace origin
    if (payloadToSend.textBaseline === undefined && ('textBaseline' in rawPayload || 'textBaseline' in (this.activeObjectProps || {}))) {
      // Found a textBaseline in source but we couldn't normalize it — log to help debugging
      console.debug('TextTools: suspicious textBaseline was removed. sourceProps:', {
        activeObjectProps: this.activeObjectProps,
        attemptedPayload: rawPayload
      });
    }

    // finally, emit via service
    this.utilService.onUpdateText(payloadToSend);
  }

  toggleBold(): void {
    this.fontWeight = this.fontWeight === 'normal' ? 'bold' : 'normal';
    this.onUpdateText();
  }

  toggleItalic(): void {
    this.fontStyle = this.fontStyle === 'normal' ? 'italic' : 'normal';
    this.onUpdateText();
  }

  toggleUnderline(): void {
    this.underline = !this.underline;
    this.onUpdateText();
  }

  toggleLinethrough(): void {
    this.linethrough = !this.linethrough;
    this.onUpdateText();
  }

  setTextAlign(alignment: any): void {
    this.textAlign = alignment;
    this.onUpdateText();
  }

}
