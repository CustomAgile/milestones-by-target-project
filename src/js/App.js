Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    layout: { type: 'vbox', align: 'stretch' },
    items: [{
        id: 'dropdownFiltersContainer',
        xtype: 'container',
        margin: 10,
        layout: {
            type: 'hbox',
            defaultMargins: '0 30 0 0',
        }
    }, {
        id: 'mainContainer',
        xtype: 'container',
        flex: 1,
        layout: {
            type: 'vbox',
            align: 'stretch',
            defaultMargins: 5,
        }
    }],

    launch() {
        Rally.data.wsapi.Proxy.superclass.timeout = 120000;
        this.down('#mainContainer').on('resize', this.onGridResize);
        let context = this.getContext();

        Ext.override(Ext.form.field.Checkbox, {
            getState: function () {
                return { checked: this.getValue() };
            },
            applyState: function (state) {
                if (typeof state.checked === 'boolean') {
                    this.setValue(state.checked);
                }
            }
        });

        this.down('#dropdownFiltersContainer').add([{
            xtype: 'customagileprojectpicker',
            cmp: this,
            appName: 'milestones-by-target-project',
            listeners: {
                scope: this,
                ready: () => this._onProjectSelected(),
                // projectschanged: () => {
                //     this.refreshProjects = true;
                // },
                applyprojects: () => this._onProjectSelected()
            }
        }, {
            xtype: 'container',
            layout: 'vbox',
            items: [
                {
                    xtype: 'rallytextfield',
                    itemId: 'idFilter',
                    fieldLabel: 'ID',
                    labelSeparator: '',
                    stateful: true,
                    stateId: context.getScopedStateId('id-filter'),
                    stateEvents: ['change']
                },
                {
                    xtype: 'rallyfieldvaluecombobox',
                    itemId: 'milestoneTypeFilter',
                    model: 'Milestone',
                    field: 'c_Type',
                    fieldLabel: 'Type',
                    labelSeparator: '',
                    stateful: true,
                    stateId: context.getScopedStateId('milestone-type'),
                    stateEvents: ['change']
                },
                {
                    xtype: 'rallyfieldvaluecombobox',
                    itemId: 'milestoneActiveFilter',
                    model: 'Milestone',
                    field: 'c_Active',
                    fieldLabel: 'Active',
                    labelSeparator: '',
                    allowBlank: true,
                    allowNoEntry: true,
                    stateful: true,
                    stateId: context.getScopedStateId('milestone-active'),
                    stateEvents: ['change']
                }
            ]
        }, {
            xtype: 'container',
            layout: 'vbox',
            items: [
                {
                    xtype: 'checkboxfield',
                    itemId: 'archivedProjectsFilter',
                    fieldLabel: 'Has archived projects',
                    width: 200,
                    labelWidth: 175,
                    labelSeparator: '',
                    // listeners: {
                    //     change: this._onProjectSelected,
                    //     scope: this
                    // },
                    stateful: true,
                    stateId: context.getScopedStateId('has-archived-projects'),
                    stateEvents: ['change']
                }, {
                    xtype: 'checkboxfield',
                    itemId: 'archivedArtifactsFilter',
                    fieldLabel: 'Has archived Artifacts',
                    width: 200,
                    labelWidth: 175,
                    labelSeparator: '',
                    // listeners: {
                    //     change: this._onProjectSelected,
                    //     scope: this
                    // },
                    stateful: true,
                    stateId: context.getScopedStateId('has-archived-artifacts'),
                    stateEvents: ['change']
                }
            ]
        }, {
            xtype: 'container',
            layout: 'vbox',
            items: [
                {
                    xtype: 'rallybutton',
                    itemId: 'applySettingsBtn',
                    text: 'Apply Settings',
                    handler: () => this._onProjectSelected()
                }
            ]
        }]);

        this.projectPicker = this.down('customagileprojectpicker');
    },

    async addGrid() {
        let context = this.getContext();
        let dataContext = context.getDataContext();
        this.setLoading(true);

        try {
            this.down('#mainContainer').add(
                {
                    xtype: 'rallygrid',
                    editable: false,
                    storeConfig: {
                        filters: await this.getFilters(),
                        model: 'milestone',
                        context: dataContext,
                        enablePostGet: true
                    },
                    // stateful: true,
                    // stateId: context.getScopedStateId('milestones-grid'),
                    height: this.down('#mainContainer').getHeight(),
                    columnCfgs: [
                        'FormattedID',
                        'Name',
                        {
                            dataIndex: 'Projects',
                            text: 'All Projects',
                            flex: 1,
                            renderer: function (value, metaData, record) {
                                return `<a onclick="Rally.getApp().showCollectionGrid(event,${record.get('ObjectID')}, 'Projects'); return false;">
                                        <span class="grid-link">${value.Count}</span>
                                    </a>`;
                            }
                        },
                        {
                            dataIndex: 'Artifacts',
                            text: 'All Artifacts',
                            flex: 1,
                            renderer: function (value, metaData, record) {
                                return `<a onclick="Rally.getApp().showCollectionGrid(event,${record.get('ObjectID')}, 'Artifacts'); return false;">
                                        <span class="grid-link">${value.Count}</span>
                                    </a>`;
                            }
                        },
                        'TargetDate',
                        'c_Type',
                        'c_Active'
                    ],
                });
        }
        catch (e) {
            this.showError(e);
        }
        this.setLoading(false);
    },

    _onProjectSelected() {
        this.down('#mainContainer').removeAll();
        this.addGrid();
    },

    showCollectionGrid(event, id, collectionName) {
        this.setLoading(`Loading ${collectionName}`);

        try {
            let record = this.down('rallygrid').store.getById(id);

            if (record) {
                let fetch = [];
                let columns = [];
                let sorters = [];

                if (collectionName === 'Projects') {
                    fetch = ['Name', 'Owner', 'Archived'];
                    columns = ['Name', 'Owner', 'Archived'];
                    sorters = ['Name'];
                }
                else if (collectionName === 'Artifacts') {
                    fetch = ['FormattedID', 'Name', 'Project'];
                    columns = ['FormattedID', 'Name', 'Project'];
                    sorters = ['FormattedID'];
                }

                let store = record.getCollection(collectionName);

                Ext.create(CustomAgile.ui.popover.SummaryGridPopover, {
                    title: collectionName,
                    target: event.target,
                    placement: ['bottom', 'top'],
                    offsetFromTarget: [
                        { x: 0, y: -5 },
                        { x: 5, y: 0 },
                        { x: 0, y: 5 },
                        { x: -5, y: 0 }
                    ],
                    models: ['Project'],
                    store,
                    fetch,
                    sorters,
                    maxWidth: this.down('rallygrid').getWidth(),
                    columns
                });

                this.setLoading(false);

                return false;
            }
        }
        catch (e) {
            this.showError(e);
        }
    },

    async getFilters() {
        let filters = [];
        let projects = await this.getProjects();

        if (projects.length) {
            filters.push({
                property: 'Projects',
                operator: projects.length > 1 ? 'in' : '=',
                value: projects.length > 1 ? projects : projects[0]
            });
        }

        if (this.down('#idFilter').getValue()) {
            filters.push({
                property: 'FormattedID',
                operator: 'contains',
                value: this.down('#idFilter').getValue()
            });
        }

        if (this.down('#milestoneTypeFilter').getValue()) {
            filters.push({
                property: 'c_Type',
                value: this.down('#milestoneTypeFilter').getValue()
            });
        }

        if (this.down('#milestoneActiveFilter').getValue()) {
            filters.push({
                property: 'c_Active',
                value: this.down('#milestoneActiveFilter').getValue()
            });
        }

        if (this.down('#archivedProjectsFilter').getValue()) {
            filters.push({
                property: 'Projects.c_Archived',
                value: 'Yes'
            });
        }

        if (this.down('#archivedArtifactsFilter').getValue()) {
            filters.push({
                property: 'Artifacts.Project.c_Archived',
                value: 'Yes'
            });
        }

        return filters;
    },

    async getProjects() {
        let projects = this.projectPicker.getValue() || [];

        if (this.projectPicker.includeChildProjects()) {
            projects = await this.getAllChildProjects(projects);
        }

        return _.map(projects, p => p.get('_ref'));
    },

    async getAllChildProjects(allRoots = [], fetch = ['Name', 'Children', 'ObjectID']) {
        if (!allRoots.length) { return []; }

        const promises = allRoots.map(r => this.wrap(r.getCollection('Children', { fetch, limit: Infinity, filters: [{ property: 'State', value: 'Open' }] }).load()));
        const children = _.flatten(await Promise.all(promises));
        const decendents = await this.getAllChildProjects(children, fetch);
        const removeDupes = {};
        let finalResponse = _.flatten([...decendents, ...allRoots, ...children]);

        // eslint-disable-next-line no-return-assign
        finalResponse.forEach(s => removeDupes[s.get('_ref')] = s);
        finalResponse = Object.values(removeDupes);
        return finalResponse;
    },

    onGridResize() {
        let grid = this.down('rallygrid');

        if (grid) {
            grid.setHeight(this.getHeight());
        }
    },

    setLoading(msg) {
        this.down('#mainContainer').setLoading(msg);
    },

    showError(msg) {
        this.setLoading(false);
        Rally.ui.notify.Notifier.showError({ message: this.parseError(msg) });
    },

    parseError(e, defaultMessage) {
        if (typeof e === 'string' && e.length) {
            return e;
        }
        if (e.message && e.message.length) {
            return e.message;
        }
        if (e.exception && e.error && e.error.errors && e.error.errors.length) {
            if (e.error.errors[0].length) {
                return e.error.errors[0];
            } else {
                if (e.error && e.error.response && e.error.response.status) {
                    return `${defaultMessage} (Status ${e.error.response.status})`;
                }
            }
        }
        if (e.exceptions && e.exceptions.length && e.exceptions[0].error) {
            return e.exceptions[0].error.statusText;
        }
        return defaultMessage;
    },

    async wrap(deferred) {
        if (!deferred || !_.isFunction(deferred.then)) {
            return Promise.reject(new Error('Wrap cannot process this type of data into a ECMA promise'));
        }
        return new Promise((resolve, reject) => {
            deferred.then({
                success(...args) {
                    resolve(...args);
                },
                failure(error) {
                    Rally.getApp().setLoading(false);
                    reject(error);
                }
            });
        });
    }
});
