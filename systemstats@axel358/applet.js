const Applet = imports.ui.applet;
const Main = imports.ui.main;
const Lang = imports.lang;
const St = imports.gi.St;
const GTop = imports.gi.GTop;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;

class SystemStatsApplet extends Applet.TextApplet {

    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.settings = new Settings.AppletSettings(this, "systemstats@axel358", instance_id);
        this.settings.bind("refresh-interval", "refresh_interval", this.on_settings_changed);
        this.settings.bind("decimal-places", "decimal_places", this.on_settings_changed);
        this.settings.bind("display-style", "display_style", this.on_settings_changed);

        this.cpu = new GTop.glibtop_cpu();
        this.mem = new GTop.glibtop_mem();

        this.update();
    }

    on_settings_changed() {
        //TODO: This causes performance issues
        //this.update();
    }

    update() {
        //CPU usage
        GTop.glibtop_get_cpu(this.cpu);
        const cpu_now = (this.cpu.total - this.last_cpu) * 100 / this.refresh_interval ;

        this.last_cpu = this.cpu.total;
        const formatted_cpu = "CPU: " + cpu_now + "% ";

        //Memory usage
        GTop.glibtop_get_mem(this.mem);
        const mem = (this.mem.user / this.mem.total * 100);

        const formatted_mem = "RAM: " + mem.toFixed(this.decimal_places) + "% ";

        this.set_applet_tooltip("");

        switch(this.display_style){
            case "column":
                this.set_applet_label(formatted_cpu + "\n" + formatted_mem);
                break;
            case "both":
                this.set_applet_label(formatted_cpu + " " + formatted_mem);
                break;
            case "cpu":
                this.set_applet_label(formatted_cpu);
               break;
            case "mem":
                this.set_applet_label(formatted_mem);
        }

        this.update_loop_id = Mainloop.timeout_add(this.refresh_interval, Lang.bind(this, this.update));
    }

    formatBytes(bytes, decimals = 1) {
        if (!+bytes)
            return '0 b';

        const sizes = ['b', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(decimals))} ${sizes[i]}`;
    }

    on_applet_removed_from_panel() {
        if (this.update_loop_id > 0) {
            Mainloop.source_remove(this.update_loop_id);
            this.update_loop_id = 0;
        }
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new SystemStatsApplet(metadata, orientation, panel_height, instance_id);
}
