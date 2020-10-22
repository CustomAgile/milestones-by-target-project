Ext.define('Customagile.ui.ProjectPicker', {
    extend: 'Ext.Container',
    alias: 'widget.customagileprojectpicker',
    layout: 'vbox',

    cmp: null,
    appName: '',
    tab: null,

    initComponent() {
        this.callParent(arguments);

        this.add([
            // {
            //     xtype: 'component',
            //     html: `If you require a report spanning across multiple project hierarchies, use this project picker to specify where the data will be pulled from. If blank, app will respect user's current project scoping.`,
            //     itemId: 'pheader',
            //     cls: 'x-form-item-label'
            // },
            {
                xtype: 'customagilepillpicker',
                itemId: 'projectPicker',
                hidden: false,
                statefulKey: this.cmp.getContext().getScopedStateId(this.appName + '-project-picker'),
                defaultToRecentTimeboxes: false,
                listeners: {
                    recordremoved: this.showApplyProjectsBtn,
                    scope: this
                },
                pickerCfg: {
                    xtype: 'customagilemultiselectproject',
                    width: 350,
                    margin: '10 0 0 0',
                    listeners: {
                        stateapplied: () => this._onReady(),
                        defaultapplied: () => this._onReady(),
                        blur: this.showApplyProjectsBtn,
                        scope: this
                    }
                }
            },
            {
                xtype: 'rallycheckboxfield',
                itemId: 'includeChildProjectsCheckbox',
                fieldLabel: 'Show work from child projects',
                labelSeparator: '',
                stateful: true,
                stateId: this.cmp.getContext().getScopedStateId(this.appName + '-scope-down-checkbox'),
                stateEvents: ['change'],
                labelWidth: 200,
                listeners: {
                    scope: this,
                    change: this.showApplyProjectsBtn
                }
            },
            // {
            //     xtype: 'rallybutton',
            //     itemId: 'applyProjectsBtn',
            //     text: 'Apply',
            //     margin: '10 0 0 0',
            //     hidden: true,
            //     handler: function (btn) {
            //         btn.hide();
            //         this.fireEvent('applyprojects');
            //     }.bind(this)
            // }
        ]);

        this.projectPicker = this.down('#projectPicker');
    },

    _onReady() {
        setTimeout(() => this.updateProjectTabText(), 1000);
        setTimeout(() => this.fireEvent('ready'), 200);
    },

    showApplyProjectsBtn() {
        // if (this.down('#applyProjectsBtn')) { this.down('#applyProjectsBtn').show(); }
        // this.updateProjectTabText();
        // this.fireEvent('projectschanged');
    },

    updateProjectTabText() {
        if (this.tab) {
            if (this.cmp.down('#ignoreScopeControl') && this.cmp.down('#ignoreScopeControl').getValue() === 'workspace') {
                this.tab.setTitle('PROJECTS (ALL)');
            }
            else if (this.projectPicker && !this.projectPicker.hidden) {
                let totalProjects = this.projectPicker.getValue().length;
                let titleText = totalProjects ? `PROJECTS (${totalProjects})` : 'PROJECTS';
                this.tab.setTitle(titleText);
            }
            else {
                this.tab.setTitle('PROJECTS');
            }
        }
    },

    getValue() {
        return this.projectPicker.getValue();
    },

    includeChildProjects() {
        return this.down('#includeChildProjectsCheckbox').getValue();
    },

    setIncludeChildProjects(searchChildProjects) {
        this.down('#includeChildProjectsCheckbox').setValue(searchChildProjects);
    },

    reset() {
        this.projectPicker._removePills();
        this.projectPicker.picker.setValueBasedOnState([]);
        this.projectPicker.saveStateLocal([]);
        this.updateProjectTabText();
        this.down('#includeChildProjectsCheckbox').setValue(false);
        this.projectPicker.picker.setDefaultValue([]);
        // if (this.down('#applyProjectsBtn')) { this.down('#applyProjectsBtn').hide(); }
        //this.projectPicker.this._setDefaults();
    },

    getProjectRefs() {
        return _.map(this.projectPicker.getValue(), (p) => {
            return p.get('_ref');
        });
    },

    async setValueFromPrjRef(prjs, searchChildProjects) {
        this.setIncludeChildProjects(searchChildProjects);
        await this.projectPicker._setPillsFromPrjRef(prjs);
    },

    async updatePickerFromOldPicker(appName, childProjectCheck) {
        let prjs = JSON.parse(localStorage.getItem(this.cmp.getContext().getScopedStateId(appName + '-project-picker')));
        if (prjs && prjs.length > 0) {
            await this.setValueFromPrjRef(prjs, childProjectCheck);
        }
        localStorage.removeItem(this.cmp.getContext().getScopedStateId(appName + '-project-picker'));
    }

});