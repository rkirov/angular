import {Injector, bind} from 'di/di';
import {Type, FIELD, isBlank} from 'facade/lang';
import {DOM, Element} from 'facade/dom';
import {Compiler} from './compiler/compiler';
import {ProtoView} from './compiler/view';
import {ClosureMap} from 'change_detection/parser/closure_map';
import {Parser} from 'change_detection/parser/parser';
import {Lexer} from 'change_detection/parser/lexer';
import {ChangeDetector} from 'change_detection/change_detector';
import {WatchGroup} from 'change_detection/watch_group';
import {TemplateLoader} from './compiler/template_loader';
import {Reflector} from './compiler/reflector';
import {AnnotatedType} from './compiler/annotated_type';

var _ngInjector: Injector;

// ngInjector should contain everything that is safe to share between
// applications.
var ngModule = [Compiler, TemplateLoader, Reflector, Parser, Lexer, ClosureMap];

export class Application {
  // appDonePromise:Promise<Application>;
  constructor(rootComponentAnnotatedType: AnnotatedType,
      insertionElement: Element) {
    this.insertionElement = insertionElement;
    if (isBlank(_ngInjector)) _ngInjector = new Injector(ngModule);
    this.injector = _ngInjector.createChild(this.injectorBindings(
        rootComponentAnnotatedType));
    this.appDonePromise = this.injector.asyncGet(ChangeDetector).then((cd) => {
      // TODO(rado): replace with zone.
      cd.detectChanges();
      return this;
    });
  }

  injectorBindings(rootComponentAnnotatedType: AnnotatedType) {
    return [
        bind(Application).toValue(this),
        bind('RootView').toAsyncFactory((compiler) => {
          var protoViewPromise = compiler.compile(
              rootComponentAnnotatedType.type, null);
          var rootViewPromise = protoViewPromise.then((protoView) => {
            var rootProtoView = ProtoView.createRootProtoView(protoView,
                this.insertionElement, rootComponentAnnotatedType)
            return rootProtoView.instantiate(
                // The light Dom of the insertion element is not considered part 
                // of the angular application. Thus the context and
                // lightDomInjector are empty.
                new Object(), this.injector, null, true);
          });
          return rootViewPromise;
        }, [Compiler]),
        bind(WatchGroup).toFactory((rootView) => rootView.watchGroup,
            ['RootView']),
        ChangeDetector
    ];
  }

  // Multiple calls to this method are ok. The created applications would
  // only share ngInjector, which is not user configurable by design, thus safe
  // to share.
  static bootstrap(rootComponentType: Type) {
    // TODO(rado): prepopulate template cache, so applications with only
    // index.html and main.js are possible.
    var annotatedType = (new Reflector()).annotatedType(rootComponentType);
    var selector = annotatedType.annotation.selector;
    var element = DOM.query(selector);
    if (isBlank(element)) {
      throw new NoAppElement(selector);
    }
    // TODO(rado): warn here if the rootComponent has bindings, lightDomServices,
    // and other component annotations that are skipped for bootstrapping
    // components.
    var application = new Application(annotatedType, element);
    return application.appDonePromise;
  }
}

export class NoAppElement extends Error {
  constructor(selector) {
    this.message =
        `The app selector "${selector}" did not match any elements`;
  }

  toString() {
    return this.message;
  }
}
