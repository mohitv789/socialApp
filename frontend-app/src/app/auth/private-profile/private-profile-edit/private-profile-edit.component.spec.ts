import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateProfileEditComponent } from './private-profile-edit.component';

describe('PrivateProfileEditComponent', () => {
  let component: PrivateProfileEditComponent;
  let fixture: ComponentFixture<PrivateProfileEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivateProfileEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
