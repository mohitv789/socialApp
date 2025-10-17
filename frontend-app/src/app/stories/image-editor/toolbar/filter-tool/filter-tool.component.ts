import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { UtilService } from '../../util.service';

@Component({
  selector: 'app-filter-tool',
  templateUrl: './filter-tool.component.html',
  styleUrls: ['./filter-tool.component.css']
})
export class FilterToolComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() selectedToolType: any;
  @Input() activeObjectProps: any;

  filterScope!: string;
  panelType: string;
  filterValues: any;

  // DEFAULTS: always present so template bindings never read `undefined`
  readonly defaultFilterValues = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    noise: 0,
    blur: 0,
    pixelate: 0.01,
    sharpen: false,
    emboss: false,
    grayscale: false,
    vintage: false,
    sepia: false,
    polaroid: false
  };

  constructor(private utilService: UtilService) {
    this.panelType = 'PRESET';
    // initialize with defaults so template can safely bind immediately
    this.filterValues = { ...this.defaultFilterValues };
    this.filterScope = 'ALL';
  }

  ngOnInit() {
    // If activeObjectProps already present at init, merge them
    if (this.activeObjectProps) {
      this.filterValues = { ...this.defaultFilterValues, ...this.activeObjectProps };
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // when the active object props change, merge into defaults
    if (changes['activeObjectProps']) {
      this.filterValues = { ...this.defaultFilterValues, ...(this.activeObjectProps || {}) };
    }

    if (changes['selectedToolType']) {
      if (this.selectedToolType === 'FILTER:ALL') {
        this.filterScope = 'ALL';
      } else if (this.selectedToolType === 'FILTER:SINGLE') {
        this.filterScope = 'SINGLE';
      }
    }
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }
    return `${value}`;
  }

  onPanelChange(panelType: string): void {
    this.panelType = panelType;
  }

  toggleScope(filterScope: any) {
    this.filterScope = filterScope;
    if (this.filterScope === 'ALL') {
      this.utilService.canvasCommand('FILTER:ALL', {});
    }
  }

  togglePreset(presetType: any): void {
    this.filterValues = { ...this.filterValues, [presetType]: !this.filterValues[presetType] };
    this.onFilterUpdate();
  }

  onFilterUpdate(): void {
    this.utilService.addImageFilter(this.filterScope, this.filterValues);
  }
  showSliders = false;
  ngAfterViewInit() { setTimeout(()=> this.showSliders = true, 0); }

  onSetToDefault(filterType: string): void {
    switch (filterType) {
      case 'brightness': this.filterValues = { ...this.filterValues, brightness: 0 }; break;
      case 'contrast': this.filterValues = { ...this.filterValues, contrast: 0 }; break;
      case 'saturation': this.filterValues = { ...this.filterValues, saturation: 0 }; break;
      case 'hue': this.filterValues = { ...this.filterValues, hue: 0 }; break;
      case 'noise': this.filterValues = { ...this.filterValues, noise: 0 }; break;
      case 'blur': this.filterValues = { ...this.filterValues, blur: 0 }; break;
      case 'pixelate': this.filterValues = { ...this.filterValues, pixelate: 0.01 }; break;
      default: break;
    }
    this.onFilterUpdate();
  }
}
