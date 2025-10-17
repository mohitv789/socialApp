import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { UtilService } from '../../util.service';

@Component({
  selector: 'app-shape-mask-tools',
  templateUrl: './shape-mask-tools.component.html',
  styleUrls: ['./shape-mask-tools.component.css']
})
export class ShapeMaskToolsComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() selectedToolType: any;
  @Input() activeObjectProps: any;

  // always-initialized defaults to avoid undefined reads in template
  isSelectionInactive: boolean = false;
  color: string = '#a0c9d5';
  opacity: number = 1;
  shadowAmount: number = 0.3;
  shadowBlur: number = 5;
  shadowOffsetX: number = 0;
  shadowOffsetY: number = 0;

  constructor(private utilService: UtilService) {}

  ngOnInit() {
    // merge incoming props if present
    if (this.activeObjectProps) {
      this.applyActiveProps(this.activeObjectProps);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeObjectProps'] && this.activeObjectProps) {
      this.applyActiveProps(this.activeObjectProps);
    }

    // keep the inactive flag in sync whenever inputs change
    this.isSelectionInactive = (this.activeObjectProps && this.activeObjectProps.isSelectionInactive) ? true : false;
  }

  private applyActiveProps(props: any) {
    // protect against props being undefined / missing fields
    this.color = (props.color !== undefined && props.color !== null) ? props.color : this.color;
    this.opacity = (props.opacity !== undefined && props.opacity !== null) ? props.opacity : this.opacity;

    // some code paths might supply shadow as object or individual fields
    if (props.shadowAmount !== undefined) {
      this.shadowAmount = props.shadowAmount;
    } else if (props.shadow && typeof props.shadow === 'object' && props.shadow.color) {
      // try extracting alpha from rgba(...) if present
      const match = /rgba?\(([^)]+)\)/.exec(props.shadow.color);
      if (match) {
        const parts = match[1].split(',').map(s => s.trim());
        if (parts.length >= 4) {
          const alpha = parseFloat(parts[3]);
          if (!Number.isNaN(alpha)) {
            this.shadowAmount = alpha;
          }
        }
      }
    }

    this.shadowBlur = (props.shadowBlur !== undefined && props.shadowBlur !== null) ? props.shadowBlur : this.shadowBlur;
    this.shadowOffsetX = (props.shadowOffsetX !== undefined && props.shadowOffsetX !== null) ? props.shadowOffsetX : this.shadowOffsetX;
    this.shadowOffsetY = (props.shadowOffsetY !== undefined && props.shadowOffsetY !== null) ? props.shadowOffsetY : this.shadowOffsetY;
  }

  onUpdateShapeMask() {
    // send current tool settings back to parent/service
    this.utilService.onUpdateShapeMask({
      color: this.color,
      opacity: this.opacity,
      shadowAmount: this.shadowAmount,
      shadowBlur: this.shadowBlur,
      shadowOffsetX: this.shadowOffsetX,
      shadowOffsetY: this.shadowOffsetY
    });
  }

  addShapeMask(shape: any) {
    this.utilService.canvasCommand('ADD_SHAPE_MASK', {
      shape: shape,
      color: this.color,
      opacity: this.opacity,
      shadowAmount: this.shadowAmount,
      shadowBlur: this.shadowBlur,
      shadowOffsetX: this.shadowOffsetX,
      shadowOffsetY: this.shadowOffsetY
    });
  }
  showSliders = false;
  ngAfterViewInit() { setTimeout(()=> this.showSliders = true, 0); }
}
