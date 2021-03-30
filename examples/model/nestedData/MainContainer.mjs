import ComponentModel          from '../../../src/model/Component.mjs';
import MainContainerController from './MainContainerController.mjs'
import Panel                   from '../../../src/container/Panel.mjs';
import TextField               from '../../../src/form/field/Text.mjs';
import Viewport                from '../../../src/container/Viewport.mjs';

/**
 * @class Neo.examples.model.nestedData.MainContainer
 * @extends Neo.container.Viewport
 */
class MainContainer extends Viewport {
    static getConfig() {return {
        /**
         * @member {String} className='Neo.examples.model.nestedData.MainContainer'
         * @protected
         */
        className: 'Neo.examples.model.nestedData.MainContainer',
        /**
         * @member {Boolean} autoMount=true
         */
        autoMount : true,
        /**
         * @member {Neo.controller.Component} controller=MainContainerController
         */
        controller: MainContainerController,
        /**
         * @member {Object|Neo.model.Component} model
         */
        model: {
            data: {
                user: {
                    details: {
                        firstname: 'Nils',
                        lastname : 'Dehl'
                    }
                }
            }
        },
        /**
         * @member {Object} style
         */
        style: {
            padding: '20px'
        },
        /**
         * @member {Object[]} items
         */
        items: [{
            module: Panel,

            containerConfig: {
                style: {
                    padding: '20px'
                }
            },

            headers: [{
                dock : 'top',
                items: [{
                    ntype: 'label',
                    text : 'model.Component: inline definition'
                }, {
                    ntype: 'component',
                    flex : 1
                }, {
                    handler: 'onButton1Click',
                    iconCls: 'fa fa-home',

                    bind: {
                        text: 'user.details.firstname'
                    }
                }, {
                    handler: 'onButton2Click',
                    iconCls: 'fa fa-user',
                    style  : {marginLeft: '10px'},

                    bind: {
                        text: 'user.details.lastname'
                    }
                }]
            }],

            items: [{
                module    : TextField,
                flex      : 'none',
                labelText : 'Button1 text:',
                labelWidth: 110,
                maxWidth  : 300,

                bind: {
                    value: 'user.details.firstname'
                },

                listeners: {
                    change: 'onTextField1Change'
                }
            }, {
                module    : TextField,
                flex      : 'none',
                labelText : 'Button2 text:',
                labelWidth: 110,
                maxWidth  : 300,

                bind: {
                    value: 'user.details.lastname'
                },

                listeners: {
                    change: 'onTextField2Change'
                }
            }]
        }]
    }}
}

Neo.applyClassConfig(MainContainer);

export {MainContainer as default};