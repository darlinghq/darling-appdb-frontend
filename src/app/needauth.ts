import { Injectable } from "@angular/core";
import { AuthService } from './auth.service';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class NeedAuthGuard  {
	constructor(private authService: AuthService, private router: Router) {
	}

	canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
		return this.authService.waitUntilChecked().pipe(
			map(authenticated => {
				if (authenticated) {
					return true;
				}

				this.router.navigate(['/login'], { queryParams: { returnTo: state.url } });
				return false;
			})
		);
	}
}
