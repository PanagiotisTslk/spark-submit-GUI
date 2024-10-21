import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {
  JobElement,
  Jobs, StatusResponse
} from "../../interfaces";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent} from "../../components/error-dialog/error-dialog.component";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import {Router} from "@angular/router";
import {MatTabsModule} from "@angular/material/tabs";
import {JsonPipe, NgClass, NgForOf, NgStyle} from "@angular/common";
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatSelectModule} from "@angular/material/select";
import {ClipboardModule} from "@angular/cdk/clipboard";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatSort, MatSortModule} from "@angular/material/sort";
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatDividerModule} from "@angular/material/divider";
import {ConfirmDialogComponent} from "../../components/confirm-dialog/confirm-dialog.component";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatTooltipModule, TooltipPosition} from "@angular/material/tooltip";

const JOB_DATA: JobElement[] = [];

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule, MatTabsModule, NgStyle, FormsModule, MatSelectModule, ClipboardModule, MatCheckboxModule, ReactiveFormsModule, MatSortModule, MatPaginatorModule, NgClass, JsonPipe, NgForOf, MatDividerModule, MatToolbarModule, MatTooltipModule],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.css'
})
export class AdminMenuComponent implements OnInit, AfterViewInit{
  jobsColumns: string[] = ['position', 'job_id', 'user', 'status', 'priority', 'timestamp', 'job'];
  dataSource = new MatTableDataSource();
  user = localStorage.getItem('username');
  ticket: string | null = localStorage.getItem('ticket');
  headers = new HttpHeaders();
  jobsToDelete: string[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  @ViewChild(MatSort) sort: MatSort | undefined;
  filter_input: any;
  job_id = '';
  isAdmin = true;
  positionOptions: TooltipPosition[] = ['after', 'before', 'above', 'below', 'left', 'right'];
  position = new FormControl(this.positionOptions[0]);
  priorities = [0, 1, 2];

  constructor(private http: HttpClient, public dialog: MatDialog, private router: Router) {
    // @ts-ignore
    this.isAdmin = this.router.getCurrentNavigation().extras.state.isAdmin;
    // @ts-ignore
    console.log('Is Admin? --> ' + this.router.getCurrentNavigation().extras.state.isAdmin);
  }

  ngOnInit() {
    this.ClearTable(JOB_DATA);
    this.RetrieveAllJobs();
  }

  ngAfterViewInit() {
    // @ts-ignore
    this.dataSource.paginator = this.paginator;
    // @ts-ignore
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Retrieving all jobs from all users
  RetrieveAllJobs(){
    // Clear table of jobs
    this.ClearTable(JOB_DATA);
    // Check if ticket exists and add it to headers
    console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return}
    this.headers.set('Cookie', this.ticket);
    this.http.get<Jobs>('http://localhost:5000/spark-job', {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data  => {
        console.log(data);
        let index = 0;
        for (let i in data){
          index++;
          JOB_DATA.push({position: index, job_id: data[i].id, status: data[i].status, user: data[i].user, priority: data[i].priority, timestamp: data[i].timestamp, job: data[i].options});
        }
        this.dataSource.data = JOB_DATA;
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: { message: err.error.message},
        });
      }
    });
  }

  // Clearing an array (table with jobs)
  ClearTable(myArray: any){
    // set the length to 0
    myArray.length = 0;
    // use splice to remove all items
    myArray.splice(0, myArray.length);
    // loop through array and remove each item with pop()
    while (myArray.length > 0) {
      myArray.pop();
    }
  }

  // Logging out the user
  Logout(){
    // localStorage.setItem('username', '');
    localStorage.setItem('ticket', '');
    console.log('Disconnecting...');
    this.ChangePage('login');
  }

  ChangePage(page: string){
    this.router.navigateByUrl('/' + page, { state: { isAdmin: true } });
  }

  DeleteJobs(){
    // Check ticket and write it to headers
    console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return;}
    this.headers.set('Cookie', this.ticket);
    // Check if list with jobs to delete is empty
    if (this.jobsToDelete === null) {return;}
    // Http Delete Calls (based on selected job ids)
    for (var val of this.jobsToDelete) {
      let url = 'http://localhost:5000/spark-job/' + val;
      this.http.delete(url,
        {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
        next: data => {
          console.log(data);
        },
        error: err => {
          this.dialog.open(ErrorDialogComponent, {
            data: {message: err.error.message},
          });
        }
      });
    }
  }

  CheckJob(event: any, job_id: string){
    console.log(this.jobsToDelete);
    console.log(event);
    if (event.checked){
      this.jobsToDelete.push(job_id);
    }
    else{
      // Finding the index of job_id inside list to delete it
      const index = this.jobsToDelete.indexOf(job_id, 0);
      if (index > -1) {
        this.jobsToDelete.splice(index, 1);
      }
    }
    console.log(this.jobsToDelete);
  }

  // Changing priority of selected job
  ChangePriorities(job_id: string, event: any){
    console.log("Changing priorities");
    console.log(job_id);
    console.log(event);
    // Check ticket and write it to headers
    // console.log("User's ticket: " + this.ticket);
    if (this.ticket === null){return;}
    this.headers.set('Cookie', this.ticket);
    // Http Put (Update) Call (based on selected job)
    let url = 'http://localhost:5000/change_priority/' + job_id;
    this.http.put<StatusResponse>(url, event,
      {headers: {"ticket": this.ticket}, responseType: 'json'}).subscribe({
      next: data => {
        console.log(data);
        this.openDialog(data.message, '');
        this.RetrieveAllJobs();
      },
      error: err => {
        this.dialog.open(ErrorDialogComponent, {
          data: {message: err.error.message},
        });
      }
    });
  }

  ClearFilter() {
    this.filter_input = '';
    this.dataSource.filter = '';
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
    else if (mode === 'delete'){
      dialogRef.afterClosed().subscribe({
        next: data => {
          console.log(`Dialog result: ${data}`);
          if (data === 'Yes'){
            this.DeleteJobs();
          }
        },
        error: err => {
          console.log('Error on delete confirmation dialog');
        }
      });
    }
    else {
      console.log('openDialog else statement');
    }
  }

}
