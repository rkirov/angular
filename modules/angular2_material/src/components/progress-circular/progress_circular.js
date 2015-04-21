import {ComponentAnnotation, ViewAnnotation} from 'angular2/angular2';

@ComponentAnnotation({
  selector: 'md-progress-circular'
})
@ViewAnnotation({
  templateUrl: 'angular2_material/src/components/progress-circular/progress_circular.html'
})
export class MdProgressCircular {
  constructor() {
  }
}
