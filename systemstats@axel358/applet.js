const Applet = imports.ui.applet;
const Main = imports.ui.main;
const Lang = imports.lang;
const St = imports.gi.St;
const GTop = imports.gi.GTop;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const GLib = imports.gi.GLib;

class SystemStatsApplet extends Applet.TextApplet {

    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        this.settings = new Settings.AppletSettings(this, "systemstats@axel358", instance_id);
        this.settings.bind("refresh-interval", "refresh_interval", this.on_settings_changed);
        this.settings.bind("decimal-places", "decimal_places", this.on_settings_changed);
        this.settings.bind("display-style", "display_style", this.on_settings_changed);

        this._applet_tooltip._tooltip.set_style("text-align:left");

        this.cpu = new GTop.glibtop_cpu();
        this.mem = new GTop.glibtop_mem();
        this.disk = new GTop.glibtop_fsusage();
        this.uptime = new GTop.glibtop_uptime();

        this.update();
    }

    on_settings_changed() {
        //TODO: This causes performance issues
        //this.update();
    }

    update() {
        //CPU usage
        GTop.glibtop_get_cpu(this.cpu);
        const cpu_total_now = (this.cpu.total - this.cpu_last_total);
        const cpu_used_now = this.cpu.total - this.cpu.idle - this.cpu_last_used;
        const cpu_usage = cpu_used_now / cpu_total_now * 100;
        const formatted_cpu = "CPU: " + cpu_usage.toFixed(this.decimal_places) + "% ";
        const formatted_cpu_bold = "<b>CPU: </b>" + cpu_usage.toFixed(this.decimal_places) + "% ";
        this.cpu_last_total = this.cpu.total;
        this.cpu_last_used = this.cpu.total - this.cpu.idle;

        //Memory usage
        GTop.glibtop_get_mem(this.mem);
        const mem_used = this.mem.user / this.mem.total * 100;
        const formatted_mem_info = "<b>RAM: </b>" + this.formatBytes(this.mem.user) + " / " + this.formatBytes(this.mem.total);
        const formatted_mem_used = "RAM: " + mem_used.toFixed(this.decimal_places) + "% ";

        //Disk
        GTop.glibtop_get_fsusage(this.disk, "/");
        const disk_used_root = (this.disk.blocks - this.disk.bfree) / this.disk.blocks * 100;
        const formatted_disk_used_root = "<b>Used disk(/): </b>" + disk_used_root.toFixed(this.decimal_places) + "%";

        GTop.glibtop_get_fsusage(this.disk, "/home");
        const disk_used_home = (this.disk.blocks - this.disk.bfree) / this.disk.blocks * 100;
        const formatted_disk_used_home = "<b>Used disk(/home): </b>" + disk_used_home.toFixed(this.decimal_places) + "%";


        //Up time
        GTop.glibtop_get_uptime(this.uptime);
        const formatted_uptime = "<b>Up time: </b>" + this.uptime.uptime + "s";


        this.set_applet_tooltip(formatted_mem_info
            + "\n" + formatted_cpu_bold
            + "\n" + formatted_disk_used_root
            + "\n" + formatted_disk_used_home
            + "\n" + formatted_uptime, true);

        switch (this.display_style) {
            case "column":
                this.set_applet_label(formatted_cpu + "\n" + formatted_mem_used);
                break;
            case "both":
                this.set_applet_label(formatted_cpu + " " + formatted_mem_used);
                break;
            case "cpu":
                this.set_applet_label(formatted_cpu);
                break;
            case "mem":
                this.set_applet_label(formatted_mem_used);
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
