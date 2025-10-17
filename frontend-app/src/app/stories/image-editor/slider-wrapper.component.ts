// src/app/stories/image-editor/slider-wrapper.component.ts
import { Component, forwardRef, Input, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'my-slider-wrapper',
  template: `
    <mat-slider
      [min]="min"
      [max]="max"
      [step]="step"
      [disabled]="disabled"
      (input)="onInput($event)"
      (change)="onChangeEvent($event)"
    >
      <!-- internal thumb input that actually receives the value -->
      <input
        matSliderThumb
        [(ngModel)]="value"
      />
    </mat-slider>
  `,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SliderWrapperComponent),
    multi: true
  }]
})
export class SliderWrapperComponent implements ControlValueAccessor {
  @Input() min = 0;
  @Input() max = 100;
  @Input() step = 1;
  @Input() disabled = false;

  @Output() change = new EventEmitter<number>();

  value = 0;

  private _onChange: (v: any) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(obj: any): void { this.value = obj ?? 0; }
  registerOnChange(fn: any): void { this._onChange = fn; }
  registerOnTouched(fn: any): void { this._onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void { this.disabled = isDisabled; }

  onInput(event: any) {
    // event comes from mat-slider; value is on event.value OR on the input ngModel
    const val = event?.value ?? this.value;
    this.value = Number(val);
    this._onChange(this.value);
  }

  onChangeEvent(event: any) {
    const val = event?.value ?? this.value;
    this.change.emit(Number(val));
    this._onTouched();
  }
}
