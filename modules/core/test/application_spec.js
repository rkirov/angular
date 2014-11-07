import {describe, ddescribe, it, iit, xit, xdescribe, expect, beforeEach} from 'test_lib/test_lib';
import {Application} from 'core/application';
import {Component} from 'core/annotations/component';
import {DOM} from 'facade/dom';
import {Reflector} from 'core/compiler/reflector';
import {TemplateConfig} from 'core/annotations/template_config';

@Component({
  selector: 'hello-app',
  template: new TemplateConfig({
    // replace with '{{greeting}} when nested watch groups are ready.
    inline: 'hello static!',
    directives: []
  })
})
class HelloRootCmp {
  constructor() {
    this.greeting = 'hello world!';
  }
}

export function main() {
  describe('Application constructor', () => {
    var el;
    var annotatedType = (new Reflector()).annotatedType(HelloRootCmp);

    beforeEach(() => {
      el = DOM.createElement('div');
    });

    it('should create an app promise', () => {
      var application = new Application(annotatedType, el);
      expect(application.appDonePromise).not.toBe(null);
    });

    it('should resolve an app promise', (done) => {
      var application = new Application(annotatedType, el);
      expect(application.appDonePromise).not.toBe(null);
      application.appDonePromise.then((app) => {
        expect(app).toBeAnInstanceOf(Application);
        done();
      });
    });

    it('should display hello world', (done) => {
      var application = new Application(annotatedType, el);
      application.appDonePromise.then((app) => {
        expect(app.insertionElement.shadowRoot.childNodes[0].nodeValue).
            toEqual('hello static!');
        done();
      });
    });
  });

  describe('bootstrap factory method', () => {
    it('should throw if no element is found', () => {
      expect(() => Application.bootstrap(HelloRootCmp)).toThrowError(
          'The app selector "hello-app" did not match any elements');
    });
  });
}
