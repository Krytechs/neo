import BaseList from '../list/Base.mjs';
import NeoArray from '../util/Array.mjs';
import Store    from './Store.mjs';

/**
 * @class Neo.menu.List
 * @extends Neo.list.Base
 */
class List extends BaseList {
    static getConfig() {return {
        /**
         * @member {String} className='Neo.menu.List'
         * @protected
         */
        className: 'Neo.menu.List',
        /**
         * @member {String} ntype='menu-list'
         * @protected
         */
        ntype: 'menu-list',
        /**
         * Read only. We are storing the currently visible subMenu instance.
         * @member {Neo.menu.List|Neo.menu.Panel|null} activeSubMenu=null
         */
        activeSubMenu: null,
        /**
         * @member {String[]} cls=['neo-menu-list','neo-list']
         */
        cls: ['neo-menu-list', 'neo-list'],
        /**
         * True will add 'neo-floating' to the instance cls list.
         * @member {Boolean} floating_=false
         */
        floating_: false,
        /**
         * Optionally pass menu.Store data directly
         * @member {Object[]|null} items_=null
         */
        items_: null,
        /**
         * Value for the list.Base store_ config
         * @member {Neo.menu.Store} store=Store
         */
        store: Store,
        /**
         * The distance in px between a menu and a child menu
         * See: https://github.com/neomjs/neo/issues/2569
         * @member {Number} subMenuGap=0
         */
        subMenuGap: 0,
        /**
         * Storing childMenus by record keyProperty
         * @member {Object} subMenuMap=null
         * @protected
         */
        subMenuMap: null
    }}

    /**
     * Triggered after the floating config got changed
     * @param {Object[]} value
     * @param {Object[]} oldValue
     * @protected
     */
    afterSetFloating(value, oldValue) {
        let cls = this.cls;

        NeoArray[value ? 'add' : 'remove'](cls, 'neo-floating');
        this.cls = cls;
    }

    /**
     * Triggered after the items config got changed
     * @param {Object[]} value
     * @param {Object[]} oldValue
     * @protected
     */
    afterSetItems(value, oldValue) {
        let store = this.store;

        oldValue && store.remove(oldValue);
        value    && store.add(value);
    }

    /**
     * Override this method for custom renderers
     * @param {Object} record
     * @param {Number} index
     * @returns {Object|Object[]|String} Either a config object to assign to the item, a vdom cn array or a html string
     */
    createItemContent(record, index) {
        let me     = this,
            id     = record[me.store.keyProperty],
            vdomCn = [{tag: 'span', cls: ['neo-content'], html: record[me.displayField]}];

        if (record.iconCls && record.iconCls !== '') {
            vdomCn.unshift({tag: 'i', cls: ['neo-icon', record.iconCls], id: me.getIconId(id)});
        }

        if (me.hasChildren(record)) {
            vdomCn.push({tag: 'i', cls: ['neo-arrow-icon', 'fas fa-chevron-right'], id: me.getArrowIconId(id)});
        }

        return vdomCn;
    }

    /**
     *
     * @param {String} nodeId
     * @param {Object} record
     */
    createSubMenu(nodeId, record) {
        let me         = this,
            recordId   = record[me.store.keyProperty],
            subMenuMap = me.subMenuMap || {},
            subMenu    = subMenuMap[`menu__${recordId}`], // ids can be Numbers, so we do need a prefix
            menuStyle, style;

        Neo.main.DomAccess.getBoundingClientRect({
            appName: me.appName,
            id     : nodeId
        }).then(rect => {
            style = {
                left: `${rect.right + me.subMenuGap}px`,
                top : `${rect.top - 1}px` // minus the border
            };

            if (subMenu) {
                menuStyle = subMenu.style;

                Object.assign(menuStyle, style);

                subMenu.setSilent({style: menuStyle});
            } else {
                subMenuMap[`menu__${recordId}`] = subMenu = Neo.create({
                    module  : List,
                    appName : me.appName,
                    floating: true,
                    items   : record.items,
                    style   : style
                });
            }

            me.activeSubMenu = subMenu;
            me.subMenuMap    = subMenuMap;

            subMenu.render(true);
        });
    }

    /**
     *
     */
    destroy(...args) {
        let me            = this,
            activeSubMenu = me.activeSubMenu,
            subMenuMap    = me.subMenuMap;

        me.store.destroy();
        me.store = null;

        if (activeSubMenu) {
            activeSubMenu.unmount();
            me.activeSubMenu = null;
        }

        Object.entries(subMenuMap).forEach(([key, value]) => {
            value.destroy();
            subMenuMap[key] = null;
        });

        super.destroy(...args);
    }

    /**
     *
     * @param {Number|String} recordId
     * @returns {String}
     */
    getArrowIconId(recordId) {
        return `${this.id}__arrow_icon__${recordId}`;
    }

    /**
     *
     * @param {Number|String} recordId
     * @returns {String}
     */
    getIconId(recordId) {
        return `${this.id}__icon__${recordId}`;
    }

    /**
     * Checks if a record has items
     * @param {Object} record
     * @returns {Boolean}
     */
    hasChildren(record) {
        return Array.isArray(record.items) && record.items.length > 0;
    }

    /**
     *
     * @param {String[]} items
     */
    onSelect(items) {
        let me     = this,
            nodeId = items[0],
            record = me.store.get(me.getItemRecordId(nodeId));

        if (me.hasChildren(record)) {
            me.createSubMenu(nodeId, record);
        } else if (me.activeSubMenu) {
            me.activeSubMenu.unmount();
            me.activeSubMenu = null;
        }
    }

    /**
     *
     */
    unmount() {
        let me = this;

        if (me.activeSubMenu) {
            me.activeSubMenu.unmount();
            me.activeSubMenu = null;
        }

        super.unmount();
    }
}

Neo.applyClassConfig(List);

export {List as default};
