import {DecoratorAnnotation} from 'angular2/angular2';

@DecoratorAnnotation({
  selector: 'md-input-container input'
})
export class MdInput {
  constructor() {

  }
}


@DecoratorAnnotation({
  selector: 'md-input-container'
})
export class MdInputContainer {
}
