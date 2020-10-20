Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function () {
        var panel = Ext.create('Ext.panel.Panel', {
            items: [
                {
                    xtype: 'rallyprojectpicker',
                    fieldLabel: 'select project',
                    itemId: 'proj',
                    margin: 10,
                    workspace: this.getContext().getWorkspace()._ref, //limit choices to the current workspace
                    value: this.getContext().getProject(),
                    listeners: {
                        change: this._onProjectSelected,
                        scope: this
                    }
                },
                {
                    xtype: 'container',
                    itemId: 'gridContainer'
                }
            ]
        });
        this.add(panel);
    },
    _onProjectSelected: function () {
        if (this.down('rallygrid')) {
            Ext.ComponentQuery.query('#gridContainer')[0].remove(Ext.ComponentQuery.query('#milestoneGrid')[0], true);
        }
        this.down('#gridContainer').add({
            xtype: 'rallygrid',
            itemId: 'milestoneGrid',
            columnCfgs: [
                'FormattedID',
                'Name'
            ],
            context: this.getContext(),
            storeConfig: {
                model: 'milestone',
                filters: [this._getProjectFilter()]
            }
        });
    },
    _getProjectFilter: function () {
        return {
            property: 'TargetProject',
            operator: '=',
            value: this.down('#proj').getValue()
        };
    }
});
