import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
	public loginForm: FormGroup = this.fb.group({
		email: [null, [Validators.required, Validators.email]],
		password: [null, Validators.required],
	});
	private previousUrl = '';
	private destroyRef = inject(DestroyRef);

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router,
		private activatedRoute: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.getPreviousUrl();
	}

	private getPreviousUrl(): void {
		this.activatedRoute.queryParams
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(
				params =>
					(this.previousUrl = params['previousUrl'] || '/principal')
			);
	}

	//TODO: ver mensajes de error
	public login(): void {
		if (
			this.loginForm.get('email')?.invalid ||
			this.loginForm.get('password')?.invalid
		) {
			this.loginForm.markAllAsTouched();
			return;
		}

		// this.submit_button.loading = true;
		// this.submit_button.text = 'Ingresando';

		const { email, password } = this.loginForm.value;

		const request = {
			email,
			password,
		};

		this.authService
			.login(request)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((resp: boolean) => {
				if (resp) {
					return this.router.navigateByUrl(this.previousUrl);
				}

				// this.nmz.error('Email o contraseña inválida', { nzDuration: 5000 });

				// this.submit_button.loading = false;
				// this.submit_button.text = 'Ingresar';

				return;
			});
	}
}
