(function () {
    'use strict';

    var LW = window.LW = window.LW || {};

    // ---- Built-in Machine Profiles -----------------------------------------

    var BUILTIN_MACHINES = [
        {
            id: 'grblhal-http',
            name: 'GRBL-ESP32 (HTTP)',
            make: 'grblhal',
            protocol: 'http',
            workArea: { x: 400, y: 400, z: 100 },
            endpoint: 'http://laser.local',
            gcodeFlavor: 'grbl',
            supportsRaster: true,
            supportsZ: false
        },
        {
            id: 'grblhal-serial',
            name: 'GRBL-ESP32 (Serial)',
            make: 'grblhal',
            protocol: 'serial',
            workArea: { x: 400, y: 400, z: 100 },
            port: '',
            baud: 115200,
            gcodeFlavor: 'grbl',
            supportsRaster: true,
            supportsZ: false
        },
        {
            id: 'generic-laser',
            name: 'Generic Laser (File)',
            make: 'generic',
            protocol: 'file',
            workArea: { x: 300, y: 300, z: 0 },
            gcodeFlavor: 'grbl',
            supportsRaster: true,
            supportsZ: false
        },
        {
            id: 'generic-cnc',
            name: 'Generic CNC (File)',
            make: 'generic',
            protocol: 'file',
            workArea: { x: 500, y: 500, z: 100 },
            gcodeFlavor: 'grbl',
            supportsRaster: false,
            supportsZ: true
        }
    ];

    // ---- Factory Default Settings ------------------------------------------

    function getDefaultMachine() {
        return BUILTIN_MACHINES[0];
    }

    // ---- Profile Store API -------------------------------------------------

    var profiles = {
        machines: [],
        currentMachineId: null,

        init: function () {
            var state = LW.getState ? LW.getState() : null;
            var saved = state ? state.profiles : null;
            if (saved && saved.machines && saved.machines.length) {
                this.machines = saved.machines;
                this.currentMachineId = saved.currentMachineId || this.machines[0].id;
            } else {
                this.machines = JSON.parse(JSON.stringify(BUILTIN_MACHINES));
                this.currentMachineId = this.machines[0].id;
            }
            if (!state) return;
            state.profiles.machines = this.machines;
            state.profiles.currentMachineId = this.currentMachineId;
            this.save();
        },

        getMachine: function (id) {
            return this.machines.find(function (m) { return m.id === id; }) || this.machines[0];
        },

        getCurrentMachine: function () {
            return this.getMachine(this.currentMachineId);
        },

        addMachine: function (machine) {
            this.machines.push(machine);
            this.save();
        },

        removeMachine: function (id) {
            this.machines = this.machines.filter(function (m) { return m.id !== id; });
            if (this.currentMachineId === id) this.currentMachineId = this.machines[0].id;
            this.save();
        },

        save: function () {
            if (LW.dispatch) {
                LW.dispatch({
                    type: 'PROFILES_UPDATE',
                    payload: {
                        machines: this.machines,
                        currentMachineId: this.currentMachineId
                    }
                });
            }
        }
    };

    profiles.init();

    LW.profiles = profiles;
    LW.BUILTIN_MACHINES = BUILTIN_MACHINES;

})();
