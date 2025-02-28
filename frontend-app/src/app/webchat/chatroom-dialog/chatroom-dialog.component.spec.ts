import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatroomDialogComponent } from './chatroom-dialog.component';

describe('ChatroomDialogComponent', () => {
  let component: ChatroomDialogComponent;
  let fixture: ComponentFixture<ChatroomDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatroomDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChatroomDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
