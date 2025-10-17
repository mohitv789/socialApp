import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { ColorPickerModule } from 'ngx-color-picker';
import { SliderWrapperComponent } from '../stories/image-editor/slider-wrapper.component'; // adjust path if needed

@NgModule({
  declarations: [
    SliderWrapperComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ColorPickerModule,
    MatSliderModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ColorPickerModule,
    MatSliderModule,
    SliderWrapperComponent   // <-- export component so other modules can use it
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<any> {
    return {
      ngModule: SharedModule
    };
  }
}
