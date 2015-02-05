import {CONST} from 'facade/src/lang';
import {DOM, Element} from 'facade/src/dom';
import {List} from 'facade/src/collection';
import {View} from './view';
import {Content} from './shadow_dom_emulation/content_tag';
import {LightDom} from './shadow_dom_emulation/light_dom';

export class ShadowDomStrategy {
  @CONST() constructor() {}
  attachTemplate(el:Element, view:View){}
  constructLightDom(lightDomView:View, shadowDomView:View, el:Element){}
  polyfillDirectives():List<Type>{ return null; };
}

/**
 * Emulate <content> tag light dom inclusion in the shadow dom and CSS
 * encapsulation.
 */
export class EmulatedShadowDomStrategy extends ShadowDomStrategy {
  @CONST() constructor() {}
  attachTemplate(el:Element, view:View){
    DOM.clearNodes(el);
    moveViewNodesIntoParent(el, view);
  }

  constructLightDom(lightDomView:View, shadowDomView:View, el:Element){
    return new LightDom(lightDomView, shadowDomView, el);
  }

  polyfillDirectives():List<Type> {
    return [Content];
  }
}

/**
 * Emulate only <content> tag light dom inclusion in the shadow dom.
 */
export class ComponentOnlyEmulatedShadowDomStrategy extends ShadowDomStrategy {
  @CONST() constructor() {}
  attachTemplate(el:Element, view:View){
    DOM.clearNodes(el);
    moveViewNodesIntoParent(el, view);
  }

  constructLightDom(lightDomView:View, shadowDomView:View, el:Element){
    return new LightDom(lightDomView, shadowDomView, el);
  }

  polyfillDirectives():List<Type> {
    return [Content];
  }
}

/**
 * Use native shadow dom APIs. When used in a browser that does not support
 * them, this strategy will throw.
 */
export class NativeShadowDomStrategy extends ShadowDomStrategy {
  @CONST() constructor() {}
  attachTemplate(el:Element, view:View){
    moveViewNodesIntoParent(el.createShadowRoot(), view);
  }

  constructLightDom(lightDomView:View, shadowDomView:View, el:Element){
    return null;
  }

  polyfillDirectives():List<Type> {
    return [];
  }
}

/**
 * Use NativeShadowDomStrategy when available, otherwise fallback to
 * EmulatedShadowDomStrategy.
 */
export class AutoDetectShadowDomStrategy extends ShadowDomStrategy {
  @CONST() constructor() {}
  attachTemplate(el:Element, view:View){
    moveViewNodesIntoParent(el.createShadowRoot(), view);
  }

  constructLightDom(lightDomView:View, shadowDomView:View, el:Element){
    return null;
  }

  polyfillDirectives():List<Type> {
    return [];
  }
}

function moveViewNodesIntoParent(parent, view) {
  for (var i = 0; i < view.nodes.length; ++i) {
    DOM.appendChild(parent, view.nodes[i]);
  }
}
