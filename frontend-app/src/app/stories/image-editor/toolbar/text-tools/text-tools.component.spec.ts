import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextToolsComponent } from './text-tools.component';

describe('TextToolsComponent', () => {
  let component: TextToolsComponent;
  let fixture: ComponentFixture<TextToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextToolsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
