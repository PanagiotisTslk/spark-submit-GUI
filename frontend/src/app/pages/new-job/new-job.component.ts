import {Component, OnInit} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatTooltipModule} from "@angular/material/tooltip";
import {ConfirmDialogComponent} from "../../components/confirm-dialog/confirm-dialog.component";
import {ErrorDialogComponent} from "../../components/error-dialog/error-dialog.component";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {MatDialog} from "@angular/material/dialog";
import {Router} from "@angular/router";
import {JobCheck, JobElement, Jobs, NewJob, StatusResponse} from "../../interfaces";
import {MatTableModule} from "@angular/material/table";
import {MatCardModule} from "@angular/material/card";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {MatTabsModule} from "@angular/material/tabs";
import {JsonPipe, NgClass, NgForOf, NgStyle} from "@angular/common";
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatSelectModule} from "@angular/material/select";
import {ClipboardModule} from "@angular/cdk/clipboard";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatSortModule} from "@angular/material/sort";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatDividerModule} from "@angular/material/divider";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {connect, Subscription} from "rxjs";
import {log} from "@angular-devkit/build-angular/src/builders/ssr-dev-server";
import {MessageDialogComponent} from "../../components/message-dialog/message-dialog.component";

const JOB_DATA: JobElement[] = [];

@Component({
  selector: 'app-new-job',
  standalone: true,
  imports: [MatTableModule, MatIconModule,
    MatButtonModule, MatCardModule,
    MatExpansionModule, MatFormFieldModule,
    MatInputModule, MatDatepickerModule,
    MatNativeDateModule, MatTabsModule,
    NgStyle, FormsModule, MatSelectModule,
    ClipboardModule, MatCheckboxModule,
    ReactiveFormsModule, MatSortModule,
    MatPaginatorModule, NgClass, JsonPipe,
    NgForOf, MatDividerModule, MatToolbarModule,
    MatTooltipModule, MatProgressBarModule],
  templateUrl: './new-job.component.html',
  styleUrl: './new-job.component.css'
})
export class NewJobComponent implements OnInit{
  user = localStorage.getItem('username');
  ticket: string | null = localStorage.getItem('ticket');
  headers = new HttpHeaders();
  step = 0;
  newJob: NewJob = {username: '', status: 'pending',
    priority: 1, additionalOptions: {},
    options: {
      sparkPath: 'opt/spark/bin/spark-submit',
      master: 'k8s://https://192.168.0.201:16443', deployMode: 'cluster',
      name: '', class: '', executable: '',
      conf: {
        "spark.executor.instances": 1,
        "spark.executor.cores": 1,
        "spark.executor.memory": '512',
        "spark.kubernetes.container.image": '',
        "spark.kubernetes.driver.node.selector.kubernetes.io/hostname": 'k8s-1',
        "spark.kubernetes.authenticate.driver.serviceAccountName": 'spark'
      }}};
  capacities = ['512','1024','2048','3072','4096','5120','6144','7168','8192','9216','10240'];
  measure = ['MB', 'GB'];
  deploy_modes = ['cluster', 'client'];
  fileName = '';
  uploadProgress: number | undefined;
  uploadSub: Subscription | undefined;
  dynamicForm!: FormGroup;
  isAdmin = false;

  constructor(private http: HttpClient, public dialog: MatDialog, private router: Router, private formBuilder: FormBuilder) {
    // @ts-ignore
    this.isAdmin = this.router.getCurrentNavigation().extras.state.isAdmin;
    // @ts-ignore
    console.log('Is Admin? --> ' + this.router.getCurrentNavigation().extras.state.isAdmin);
  }

  // Initialization Function
  ngOnInit() {
    // Initializing Dynamic Form
    this.dynamicForm = new FormGroup({
      deployMode: new FormControl(),
      name: new FormControl(),
      class: new FormControl(),
      instances: new FormControl(),
      cores: new FormControl(),
      memory: new FormControl(),
      image: new FormControl(),
      hostname: new FormControl('k8s-1'),
      serviceAccountName: new FormControl('spark'),
      executablePath: new FormControl(),
      executableFile: new FormControl(),
      additionalOptions: this.formBuilder.array([])
    });
    // Lock fields
    this.dynamicForm.controls['hostname'].disable()
    this.dynamicForm.controls['serviceAccountName'].disable()
    this.dynamicForm.controls['executablePath'].disable()
  }

