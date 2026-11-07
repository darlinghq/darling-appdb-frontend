import { Injectable } from "@angular/core";
import { AuthService } from './auth.service';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class NeedAuthGuard  {
	constructor(private authService: AuthService, private router: Router) {
	}

	canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
		if (this.authService.authenticated)
			return true;
		
		this.router.navigateByUrl('/login');
		return false;
	}
}
