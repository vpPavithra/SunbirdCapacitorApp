import { Injectable } from '@angular/core';
import { AndroidPermission, AndroidPermissionsStatus } from '../../services/android-permissions/android-permission';
import { defer, Observable } from 'rxjs';

declare const window;

@Injectable()
export class AndroidPermissionsService {
  checkPermissions(permissions: AndroidPermission[]): Observable<{ [key: string]: AndroidPermissionsStatus }> {
    return defer(async () => {
      const requestPromises = permissions.map((permission) => {
        return new Promise<AndroidPermissionsStatus>((resolve, reject) => {
          window.cordova.plugins.permissions.checkPermission(permission, (status: AndroidPermissionsStatus) => {
            resolve(status);
          }, (err) => {
            reject(err);
          });
        });
      });

      const statuses = await Promise.all(requestPromises);

      const permissionStatus = permissions.reduce((acc, permission, index) => {
        acc[permission] = statuses[index];
        return acc;
      }, {});

      for (const permission in permissionStatus) {
        if (permissionStatus.hasOwnProperty(permission)) {
          permissionStatus[permission].isPermissionAlwaysDenied = await this.getAlwaysDeniedStatus(permission as any);
        }
      }

      return permissionStatus;
    });
  }

  requestPermission(permission: AndroidPermission): Observable<AndroidPermissionsStatus> {
    return defer(async () => {
      const permissionStatus: AndroidPermissionsStatus = await new Promise<AndroidPermissionsStatus>((resolve, reject) => {
        window.cordova.plugins.permissions.requestPermissions([permission], (status: AndroidPermissionsStatus) => {
          resolve(status);
        }, (err) => {
          reject(err);
        });
      });

      permissionStatus.isPermissionAlwaysDenied = await this.getAlwaysDeniedStatus(permission);

      return permissionStatus;
    });
  }

  requestPermissions(permissions: AndroidPermission[]): Observable<AndroidPermissionsStatus> {
    return defer(async () => {
      const permissionStatus: AndroidPermissionsStatus = await new Promise<AndroidPermissionsStatus>((resolve, reject) => {
        window.cordova.plugins.permissions.requestPermissions(permissions, (status: AndroidPermissionsStatus) => {
          resolve(status);
        }, (err) => {
          reject(err);
        });
      });

      return permissionStatus;
    });
  }

  private async getAlwaysDeniedStatus(androidPermission: AndroidPermission): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      window.cordova.plugins.diagnostic.getPermissionAuthorizationStatus((status) => {
        if (status === window.cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, (e) => {
        reject(e);
      }, androidPermission.split('.')[2]);
    });
  }
}
