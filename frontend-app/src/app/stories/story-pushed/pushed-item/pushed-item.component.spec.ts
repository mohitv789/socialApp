import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PushedItemComponent } from './pushed-item.component';

describe('PushedItemComponent', () => {
  let component: PushedItemComponent;
  let fixture: ComponentFixture<PushedItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PushedItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PushedItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
