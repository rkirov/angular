import {DecoratorAnnotation} from 'angular2/angular2';

@DecoratorAnnotation({
  selector: '[md-theme]'
})
export class MdTheme {
  color: string;

  constructor() {
    this.color = 'sky-blue'
  }
}
