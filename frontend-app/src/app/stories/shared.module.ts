import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { ColorPickerModule } from 'ngx-color-picker';



@NgModule({
  imports: [
    CommonModule,
    ColorPickerModule
  ],
  exports: [
    CommonModule,
    ColorPickerModule
  ],
  declarations: [],
  providers: []
})
export class SharedModule {

  static forRoot(): ModuleWithProviders<any> {
    return {
      ngModule: SharedModule
    };
  }
}
