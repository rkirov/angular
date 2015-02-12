import {FIELD, print} from 'angular2/src/facade/lang';
import {ChangeDetector} from 'angular2/change_detection';
import {VmTurnZone} from 'angular2/src/core/zone/vm_turn_zone';
import {ListWrapper} from 'angular2/src/facade/collection';
import {isPresent} from 'angular2/src/facade/lang';
import {View} from 'angular2/src/core/compiler/view';

export class LifeCycle {
  _changeDetector:ChangeDetector;
  _enforceNoNewChanges:boolean;
  _rootView: View;

  constructor(changeDetector:ChangeDetector = null, enforceNoNewChanges:boolean = false) {
    this._changeDetector = changeDetector; // may be null when instantiated from application bootstrap
    this._enforceNoNewChanges = enforceNoNewChanges;
  }

  registerWith(zone:VmTurnZone, changeDetector:ChangeDetector = null) {
    // temporary error handler, we should inject one
    var errorHandler = (exception, stackTrace) => {
      var longStackTrace = ListWrapper.join(stackTrace, "\n\n-----async gap-----\n");
      print(`${exception}\n\n${longStackTrace}`);
      throw exception;
    };

    if (isPresent(changeDetector)) {
      this._changeDetector = changeDetector;
    }

    zone.initCallbacks({
      onErrorHandler: errorHandler,
      onTurnDone: () => this.tick()
    });
  }

  setRootView(view: View) {
    this._rootView = view;
  }

  tick() {
    this._changeDetector.detectChanges();
    if (this._enforceNoNewChanges) {
      this._changeDetector.checkNoChanges();
    }
    this._runDomQueues();
  }

  _runDomQueues() {
    this._rootView.runWriteQueueDown();
    this._rootView.runReadQueueDown();
  }
}