  // Set field's step
  setStep(index: number) {
    this.step = index;
  }

  // Move to next field of form
  nextStep() {
    this.step++;
  }

  // Move to previous field of form
  prevStep() {
    this.step--;
  }

  // Retrieve all user's job
  RetrieveJobs(){
    // Check if user exists and take username
    if (this.user) {
      this.newJob.username = this.user;
    }
    // Check if ticket exists and add it to headers
    console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return}
    this.headers.set('Cookie', this.ticket);
    this.http.get<Jobs>('http://localhost:5000/user-jobs/' + this.newJob.username, {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data  => {
        console.log(data);
        let index = 0;
        for (let i in data){
          index++;
          JOB_DATA.push({position: index, job_id: data[i].id, status: data[i].status, user: data[i].user, priority: data[i].priority, timestamp: data[i].timestamp, job: data[i].options});
        }
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: err.error.message},
        });
      }
    });
  }

  // Adding new job to database
  AddJob(){
    // Check if user exists and take username
    if (this.user) {
      this.newJob.username = this.user;
    }
    // Check ticket and write it to headers
    console.log(JSON.stringify(this.newJob));
    console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return;}
    this.headers.set('Cookie', this.ticket);
    // Updating the dictionary to be sent
    // this.setNewJob();
    // Http Post Call
    this.http.post<StatusResponse>('http://localhost:5000/spark-job',
      this.newJob,
      {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data  => {
        console.log(data);
        this.openDialog(data.message, '');
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: err.error.message},
        });
      }
    });
  }

  // Setting the values from dynamic form to dictionary
  setNewJob(){
    this.newJob.options.deployMode = this.dynamicForm.controls['deployMode'].getRawValue();
    this.newJob.options.name = this.dynamicForm.controls['name'].getRawValue();
    this.newJob.options.class = this.dynamicForm.controls['class'].getRawValue();
    this.newJob.options.conf["spark.executor.instances"] = this.dynamicForm.controls['instances'].getRawValue();
    this.newJob.options.conf["spark.executor.cores"] = this.dynamicForm.controls['cores'].getRawValue();
    this.newJob.options.conf["spark.executor.memory"] = this.dynamicForm.controls['memory'].getRawValue();
    this.newJob.options.conf["spark.kubernetes.container.image"] = this.dynamicForm.controls['image'].getRawValue();
    this.newJob.options.conf["spark.kubernetes.driver.node.selector.kubernetes.io/hostname"] = this.dynamicForm.controls['hostname'].getRawValue();
    this.newJob.options.conf["spark.kubernetes.authenticate.driver.serviceAccountName"] = this.dynamicForm.controls['serviceAccountName'].getRawValue();
    this.newJob.options.executable = this.dynamicForm.controls['executablePath'].getRawValue();
    // this.newJob.options.conf["spark.executor.executable"] = this.dynamicForm.controls['executablePath'].getRawValue();
    let x = 0;
    for (let i of this.additionalOptions.controls){
      this.newJob['additionalOptions'][x] = i.getRawValue();
      x+=1;
    }
    console.log(this.newJob);
  }

  // Logout the user
  Logout(){
    // localStorage.setItem('username', '');
    localStorage.setItem('ticket', '');
    console.log('Disconnecting...');
    this.ChangePage('login');
  }

  // Redirection to other page
  ChangePage(page: string){
    console.log(page);
    console.log(this.isAdmin);
    if (page === 'user-menu' && this.isAdmin){
      this.router.navigateByUrl('/' + 'admin-menu', { state: { isAdmin: true } });
    }
    else {
      this.router.navigateByUrl('/' + page, { state: { isAdmin: false } });
    }
  }

  // Selecting file to upload
  onFileSelected(event: any) {
    console.log(event.target.files[0]);
    const file:File = event.target.files[0];
    if (file) {
      console.log(file);
      this.fileName = file.name;
      // Making form with the file & user data to upload
      const formData = new FormData();
      formData.append("spark_exe", file);
      // Check if user exists
      if (this.user){ formData.append("user", this.user); }
      else { console.log('No user found!'); }
      console.log(this.user);
      console.log(formData);
      // Check ticket and write it to headers
      console.log(JSON.stringify(this.newJob));
      console.log("User's ticket: " + this.ticket);
      if (this.ticket === null){return;}
      this.headers.set('Cookie', this.ticket);
      // Http Post Call
      this.http.post('http://localhost:5000/upload_executable',
        formData,
        {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
        next: data  => {
          console.log(data);
          // @ts-ignore
          this.fileName = data['filename'];
          // @ts-ignore
          this.dynamicForm.controls['executablePath'].setValue(data['file_path']);
        },
        error: err => {
          this.dialog.open(ErrorDialogComponent, {
            data: { message: err.error.message},
          });
        }
      });
    }
  }

  // Delete uploaded file
  deleteUpload() {
    console.log('File = ' + this.fileName);
    // Case file not uploaded
    if (this.fileName === ''){return;}
    // Case ticket is invalid
    if (this.ticket === null){return;}
    this.headers.set('Cookie', this.ticket);
    // Http Delete Call
    this.http.delete('http://localhost:5000/upload_executable/' + this.fileName,
      {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data => {
        console.log(data);
        this.fileName = '';
        // @ts-ignore
        this.dynamicForm.controls['executablePath'].setValue(data['file_path']);
        console.log('File = ' + this.fileName);
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: {message: err.error.message},
        });
      }
    });
      // if (this.uploadSub){
      //   this.uploadSub.unsubscribe();
      //   this.reset();
      // }
  }

  // Reset file's upload progress
  reset() {
    if (this.uploadSub){
      this.uploadProgress = 0;
      this.uploadSub = undefined;
    }
  }

  // Retrieving dynamic's form controls
  get additionalOptions() {
    return this.dynamicForm.get('additionalOptions') as FormArray;
  }

  // Adding new pair fields of additional option
  addOption() {
    this.additionalOptions.push(this.formBuilder.group({
      confKey: '',
      confValue: ''
    }));
  }

  // Printing dynamic form
  printForm(){
    let executableFile = this.dynamicForm.controls['executableFile'];
    console.log("File: " + executableFile.getRawValue());
    this.setNewJob();
  }

  // Removing additional option
  removeOption(i: number) {
    this.additionalOptions.removeAt(i);
  }

  // Check job's options
  checkJob(){
    // Check if user exists and take username
    if (this.user) {
      this.newJob.username = this.user;
    }
    // Check ticket and write it to headers
    console.log(JSON.stringify(this.newJob));
    console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return;}
    this.headers.set('Cookie', this.ticket);
    // Updating the dictionary to be sent
    this.setNewJob();
    // Http Post Call
    this.http.post<JobCheck>('http://localhost:5000/check_job',
      this.newJob,
      {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data  => {
        console.log(data);
        let res = data.toString();
        // console.log(res);
        if (res.length === 0){
          console.log('Valid Check!');
          this.AddJob();
        }
        else {
          console.log('Invalid Check!');
          let messages:string[] = [];
          for (let i in data){
            // @ts-ignore
            // console.log(data[i][0]);
            messages.push(data[i][0] + ' - ' + data[i][1]);
          }
          console.log(messages);
          this.messageDialog(messages);
        }
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: err.error.message},
        });
      }
    });
  }

  // Opening PopUp to display message
  messageDialog(message: string | string[]){
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      data: { message: message},
    });

    dialogRef.afterClosed().subscribe({
      next: data => {
        console.log(`Dialog result: ${data}`);
      },
      error: err => {
        console.log('Error on message dialog');
      }
    });
  }

  // Displaying pop up message
  openDialog(message: string | string[], mode: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: message},
    });

    if (mode === 'logout') {
      dialogRef.afterClosed().subscribe({
        next: data => {
          console.log(`Dialog result: ${data}`);
          if (data === 'Yes'){
            this.Logout();
          }
        },
        error: err => {
          console.log('Error on logout confirmation dialog');
        }
      });
    }
    else if (mode === 'add'){
      dialogRef.afterClosed().subscribe({
        next: data => {
          console.log(`Dialog result: ${data}`);
          if (data === 'Yes'){
            this.checkJob();
          }
        },
        error: err => {
          console.log('Error on add confirmation dialog');
        }
      });
    }
    else if (mode === 'check'){
      dialogRef.afterClosed().subscribe({
        next: data => {
          console.log(`Dialog result: ${data}`);
          if (data === 'Yes'){
            console.log('Done!');
          }
        },
        error: err => {
          console.log('Error on add confirmation dialog');
        }
      });
    }
    else {
      console.log('Nothing...');
    }
  }

}
