import { NgModule } from '@angular/core';

import { AuthRoutingModule } from './auth-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './login/login.component';

@NgModule({
	declarations: [LoginComponent],
	imports: [AuthRoutingModule, SharedModule],
})
export class AuthModule {}
