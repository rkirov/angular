// This file tests that the generated angular.d.ts is valid and tsc transpiles
// this file without any error. There are no runtime assertions, in fact this
// file is not meant to be run.

// Next features to be added here:
// - whitelist/blacklist apis, so that we don't accidentally export private APIs.

import {bootstrap, bind, NgIf, NgFor, Component, View} from 'angular2/angular2';

class Service {
  
}

class Cmp {
  static annotations: any[];
}
Cmp.annotations = [
  ng.Component({
  }),
  ng.View({
  })
];
@Component({
  selector: 'cmp',
  appInjector: [bind(Service).toValue(null)]
})
@View({
  template: '{{greeting}} world!',
  directives: [NgFor, NgIf]
})
class Cmp {}

bootstrap(Cmp);



