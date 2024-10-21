import {Component, OnInit} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatTooltipModule} from "@angular/material/tooltip";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Job, JobElement, NewJob, StatusResponse} from "../../interfaces";
import {MatDialog} from "@angular/material/dialog";
import {ActivatedRoute, Router} from "@angular/router";
import {ErrorDialogComponent} from "../../components/error-dialog/error-dialog.component";
import {ConfirmDialogComponent} from "../../components/confirm-dialog/confirm-dialog.component";
import {FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatCardModule} from "@angular/material/card";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatOptionModule} from "@angular/material/core";
import {MatSelectModule} from "@angular/material/select";
import {NgForOf} from "@angular/common";
import {Subscription} from "rxjs";
import {MessageDialogComponent} from "../../components/message-dialog/message-dialog.component";

const JOB_DATA: JobElement[] = [];

@Component({
  selector: 'app-edit-job',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    FormsModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    NgForOf
  ],
  templateUrl: './edit-job.component.html',
  styleUrl: './edit-job.component.css'
})
export class EditJobComponent implements OnInit{
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
  // Check to remove
  job: Job = {id: '', user: '', status: '', priority: 1, timestamp: '', options: {
      sparkPath: 'opt/spark/bin/spark-submit',
      master: '', deployMode: '', name: '', class: '', executable: '', conf: {
        "spark.executor.instances": 1,
        "spark.executor.cores": 1,
        "spark.executor.memory": '',
        "spark.kubernetes.container.image": '',
        "spark.kubernetes.driver.node.selector.kubernetes.io/hostname": '',
        "spark.kubernetes.authenticate.driver.serviceAccountName": ''
      }}};
  capacities = ['512','1024','2048','3072','4096','5120','6144','7168','8192','9216','10240'];
  measure = ['MB', 'GB'];
  deploy_modes = ['cluster', 'client'];
  fileName = '';
  uploadProgress: number | undefined;
  uploadSub: Subscription | undefined;
  dynamicForm!: FormGroup;
  // Check to remove
  job_id = '';
  isAdmin = false;

  constructor(private http: HttpClient, public dialog: MatDialog, private router: Router, private route: ActivatedRoute, private formBuilder: FormBuilder) {
    // @ts-ignore
    this.isAdmin = this.router.getCurrentNavigation().extras.state.isAdmin;
    // @ts-ignore
    console.log('Is Admin? --> ' + this.router.getCurrentNavigation().extras.state.isAdmin);
  }

  // Initialization Function
  ngOnInit() {
    // Copping id from previous page
    this.route.params.subscribe(params => {
      this.job_id = params['id'];
    });
    console.log('Here is ' + this.job_id);
    // Retrieving job selected
    this.RetrieveJob();
    this.job_id = this.job.id;
  }

  // Initializing form's data with the data from the database
  formInit(){
    console.log(this.job.options['deployMode']);
    // Initializing Dynamic Form
    this.dynamicForm = new FormGroup({
      deployMode: new FormControl(this.job.options.deployMode),
      name: new FormControl(this.job.options.name),
      class: new FormControl(this.job.options.class),
      instances: new FormControl(this.job.options.conf["spark.executor.instances"]),
      cores: new FormControl(this.job.options.conf["spark.executor.cores"]),
      memory: new FormControl(this.job.options.conf["spark.executor.memory"]),
      image: new FormControl(this.job.options.conf["spark.kubernetes.container.image"]),
      hostname: new FormControl(this.job.options.conf["spark.kubernetes.driver.node.selector.kubernetes.io/hostname"]),
      serviceAccountName: new FormControl(this.job.options.conf["spark.kubernetes.authenticate.driver.serviceAccountName"]),
      executablePath: new FormControl(this.job.options.executable),
      executableFile: new FormControl(),
      additionalOptions: this.formBuilder.array([])
    });
    // this.fileName = this.job.options.executable;
    console.log(this.job);
    for (let i in this.job){
      if (i === 'options'){
        console.log(this.job[i]);
        // @ts-ignore
        if (this.job[i]["additional_options"]){
          console.log('Job has additional options');
          // @ts-ignore
          for (let j in this.job[i]["additional_options"]) {
            // console.log(this.job[i]["additional_options"][j]['confKey']);
            this.additionalOptions.push(this.formBuilder.group({
              // @ts-ignore
              confKey: this.job[i]["additional_options"][j]['confKey'],
              // @ts-ignore
              confValue: this.job[i]["additional_options"][j]['confValue']
            }));
          }
        }
      }
    }
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

  // Retrieve selected user's job
  RetrieveJob(){
    // Check if user exists and take username
    if (this.user) {
      this.newJob.username = this.user;
    }
    // Check if ticket exists and add it to headers
    console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return}
    this.headers.set('Cookie', this.ticket);
    this.http.get<Job>('http://localhost:5000/spark-job/' + this.job_id, {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data  => {
        console.log('Returns: ');
        console.log(data);
        this.job = data;
        let filename = this.job.options.executable.split('/');
        // console.log(filename);
        this.fileName = filename[4];
        console.log('job: ');
        console.log(this.job);
        this.formInit();
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: err.error.message},
        });
      }
    });
  }

  // Updating selected job
  UpdateJob(){
    // console.log(this.job_id)
    console.log('Updating job...');
    // Check ticket and write it to headers
    // console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return;}
    this.headers.set('Cookie', this.ticket);
    // Http Put (Update) Call (based on selected job)
    console.log('UpdateJob: ' + this.job.id)
    let url = 'http://localhost:5000/spark-job/' + this.job.id;
    this.http.put<StatusResponse>(url, this.job,
      {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data => {
        console.log(data);
        this.openDialog(data.message, '');
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: {message: err.error.message},
        });
      }
    });
  }

  // Setting the values from dynamic form to dictionary
  setNewJob(){
    if (this.dynamicForm.controls['deployMode'].getRawValue() === null){
      this.newJob.options.deployMode = this.job.options.deployMode;
    }
    else {
      this.newJob.options.deployMode = this.dynamicForm.controls['deployMode'].getRawValue();
    }
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
    if (this.user) { this.newJob.username = this.user; }
    // Check ticket and write it to headers
    // console.log(JSON.stringify(this.newJob));
    // console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return;}
    this.headers.set('Cookie', this.ticket);
    // Updating the dictionary to be sent
    this.setNewJob();
    // Http Post Call
    this.http.post('http://localhost:5000/check_job',
      this.newJob,
      {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data  => {
        console.log(data);
        let res = data.toString();
        // console.log(res);
        if (res.length === 0){
          console.log('Valid Check!');
          this.UpdateJob();
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

  openDialog(message: string, mode: string) {
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
    else if (mode === 'update'){
      dialogRef.afterClosed().subscribe({
        next: data => {
          console.log(`Dialog result: ${data}`);
          if (data === 'Yes'){
            this.checkJob();
          }
        },
        error: err => {
          console.log('Error on update confirmation dialog');
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
      const dialogRef = this.dialog.open(MessageDialogComponent, {
        data: { message: message},
      });
      // console.log('openDialog else statement');
      dialogRef.afterClosed().subscribe({
        next: data => {
          console.log(`Dialog result: ${data}`);
        },
        error: err => {
          console.log('Error on message dialog');
        }
      });
    }
  }

}
