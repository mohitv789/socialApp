import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushedDetailComponent } from './pushed-detail.component';

describe('PushedDetailComponent', () => {
  let component: PushedDetailComponent;
  let fixture: ComponentFixture<PushedDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PushedDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PushedDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
