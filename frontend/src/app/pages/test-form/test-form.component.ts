import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatTooltipModule} from "@angular/material/tooltip";
import {NgForOf} from "@angular/common";
import data from './Kubernetes.Options.json';

@Component({
  selector: 'app-test-form',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatToolbarModule,
    MatTooltipModule,
    ReactiveFormsModule,
    NgForOf
  ],
  templateUrl: './test-form.component.html',
  styleUrl: './test-form.component.css'
})
export class TestFormComponent implements OnInit {

  dynamicForm!: FormGroup;

  constructor(private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.dynamicForm = new FormGroup({
      instances: new FormControl(),
      additionalOptions: this.formBuilder.array([])
    });
  }

  get additionalOptions() {
    return this.dynamicForm.get('additionalOptions') as FormArray;
  }

  addOption() {
    this.additionalOptions.push(this.formBuilder.group({
      confKey: '',
      confValue: ''
    }));
  }

  removeOption(i: number) {
    this.additionalOptions.removeAt(i);
  }

  readOptions(){
    console.log(data);
  }

}
