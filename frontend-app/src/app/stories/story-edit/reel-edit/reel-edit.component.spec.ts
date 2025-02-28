import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReelEditComponent } from './reel-edit.component';

describe('ReelEditComponent', () => {
  let component: ReelEditComponent;
  let fixture: ComponentFixture<ReelEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReelEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReelEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
