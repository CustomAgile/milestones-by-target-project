Ext.define('CustomAgile.ui.popover.SummaryGridPopover', {
    alias: 'widget.summarygridpopover',
    extend: 'Rally.ui.popover.Popover',
    id: 'grid-popover',
    cls: 'grid-popover',
    title: 'Collection Details',
    width: 750,
    maxHeight: 600,
    layout: 'fit',

    constructor: function (config) {
        if (config.title) {
            this.title = config.title;
        }

        let items = [{
            xtype: 'rallygrid',
            itemId: 'listview',
            store: config.store,
            storeConfig: { fetch: config.fetch, sorters: config.sorters },
            columnCfgs: config.columns,
            sortableColumns: true,
            showRowActionsColumn: false,
            showPagingToolbar: true,
            enableEditing: false,
            flex: 1,
            overflowY: 'auto'
        }];

        config.items = Ext.merge(items, config.items);

        this.callParent(arguments);
    },

    getGrid: function () {
        return this.down('#listview');
    }
});