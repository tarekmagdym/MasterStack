import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
   private authService: AuthService;
   constructor(authService: AuthService) {
     this.authService = authService;
   }
logout() {
  this.authService.logout();
  
}

}
