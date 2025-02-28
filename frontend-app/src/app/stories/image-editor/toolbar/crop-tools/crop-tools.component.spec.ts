import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CropToolsComponent } from './crop-tools.component';

describe('CropToolsComponent', () => {
  let component: CropToolsComponent;
  let fixture: ComponentFixture<CropToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CropToolsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CropToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
