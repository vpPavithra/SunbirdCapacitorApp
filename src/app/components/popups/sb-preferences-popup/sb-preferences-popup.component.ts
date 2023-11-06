import { Component, Input} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { App, AppInfo } from '@capacitor/app';

@Component({
    selector: 'app-sb-preferences-popup',
    templateUrl: './sb-preferences-popup.component.html',
    styleUrls: ['./sb-preferences-popup.component.scss']
})
export class SbPreferencePopupComponent {
    @Input() public userName = '';
    @Input() public preferenceData;

    public appLabel = '';

    constructor(
        private modalCtrl: ModalController
    ) {
        App.getInfo().then((info: AppInfo) => {
            this.appLabel = info.name;
        }).catch(err => console.error(err));
    }

    async changePreference() {
        await this.modalCtrl.dismiss({ showPreference: true });
    }
}
