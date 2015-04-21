import {ComponentAnnotation, DecoratorAnnotation, DynamicComponentAnnotation, ViewportAnnotation} from './annotations';
import {ViewAnnotation} from './view';

function makeDecorator(annotationCls) {
  return function(...args) {
    if (!window.Reflect) throw 'reflect-metadata shim is required';
    var annotationInstance = new annotationCls(...args);
    var Reflect = window.Reflect;
    return function(cls) {
      var annotations = Reflect.getMetadata('annotations', cls);
      annotations = annotations || [];
      annotations.push(annotationInstance);
      Reflect.defineMetadata('annotations', annotations, cls);
      return cls;
    }
  }
}

export var Component = makeDecorator(ComponentAnnotation);
export var Decorator = makeDecorator(DecoratorAnnotation);
export var DynamicComponent = makeDecorator(DynamicComponentAnnotation);
export var Viewport = makeDecorator(ViewportAnnotation);
export var View = makeDecorator(ViewAnnotation);
