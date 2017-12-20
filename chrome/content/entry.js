if (typeof(net) == "undefined") var net = {};
if (!net.wicked) net.wicked = {};
net.wicked.seedbox = (function (my) {
    my.server =
        {
            ret: null,

            loadEntry: function () {
                this.ret = window.arguments[0];

                document.getElementById("wicked_entry_host").value = (this.ret.host || 'https://rt-new.wickedsun.org');
                document.getElementById("wicked_entry_user").value = this.ret.user;
                document.getElementById("wicked_entry_pass").value = this.ret.pass;
                document.getElementById("wicked_entry_description").value = (this.ret.description || 'wickedsun\'s seedbox');
                document.getElementById("wicked_entry_permanent_label").value = this.ret.label;
                document.getElementById("wicked_entry_label_selection").selectedIndex = (this.ret.label_selection || 1);
                document.getElementById("wicked_entry_permanent_directory").value = this.ret.directory;
                document.getElementById("wicked_entry_directory_selection").selectedIndex = (this.ret.directory_selection || 0);

                var list = document.getElementById("wicked_entry_client");
                list.selectedIndex = 0;

                for (var i = 0; i < list.itemCount; i++) {
                    if (list.getItemAtIndex(i).getAttribute("label") == this.ret.client) {
                        list.selectedIndex = i;
                        break;
                    }
                }

                this.onClientChange();
                this.onLabelSelectionChange();
                this.onDirectorySelectionChange();
                this.onHostChange();
            },

            saveEntry: function () {
                this.ret.action = "save";
                this.ret.host = my.trim(document.getElementById("wicked_entry_host").value);
                this.ret.user = my.trim(document.getElementById("wicked_entry_user").value);
                this.ret.pass = my.trim(document.getElementById("wicked_entry_pass").value);
                this.ret.description = my.trim(document.getElementById("wicked_entry_description").value);
                this.ret.client = document.getElementById("wicked_entry_client").selectedItem.getAttribute("label");
                this.ret.label_selection = document.getElementById("wicked_entry_label_selection").selectedIndex;
                this.ret.label = my.trim(document.getElementById("wicked_entry_permanent_label").value);
                this.ret.directory_selection = document.getElementById("wicked_entry_directory_selection").selectedIndex;
                this.ret.directory = my.trim(document.getElementById("wicked_entry_permanent_directory").value);
            },

            onHostChange: function () {
                var btn = document.documentElement.getButton('accept');
                btn.disabled = (my.trim(document.getElementById("wicked_entry_host").value) == '');
            },

            onClientChange: function () {
                var client = document.getElementById("wicked_entry_client").selectedItem.getAttribute("label");
                document.getElementById("rutorrent_options").hidden = (client != "rutorrent 3.x");
            },

            onLabelSelectionChange: function () {
                var selection = document.getElementById("wicked_entry_label_selection").selectedIndex;
                document.getElementById("wicked_entry_permanent_label").hidden = (selection != 2);
            },

            onDirectorySelectionChange: function () {
                var selection = document.getElementById("wicked_entry_directory_selection").selectedIndex;
                document.getElementById("wicked_entry_permanent_directory").hidden = (selection != 2);
            }
        };

    return (my);
})(net.wicked.seedbox || {});