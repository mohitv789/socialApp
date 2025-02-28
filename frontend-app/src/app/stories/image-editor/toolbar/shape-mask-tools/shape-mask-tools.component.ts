import { Component, Input, OnInit } from '@angular/core';
import { UtilService } from '../../util.service';

@Component({
  selector: 'app-shape-mask-tools',
  templateUrl: './shape-mask-tools.component.html',
  styleUrl: './shape-mask-tools.component.css'
})
export class ShapeMaskToolsComponent implements OnInit {

  @Input() selectedToolType:any;
  @Input() activeObjectProps:any;
  isSelectionInactive!:boolean;
  color!: string;
  opacity!: number;
  shadowAmount!: number;
  shadowBlur!: number;
  shadowOffsetX!: number;
  shadowOffsetY!: number;

  onUpdateShapeMask(){
    this.utilService.onUpdateShapeMask(
      {
        color: this.color,
        opacity: this.opacity,
        shadowAmount: this.shadowAmount,
        shadowBlur: this.shadowBlur,
        shadowOffsetX: this.shadowOffsetX,
        shadowOffsetY: this.shadowOffsetY
      }
    );
  }

  addShapeMask(shape:any){
    this.utilService.canvasCommand('ADD_SHAPE_MASK',{
      shape: shape,
      color: this.color,
      opacity: this.opacity,
      shadowAmount: this.shadowAmount,
      shadowBlur: this.shadowBlur,
      shadowOffsetX: this.shadowOffsetX,
      shadowOffsetY: this.shadowOffsetY
    });
  }

  constructor(private utilService: UtilService) {
  }

  ngOnInit() {
    this.color = this.activeObjectProps.color ? this.activeObjectProps.color : '#F0E58C';
    this.opacity = this.activeObjectProps.opacity ? this.activeObjectProps.opacity : 0.5;
    this.shadowAmount = this.activeObjectProps.shadowAmount ? this.activeObjectProps.shadowAmount : 0;
    this.shadowBlur = this.activeObjectProps.shadowBlur ? this.activeObjectProps.shadowBlur : 0;
    this.shadowOffsetX = this.activeObjectProps.shadowOffsetX ? this.activeObjectProps.shadowOffsetX : 0;
    this.shadowOffsetY = this.activeObjectProps.shadowOffsetY ? this.activeObjectProps.shadowOffsetY : 0;
    this.isSelectionInactive = false;
  }

  ngOnChanges(){
    this.color = this.activeObjectProps.color;
    this.opacity = this.activeObjectProps.opacity;
    this.shadowAmount = this.activeObjectProps.shadowAmount;
    this.shadowBlur = this.activeObjectProps.shadowBlur;
    this.shadowOffsetX = this.activeObjectProps.shadowOffsetX;
    this.shadowOffsetY = this.activeObjectProps.shadowOffsetY;
    this.isSelectionInactive = this.activeObjectProps.isSelectionInactive || false;
  }
}
