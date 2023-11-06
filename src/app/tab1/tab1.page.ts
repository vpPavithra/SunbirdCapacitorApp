import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  constructor(private platform: Platform) {
    this.initialisePlatformReady();
  }

  async initialisePlatformReady() {
    await this.platform.ready().then((src) => {
      console.log("******* platform ready ", src);
    }).catch(err => {
      console.log("error on platform ready ");
    })
  }

}
