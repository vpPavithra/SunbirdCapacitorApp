import { Injectable, Inject } from '@angular/core';
import { SharedPreferences } from '@project-sunbird/sunbird-sdk';
import { PreferenceKey, StoreRating } from '../app/app.constant';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
declare const window: any;

@Injectable()
export class AppRatingService {
  constructor(
    @Inject('SHARED_PREFERENCES') private preference: SharedPreferences,
  ) { }

  async checkInitialDate() {
    let res = await this.preference.getString(PreferenceKey.APP_RATING_DATE).toPromise()
    if (!res) {
      await this.setInitialDate();
    }
  }

  private async setInitialDate() {
    const presentDate = window.dayjs().format();
    await this.preference.putString(PreferenceKey.APP_RATING_DATE, String(presentDate)).toPromise();
  }

  async setEndStoreRate(rate) {
    await this.createFolder(rate);
  }

  private async createFolder(rate) {
    await Filesystem.mkdir({path: StoreRating.FOLDER_NAME, directory: Directory.Data, recursive: true})
    await this.writeFile(rate);
  }

  private async writeFile(rate) {
    await Filesystem.writeFile({path: StoreRating.FOLDER_NAME+'/'+StoreRating.FILE_NAME, data: StoreRating.FILE_TEXT + ' = ' + rate, directory: Directory.Data, encoding: Encoding.UTF8, recursive: true});
  }

  async rateLaterClickedCount() {
    return await this.checkRateLaterCount();
  }

  private async checkRateLaterCount() {
    return this.preference.getString(PreferenceKey.APP_RATE_LATER_CLICKED).toPromise().then(async (val) => {
      if (val) {
        const incrementValue = Number(val) + 1;
        await this.increaseRateLaterClickedCount(incrementValue);
        return incrementValue;
      }
      return this.increaseRateLaterClickedCount(1);
    });
  }

  private async increaseRateLaterClickedCount(value) {
    return await this.preference.putString(PreferenceKey.APP_RATE_LATER_CLICKED, String(value)).toPromise().then(() => value);
  }
}
