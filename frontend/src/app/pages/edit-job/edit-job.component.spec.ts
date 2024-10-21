import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditJobComponent } from './edit-job.component';

describe('EditJobComponent', () => {
  let component: EditJobComponent;
  let fixture: ComponentFixture<EditJobComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditJobComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditJobComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
