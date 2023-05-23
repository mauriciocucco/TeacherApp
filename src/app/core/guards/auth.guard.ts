import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

export const authGuard: CanMatchFn = (route, segments) => {
	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.verifyAuth().pipe(
		tap(resp => {
			if (!resp) {
				router.navigate(['/auth/login'], {
					queryParams: {
						previousUrl: segments
							.map(segment => segment.path)
							.join('/'),
					},
				});
			}
		})
	);
};
