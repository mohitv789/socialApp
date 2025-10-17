import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { UtilService } from '../../util.service';

@Component({
  selector: 'app-crop-tools',
  templateUrl: './crop-tools.component.html',
  styleUrl: './crop-tools.component.css'
})
export class CropToolsComponent implements AfterViewInit {
  @Input() selectedToolType:any;

  onCropCancel(){
    this.utilService.canvasCommand('STOP_CROP',{});
  }

  onCropFinish(){
    this.utilService.canvasCommand('FINISH_CROP',{});
  }

  constructor(private utilService:UtilService) { }
  showSliders = false;
  ngAfterViewInit() { setTimeout(()=> this.showSliders = true, 0); }
}
