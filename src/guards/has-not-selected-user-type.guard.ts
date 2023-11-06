import { Injectable, Inject } from '@angular/core';
import { Router, ActivatedRoute, Resolve, NavigationExtras, ActivatedRouteSnapshot } from '@angular/router';
import { ProfileType, SharedPreferences } from '@project-sunbird/sunbird-sdk';
import { OnboardingScreenType, PreferenceKey, RouterLinks } from '../app/app.constant';
// import {SplashScreenService} from '../services/splash-screen.service';
import { OnboardingConfigurationService } from '../services/onboarding-configuration.service';

@Injectable()
export class HasNotSelectedUserTypeGuard implements Resolve<any> {
    private guardActivated: boolean;
    constructor(
        @Inject('SHARED_PREFERENCES') private sharedPreferences: SharedPreferences,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        // private splashScreenService: SplashScreenService,
        private onboardingConfigurationService: OnboardingConfigurationService
    ) { }

    async resolve(route: ActivatedRouteSnapshot): Promise<any> {

        if (await this.onboardingConfigurationService.skipOnboardingStep(OnboardingScreenType.USER_TYPE_SELECTION)) {
            if (await this.sharedPreferences.getString(PreferenceKey.SELECTED_USER_TYPE).toPromise() === ProfileType.ADMIN) {
                await this.router.navigate([RouterLinks.SIGN_IN], { state: { hideBackBtn: true } });
                // await this.splashScreenService.handleSunbirdSplashScreenActions();
            } else {
                await this.navigateToProfileSettings();
            }
            return false;
        }

        if (route.queryParams.onReload === 'true') {
            this.guardActivated = true;
        }

        if (this.guardActivated) {
            return true;
        }

        this.guardActivated = true;
        if (this.activatedRoute.snapshot.params['comingFrom'] === 'UserTypeSelection') {
            return true;
        }

        const selectedUser = await this.sharedPreferences.getString(PreferenceKey.SELECTED_USER_TYPE).toPromise();
        if (selectedUser && selectedUser !== ProfileType.ADMIN) {
            await this.navigateToProfileSettings()
            return false;
        }
        // await this.splashScreenService.handleSunbirdSplashScreenActions();
        return true;
    }

    private async navigateToProfileSettings(){
        const navigationExtras: NavigationExtras = {
            state: {
                forwardMigration: true
            }
        };
        await this.router.navigate(['/', RouterLinks.PROFILE_SETTINGS], navigationExtras);
    }
}
