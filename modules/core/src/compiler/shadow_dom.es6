import {EmulatedShadowDomStrategy, NativeShadowDomStrategy, ComponentOnlyEmulatedShadowDomStrategy, AutoDetectShadowDomStrategy} from './shadow_dom_strategy';
export * from './shadow_dom_strategy';

export var ShadowDomEmulated = new EmulatedShadowDomStrategy();
export var ShadowDomNative = new NativeShadowDomStrategy();
export var ShadowDomComponentOnlyEmulated = new ComponentOnlyEmulatedShadowDomStrategy();
export var ShadowDomAutoDetect = new AutoDetectShadowDomStrategy();
