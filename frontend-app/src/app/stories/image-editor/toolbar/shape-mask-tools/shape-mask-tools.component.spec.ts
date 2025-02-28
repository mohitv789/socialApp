import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeMaskToolsComponent } from './shape-mask-tools.component';

describe('ShapeMaskToolsComponent', () => {
  let component: ShapeMaskToolsComponent;
  let fixture: ComponentFixture<ShapeMaskToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShapeMaskToolsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShapeMaskToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
