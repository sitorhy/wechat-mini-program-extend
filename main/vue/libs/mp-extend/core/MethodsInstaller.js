import OptionInstaller from"./OptionInstaller";export default class MethodsInstaller extends OptionInstaller{_methods={};definitionFilter(t,s,e,l,o){Object.assign(l,{methods:Object.assign(l.methods||{},this._methods)})}install(t,s,e){var{methods:e=null}=e;s.set("methods",Object.assign.apply(void 0,[this._methods,...t.installers.map(t=>t.methods()),e]))}}