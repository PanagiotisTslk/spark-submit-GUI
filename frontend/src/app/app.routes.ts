import {Routes} from '@angular/router';
import {HomeComponent} from './pages/home/home.component';
import {LoginComponent} from './pages/login/login.component';
import {UserMenuComponent} from "./pages/user-menu/user-menu.component";
import {AdminMenuComponent} from "./pages/admin-menu/admin-menu.component";
import {NewJobComponent} from "./pages/new-job/new-job.component";
import {EditJobComponent} from "./pages/edit-job/edit-job.component";
import {TestFormComponent} from "./pages/test-form/test-form.component";

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home page'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login page'
  },
  {
    path: 'user-menu',
    component: UserMenuComponent,
    title: 'User menu page'
  },
  {
    path: 'edit-job/:id',
    component: EditJobComponent,
    title: 'Edit job page'
  },
  {
    path: 'admin-menu',
    component: AdminMenuComponent,
    title: 'Admin menu page'
  },
  {
    path: 'new-job',
    component: NewJobComponent,
    title: 'Add job page'
  },
  {
    path: 'test',
    component: TestFormComponent,
    title: 'Test'
  }
];
