import {
  AsyncTestCompleter,
  beforeEach,
  xdescribe,
  ddescribe,
  describe,
  el,
  expect,
  iit,
  inject,
  IS_DARTIUM,
  it,
  SpyObject, proxy
} from 'angular2/test_lib';

import {List, ListWrapper, Map, MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {IMPLEMENTS, Type, isBlank, stringify, isPresent} from 'angular2/src/facade/lang';
import {PromiseWrapper, Promise} from 'angular2/src/facade/async';

import {Compiler, CompilerCache} from 'angular2/src/core/compiler/compiler';
import {AppProtoView} from 'angular2/src/core/compiler/view';
import {ElementBinder} from 'angular2/src/core/compiler/element_binder';
import {DirectiveMetadataReader} from 'angular2/src/core/compiler/directive_metadata_reader';
import {ComponentAnnotation, DynamicComponentAnnotation, ViewportAnnotation, DecoratorAnnotation} from 'angular2/src/core/annotations/annotations';
import {PropertySetter, Attribute} from 'angular2/src/core/annotations/di';
import {ViewAnnotation} from 'angular2/src/core/annotations/view';
import {DirectiveBinding} from 'angular2/src/core/compiler/element_injector';
import {TemplateResolver} from 'angular2/src/core/compiler/template_resolver';
import {ComponentUrlMapper, RuntimeComponentUrlMapper} from 'angular2/src/core/compiler/component_url_mapper';
import {ProtoViewFactory} from 'angular2/src/core/compiler/proto_view_factory';

import {UrlResolver} from 'angular2/src/services/url_resolver';
import * as renderApi from 'angular2/src/render/api';
// TODO(tbosch): Spys don't support named modules...
import {Renderer} from 'angular2/src/render/api';

export function main() {
  describe('compiler', function() {
    var reader, tplResolver, renderer, protoViewFactory, cmpUrlMapper, renderCompileRequests;

    beforeEach(() => {
      reader = new DirectiveMetadataReader();
      tplResolver = new FakeTemplateResolver();
      cmpUrlMapper = new RuntimeComponentUrlMapper();
      renderer = new SpyRenderer();
    });

    function createCompiler(renderCompileResults:List, protoViewFactoryResults:List<AppProtoView>) {
      var urlResolver = new FakeUrlResolver();
      renderCompileRequests = [];
      renderer.spy('compile').andCallFake( (template) => {
        ListWrapper.push(renderCompileRequests, template);
        return PromiseWrapper.resolve(ListWrapper.removeAt(renderCompileResults, 0));
      });

      protoViewFactory = new FakeProtoViewFactory(protoViewFactoryResults)
      return new Compiler(
        reader,
        new CompilerCache(),
        tplResolver,
        cmpUrlMapper,
        urlResolver,
        renderer,
        protoViewFactory
      );
    }

    describe('serialize template', () => {

      function captureTemplate(template:ViewAnnotation):Promise<renderApi.ViewDefinition> {
        tplResolver.setView(MainComponent, template);
        var compiler = createCompiler([createRenderProtoView()], [createProtoView()]);
        return compiler.compile(MainComponent).then( (protoView) => {
          expect(renderCompileRequests.length).toBe(1);
          return renderCompileRequests[0];
        });
      }

      function captureDirective(directive):Promise<renderApi.DirectiveMetadata> {
        return captureTemplate(new ViewAnnotation({template: '<div></div>', directives: [directive]})).then( (renderTpl) => {
          expect(renderTpl.directives.length).toBe(1);
          return renderTpl.directives[0];
        });
      }

      it('should fill the componentId', inject([AsyncTestCompleter], (async) => {
        captureTemplate(new ViewAnnotation({template: '<div></div>'})).then( (renderTpl) => {
          expect(renderTpl.componentId).toEqual(stringify(MainComponent));
          async.done();
        });
      }));

      it('should fill inline template', inject([AsyncTestCompleter], (async) => {
        captureTemplate(new ViewAnnotation({template: '<div></div>'})).then( (renderTpl) => {
          expect(renderTpl.template).toEqual('<div></div>');
          async.done();
        });
      }));

      it('should fill absUrl given inline templates', inject([AsyncTestCompleter], (async) => {
        cmpUrlMapper.setComponentUrl(MainComponent, '/mainComponent');
        captureTemplate(new ViewAnnotation({template: '<div></div>'})).then( (renderTpl) => {
          expect(renderTpl.absUrl).toEqual('http://www.app.com/mainComponent');
          async.done();
        });
      }));

      it('should fill absUrl given url template', inject([AsyncTestCompleter], (async) => {
        cmpUrlMapper.setComponentUrl(MainComponent, '/mainComponent');
        captureTemplate(new ViewAnnotation({templateUrl: '/someTemplate'})).then( (renderTpl) => {
          expect(renderTpl.absUrl).toEqual('http://www.app.com/mainComponent/someTemplate');
          async.done();
        });
      }));

      it('should fill directive.id', inject([AsyncTestCompleter], (async) => {
        captureDirective(MainComponent).then( (renderDir) => {
          expect(renderDir.id).toEqual(stringify(MainComponent));
          async.done();
        });
      }));

      it('should fill directive.selector', inject([AsyncTestCompleter], (async) => {
        captureDirective(MainComponent).then( (renderDir) => {
          expect(renderDir.selector).toEqual('main-comp');
          async.done();
        });
      }));

      it('should fill directive.type for components', inject([AsyncTestCompleter], (async) => {
        captureDirective(MainComponent).then( (renderDir) => {
          expect(renderDir.type).toEqual(renderApi.DirectiveMetadata.COMPONENT_TYPE);
          async.done();
        });
      }));

      it('should fill directive.type for dynamic components', inject([AsyncTestCompleter], (async) => {
        captureDirective(SomeDynamicComponentDirective).then( (renderDir) => {
          expect(renderDir.type).toEqual(renderApi.DirectiveMetadata.COMPONENT_TYPE);
          async.done();
        });
      }));

      it('should fill directive.type for ViewportAnnotation directives', inject([AsyncTestCompleter], (async) => {
        captureDirective(SomeViewAnnotationportDirective).then( (renderDir) => {
          expect(renderDir.type).toEqual(renderApi.DirectiveMetadata.VIEWPORT_TYPE);
          async.done();
        });
      }));

      it('should fill directive.type for DecoratorAnnotation directives', inject([AsyncTestCompleter], (async) => {
        captureDirective(SomeDecoratorDirective).then( (renderDir) => {
          expect(renderDir.type).toEqual(renderApi.DirectiveMetadata.DECORATOR_TYPE);
          async.done();
        });
      }));

      it('should set directive.compileChildren to false for other directives', inject([AsyncTestCompleter], (async) => {
        captureDirective(MainComponent).then( (renderDir) => {
          expect(renderDir.compileChildren).toEqual(true);
          async.done();
        });
      }));

      it('should set directive.compileChildren to true for DecoratorAnnotation directives', inject([AsyncTestCompleter], (async) => {
        captureDirective(SomeDecoratorDirective).then( (renderDir) => {
          expect(renderDir.compileChildren).toEqual(true);
          async.done();
        });
      }));

      it('should set directive.compileChildren to false for DecoratorAnnotation directives', inject([AsyncTestCompleter], (async) => {
        captureDirective(IgnoreChildrenDecoratorDirective).then( (renderDir) => {
          expect(renderDir.compileChildren).toEqual(false);
          async.done();
        });
      }));

      it('should set directive.hostListeners', inject([AsyncTestCompleter], (async) => {
        captureDirective(DirectiveWithEvents).then( (renderDir) => {
          expect(renderDir.hostListeners).toEqual(MapWrapper.createFromStringMap({
            'someEvent': 'someAction'
          }));
          async.done();
        });
      }));

      it('should set directive.bind', inject([AsyncTestCompleter], (async) => {
        captureDirective(DirectiveWithBind).then( (renderDir) => {
          expect(renderDir.properties).toEqual(MapWrapper.createFromStringMap({
            'a': 'b'
          }));
          async.done();
        });
      }));

      it('should read @PropertySetter', inject([AsyncTestCompleter], (async) => {
        captureDirective(DirectiveWithPropertySetters).then( (renderDir) => {
          expect(renderDir.setters).toEqual(['someProp']);
          async.done();
        });
      }));

      it('should read @Attribute', inject([AsyncTestCompleter], (async) => {
        captureDirective(DirectiveWithAttributes).then( (renderDir) => {
          expect(renderDir.readAttributes).toEqual(['someAttr']);
          async.done();
        });
      }));
    });

    describe('call ProtoViewAnnotationFactory', () => {

      it('should pass the render protoViewAnnotation', inject([AsyncTestCompleter], (async) => {
        tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
        var renderProtoViewAnnotation = createRenderProtoViewAnnotation();
        var expectedProtoViewAnnotation = createProtoViewAnnotation();
        var compiler = createCompiler([renderProtoViewAnnotation], [expectedProtoViewAnnotation]);
        compiler.compile(MainComponent).then( (protoViewAnnotation) => {
          var request = protoViewAnnotationFactory.requests[0];
          expect(request[1]).toBe(renderProtoViewAnnotation);
          async.done();
        });
      }));

      it('should pass the ComponentAnnotation binding', inject([AsyncTestCompleter], (async) => {
        tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
        var compiler = createCompiler([createRenderProtoViewAnnotation()], [createProtoViewAnnotation()]);
        compiler.compile(MainComponent).then( (protoViewAnnotation) => {
          var request = protoViewAnnotationFactory.requests[0];
          expect(request[0].key.token).toBe(MainComponent);
          async.done();
        });
      }));

      it('should pass the directive bindings', inject([AsyncTestCompleter], (async) => {
        tplResolver.setViewAnnotation(MainComponent,
          new ViewAnnotation({
            template: '<div></div>',
            directives: [SomeDecoratorDirective]
          })
        );
        var compiler = createCompiler([createRenderProtoViewAnnotation()], [createProtoViewAnnotation()]);
        compiler.compile(MainComponent).then( (protoViewAnnotation) => {
          var request = protoViewAnnotationFactory.requests[0];
          var binding = request[2][0];
          expect(binding.key.token).toBe(SomeDecoratorDirective);
          async.done();
        });
      }));

      it('should use the protoViewAnnotation of the ProtoViewAnnotationFactory', inject([AsyncTestCompleter], (async) => {
        tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
        var renderProtoViewAnnotation = createRenderProtoViewAnnotation();
        var expectedProtoViewAnnotation = createProtoViewAnnotation();
        var compiler = createCompiler([renderProtoViewAnnotation], [expectedProtoViewAnnotation]);
        compiler.compile(MainComponent).then( (protoViewAnnotation) => {
          expect(protoViewAnnotation).toBe(expectedProtoViewAnnotation);
          async.done();
        });
      }));

    });

    it('should load nested components', inject([AsyncTestCompleter], (async) => {
      tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
      tplResolver.setViewAnnotation(NestedComponent, new ViewAnnotation({template: '<div></div>'}));
      var mainProtoViewAnnotation = createProtoViewAnnotation([
        createComponentElementBinder(reader, NestedComponent)
      ]);
      var nestedProtoViewAnnotation = createProtoViewAnnotation();
      var compiler = createCompiler(
        [
          createRenderProtoViewAnnotation([createRenderComponentElementBinder(0)]),
          createRenderProtoViewAnnotation()
        ],
        [mainProtoViewAnnotation, nestedProtoViewAnnotation]
      );
      compiler.compile(MainComponent).then( (protoViewAnnotation) => {
        expect(protoViewAnnotation).toBe(mainProtoViewAnnotation);
        expect(mainProtoViewAnnotation.elementBinders[0].nestedProtoViewAnnotation).toBe(nestedProtoViewAnnotation);
        // parentProtoViewAnnotation of nested components has to be null as components can
        // be used by multiple other components.
        expect(nestedProtoViewAnnotation.parentProtoViewAnnotation).toBe(null);
        async.done();
      });
    }));

    it('should load nested components in ViewportAnnotation', inject([AsyncTestCompleter], (async) => {
      tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
      tplResolver.setViewAnnotation(NestedComponent, new ViewAnnotation({template: '<div></div>'}));
      var mainProtoViewAnnotation = createProtoViewAnnotation([
        createViewAnnotationportElementBinder(null)
      ]);
      var viewportProtoViewAnnotation = createProtoViewAnnotation([
        createComponentElementBinder(reader, NestedComponent)
      ]);
      var nestedProtoViewAnnotation = createProtoViewAnnotation();
      var compiler = createCompiler(
        [
          createRenderProtoViewAnnotation([
            createRenderViewAnnotationportElementBinder(
              createRenderProtoViewAnnotation([
                createRenderComponentElementBinder(0)
              ])
            )
          ]),
          createRenderProtoViewAnnotation()
        ],
        [mainProtoViewAnnotation, viewportProtoViewAnnotation, nestedProtoViewAnnotation]
      );
      compiler.compile(MainComponent).then( (protoViewAnnotation) => {
        expect(protoViewAnnotation).toBe(mainProtoViewAnnotation);
        expect(mainProtoViewAnnotation.elementBinders[0].nestedProtoViewAnnotation).toBe(viewportProtoViewAnnotation);
        expect(viewportProtoViewAnnotation.parentProtoViewAnnotation).toBe(mainProtoViewAnnotation);
        expect(viewportProtoViewAnnotation.elementBinders[0].nestedProtoViewAnnotation).toBe(nestedProtoViewAnnotation);
        // parentProtoViewAnnotation of nested components has to be null as components can
        // be used by multiple other components.
        expect(nestedProtoViewAnnotation.parentProtoViewAnnotation).toBe(null);

        async.done();
      });
    }));

    it('should cache compiled components', inject([AsyncTestCompleter], (async) => {
      tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
      var renderProtoViewAnnotation = createRenderProtoViewAnnotation();
      var expectedProtoViewAnnotation = createProtoViewAnnotation();
      var compiler = createCompiler([renderProtoViewAnnotation], [expectedProtoViewAnnotation]);
      compiler.compile(MainComponent).then( (protoViewAnnotation) => {
        expect(protoViewAnnotation).toBe(expectedProtoViewAnnotation);
        return compiler.compile(MainComponent);
      }).then( (protoViewAnnotation) => {
        expect(protoViewAnnotation).toBe(expectedProtoViewAnnotation);
        async.done();
      });
    }));

    it('should re-use components being compiled', inject([AsyncTestCompleter], (async) => {
      tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
      var renderProtoViewAnnotationCompleter = PromiseWrapper.completer();
      var expectedProtoViewAnnotation = createProtoViewAnnotation();
      var compiler = createCompiler([renderProtoViewAnnotationCompleter.promise], [expectedProtoViewAnnotation]);
      renderProtoViewAnnotationCompleter.resolve(createRenderProtoViewAnnotation());
      PromiseWrapper.all([
        compiler.compile(MainComponent),
        compiler.compile(MainComponent)
      ]).then( (protoViewAnnotations) => {
        expect(protoViewAnnotations[0]).toBe(expectedProtoViewAnnotation);
        expect(protoViewAnnotations[1]).toBe(expectedProtoViewAnnotation);
        async.done();
      });
    }));

    it('should allow recursive components', inject([AsyncTestCompleter], (async) => {
      tplResolver.setViewAnnotation(MainComponent, new ViewAnnotation({template: '<div></div>'}));
      var mainProtoViewAnnotation = createProtoViewAnnotation([
        createComponentElementBinder(reader, MainComponent)
      ]);
      var compiler = createCompiler(
        [createRenderProtoViewAnnotation([
          createRenderComponentElementBinder(0)
        ])],
        [mainProtoViewAnnotation]
      );
      compiler.compile(MainComponent).then( (protoViewAnnotation) => {
        expect(protoViewAnnotation).toBe(mainProtoViewAnnotation);
        expect(mainProtoViewAnnotation.elementBinders[0].nestedProtoViewAnnotation).toBe(mainProtoViewAnnotation);
        async.done();
      });
    }));

    it('should create host proto views', inject([AsyncTestCompleter], (async) => {
      renderer.spy('createHostProtoView').andCallFake( (componentId) => {
        return PromiseWrapper.resolve(
          createRenderProtoView([createRenderComponentElementBinder(0)])
        );
      });
      tplResolver.setView(MainComponent, new ViewAnnotation({template: '<div></div>'}));
      var rootProtoView = createProtoView([
        createComponentElementBinder(reader, MainComponent)
      ]);
      var mainProtoViewAnnotation = createProtoViewAnnotation();
      var compiler = createCompiler(
        [
          createRenderProtoViewAnnotation()
        ],
        [rootProtoViewAnnotation, mainProtoViewAnnotation]
      );
      compiler.compileInHost(MainComponent).then( (protoViewAnnotation) => {
        expect(protoViewAnnotation).toBe(rootProtoViewAnnotation);
        expect(rootProtoViewAnnotation.elementBinders[0].nestedProtoViewAnnotation).toBe(mainProtoViewAnnotation);
        async.done();
      });
    }));

    it('should create imperative proto views', inject([AsyncTestCompleter], (async) => {
      renderer.spy('createImperativeComponentProtoView').andCallFake( (rendererId) => {
        return PromiseWrapper.resolve(
          createRenderProtoView([])
        );
      });
      tplResolver.setView(MainComponent, new ViewAnnotation({renderer: 'some-renderer'}));
      var mainProtoView = createProtoView();
      var compiler = createCompiler(
        [],
        [mainProtoView]
      );
      compiler.compile(MainComponent).then( (protoView) => {
        expect(protoView).toBe(mainProtoView);
        expect(renderer.spy('createImperativeComponentProtoView')).toHaveBeenCalledWith('some-renderer');
        async.done();
      });
    }));
  });
}

function createDirectiveBinding(reader, type) {
  var meta = reader.read(type);
  return DirectiveBinding.createFromType(meta.type, meta.annotation);
}

function createProtoViewAnnotation(elementBinders = null) {
  var pv = new AppProtoViewAnnotation(null, null);
  if (isBlank(elementBinders)) {
    elementBinders = [];
  }
  pv.elementBinders = elementBinders;
  return pv;
}

function createComponentElementBinder(reader, type) {
  var binding = createDirectiveBinding(reader, type);
  return new ElementBinder(
    0, null, 0,
    null, binding,
    null
  );
}

function createViewAnnotationportElementBinder(nestedProtoViewAnnotation) {
  var elBinder = new ElementBinder(
    0, null, 0,
    null, null,
    null
  );
  elBinder.nestedProtoViewAnnotation = nestedProtoViewAnnotation;
  return elBinder;
}

function createRenderProtoViewAnnotation(elementBinders = null) {
  if (isBlank(elementBinders)) {
    elementBinders = [];
  }
  return new renderApi.ProtoViewAnnotationDto({
    elementBinders: elementBinders
  });
}

function createRenderComponentElementBinder(directiveIndex) {
  return new renderApi.ElementBinder({
    directives: [new renderApi.DirectiveBinder({
      directiveIndex: directiveIndex
    })]
  });
}

function createRenderViewAnnotationportElementBinder(nestedProtoViewAnnotation) {
  return new renderApi.ElementBinder({
    nestedProtoViewAnnotation: nestedProtoViewAnnotation
  });
}

@ComponentAnnotation({
  selector: 'main-comp'
})
class MainComponent {}

@ComponentAnnotation()
class NestedComponent {}

class RecursiveComponent {}

@DynamicComponentAnnotation()
class SomeDynamicComponentDirective {}

@ViewAnnotationport()
class SomeViewAnnotationportDirective {}

@DecoratorAnnotation()
class SomeDecoratorDirective {}

@DecoratorAnnotation({
  compileChildren: false
})
class IgnoreChildrenDecoratorDirective {}

@DecoratorAnnotation({
  hostListeners: {'someEvent': 'someAction'}
})
class DirectiveWithEvents {}

@DecoratorAnnotation({
  properties: {'a': 'b'}
})
class DirectiveWithBind {}

@DecoratorAnnotation()
class DirectiveWithPropertySetters {
  constructor(@PropertySetter('someProp') someProp) {}
}

@DecoratorAnnotation()
class DirectiveWithAttributes {
  constructor(@Attribute('someAttr') someAttr:string) {}
}

@proxy
@IMPLEMENTS(Renderer)
class SpyRenderer extends SpyObject {
  constructor(){super(Renderer);}
  noSuchMethod(m){return super.noSuchMethod(m)}
}

class FakeUrlResolver extends UrlResolver {
  constructor() {
    super();
  }

  resolve(baseUrl: string, url: string): string {
    if (baseUrl === null && url == './') {
      return 'http://www.app.com';
    }

    return baseUrl + url;
  }
}


class FakeTemplateResolver extends TemplateResolver {
  _cmpTemplates: Map;

  constructor() {
    super();
    this._cmpTemplates = MapWrapper.create();
  }

  resolve(ComponentAnnotation: Type): ViewAnnotation {
    var template = MapWrapper.get(this._cmpTemplates, ComponentAnnotation);
    if (isBlank(template)) {
      throw 'No template';
    }
    return template;
  }

  setViewAnnotation(ComponentAnnotation: Type, template: ViewAnnotation) {
    MapWrapper.set(this._cmpTemplates, ComponentAnnotation, template);
  }
}

class FakeProtoViewAnnotationFactory extends ProtoViewAnnotationFactory {
  requests:List;
  _results:List;

  constructor(results) {
    super(null);
    this.requests = [];
    this._results = results;
  }

  createProtoViewAnnotation(componentBinding:DirectiveBinding, renderProtoViewAnnotation: renderApi.ProtoViewAnnotationDto, directives:List<DirectiveBinding>):AppProtoViewAnnotation {
    ListWrapper.push(this.requests, [componentBinding, renderProtoViewAnnotation, directives]);
    return ListWrapper.removeAt(this._results, 0);
  }
}
