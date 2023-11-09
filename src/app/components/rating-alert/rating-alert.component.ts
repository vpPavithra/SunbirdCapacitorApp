import { Component, Inject, OnInit } from '@angular/core';
import { NavParams, Platform, PopoverController } from '@ionic/angular';
import { AppRatingService } from '../../../services/app-rating.service';
import { TelemetryGeneratorService } from '../../../services/telemetry-generator.service';
import { UtilityService } from '../../../services/utility-service';
import { SharedPreferences, TelemetryService } from '@project-sunbird/sunbird-sdk';
import { App, AppInfo } from '@capacitor/app';
import { Observable } from 'rxjs';
import { PreferenceKey, StoreRating } from '../../../app/app.constant';
import {
  Environment,
  ImpressionSubtype,
  ImpressionType,
  InteractSubtype,
  InteractType
} from '../../../services/telemetry-constants';
import { map } from 'rxjs/operators';
import { CommonUtilService } from '../../../services/common-util.service';

enum ViewType {
  APP_RATE = 'appRate',
  STORE_RATE = 'storeRate',
  HELP_DESK = 'helpDesk',
}

interface ViewText {
  type: string;
  heading: string;
  message: string;
}

@Component({
  selector: 'app-rating-alert',
  templateUrl: './rating-alert.component.html',
  styleUrls: ['./rating-alert.component.scss'],
})
export class AppRatingAlertComponent implements OnInit {

  private readonly appRateView = {
    appRate: { type: ViewType.APP_RATE, heading: 'APP_RATING_RATE_EXPERIENCE', message: 'APP_RATING_TAP_ON_STARS' },
    storeRate: {
      type: ViewType.STORE_RATE,
      heading: 'APP_RATING_THANKS_FOR_RATING',
      message: 'APP_RATING_RATE_ON_PLAYSTORE'
    },
    helpDesk: { type: ViewType.HELP_DESK, heading: 'APP_RATING_THANKS_FOR_RATING', message: 'APP_RATING_REPORT_AN_ISSUE' }
  };
  public appRate = 0;
  private pageId = '';
  public currentViewText: ViewText;
  public appLogo$: Observable<string>;
  public appName: string;
  backButtonFunc = undefined;
  private appRatingPopCount = 0;
  private rateLaterClickedCount = 0;

  constructor(
    @Inject('SHARED_PREFERENCES') private preference: SharedPreferences,
    @Inject('TELEMETRY_SERVICE') private telemetryService: TelemetryService,
    private popOverCtrl: PopoverController,
    private utilityService: UtilityService,
    private appRatingService: AppRatingService,
    private platform: Platform,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private navParams: NavParams,
    private commonUtilService: CommonUtilService,
  ) {
    this.getAppName();
    this.appLogo$ = this.preference.getString('app_logo').pipe(
      map((logo) => logo || './assets/imgs/ic_launcher.png')
    );
    this.currentViewText = this.appRateView[ViewType.APP_RATE];
    this.backButtonFunc = this.platform.backButton.subscribeWithPriority(11, async () => {
      await this.closePopover();
    });
  }

  async ngOnInit() {
    this.pageId = this.navParams.get('pageId');
    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.VIEW,
      ImpressionSubtype.APP_RATING_POPUP,
      this.pageId,
      Environment.HOME
    );
    await this.appRatePopup();
  }

  getAppName() {
    App.getInfo()
      .then((info: AppInfo) => {
        this.appName = info.name;
      })
      .catch(err => console.error(err));
  }

  async closePopover() {
    await this.popOverCtrl.dismiss(null);
    if (this.backButtonFunc) {
      this.backButtonFunc.unsubscribe();
    }
  }

  async rateLater() {
    this.rateLaterClickedCount = await this.appRatingService.rateLaterClickedCount();
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.RATE_LATER_CLICKED,
      Environment.HOME,
      this.pageId,
      undefined,
      { rateLaterCount: this.rateLaterClickedCount }
    );
    await this.closePopover();
  }

  async rateOnStore() {
    let pkg = (await App.getInfo()).id;
    await this.utilityService.openPlayStore(pkg);
    await this.appRatingService.setEndStoreRate(this.appRate);
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.PLAY_STORE_BUTTON_CLICKED,
      Environment.HOME,
      this.pageId,
      undefined,
      { appRating: this.appRate }
    );
    await this.popOverCtrl.dismiss(StoreRating.RETURN_CLOSE);
  }

  submitRating() {
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.RATING_SUBMITTED,
      Environment.HOME,
      this.pageId,
      undefined,
      { appRating: this.appRate }
    );
    if (this.appRate >= StoreRating.APP_MIN_RATE) {
      this.currentViewText = this.appRateView[ViewType.STORE_RATE];
    } else {
      this.currentViewText = this.appRateView[ViewType.HELP_DESK];
    }
  }

  async goToHelpSection() {
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.HELP_SECTION_CLICKED,
      Environment.HOME,
      this.pageId
    );
    await this.popOverCtrl.dismiss(StoreRating.RETURN_HELP);
  }

  private async appRatePopup() {
    this.appRatingPopCount = await this.countAppRatingPopupAppeared();
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.OTHER,
      InteractSubtype.APP_RATING_APPEARED,
      this.pageId,
      Environment.HOME,
      undefined,
      { appRatingPopAppearedCount: this.appRatingPopCount }
    );
    this.rateContent(0);
  }

  async calculateAppRatingCountAppeared(value) {
    return this.preference.putString(PreferenceKey.APP_RATING_POPUP_APPEARED, String(value)).toPromise().then(() => value);
  }

  async countAppRatingPopupAppeared() {
    return this.preference.getString(PreferenceKey.APP_RATE_LATER_CLICKED).toPromise().then(async (val) => {
      if (val) {
        const incrementedVal = Number(val) + 1;
        await this.calculateAppRatingCountAppeared(incrementedVal);
        return incrementedVal;
      } else {
        return this.calculateAppRatingCountAppeared(1);
      }
    });
  }

  rateContent(ratingCount){
    const ratingDomTag = document.getElementsByTagName('rating');
    this.commonUtilService.setRatingStarAriaLabel(ratingDomTag, ratingCount);
  }

}
